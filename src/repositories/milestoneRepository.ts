import { query } from '../config/db';
import { IBookingMilestone, MilestoneStage, MilestoneStatus } from '../types/index';

export class MilestoneRepository {
  static async createMilestonesForBooking(
    bookingId: string,
    grossAmount: number,
    platformFeeRate: number = 0.10
  ): Promise<IBookingMilestone[]> {
    const netPayout = grossAmount * (1 - platformFeeRate);

    const m1Gross = grossAmount * 0.20;
    const m1Net = netPayout * 0.20;

    const m2Gross = grossAmount * 0.50;
    const m2Net = netPayout * 0.50;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const m3Gross = grossAmount * 0.30;
    const m3Net = netPayout * 0.30;

    const sql = `
      INSERT INTO booking_milestones 
        (booking_id, stage, split_percentage, gross_amount, net_vendor_payout, status, trigger_type, otp_code)
      VALUES 
        ($1, 'advance_lock', 20.00, $2, $3, 'released', 'booking_confirmation', NULL),
        ($1, 'event_checkin', 50.00, $4, $5, 'held_escrow', 'geofenced_otp', $6),
        ($1, 'work_delivery', 30.00, $7, $8, 'held_escrow', 'client_approval', NULL)
      RETURNING *;
    `;

    const res = await query(sql, [bookingId, m1Gross, m1Net, m2Gross, m2Net, otpCode, m3Gross, m3Net]);
    return res.rows;
  }

  static async findByBookingId(bookingId: string): Promise<IBookingMilestone[]> {
    const res = await query('SELECT * FROM booking_milestones WHERE booking_id = $1 ORDER BY created_at ASC', [bookingId]);
    return res.rows;
  }

  static async findCheckinMilestone(bookingId: string): Promise<IBookingMilestone | null> {
    const res = await query(
      "SELECT * FROM booking_milestones WHERE booking_id = $1 AND stage = 'event_checkin'",
      [bookingId]
    );
    return res.rows[0] || null;
  }

  static async updateStatus(id: string, status: MilestoneStatus): Promise<void> {
    await query('UPDATE booking_milestones SET status = $1, released_at = NOW() WHERE id = $2', [status, id]);
  }
}
