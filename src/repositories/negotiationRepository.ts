import { query } from '../config/db';
import { IBookingNegotiation, NegotiationSender, NegotiationStatus } from '../types/index';

export class NegotiationRepository {
  static async createCounterOffer(data: {
    booking_id: string;
    sender_type: NegotiationSender;
    proposed_price: number;
    counter_discount_percentage: number;
    remarks?: string;
    expiresInHours?: number;
  }): Promise<IBookingNegotiation> {
    const hours = data.expiresInHours || 12;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const res = await query(
      `INSERT INTO booking_negotiations (
        booking_id, sender_type, proposed_price, counter_discount_percentage, remarks, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)
      RETURNING *`,
      [
        data.booking_id,
        data.sender_type,
        data.proposed_price,
        data.counter_discount_percentage,
        data.remarks || null,
        expiresAt,
      ]
    );

    return res.rows[0];
  }

  static async findLatestByBookingId(bookingId: string): Promise<IBookingNegotiation | null> {
    const res = await query(
      'SELECT * FROM booking_negotiations WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1',
      [bookingId]
    );
    return res.rows[0] || null;
  }

  static async updateStatus(id: string, status: NegotiationStatus): Promise<void> {
    await query('UPDATE booking_negotiations SET status = $1 WHERE id = $2', [status, id]);
  }
}
