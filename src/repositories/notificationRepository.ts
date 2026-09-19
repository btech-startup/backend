import { query } from '../config/db';

export class NotificationRepository {
  static async create(data: { user_id: string; type: string; title: string; body: string; data?: any }) {
    const sql = `
      INSERT INTO notifications (user_id, type, title, body, data, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const params = [data.user_id, data.type, data.title, data.body, data.data || null];
    const result = await query(sql, params);
    return result.rows[0];
  }

  static async findByUserId(userId: string, limit: number = 20, offset: number = 0) {
    const sql = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await query(sql, [userId, limit, offset]);
    return result.rows;
  }

  static async markAsRead(notificationId: string, userId: string) {
    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await query(sql, [notificationId, userId]);
    return result.rows[0];
  }

  static async markAllAsRead(userId: string) {
    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
      RETURNING *
    `;
    const result = await query(sql, [userId]);
    return result.rows;
  }

  static async getUnreadCount(userId: string) {
    const sql = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = FALSE
    `;
    const result = await query(sql, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  static async deleteOld(userId: string, daysOld: number = 30) {
    const sql = `
      DELETE FROM notifications
      WHERE user_id = $1 AND created_at < NOW() - INTERVAL '$2 days'
      RETURNING *
    `;
    const result = await query(sql, [userId, daysOld]);
    return result.rows;
  }
}
