import { query } from '../config/db';
import { IEvent, EventStatus } from '../types/index';
import crypto from 'crypto';

// Resilient memory cache for user events
const memoryEvents: Map<string, IEvent> = new Map();

export interface EventFilterOptions {
  status?: string;
  event_date?: string;
  from_date?: string;
  to_date?: string;
  city?: string;
  location?: string;
  min_guests?: number;
  max_guests?: number;
  min_budget?: number;
  max_budget?: number;
  search?: string;
}

export class EventRepository {
  static async create(data: {
    user_id: string;
    event_type_id?: string;
    event_type?: string;
    title: string;
    description?: string;
    event_date: string;
    start_time?: string;
    end_time?: string;
    venue_name?: string;
    venue_address?: string;
    city?: string;
    location?: string;
    venue_latitude?: number;
    venue_longitude?: number;
    guest_count: number;
    estimated_budget: number;
    actual_spent?: number;
    notes?: string;
    status?: EventStatus;
  }): Promise<IEvent> {
    const status: EventStatus = data.status || 'planning';
    const guestCount = Number(data.guest_count) || 50;
    const estimatedBudget = Number(data.estimated_budget) || 0;
    const actualSpent = Number(data.actual_spent) || 0;

    try {
      const res = await query(
        `INSERT INTO events (
          user_id, event_type_id, event_type, title, description,
          event_date, start_time, end_time, venue_name, venue_address,
          city, location, venue_latitude, venue_longitude, guest_count,
          estimated_budget, actual_spent, notes, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING *`,
        [
          data.user_id,
          data.event_type_id || null,
          data.event_type || null,
          data.title,
          data.description || null,
          data.event_date,
          data.start_time || null,
          data.end_time || null,
          data.venue_name || null,
          data.venue_address || null,
          data.city || null,
          data.location || null,
          data.venue_latitude || null,
          data.venue_longitude || null,
          guestCount,
          estimatedBudget,
          actualSpent,
          data.notes || null,
          status,
        ]
      );
      if (res && res.rows && res.rows[0]) {
        memoryEvents.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Memory fallback
    }

    const newEvent: IEvent = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      event_type_id: data.event_type_id,
      event_type: data.event_type,
      title: data.title,
      description: data.description,
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time,
      venue_name: data.venue_name,
      venue_address: data.venue_address,
      city: data.city,
      location: data.location,
      venue_latitude: data.venue_latitude,
      venue_longitude: data.venue_longitude,
      guest_count: guestCount,
      estimated_budget: estimatedBudget,
      actual_spent: actualSpent,
      notes: data.notes,
      status,
      created_at: new Date(),
      updated_at: new Date(),
    };

    memoryEvents.set(newEvent.id, newEvent);
    return newEvent;
  }

