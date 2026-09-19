import { BookingRepository } from '../repositories/bookingRepository';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { CheckinRepository } from '../repositories/checkinRepository';
import { EscrowLedgerRepository } from '../repositories/escrowLedgerRepository';
import { calculateHaversineDistance } from '../utils/geofence';
import { MilestoneStatus, LedgerEntryType, BookingStatus } from '../types/index';

export class CheckinService {
  /**
   * On-Site Geofenced OTP Handshake:
   * Validates vendor GPS coordinates within 500 meters of venue AND 6-digit OTP
   * Releases Milestone 2 (50% payout)
   */
  static async verifyGeofencedOTP(data: {
    booking_id: string;
    submitted_otp: string;
    vendor_latitude: number;
    vendor_longitude: number;
  }) {
    const booking = await BookingRepository.findById(data.booking_id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const checkinMilestone = await MilestoneRepository.findCheckinMilestone(data.booking_id);
    if (!checkinMilestone) {
      throw new Error('Checkin milestone not configured for this booking');
    }

    if (checkinMilestone.otp_code && checkinMilestone.otp_code !== data.submitted_otp) {
      throw new Error('Invalid 6-digit OTP provided');
    }

    // Compute Haversine Distance
    const distanceMeters = calculateHaversineDistance(
      booking.venue_latitude,
      booking.venue_longitude,
      data.vendor_latitude,
      data.vendor_longitude
    );

    const isDistanceValid = distanceMeters <= 500;

    await CheckinRepository.createOrUpdateCheckin({
      booking_id: data.booking_id,
      vendor_id: booking.vendor_id,
      expected_latitude: booking.venue_latitude,
      expected_longitude: booking.venue_longitude,
      actual_latitude: data.vendor_latitude,
      actual_longitude: data.vendor_longitude,
      radial_distance_meters: distanceMeters,
      submitted_otp: data.submitted_otp,
      is_verified: isDistanceValid,
    });

    if (!isDistanceValid) {
      throw new Error(
        `Geofence verification failed. Vendor is ${distanceMeters} meters away from venue (Threshold: <= 500m)`
      );
    }

    // Release Milestone 2 (50% payout)
    await MilestoneRepository.updateStatus(checkinMilestone.id, MilestoneStatus.RELEASED);
    await BookingRepository.updateStatus(data.booking_id, BookingStatus.ACTIVE_CONFIRMED);

    // Record Escrow Ledger Payout Entry
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

    return {
      checkinStatus: 'verified',
      distanceMeters,
      milestoneReleased: {
        stage: 'event_checkin',
        percentage: 50.0,
        payoutAmount: checkinMilestone.net_vendor_payout,
        transactionReference: idempotencyKey,
      },
    };
  }
}
