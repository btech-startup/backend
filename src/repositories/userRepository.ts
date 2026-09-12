import { query } from '../config/db.js';
import { IUser, UserRole } from '../types/index.js';

export class UserRepository {
  static async findByPhone(phone: string): Promise<IUser | null> {
    try {
      const res = await query('SELECT * FROM users WHERE phone_number = $1', [phone]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  }

  static async findById(id: string): Promise<IUser | null> {
    try {
      const res = await query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  }

  static async create(userData: {
    phone_number: string;
    full_name: string;
    email?: string;
    password_hash?: string;
    role?: UserRole;
  }): Promise<IUser> {
    const res = await query(
      `INSERT INTO users (phone_number, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userData.phone_number,
        userData.full_name,
        userData.email || null,
        userData.password_hash || null,
        userData.role || UserRole.CUSTOMER,
      ]
    );
    return res.rows[0];
  }
}
