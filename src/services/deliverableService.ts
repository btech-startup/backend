import { DeliverableRepository } from '../repositories/deliverableRepository';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { EscrowLedgerRepository } from '../repositories/escrowLedgerRepository';
import { BookingRepository } from '../repositories/bookingRepository';
import { query } from '../config/db';
import { IDeliverable, DeliverableStatus, MilestoneStage, MilestoneStatus, LedgerEntryType, BookingStatus } from '../types';

export class DeliverableService {
  static async createDeliverable(data: any): Promise<IDeliverable> {
    return await DeliverableRepository.create(data);
  }

  static async submitDeliverable(deliverableId: string, vendorId: string, fileUrls: string[]): Promise<IDeliverable> {
    const deliverable = await DeliverableRepository.findById(deliverableId);
    if (!deliverable) throw new Error('Deliverable not found');
    if (deliverable.vendor_id !== vendorId) throw new Error('Unauthorized');
    
    await DeliverableRepository.addFiles(deliverableId, fileUrls);
    return await DeliverableRepository.updateStatus(deliverableId, DeliverableStatus.SUBMITTED);
  }

  static async approveDeliverable(deliverableId: string, reviewerNotes?: string): Promise<IDeliverable> {
    const deliverable = await DeliverableRepository.findById(deliverableId);
    if (!deliverable) throw new Error('Deliverable not found');

    const updated = await DeliverableRepository.updateStatus(deliverableId, DeliverableStatus.APPROVED, reviewerNotes);

    // Find the work_delivery milestone for the booking using raw query to be safe
    const sql = `SELECT * FROM booking_milestones WHERE booking_id = $1 AND stage = $2`;
    const milestoneResult = await query(sql, [deliverable.booking_id, MilestoneStage.WORK_DELIVERY]);
    const workDeliveryMilestone = milestoneResult.rows[0];

    if (workDeliveryMilestone) {
      // Release Milestone 3
      await MilestoneRepository.updateStatus(workDeliveryMilestone.id, MilestoneStatus.RELEASED);
      
      // Add escrow ledger entry
      await EscrowLedgerRepository.addEntry({
        booking_id: deliverable.booking_id,
        milestone_id: workDeliveryMilestone.id,
        entry_type: LedgerEntryType.VENDOR_PAYOUT,
        amount: workDeliveryMilestone.net_vendor_payout,
        debit_account: 'ESCROW_ACCOUNT',
        credit_account: 'VENDOR_WALLET',
        idempotency_key: `DELIVERABLE_APPROVE_${deliverableId}`
      });
    }

    // Update booking status to COMPLETED
    await BookingRepository.updateStatus(deliverable.booking_id, BookingStatus.COMPLETED);

    return updated;
  }

  static async requestRevision(deliverableId: string, notes: string): Promise<IDeliverable> {
    return await DeliverableRepository.updateStatus(deliverableId, DeliverableStatus.REVISION_REQUESTED, notes);
  }

  static async rejectDeliverable(deliverableId: string, notes: string): Promise<IDeliverable> {
    return await DeliverableRepository.updateStatus(deliverableId, DeliverableStatus.REJECTED, notes);
  }

  static async getBookingDeliverables(bookingId: string): Promise<IDeliverable[]> {
    return await DeliverableRepository.findByBookingId(bookingId);
  }

  static async getVendorDeliverables(vendorId: string): Promise<IDeliverable[]> {
    return await DeliverableRepository.findByVendorId(vendorId);
  }
}
