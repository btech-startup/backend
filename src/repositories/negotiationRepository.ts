import { query } from '../config/db';
import { IBookingNegotiation, NegotiationSender, NegotiationStatus } from '../types/index';
import crypto from 'crypto';

// In-memory fallback thread registry for resilience
const memoryNegotiations: Map<string, IBookingNegotiation> = new Map();

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

    try {
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
      if (res && res.rows && res.rows[0]) {
        memoryNegotiations.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch (e) {
      // Fallback to memory
    }

    const id = crypto.randomUUID();
    const item: IBookingNegotiation = {
      id,
      booking_id: data.booking_id,
      sender_type: data.sender_type,
      proposed_price: data.proposed_price,
      counter_discount_percentage: data.counter_discount_percentage,
      remarks: data.remarks || undefined,
      status: NegotiationStatus.PENDING,
      expires_at: expiresAt,
      created_at: new Date(),
    };
    memoryNegotiations.set(id, item);
    return item;
  }

  static async findById(id: string): Promise<IBookingNegotiation | null> {
    try {
      const res = await query('SELECT * FROM booking_negotiations WHERE id = $1', [id]);
      if (res && res.rows && res.rows[0]) {
        return res.rows[0];
      }
    } catch {
      // Fallback
    }
    return memoryNegotiations.get(id) || null;
  }

  static async findLatestByBookingId(bookingId: string): Promise<IBookingNegotiation | null> {
    try {
      const res = await query(
        'SELECT * FROM booking_negotiations WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1',
        [bookingId]
      );
      if (res && res.rows && res.rows[0]) {
        return res.rows[0];
      }
    } catch {
      // Fallback
    }

    const matches = Array.from(memoryNegotiations.values())
      .filter((n) => n.booking_id === bookingId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return matches[0] || null;
  }

  static async findByBookingId(bookingId: string): Promise<IBookingNegotiation[]> {
    try {
      const res = await query(
        'SELECT * FROM booking_negotiations WHERE booking_id = $1 ORDER BY created_at ASC',
        [bookingId]
      );
      if (res && res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch {
      // Fallback
    }

    return Array.from(memoryNegotiations.values())
      .filter((n) => n.booking_id === bookingId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  static async updateStatus(id: string, status: NegotiationStatus): Promise<void> {
    try {
      await query('UPDATE booking_negotiations SET status = $1 WHERE id = $2', [status, id]);
    } catch {
      // Fallback
    }

    const item = memoryNegotiations.get(id);
    if (item) {
      item.status = status;
      memoryNegotiations.set(id, item);
    }
  }
}
