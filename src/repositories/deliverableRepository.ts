import { query } from '../config/db';
import { IDeliverable, DeliverableStatus } from '../types';

export class DeliverableRepository {
  static async create(data: Partial<IDeliverable>): Promise<IDeliverable> {
    const sql = `
      INSERT INTO deliverables (booking_id, vendor_id, title, description, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await query(sql, [
      data.booking_id,
      data.vendor_id,
      data.title,
      data.description,
      data.status || DeliverableStatus.PENDING
    ]);
    return result.rows[0];
  }

  static async findById(id: string): Promise<IDeliverable | null> {
    const sql = `SELECT * FROM deliverables WHERE id = $1`;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  static async findByBookingId(bookingId: string): Promise<IDeliverable[]> {
    const sql = `SELECT * FROM deliverables WHERE booking_id = $1 ORDER BY created_at DESC`;
    const result = await query(sql, [bookingId]);
    return result.rows;
  }

  static async findByVendorId(vendorId: string): Promise<IDeliverable[]> {
    const sql = `SELECT * FROM deliverables WHERE vendor_id = $1 ORDER BY created_at DESC`;
    const result = await query(sql, [vendorId]);
    return result.rows;
  }

  static async updateStatus(id: string, status: DeliverableStatus, reviewerNotes?: string): Promise<IDeliverable> {
    const sql = `
      UPDATE deliverables
      SET status = $2, reviewer_notes = COALESCE($3, reviewer_notes), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id, status, reviewerNotes || null]);
    return result.rows[0];
  }

  static async addFiles(id: string, fileUrls: string[]): Promise<IDeliverable> {
    const sql = `
      UPDATE deliverables
      SET file_urls = $2, submitted_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [id, fileUrls]);
    return result.rows[0];
  }
}
