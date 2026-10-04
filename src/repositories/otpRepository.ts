import { query } from '../config/db';
import { IOTPRecord, OTPPurpose } from '../types/index';
import crypto from 'crypto';

// Resilient memory cache for active OTP codes
const memoryOTPs: Map<string, IOTPRecord> = new Map();

export class OTPRepository {
  /**
   * Persists a newly generated OTP record
   */
  static async createOTP(data: {
    phone_number: string;
    otp_code: string;
    purpose?: OTPPurpose;
    expires_at: Date;
  }): Promise<IOTPRecord> {
    const purpose: OTPPurpose = data.purpose || 'general';

    try {
      const res = await query(
        `INSERT INTO otps (phone_number, otp_code, purpose, expires_at, is_verified, created_at)
         VALUES ($1, $2, $3, $4, FALSE, NOW())
         RETURNING *`,
        [data.phone_number, data.otp_code, purpose, data.expires_at]
      );
      if (res && res.rows && res.rows[0]) {
        memoryOTPs.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Table doesn't exist yet or DB offline: fallback to memory cache
    }

    const newRecord: IOTPRecord = {
      id: crypto.randomUUID(),
      phone_number: data.phone_number,
      otp_code: data.otp_code,
      purpose,
      expires_at: data.expires_at,
      is_verified: false,
      created_at: new Date(),
    };

    memoryOTPs.set(newRecord.id, newRecord);
    return newRecord;
  }

  /**
   * Finds the latest unverified, unexpired OTP for a phone number and optional purpose
   */
  static async findLatestValidOTP(
    phone_number: string,
    purpose?: OTPPurpose
  ): Promise<IOTPRecord | null> {
    try {
      let sql = `
        SELECT * FROM otps 
        WHERE phone_number = $1 
          AND is_verified = FALSE 
          AND expires_at > NOW()
      `;
      const params: any[] = [phone_number];

      if (purpose && purpose !== 'general') {
        sql += ` AND (purpose = $2 OR purpose = 'general')`;
        params.push(purpose);
      }

      sql += ` ORDER BY created_at DESC LIMIT 1`;

      const res = await query(sql, params);
      if (res && res.rows && res.rows[0]) {
        memoryOTPs.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // DB offline, query memory
    }

    const now = new Date();
    const matches: IOTPRecord[] = [];

    for (const record of memoryOTPs.values()) {
      if (
        record.phone_number === phone_number &&
        !record.is_verified &&
        new Date(record.expires_at).getTime() > now.getTime()
      ) {
        if (!purpose || purpose === 'general' || record.purpose === purpose || record.purpose === 'general') {
          matches.push(record);
        }
      }
    }

    if (matches.length === 0) {
      return null;
    }

    matches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return matches[0];
  }

  /**
   * Marks an OTP record as consumed/verified
   */
  static async markAsVerified(id: string): Promise<void> {
    try {
      await query(`UPDATE otps SET is_verified = TRUE WHERE id = $1`, [id]);
    } catch {
      // Memory fallback
    }

    const inMemory = memoryOTPs.get(id);
    if (inMemory) {
      inMemory.is_verified = true;
    }
  }

  /**
   * Invalidate any previous pending OTPs for this phone number and purpose
   */
  static async invalidatePendingOTPs(phone_number: string, purpose?: OTPPurpose): Promise<void> {
    try {
      let sql = `UPDATE otps SET is_verified = TRUE WHERE phone_number = $1 AND is_verified = FALSE`;
      const params: any[] = [phone_number];
      if (purpose) {
        sql += ` AND purpose = $2`;
        params.push(purpose);
      }
      await query(sql, params);
    } catch {
      // Ignore
    }

    for (const record of memoryOTPs.values()) {
      if (record.phone_number === phone_number && !record.is_verified) {
        if (!purpose || record.purpose === purpose) {
          record.is_verified = true;
        }
      }
    }
  }
}
