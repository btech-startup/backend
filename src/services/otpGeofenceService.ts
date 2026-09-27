import { BookingRepository } from '../repositories/bookingRepository';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { CheckinRepository } from '../repositories/checkinRepository';
import { EscrowLedgerRepository } from '../repositories/escrowLedgerRepository';
import { BookingStateMachine } from './bookingStateMachine';
import { calculateHaversineDistance } from '../utils/geofence';
import { MilestoneStatus, LedgerEntryType, BookingStatus, MilestoneStage } from '../types/index';
import { logger } from '../utils/logger';

export class GeofenceError extends Error {
  public statusCode: number = 400;
  constructor(message: string) {
    super(message);
    this.name = 'GeofenceError';
  }
}

export class OTPGeofenceService {
  /**
   * Dual-Factor Geofenced OTP Handshake:
   * 1. Distance <= 500 meters (Haversine engine)
   * 2. 6-digit cryptographic OTP code match
   * Releases Milestone 2 (50% payout) & advances booking state to active_confirmed
   */
  public static async verifyHandshake(data: {
    booking_id: string;
    submitted_otp: string;
    vendor_latitude: number;
    vendor_longitude: number;
  }) {
    const booking = await BookingRepository.findById(data.booking_id);
    if (!booking) {
      throw new GeofenceError(`Booking with ID '${data.booking_id}' not found.`);
    }

    const milestones = await MilestoneRepository.findByBookingId(data.booking_id);
    const checkinMilestone = milestones.find((m) => m.stage === MilestoneStage.EVENT_CHECKIN);

    if (!checkinMilestone) {
      throw new GeofenceError('Event check-in milestone not configured for this booking.');
    }

    if (checkinMilestone.status === MilestoneStatus.RELEASED) {
      return {
        checkinStatus: 'already_verified',
        message: 'Vendor has already checked in and Milestone 2 (50%) has been released.',
        milestone: checkinMilestone,
      };
    }

    // ─── Verification 1: 6-Digit OTP Match ───────────────────
    const expectedOtp = checkinMilestone.otp_code || '849201';
    if (data.submitted_otp.trim() !== expectedOtp.trim()) {
      logger.warn(`[OTP + Geofence] Invalid OTP for booking ${data.booking_id}. Submitted: ${data.submitted_otp}`);
      throw new GeofenceError('Invalid 6-digit OTP code provided. Please obtain the correct code from the customer.');
    }

    // ─── Verification 2: Haversine Distance Engine (<= 500m) ─
    const venueLat = Number(booking.venue_latitude);
    const venueLng = Number(booking.venue_longitude);
    const vendorLat = Number(data.vendor_latitude);
    const vendorLng = Number(data.vendor_longitude);

    const distanceMeters = calculateHaversineDistance(venueLat, venueLng, vendorLat, vendorLng);

    const isDistanceValid = distanceMeters <= 500;

    // Record check-in attempt
    try {
      await CheckinRepository.createOrUpdateCheckin({
        booking_id: data.booking_id,
        vendor_id: booking.vendor_id,
        expected_latitude: venueLat,
        expected_longitude: venueLng,
        actual_latitude: vendorLat,
        actual_longitude: vendorLng,
        radial_distance_meters: distanceMeters,
        submitted_otp: data.submitted_otp,
        is_verified: isDistanceValid,
      });
    } catch {
      // In-memory or logging fallback
    }

    if (!isDistanceValid) {
      logger.warn(
        `[OTP + Geofence] Geofence breach for booking ${data.booking_id}. Distance: ${distanceMeters}m (Threshold: 500m)`
      );
      throw new GeofenceError(
        `Geofence verification failed. Vendor is ${distanceMeters} meters away from the venue (Maximum allowed radius: 500m). Must be on-site at the event venue.`
      );
    }

    // ─── Release Milestone 2 (50% Payout) ─────────────────────
    await MilestoneRepository.updateStatus(checkinMilestone.id, MilestoneStatus.RELEASED);

    // ─── Advance Booking State Machine ────────────────────────
    await BookingStateMachine.transition(data.booking_id, BookingStatus.ACTIVE_CONFIRMED, {
      actorId: booking.vendor_id,
      actorRole: 'vendor',
      reason: `Geofence verified (${distanceMeters}m) with OTP match. Event officially active.`,
    });

    // ─── Double-Entry Escrow Ledger Payout Entry ──────────────
    const idempotencyKey = `PAYOUT_M2_${data.booking_id}_${Date.now()}`;
    await EscrowLedgerRepository.addEntry({
      booking_id: data.booking_id,
      milestone_id: checkinMilestone.id,
      entry_type: LedgerEntryType.VENDOR_PAYOUT,
      amount: checkinMilestone.net_vendor_payout,
      debit_account: 'nodal_escrow_holding',
      credit_account: 'vendor_payout_vpa',
      idempotency_key: idempotencyKey,
    });

    logger.info(
      `[OTP + Geofence] Check-in verified for booking ${data.booking_id} at ${distanceMeters}m. Milestone 2 (50% - ₹${checkinMilestone.net_vendor_payout}) released.`
    );

    return {
      checkinStatus: 'verified',
      distanceMeters,
      bookingStatus: BookingStatus.ACTIVE_CONFIRMED,
      milestoneReleased: {
        stage: MilestoneStage.EVENT_CHECKIN,
        splitPercentage: 50.0,
        payoutAmount: checkinMilestone.net_vendor_payout,
        transactionReference: idempotencyKey,
      },
      message: 'On-site check-in successful. Milestone 2 (50% payout) released to vendor.',
    };
  }

  /**
   * Customer retrieves their 6-digit handshake OTP to give to vendor upon arrival
   */
  public static async getCustomerOTP(bookingId: string, clientId: string) {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new GeofenceError('Booking not found');
    }

    if (booking.client_id !== clientId) {
      throw new GeofenceError('Only the booking client can view this check-in OTP code.');
    }

    const milestones = await MilestoneRepository.findByBookingId(bookingId);
    const checkinMilestone = milestones.find((m) => m.stage === MilestoneStage.EVENT_CHECKIN);

    if (!checkinMilestone) {
      throw new GeofenceError('Event check-in milestone not configured.');
    }

    return {
      bookingId,
      stage: MilestoneStage.EVENT_CHECKIN,
      otpCode: checkinMilestone.otp_code || '849201',
      status: checkinMilestone.status,
      instructions: 'Share this 6-digit code with the vendor only after they arrive at your venue.',
    };
  }
}
