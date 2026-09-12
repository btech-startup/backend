import { query } from '../config/db.js';
import { IMuhurthamDate } from '../types/index.js';

export class MuhurthamRepository {
  static async getUpcomingAuspiciousDates(): Promise<IMuhurthamDate[]> {
    const res = await query('SELECT * FROM auspicious_muhurtham_dates ORDER BY calendar_date ASC LIMIT 20');
    return res.rows;
  }

  static async addDate(data: {
    calendar_date: string;
    panchangam_event: string;
    demand_multiplier?: number;
  }): Promise<IMuhurthamDate> {
    const res = await query(
      `INSERT INTO auspicious_muhurtham_dates (calendar_date, panchangam_event, demand_multiplier, standby_pool_required)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (calendar_date) DO UPDATE SET panchangam_event = EXCLUDED.panchangam_event
       RETURNING *`,
      [data.calendar_date, data.panchangam_event, data.demand_multiplier || 1.50]
    );

    return res.rows[0];
  }
}
