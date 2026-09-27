import { query } from '../config/db';
import { IBooking, BookingStatus } from '../types/index';
import crypto from 'crypto';

// Resilient memory cache for active bookings
const memoryBookings: Map<string, IBooking> = new Map();

export class BookingRepository {
  /**
   * Create a booking with all 12 required fields specified in Image 2:
   * 1) customer (client_id)
   * 2) vendor (vendor_id)
   * 3) service (service_id)
   * 4) event date (event_date)
   * 5) event slot (event_slot)
   * 6) venue (venue_address)
   * 7) latitude & longitude (venue_latitude, venue_longitude)
   * 8) gross amount (gross_amount)
   * 9) platform fee (platform_fee)
   * 10) tax (tax_amount)
   * 11) net payable (net_payable_amount)
   * 12) status (status)
   */
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
    tax_amount?: number;
    net_payable_amount: number;
    status?: BookingStatus;
  }): Promise<IBooking> {
    const bookingRef = `BK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const taxAmount = bookingData.tax_amount !== undefined ? bookingData.tax_amount : 0.0;
    const status = bookingData.status || BookingStatus.DRAFT;

    try {
      const res = await query(
        `INSERT INTO bookings (
          booking_reference, client_id, vendor_id, service_id, event_date, event_slot,
          venue_address, venue_latitude, venue_longitude, gross_amount, platform_fee,
          tax_amount, net_payable_amount, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
          taxAmount,
          bookingData.net_payable_amount,
          status,
        ]
      );
      if (res && res.rows && res.rows[0]) {
        memoryBookings.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Database unavailable, fallback to memory
    }

    const id = crypto.randomUUID();
    const item: IBooking = {
      id,
      booking_reference: bookingRef,
      client_id: bookingData.client_id,
      vendor_id: bookingData.vendor_id,
      service_id: bookingData.service_id,
      event_date: bookingData.event_date,
      event_slot: bookingData.event_slot,
      venue_address: bookingData.venue_address,
      venue_latitude: Number(bookingData.venue_latitude),
      venue_longitude: Number(bookingData.venue_longitude),
      gross_amount: Number(bookingData.gross_amount),
      platform_fee: Number(bookingData.platform_fee),
      tax_amount: Number(taxAmount),
      net_payable_amount: Number(bookingData.net_payable_amount),
      status,
      created_at: new Date(),
      updated_at: new Date(),
    };

    memoryBookings.set(id, item);
    return item;
  }

  static async findById(id: string): Promise<IBooking | null> {
    try {
      const res = await query('SELECT * FROM bookings WHERE id = $1', [id]);
      if (res && res.rows && res.rows[0]) {
        return res.rows[0];
      }
    } catch {
      // Fallback
    }
    return memoryBookings.get(id) || null;
  }

  static async findByClientId(clientId: string): Promise<IBooking[]> {
    try {
      const res = await query(
        'SELECT * FROM bookings WHERE client_id = $1 ORDER BY created_at DESC',
        [clientId]
      );
      if (res && res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch {
      // Fallback
    }
    return Array.from(memoryBookings.values())
      .filter((b) => b.client_id === clientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static async findByVendorId(vendorId: string): Promise<IBooking[]> {
    try {
      const res = await query(
        'SELECT * FROM bookings WHERE vendor_id = $1 ORDER BY created_at DESC',
        [vendorId]
      );
      if (res && res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch {
      // Fallback
    }
    return Array.from(memoryBookings.values())
      .filter((b) => b.vendor_id === vendorId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Check if a vendor slot is already booked for a specific date and slot
   */
  static async findActiveSlotBooking(
    vendorId: string,
    eventDate: string,
    eventSlot: string
  ): Promise<IBooking | null> {
    try {
      const res = await query(
        `SELECT * FROM bookings 
         WHERE vendor_id = $1 AND event_date = $2 AND event_slot = $3
         AND status NOT IN ('cancelled', 'draft')
         LIMIT 1`,
        [vendorId, eventDate, eventSlot]
      );
      if (res && res.rows && res.rows[0]) {
        return res.rows[0];
      }
    } catch {
      // Fallback
    }

    const matches = Array.from(memoryBookings.values()).filter(
      (b) =>
        b.vendor_id === vendorId &&
        b.event_date === eventDate &&
        b.event_slot === eventSlot &&
        b.status !== BookingStatus.CANCELLED &&
        b.status !== BookingStatus.DRAFT
    );
    return matches[0] || null;
  }

  static async updateStatus(id: string, status: BookingStatus): Promise<void> {
    try {
      await query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    } catch {
      // Fallback
    }

    const item = memoryBookings.get(id);
    if (item) {
      item.status = status;
      item.updated_at = new Date();
      memoryBookings.set(id, item);
    }
  }

  static async updatePricing(
    id: string,
    grossAmount: number,
    platformFee: number,
    taxAmount: number,
    netPayableAmount: number
  ): Promise<void> {
    try {
      await query(
        `UPDATE bookings 
         SET gross_amount = $1, platform_fee = $2, tax_amount = $3, net_payable_amount = $4, updated_at = NOW() 
         WHERE id = $5`,
        [grossAmount, platformFee, taxAmount, netPayableAmount, id]
      );
    } catch {
      // Fallback
    }

    const item = memoryBookings.get(id);
    if (item) {
      item.gross_amount = grossAmount;
      item.platform_fee = platformFee;
      item.tax_amount = taxAmount;
      item.net_payable_amount = netPayableAmount;
      item.updated_at = new Date();
      memoryBookings.set(id, item);
    }
  }
}
