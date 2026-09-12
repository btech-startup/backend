import { BookingRepository } from '../repositories/bookingRepository.js';
import { MilestoneRepository } from '../repositories/milestoneRepository.js';
import { EscrowLedgerRepository } from '../repositories/escrowLedgerRepository.js';
import { LedgerEntryType } from '../types/index.js';

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
}
