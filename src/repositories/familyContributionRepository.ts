import { query } from '../config/db';
import { IFamilyContribution } from '../types/index';

export class FamilyContributionRepository {
  static async createContribution(data: {
    booking_id: string;
    contributor_name: string;
    relation: string;
    target_amount: number;
  }): Promise<IFamilyContribution> {
    const res = await query(
      `INSERT INTO family_escrow_contributions (
        booking_id, contributor_name, relation, target_amount, paid_amount, status
      ) VALUES ($1, $2, $3, $4, 0.00, 'pending')
      RETURNING *`,
      [data.booking_id, data.contributor_name, data.relation, data.target_amount]
    );

    return res.rows[0];
  }

  static async findByBookingId(bookingId: string): Promise<IFamilyContribution[]> {
    const res = await query('SELECT * FROM family_escrow_contributions WHERE booking_id = $1 ORDER BY created_at ASC', [bookingId]);
    return res.rows;
  }
}
