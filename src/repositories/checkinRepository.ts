import { query } from '../config/db';
import { IVenueCheckin } from '../types/index';

export class CheckinRepository {
  static async createOrUpdateCheckin(data: {
    booking_id: string;
    vendor_id: string;
    expected_latitude: number;
    expected_longitude: number;
    actual_latitude: number;
    actual_longitude: number;
    radial_distance_meters: number;
    submitted_otp: string;
    is_verified: boolean;
  }): Promise<IVenueCheckin> {
    const res = await query(
      `INSERT INTO venue_checkins (
        booking_id, vendor_id, expected_latitude, expected_longitude,
        actual_latitude, actual_longitude, radial_distance_meters, submitted_otp, is_verified, verified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $9 = TRUE THEN NOW() ELSE NULL END)
      ON CONFLICT (booking_id) DO UPDATE SET
        actual_latitude = EXCLUDED.actual_latitude,
        actual_longitude = EXCLUDED.actual_longitude,
        radial_distance_meters = EXCLUDED.radial_distance_meters,
        submitted_otp = EXCLUDED.submitted_otp,
        is_verified = EXCLUDED.is_verified,
        verified_at = CASE WHEN EXCLUDED.is_verified = TRUE THEN NOW() ELSE venue_checkins.verified_at END
      RETURNING *`,
      [
        data.booking_id,
        data.vendor_id,
        data.expected_latitude,
        data.expected_longitude,
        data.actual_latitude,
        data.actual_longitude,
        data.radial_distance_meters,
        data.submitted_otp,
        data.is_verified,
      ]
    );

    return res.rows[0];
  }
}
