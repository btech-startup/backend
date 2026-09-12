import { query } from '../config/db.js';

export class DisputeRepository {
  static async createDispute(data: {
    booking_id: string;
    milestone_id: string;
    raised_by_user_id: string;
    reason: string;
    evidence_urls?: string[];
  }) {
    const res = await query(
      `INSERT INTO booking_disputes (
        booking_id, milestone_id, raised_by_user_id, reason, evidence_urls
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        data.booking_id,
        data.milestone_id,
        data.raised_by_user_id,
        data.reason,
        JSON.stringify(data.evidence_urls || []),
      ]
    );

    return res.rows[0];
  }

  static async resolveDispute(
    disputeId: string,
    refundAmount: number,
    arbitratorNotes: string
  ) {
    const res = await query(
      `UPDATE booking_disputes
       SET is_resolved = TRUE, refund_amount = $1, arbitrator_notes = $2
       WHERE id = $3
       RETURNING *`,
      [refundAmount, arbitratorNotes, disputeId]
    );

    return res.rows[0];
  }

  static async findAll() {
    const res = await query('SELECT * FROM booking_disputes ORDER BY created_at DESC');
    return res.rows;
  }
}
