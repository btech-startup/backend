import { query } from '../config/db';
import { IBooking, BookingStatus } from '../types/index';

export class BookingRepository {
  static async create(bookingData: {
    client_id: string;
    vendor_id: string;
    service_id: string;
    event_date: string;
    event_slot: string;
    venue_address: string;
    venue_latitude: number;
    venue_longitude: number;
    gross_amount: number;
    platform_fee: number;
    net_payable_amount: number;
  }): Promise<IBooking> {
    const bookingRef = `BK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const res = await query(
      `INSERT INTO bookings (
        booking_reference, client_id, vendor_id, service_id, event_date, event_slot,
        venue_address, venue_latitude, venue_longitude, gross_amount, platform_fee,
        net_payable_amount, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'advance_paid')
      RETURNING *`,
      [
        bookingRef,
        bookingData.client_id,
        bookingData.vendor_id,
        bookingData.service_id,
        bookingData.event_date,
        bookingData.event_slot,
        bookingData.venue_address,
        bookingData.venue_latitude,
        bookingData.venue_longitude,
        bookingData.gross_amount,
        bookingData.platform_fee,
        bookingData.net_payable_amount,
      ]
    );

    return res.rows[0];
  }

  static async findById(id: string): Promise<IBooking | null> {
    try {
      const res = await query('SELECT * FROM bookings WHERE id = $1', [id]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  }

  static async findByClientId(clientId: string): Promise<IBooking[]> {
    const res = await query('SELECT * FROM bookings WHERE client_id = $1 ORDER BY created_at DESC', [clientId]);
    return res.rows;
  }

  static async findByVendorId(vendorId: string): Promise<IBooking[]> {
    const res = await query('SELECT * FROM bookings WHERE vendor_id = $1 ORDER BY created_at DESC', [vendorId]);
    return res.rows;
  }

  static async updateStatus(id: string, status: BookingStatus): Promise<void> {
    await query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  }
}
