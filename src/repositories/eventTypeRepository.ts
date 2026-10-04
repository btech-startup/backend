import { query } from '../config/db';
import { IEventType } from '../types/index';
import crypto from 'crypto';

// In-memory resilient store seeded with default event types
const memoryEventTypes: Map<string, IEventType> = new Map();

// Seed initial default event types in memory
const defaultTypes: Array<Omit<IEventType, 'id' | 'created_at' | 'updated_at'>> = [
  {
    name: 'Wedding Ceremony',
    code: 'wedding',
    description: 'Traditional sacred wedding vows and auspicious muhurtham celebration',
    default_guest_count: 400,
    suggested_budget_min: 500000,
    suggested_budget_max: 2500000,
    is_active: true,
  },
  {
    name: 'Grand Reception',
    code: 'reception',
    description: 'Evening dinner and stage celebration with photography and banquet',
    default_guest_count: 500,
    suggested_budget_min: 400000,
    suggested_budget_max: 2000000,
    is_active: true,
  },
  {
    name: 'Sangeet & Mehendi',
    code: 'sangeet_mehendi',
    description: 'Musical night with sound, DJ, dance performances and mehendi artists',
    default_guest_count: 200,
    suggested_budget_min: 200000,
    suggested_budget_max: 800000,
    is_active: true,
  },
  {
    name: 'Birthday Party',
    code: 'birthday',
    description: 'Milestone birthdays with theme balloon decor, catering and cake cutting',
    default_guest_count: 75,
    suggested_budget_min: 25000,
    suggested_budget_max: 150000,
    is_active: true,
  },
  {
    name: 'Corporate Event',
    code: 'corporate',
    description: 'Conferences, product launches, annual team offsites and seminars',
    default_guest_count: 150,
    suggested_budget_min: 100000,
    suggested_budget_max: 1000000,
    is_active: true,
  },
  {
    name: 'Housewarming / Pooja',
    code: 'housewarming',
    description: 'Griha Pravesham rituals with purohit and traditional satvik catering',
    default_guest_count: 100,
    suggested_budget_min: 50000,
    suggested_budget_max: 300000,
    is_active: true,
  },
];

for (const dt of defaultTypes) {
  const id = `evt_type_${dt.code}`;
  memoryEventTypes.set(id, {
    id,
    ...dt,
    created_at: new Date(),
    updated_at: new Date(),
  });
}

export class EventTypeRepository {
  static async create(data: {
    name: string;
    code: string;
    description?: string;
    icon_url?: string;
    banner_url?: string;
    suggested_budget_min?: number;
    suggested_budget_max?: number;
    default_guest_count?: number;
    is_active?: boolean;
  }): Promise<IEventType> {
    const isActive = data.is_active !== undefined ? data.is_active : true;

    try {
      const res = await query(
        `INSERT INTO event_types (
          name, code, description, icon_url, banner_url,
          suggested_budget_min, suggested_budget_max, default_guest_count, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          data.name,
          data.code,
          data.description || null,
          data.icon_url || null,
          data.banner_url || null,
          data.suggested_budget_min || 0,
          data.suggested_budget_max || 0,
          data.default_guest_count || 100,
          isActive,
        ]
      );
      if (res && res.rows && res.rows[0]) {
        memoryEventTypes.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Memory fallback
    }

    const newEventType: IEventType = {
      id: crypto.randomUUID(),
      name: data.name,
      code: data.code,
      description: data.description,
      icon_url: data.icon_url,
      banner_url: data.banner_url,
      suggested_budget_min: data.suggested_budget_min || 0,
      suggested_budget_max: data.suggested_budget_max || 0,
      default_guest_count: data.default_guest_count || 100,
      is_active: isActive,
      created_at: new Date(),
      updated_at: new Date(),
    };

    memoryEventTypes.set(newEventType.id, newEventType);
    return newEventType;
  }

  static async findAll(filter?: { is_active?: boolean }): Promise<IEventType[]> {
    try {
      let sql = 'SELECT * FROM event_types';
      const params: any[] = [];
      if (filter && filter.is_active !== undefined) {
        sql += ' WHERE is_active = $1';
        params.push(filter.is_active);
      }
      sql += ' ORDER BY created_at ASC';
      const res = await query(sql, params);
      if (res && res.rows && res.rows.length > 0) {
        for (const row of res.rows) {
          memoryEventTypes.set(row.id, row);
        }
        return res.rows;
      }
    } catch {
      // Memory fallback
    }

    let items = Array.from(memoryEventTypes.values());
    if (filter && filter.is_active !== undefined) {
      items = items.filter((et) => et.is_active === filter.is_active);
    }
    return items;
  }

  static async findById(id: string): Promise<IEventType | null> {
    try {
      const res = await query('SELECT * FROM event_types WHERE id = $1', [id]);
      if (res && res.rows && res.rows[0]) {
        memoryEventTypes.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Memory fallback
    }

    return memoryEventTypes.get(id) || null;
  }

  static async findByCode(code: string): Promise<IEventType | null> {
    try {
      const res = await query('SELECT * FROM event_types WHERE code = $1', [code]);
      if (res && res.rows && res.rows[0]) {
        memoryEventTypes.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Memory fallback
    }

    for (const item of memoryEventTypes.values()) {
      if (item.code.toLowerCase() === code.toLowerCase()) {
        return item;
      }
    }
    return null;
  }

  static async update(
    id: string,
    data: Partial<Omit<IEventType, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<IEventType | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) return null;

      const updatedName = data.name !== undefined ? data.name : existing.name;
      const updatedCode = data.code !== undefined ? data.code : existing.code;
      const updatedDesc = data.description !== undefined ? data.description : existing.description;
      const updatedIcon = data.icon_url !== undefined ? data.icon_url : existing.icon_url;
      const updatedBanner = data.banner_url !== undefined ? data.banner_url : existing.banner_url;
      const updatedMin = data.suggested_budget_min !== undefined ? data.suggested_budget_min : existing.suggested_budget_min;
      const updatedMax = data.suggested_budget_max !== undefined ? data.suggested_budget_max : existing.suggested_budget_max;
      const updatedGuests = data.default_guest_count !== undefined ? data.default_guest_count : existing.default_guest_count;
      const updatedActive = data.is_active !== undefined ? data.is_active : existing.is_active;

      const res = await query(
        `UPDATE event_types
         SET name = $1, code = $2, description = $3, icon_url = $4, banner_url = $5,
             suggested_budget_min = $6, suggested_budget_max = $7,
             default_guest_count = $8, is_active = $9, updated_at = NOW()
         WHERE id = $10
         RETURNING *`,
        [
          updatedName,
          updatedCode,
          updatedDesc || null,
          updatedIcon || null,
          updatedBanner || null,
          updatedMin || 0,
          updatedMax || 0,
          updatedGuests || 100,
          updatedActive,
          id,
        ]
      );
      if (res && res.rows && res.rows[0]) {
        memoryEventTypes.set(res.rows[0].id, res.rows[0]);
        return res.rows[0];
      }
    } catch {
      // Memory fallback
    }

    const item = memoryEventTypes.get(id);
    if (!item) return null;

    Object.assign(item, data, { updated_at: new Date() });
    return item;
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const res = await query('DELETE FROM event_types WHERE id = $1 RETURNING id', [id]);
      if (res && res.rows && res.rows.length > 0) {
        memoryEventTypes.delete(id);
        return true;
      }
    } catch {
      // Memory fallback
    }

    if (memoryEventTypes.has(id)) {
      memoryEventTypes.delete(id);
      return true;
    }

    return false;
  }
}
