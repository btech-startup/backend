import { query } from '../config/db';
import { IBookingMilestone, MilestoneStage, MilestoneStatus } from '../types/index';
import crypto from 'crypto';

const memoryMilestones: Map<string, IBookingMilestone[]> = new Map();

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

    try {
      const sql = `
        INSERT INTO booking_milestones 
          (booking_id, stage, split_percentage, gross_amount, net_vendor_payout, status, trigger_type, otp_code)
        VALUES 
          ($1, 'advance_lock', 20.00, $2, $3, 'held_escrow', 'booking_confirmation', NULL),
          ($1, 'event_checkin', 50.00, $4, $5, 'held_escrow', 'geofenced_otp', $6),
          ($1, 'work_delivery', 30.00, $7, $8, 'held_escrow', 'client_approval', NULL)
        RETURNING *;
      `;
      const res = await query(sql, [bookingId, m1Gross, m1Net, m2Gross, m2Net, otpCode, m3Gross, m3Net]);
      if (res && res.rows && res.rows.length > 0) {
        memoryMilestones.set(bookingId, res.rows);
        return res.rows;
      }
    } catch {
      // Fallback
    }

    const mList: IBookingMilestone[] = [
      {
        id: crypto.randomUUID(),
        booking_id: bookingId,
        stage: MilestoneStage.ADVANCE_LOCK,
        split_percentage: 20.0,
        gross_amount: m1Gross,
        net_vendor_payout: m1Net,
        status: MilestoneStatus.HELD_ESCROW,
        trigger_type: 'booking_confirmation',
        created_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        booking_id: bookingId,
        stage: MilestoneStage.EVENT_CHECKIN,
        split_percentage: 50.0,
        gross_amount: m2Gross,
        net_vendor_payout: m2Net,
        status: MilestoneStatus.HELD_ESCROW,
        trigger_type: 'geofenced_otp',
        otp_code: otpCode,
        created_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        booking_id: bookingId,
        stage: MilestoneStage.WORK_DELIVERY,
        split_percentage: 30.0,
        gross_amount: m3Gross,
        net_vendor_payout: m3Net,
        status: MilestoneStatus.HELD_ESCROW,
        trigger_type: 'client_approval',
        created_at: new Date(),
      },
    ];

    memoryMilestones.set(bookingId, mList);
    return mList;
  }

  static async findByBookingId(bookingId: string): Promise<IBookingMilestone[]> {
    try {
      const res = await query(
        'SELECT * FROM booking_milestones WHERE booking_id = $1 ORDER BY created_at ASC',
        [bookingId]
      );
      if (res && res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch {
      // Fallback
    }
    return memoryMilestones.get(bookingId) || [];
  }

  static async findCheckinMilestone(bookingId: string): Promise<IBookingMilestone | null> {
    try {
      const res = await query(
        "SELECT * FROM booking_milestones WHERE booking_id = $1 AND stage = 'event_checkin'",
        [bookingId]
      );
      if (res && res.rows && res.rows[0]) {
        return res.rows[0];
      }
    } catch {
      // Fallback
    }
    const list = memoryMilestones.get(bookingId) || [];
    return list.find((m) => m.stage === MilestoneStage.EVENT_CHECKIN) || null;
  }

  static async updateStatus(id: string, status: MilestoneStatus): Promise<void> {
    try {
      await query('UPDATE booking_milestones SET status = $1, released_at = NOW() WHERE id = $2', [
        status,
        id,
      ]);
    } catch {
      // Fallback
    }

    for (const [_, list] of memoryMilestones) {
      const found = list.find((m) => m.id === id);
      if (found) {
        found.status = status;
        found.released_at = new Date();
        break;
      }
    }
  }
}
