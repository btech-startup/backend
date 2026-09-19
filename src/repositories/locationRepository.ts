import { query } from '../config/db';

export class LocationRepository {
  static async upsertVendorLocation(vendorId: string, latitude: number, longitude: number) {
    const sql = `
      INSERT INTO vendor_locations (vendor_id, latitude, longitude, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (vendor_id) DO UPDATE
      SET latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          updated_at = NOW()
      RETURNING *
    `;
    const result = await query(sql, [vendorId, latitude, longitude]);
    return result.rows[0];
  }

  static async getVendorLocation(vendorId: string) {
    const sql = `
      SELECT * FROM vendor_locations
      WHERE vendor_id = $1
    `;
    const result = await query(sql, [vendorId]);
    return result.rows[0];
  }

  static async findNearbyVendors(latitude: number, longitude: number, radiusKm: number, category?: string) {
    let sql = `
      SELECT vl.*, v.category,
      (
        6371 * acos(
          cos(radians($1)) * cos(radians(vl.latitude)) *
          cos(radians(vl.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(vl.latitude))
        )
      ) AS distance
      FROM vendor_locations vl
      JOIN vendors v ON vl.vendor_id = v.id
      WHERE (
        6371 * acos(
          cos(radians($1)) * cos(radians(vl.latitude)) *
          cos(radians(vl.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(vl.latitude))
        )
      ) <= $3
    `;
    const params: any[] = [latitude, longitude, radiusKm];

    if (category) {
      sql += ` AND v.category = $4`;
      params.push(category);
    }
    
    sql += ` ORDER BY distance ASC`;

    const result = await query(sql, params);
    return result.rows;
  }

  static async getCheckinsByVendor(vendorId: string) {
    const sql = `
      SELECT * FROM venue_checkins
      WHERE vendor_id = $1
      ORDER BY checkin_time DESC
    `;
    const result = await query(sql, [vendorId]);
    return result.rows;
  }

  static async getCheckinByBooking(bookingId: string) {
    const sql = `
      SELECT * FROM venue_checkins
      WHERE booking_id = $1
    `;
    const result = await query(sql, [bookingId]);
    return result.rows[0];
  }
}
