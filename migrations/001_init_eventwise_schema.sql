-- EventWise v1.0 Production PostgreSQL 16 Schema DDL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core Platform Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'admin', 'ops_agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_category AS ENUM ('banquet_hall', 'photography', 'catering', 'decor_sound', 'makeup_artist');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('draft', 'negotiating', 'advance_paid', 'active_confirmed', 'completed', 'disputed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE milestone_stage AS ENUM ('advance_lock', 'event_checkin', 'work_delivery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE milestone_status AS ENUM ('pending_funding', 'held_escrow', 'payout_scheduled', 'released', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ledger_entry_type AS ENUM ('escrow_deposit', 'vendor_payout', 'platform_commission', 'dispute_refund');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE negotiation_sender AS ENUM ('client', 'vendor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE negotiation_status AS ENUM ('pending', 'accepted', 'rejected', 'countered', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users & Profiles Master
CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 phone_number VARCHAR(15) UNIQUE NOT NULL,
 full_name VARCHAR(100) NOT NULL,
 email VARCHAR(120),
 password_hash VARCHAR(255),
 role user_role NOT NULL DEFAULT 'customer',
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Vendors & Verification
CREATE TABLE IF NOT EXISTS vendors (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 business_name VARCHAR(150) NOT NULL,
 category service_category NOT NULL,
 aadhaar_masked VARCHAR(12) NOT NULL,
 gstin VARCHAR(15),
 bank_account_number VARCHAR(30) NOT NULL,
 bank_ifsc VARCHAR(11) NOT NULL,
 virtual_payment_address VARCHAR(50) NOT NULL,
 is_kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
 verified_at TIMESTAMPTZ,
 rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Vendor Services & Catalog
CREATE TABLE IF NOT EXISTS vendor_services (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
 title VARCHAR(150) NOT NULL,
 description TEXT NOT NULL,
 base_price NUMERIC(12, 2) NOT NULL,
 price_unit VARCHAR(30) NOT NULL, -- 'per_event', 'per_plate', 'half_day'
 max_capacity INT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bookings Entity
CREATE TABLE IF NOT EXISTS bookings (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_reference VARCHAR(20) UNIQUE NOT NULL,
 client_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
 service_id UUID NOT NULL REFERENCES vendor_services(id) ON DELETE RESTRICT,
 event_date DATE NOT NULL,
 event_slot VARCHAR(20) NOT NULL, -- 'morning', 'evening', 'full_day'
 venue_address TEXT NOT NULL,
 venue_latitude NUMERIC(10, 7) NOT NULL,
 venue_longitude NUMERIC(10, 7) NOT NULL,
 gross_amount NUMERIC(12, 2) NOT NULL,
 platform_fee NUMERIC(12, 2) NOT NULL,
 tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
 net_payable_amount NUMERIC(12, 2) NOT NULL,
 status booking_status NOT NULL DEFAULT 'draft',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Milestone Configuration & Escrow State
CREATE TABLE IF NOT EXISTS booking_milestones (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
 stage milestone_stage NOT NULL,
 split_percentage NUMERIC(5, 2) NOT NULL, -- 20.00, 50.00, 30.00
 gross_amount NUMERIC(12, 2) NOT NULL,
 net_vendor_payout NUMERIC(12, 2) NOT NULL,
 status milestone_status NOT NULL DEFAULT 'pending_funding',
 trigger_type VARCHAR(50) NOT NULL, -- 'booking_confirmation', 'geofenced_otp', 'client_approval'
 otp_code VARCHAR(6),
 auto_release_deadline TIMESTAMPTZ,
 released_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Double-Entry Escrow Ledger (Append-Only)
CREATE TABLE IF NOT EXISTS escrow_ledger (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
 milestone_id UUID REFERENCES booking_milestones(id) ON DELETE RESTRICT,
 entry_type ledger_entry_type NOT NULL,
 amount NUMERIC(12, 2) NOT NULL,
 debit_account VARCHAR(100) NOT NULL, -- e.g., 'customer_payment_inbound', 'nodal_escrow_holding'
 credit_account VARCHAR(100) NOT NULL, -- e.g., 'nodal_escrow_holding', 'vendor_payout_vpa'
 gateway_reference_id VARCHAR(100) UNIQUE,
 idempotency_key VARCHAR(128) UNIQUE NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Real-Time Counter-Offer Negotiations
CREATE TABLE IF NOT EXISTS booking_negotiations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
 sender_type negotiation_sender NOT NULL,
 proposed_price NUMERIC(12, 2) NOT NULL,
 counter_discount_percentage NUMERIC(5, 2) NOT NULL,
 remarks VARCHAR(255),
 status negotiation_status NOT NULL DEFAULT 'pending',
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Physical Geofenced Venue Check-In
CREATE TABLE IF NOT EXISTS venue_checkins (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
 vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
 expected_latitude NUMERIC(10, 7) NOT NULL,
 expected_longitude NUMERIC(10, 7) NOT NULL,
 actual_latitude NUMERIC(10, 7),
 actual_longitude NUMERIC(10, 7),
 radial_distance_meters NUMERIC(8, 2),
 submitted_otp VARCHAR(6),
 is_verified BOOLEAN NOT NULL DEFAULT FALSE,
 verified_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Dispute Audit & Resolution
CREATE TABLE IF NOT EXISTS booking_disputes (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
 milestone_id UUID NOT NULL REFERENCES booking_milestones(id) ON DELETE RESTRICT,
 raised_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 reason TEXT NOT NULL,
 evidence_urls JSONB NOT NULL DEFAULT '[]',
 is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
 refund_amount NUMERIC(12, 2) DEFAULT 0.00,
 arbitrator_notes TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Anti-Circumvention Chat Audit Log
CREATE TABLE IF NOT EXISTS chat_audit_logs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 sender_id UUID NOT NULL REFERENCES users(id),
 receiver_id UUID NOT NULL REFERENCES users(id),
 original_message TEXT NOT NULL,
 violation_type VARCHAR(50) NOT NULL,
 sanitized_message TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Concurrency Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_date ON bookings (vendor_id, event_date, event_slot);
CREATE INDEX IF NOT EXISTS idx_milestones_booking ON booking_milestones (booking_id);
CREATE INDEX IF NOT EXISTS idx_ledger_idempotency ON escrow_ledger (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_negotiations_booking ON booking_negotiations (booking_id, status);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors (category) WHERE is_kyc_verified = TRUE;
