import { MilestoneRepository } from '../repositories/milestoneRepository';
import { BookingRepository } from '../repositories/bookingRepository';
import { EscrowLedgerRepository } from '../repositories/escrowLedgerRepository';
import { BookingStateMachine } from './bookingStateMachine';
import { MilestoneStatus, LedgerEntryType, BookingStatus, MilestoneStage } from '../types/index';
import { query } from '../config/db';
import { logger } from '../utils/logger';

export class EscrowMilestonesService {
  /**
   * Retrieve all milestones for a booking with status, split amounts, and triggers
   */
  public static async getMilestonesByBooking(bookingId: string) {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found.`);
    }

    const milestones = await MilestoneRepository.findByBookingId(bookingId);
    return {
      bookingId,
      bookingReference: booking.booking_reference,
      bookingStatus: booking.status,
      grossAmount: booking.gross_amount,
      milestones,
    };
  }

  /**
   * Release Milestone 3 (Work Delivery - 30% payout):
   * Triggered by Client approval of deliverables
   */
  public static async approveDeliverableMilestone(
    bookingId: string,
    clientId: string,
    reviewerNotes?: string
  ) {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found.`);
    }

    if (booking.client_id !== clientId) {
      throw new Error('Only the booking client can approve milestone release.');
    }

    const milestones = await MilestoneRepository.findByBookingId(bookingId);
    const m2 = milestones.find((m) => m.stage === MilestoneStage.EVENT_CHECKIN);
    const m3 = milestones.find((m) => m.stage === MilestoneStage.WORK_DELIVERY);

    if (!m3) {
      throw new Error('Work delivery milestone not found for this booking.');
    }

    if (m3.status === MilestoneStatus.RELEASED) {
      return {
        success: true,
        message: 'Milestone 3 (Work Delivery) has already been released.',
        milestone: m3,
      };
    }

    // Rule: Milestone 2 (Check-in) must be completed before Milestone 3 release
    if (m2 && m2.status !== MilestoneStatus.RELEASED) {
      throw new Error(
        'Cannot release Milestone 3 (Delivery) before Milestone 2 (Event Check-in) is verified.'
      );
    }

    // Release Milestone 3
    await MilestoneRepository.updateStatus(m3.id, MilestoneStatus.RELEASED);

    // Transition Booking State to COMPLETED
    await BookingStateMachine.transition(bookingId, BookingStatus.COMPLETED, {
      actorId: clientId,
      actorRole: 'customer',
      reason: `Client approved work deliverables. ${reviewerNotes || ''}`.trim(),
    });

    // Record Escrow Ledger Payout Entry
    const idempotencyKey = `PAYOUT_M3_${bookingId}_${Date.now()}`;
    await EscrowLedgerRepository.addEntry({
      booking_id: bookingId,
      milestone_id: m3.id,
      entry_type: LedgerEntryType.VENDOR_PAYOUT,
      amount: m3.net_vendor_payout,
      debit_account: 'nodal_escrow_holding',
      credit_account: 'vendor_payout_vpa',
      idempotency_key: idempotencyKey,
    });

    logger.info(
      `[Escrow Engine] Milestone 3 released for booking ${bookingId}. ₹${m3.net_vendor_payout} paid out to vendor. Booking COMPLETED.`
    );

    return {
      success: true,
      bookingId,
      bookingStatus: BookingStatus.COMPLETED,
      milestoneReleased: {
        stage: MilestoneStage.WORK_DELIVERY,
        splitPercentage: 30.0,
        amount: m3.net_vendor_payout,
        transactionReference: idempotencyKey,
      },
      message: 'Work delivery approved. Final 30% milestone released to vendor. Booking marked COMPLETED.',
    };
  }

  /**
   * Retrieve double-entry escrow ledger audit trail for a booking
   */
  public static async getEscrowLedger(bookingId: string) {
    try {
      const res = await query(
        'SELECT * FROM escrow_ledger WHERE booking_id = $1 ORDER BY created_at ASC',
        [bookingId]
      );
      return res.rows;
    } catch {
      return [];
    }
  }
}