  static async findAllByUserId(userId: string, filter?: EventFilterOptions): Promise<IEvent[]> {
    try {
      let sql = 'SELECT * FROM events WHERE user_id = $1';
      const params: any[] = [userId];
      let pIdx = 2;

      if (filter) {
        if (filter.status) {
          sql += ` AND status = $${pIdx++}`;
          params.push(filter.status);
        }
        if (filter.event_date) {
          sql += ` AND event_date = $${pIdx++}`;
          params.push(filter.event_date);
        }
        if (filter.from_date) {
          sql += ` AND event_date >= $${pIdx++}`;
          params.push(filter.from_date);
        }
        if (filter.to_date) {
          sql += ` AND event_date <= $${pIdx++}`;
          params.push(filter.to_date);
        }
        if (filter.city) {
          sql += ` AND LOWER(city) LIKE $${pIdx++}`;
          params.push(`%${filter.city.toLowerCase()}%`);
        }
        if (filter.location) {
          sql += ` AND (LOWER(location) LIKE $${pIdx} OR LOWER(venue_address) LIKE $${pIdx})`;
          params.push(`%${filter.location.toLowerCase()}%`);
          pIdx++;
        }
        if (filter.min_guests !== undefined) {
          sql += ` AND guest_count >= $${pIdx++}`;
          params.push(filter.min_guests);
        }
        if (filter.max_guests !== undefined) {
          sql += ` AND guest_count <= $${pIdx++}`;
          params.push(filter.max_guests);
        }
        if (filter.min_budget !== undefined) {
          sql += ` AND estimated_budget >= $${pIdx++}`;
          params.push(filter.min_budget);
        }
        if (filter.max_budget !== undefined) {
          sql += ` AND estimated_budget <= $${pIdx++}`;
          params.push(filter.max_budget);
        }
        if (filter.search) {
          sql += ` AND (LOWER(title) LIKE $${pIdx} OR LOWER(venue_name) LIKE $${pIdx} OR LOWER(city) LIKE $${pIdx})`;
          params.push(`%${filter.search.toLowerCase()}%`);
          pIdx++;
        }
      }

      sql += ' ORDER BY event_date ASC';
      const res = await query(sql, params);
      if (res && res.rows && res.rows.length > 0) {
        for (const row of res.rows) {
          memoryEvents.set(row.id, row);
        }
        return res.rows;
      }
    } catch {
      // Memory fallback
    }

    const results: IEvent[] = [];
    for (const evt of memoryEvents.values()) {
      if (evt.user_id !== userId) continue;

      if (filter) {
        if (filter.status && evt.status !== filter.status) continue;
        if (filter.event_date && evt.event_date !== filter.event_date) continue;
        if (filter.from_date && evt.event_date < filter.from_date) continue;
        if (filter.to_date && evt.event_date > filter.to_date) continue;
        if (filter.city && !evt.city?.toLowerCase().includes(filter.city.toLowerCase())) continue;
        if (
          filter.location &&
          !evt.location?.toLowerCase().includes(filter.location.toLowerCase()) &&
          !evt.venue_address?.toLowerCase().includes(filter.location.toLowerCase())
        ) {
          continue;
        }
        if (filter.min_guests !== undefined && (evt.guest_count || 0) < filter.min_guests) continue;
        if (filter.max_guests !== undefined && (evt.guest_count || 0) > filter.max_guests) continue;
        if (filter.min_budget !== undefined && (evt.estimated_budget || 0) < filter.min_budget) continue;
        if (filter.max_budget !== undefined && (evt.estimated_budget || 0) > filter.max_budget) continue;
        if (filter.search) {
          const q = filter.search.toLowerCase();
          const matchTitle = evt.title.toLowerCase().includes(q);
          const matchVenue = evt.venue_name?.toLowerCase().includes(q);
          const matchCity = evt.city?.toLowerCase().includes(q);
          if (!matchTitle && !matchVenue && !matchCity) continue;
        }
      }

      results.push(evt);
    }
    return results.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }

  static async findById(id: string): Promise<IEvent | null> {
    try {
      const res = await query('SELECT * FROM events WHERE id = $1', [id]);
      if (res && res.rows && res.rows[0]) {
        memoryEvents.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Memory fallback
    }

    return memoryEvents.get(id) || null;
  }

  static async update(
    id: string,
    data: Partial<Omit<IEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<IEvent | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) return null;

      const merged = { ...existing, ...data };

      const res = await query(
        `UPDATE events
         SET event_type_id = $1, event_type = $2, title = $3, description = $4,
             event_date = $5, start_time = $6, end_time = $7, venue_name = $8,
             venue_address = $9, city = $10, location = $11, venue_latitude = $12,
             venue_longitude = $13, guest_count = $14, estimated_budget = $15,
             actual_spent = $16, notes = $17, status = $18, updated_at = NOW()
         WHERE id = $19
         RETURNING *`,
        [
          merged.event_type_id || null,
          merged.event_type || null,
          merged.title,
          merged.description || null,
          merged.event_date,
          merged.start_time || null,
          merged.end_time || null,
          merged.venue_name || null,
          merged.venue_address || null,
          merged.city || null,
          merged.location || null,
          merged.venue_latitude || null,
          merged.venue_longitude || null,
          merged.guest_count,
          merged.estimated_budget,
          merged.actual_spent,
          merged.notes || null,
          merged.status,
          id,
        ]
      );
      if (res && res.rows && res.rows[0]) {
        memoryEvents.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Memory fallback
    }

    const item = memoryEvents.get(id);
    if (!item) return null;

    Object.assign(item, data, { updated_at: new Date() });
    return item;
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const res = await query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
      if (res && res.rows && res.rows.length > 0) {
        memoryEvents.delete(id);
        return true;
      }
    } catch {
      // Memory fallback
    }

    if (memoryEvents.has(id)) {
      memoryEvents.delete(id);
      return true;
    }

    return false;
  }
}
