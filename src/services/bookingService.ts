import { BookingRepository } from '../repositories/bookingRepository';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { EscrowLedgerRepository } from '../repositories/escrowLedgerRepository';
import { VendorRepository } from '../repositories/vendorRepository';
import { CheckinRepository } from '../repositories/checkinRepository';
import { LedgerEntryType, BookingStatus } from '../types/index';
import { query } from '../config/db';

export class BookingService {
  static async checkout(data: {
    client_id: string;
    vendor_id: string;
    service_id: string;
    event_date: string;
    event_slot: string;
    venue_address: string;
    venue_latitude: number;
    venue_longitude: number;
    gross_amount: number;
  }) {
    const platformFee = Math.round(data.gross_amount * 0.10 * 100) / 100;
    const netPayable = data.gross_amount - platformFee;

    const booking = await BookingRepository.create({
      ...data,
      platform_fee: platformFee,
      net_payable_amount: netPayable,
    });

    // Create 3-stage milestone configuration (20% Advance, 50% Check-in, 30% Delivery)
    const milestones = await MilestoneRepository.createMilestonesForBooking(booking.id, data.gross_amount);

    // Record Escrow Ledger Entry
    const idempotencyKey = `ESCROW_DEP_${booking.id}_${Date.now()}`;
    await EscrowLedgerRepository.addEntry({
      booking_id: booking.id,
      milestone_id: milestones[0].id,
      entry_type: LedgerEntryType.ESCROW_DEPOSIT,
      amount: data.gross_amount,
      debit_account: 'customer_payment_inbound',
      credit_account: 'nodal_escrow_holding',
      idempotency_key: idempotencyKey,
    });

    return {
      booking,
      milestones,
      escrowStatus: 'Milestone 1 (20% Advance) Funded & Settled to Nodal Escrow',
    };
  }

  static async getClientBookings(clientId: string) {
    return BookingRepository.findByClientId(clientId);
  }

  /**
   * Get complete booking details with milestones, vendor info, checkin status, and escrow ledger
   */
  static async getBookingDetails(bookingId: string) {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const milestones = await MilestoneRepository.findByBookingId(bookingId);

    // Get vendor details
    const vendorRes = await query(
      `SELECT v.*, u.full_name as owner_name, u.phone_number as owner_phone
       FROM vendors v JOIN users u ON v.user_id = u.id
       WHERE v.id = $1`,
      [booking.vendor_id]
    );
    const vendor = vendorRes.rows[0] || null;

    // Get service details
    const serviceRes = await query(
      'SELECT * FROM vendor_services WHERE id = $1',
      [booking.service_id]
    );
    const service = serviceRes.rows[0] || null;

    // Get checkin status
    const checkinRes = await query(
      'SELECT * FROM venue_checkins WHERE booking_id = $1',
      [bookingId]
    );
    const checkin = checkinRes.rows[0] || null;

    // Get escrow ledger entries
    const ledgerRes = await query(
      'SELECT * FROM escrow_ledger WHERE booking_id = $1 ORDER BY created_at ASC',
      [bookingId]
    );

    // Get deliverables
    const deliverablesRes = await query(
      'SELECT * FROM deliverables WHERE booking_id = $1 ORDER BY created_at ASC',
      [bookingId]
    );

    // Get customer OTP for check-in (only show OTP from checkin milestone)
    const checkinMilestone = milestones.find((m: any) => m.stage === 'event_checkin');

    return {
      booking,
      vendor,
      service,
      milestones,
      checkin,
      escrowLedger: ledgerRes.rows,
      deliverables: deliverablesRes.rows,
      customerOTP: checkinMilestone?.otp_code || null,
    };
  }

  /**
   * Get bookings for a vendor
   */
  static async getVendorBookings(userId: string) {
    const vendor = await VendorRepository.findByUserId(userId);
    if (!vendor) {
      throw new Error('Vendor profile not found');
    }
    return BookingRepository.findByVendorId(vendor.id);
  }

  /**
   * Cancel a booking - refunds based on milestone status
   */
  static async cancelBooking(bookingId: string, userId: string) {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.client_id !== userId) {
      throw new Error('Only the booking client can cancel this booking');
    }

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new Error(`Cannot cancel a booking with status: ${booking.status}`);
    }

    // Calculate refund based on milestones that haven't been released
    const milestones = await MilestoneRepository.findByBookingId(bookingId);
    let refundableAmount = 0;

    for (const milestone of milestones) {
      if (milestone.status === 'held_escrow' || milestone.status === 'pending_funding') {
        refundableAmount += Number(milestone.gross_amount);
      }
    }

    // Update booking status
    await BookingRepository.updateStatus(bookingId, BookingStatus.CANCELLED);

    // Record refund ledger entry if applicable
    if (refundableAmount > 0) {
      const idempotencyKey = `REFUND_CANCEL_${bookingId}_${Date.now()}`;
      await EscrowLedgerRepository.addEntry({
        booking_id: bookingId,
        entry_type: LedgerEntryType.DISPUTE_REFUND,
        amount: refundableAmount,
        debit_account: 'nodal_escrow_holding',
        credit_account: 'customer_refund_outbound',
        idempotency_key: idempotencyKey,
      });
    }

    return {
      bookingId,
      status: 'cancelled',
      refundableAmount,
      message: refundableAmount > 0
        ? `Booking cancelled. ₹${refundableAmount} refund initiated for unreleased milestones.`
        : 'Booking cancelled. No refundable milestones found.',
    };
  }
}
