import { query } from '../config/db';
import { IUser, UserRole } from '../types/index';
import crypto from 'crypto';

// In-memory resilient cache for users
const memoryUsers: Map<string, IUser> = new Map();

export class UserRepository {
  static async findByPhone(phone: string): Promise<IUser | null> {
    try {
      const res = await query('SELECT * FROM users WHERE phone_number = $1', [phone]);
      if (res && res.rows && res.rows[0]) {
        memoryUsers.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Database unavailable, check memory
    }

    for (const user of memoryUsers.values()) {
      if (user.phone_number === phone) {
        return user;
      }
    }

    return null;
  }

  static async findById(id: string): Promise<IUser | null> {
    try {
      const res = await query('SELECT * FROM users WHERE id = $1', [id]);
      if (res && res.rows && res.rows[0]) {
        memoryUsers.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Database unavailable, check memory
    }

    return memoryUsers.get(id) || null;
  }

  static async create(userData: {
    phone_number: string;
    full_name: string;
    email?: string;
    password_hash?: string;
    role?: UserRole;
  }): Promise<IUser> {
    try {
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
      if (res && res.rows && res.rows[0]) {
        memoryUsers.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Fallback to in-memory store
    }

    const newUser: IUser = {
      id: crypto.randomUUID(),
      phone_number: userData.phone_number,
      full_name: userData.full_name,
      email: userData.email,
      password_hash: userData.password_hash,
      role: userData.role || UserRole.CUSTOMER,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    memoryUsers.set(newUser.id, newUser);
    return newUser;
  }

  static async update(
    id: string,
    data: { full_name?: string; email?: string }
  ): Promise<IUser | null> {
    try {
      const res = await query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             email = COALESCE($2, email),
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [data.full_name || null, data.email || null, id]
      );
      if (res && res.rows && res.rows[0]) {
        memoryUsers.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Memory fallback
    }

    const inMemory = memoryUsers.get(id);
    if (inMemory) {
      if (data.full_name !== undefined) inMemory.full_name = data.full_name;
      if (data.email !== undefined) inMemory.email = data.email;
      inMemory.updated_at = new Date();
      return inMemory;
    }

    return null;
  }
}


