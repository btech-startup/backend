-- Migration 005: Event Types Taxonomy & User Events Master

CREATE TABLE IF NOT EXISTS event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(255),
  banner_url VARCHAR(255),
  suggested_budget_min NUMERIC(12, 2) DEFAULT 0,
  suggested_budget_max NUMERIC(12, 2) DEFAULT 0,
  default_guest_count INT DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type_id UUID REFERENCES event_types(id) ON DELETE SET NULL,
  event_type VARCHAR(100),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time VARCHAR(20),
  end_time VARCHAR(20),
  venue_name VARCHAR(150),
  venue_address TEXT,
  city VARCHAR(100),
  location VARCHAR(150),
  venue_latitude NUMERIC(10, 7),
  venue_longitude NUMERIC(10, 7),
  guest_count INT DEFAULT 50,
  estimated_budget NUMERIC(12, 2) DEFAULT 0,
  actual_spent NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_types_code ON event_types(code);
CREATE INDEX IF NOT EXISTS idx_event_types_active ON event_types(is_active);

-- Default Event Types Seeding
INSERT INTO event_types (name, code, description, default_guest_count, suggested_budget_min, suggested_budget_max)
VALUES 
  ('Wedding Ceremony', 'wedding', 'Traditional sacred wedding vows and muhurtham', 400, 500000, 2500000),
  ('Grand Reception', 'reception', 'Evening dinner and stage celebration with photography', 500, 400000, 2000000),
  ('Sangeet & Mehendi', 'sangeet_mehendi', 'Musical night with DJ, dance performances and mehendi', 200, 200000, 800000),
  ('Birthday Party', 'birthday', 'Milestone birthdays with theme decor and cake cutting', 75, 25000, 150000),
  ('Corporate Event', 'corporate', 'Conferences, product launches, team offsites and seminars', 150, 100000, 1000000),
  ('Housewarming / Pooja', 'housewarming', 'Griha Pravesham rituals with purohit and traditional catering', 100, 50000, 300000)
ON CONFLICT (code) DO NOTHING;
