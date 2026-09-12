-- EventWise v2.0.0-PROD-SPEC Database DDL Upgrade

-- Update Service Category Enum
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'purohit_pooja';
ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'samagri_kit';

-- Update Ledger Entry Type Enum
ALTER TYPE ledger_entry_type ADD VALUE IF NOT EXISTS 'sos_clawback';

-- 1. Family Escrow Contributions (Split-Family UPI Pool)
CREATE TABLE IF NOT EXISTS family_escrow_contributions (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
   contributor_name VARCHAR(100) NOT NULL,
   relation VARCHAR(50) NOT NULL, -- 'uncle', 'in_law', 'brother', 'friend'
   target_amount NUMERIC(12, 2) NOT NULL,
   paid_amount NUMERIC(12, 2) DEFAULT 0.00,
   upi_transaction_ref VARCHAR(100) UNIQUE,
   status VARCHAR(20) DEFAULT 'pending',
   created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Auspicious Muhurtham Dates (Panjika / Panchangam Calendar)
CREATE TABLE IF NOT EXISTS auspicious_muhurtham_dates (
   calendar_date DATE PRIMARY KEY,
   panchangam_event VARCHAR(100) NOT NULL,
   demand_multiplier NUMERIC(3, 2) DEFAULT 1.50,
   standby_pool_required BOOLEAN DEFAULT TRUE
);

-- 3. Excess Food Donation Pickups (Annadanam 10 PM Dispatch Engine)
CREATE TABLE IF NOT EXISTS food_donation_pickups (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
   estimated_meals_count INT NOT NULL,
   food_type VARCHAR(50) NOT NULL,
   assigned_ngo_name VARCHAR(150),
   volunteer_phone_masked VARCHAR(15),
   pickup_status VARCHAR(20) DEFAULT 'dispatched',
   completed_at TIMESTAMPTZ,
   created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for v2 Performance
CREATE INDEX IF NOT EXISTS idx_family_contributions_booking ON family_escrow_contributions(booking_id);
CREATE INDEX IF NOT EXISTS idx_food_donation_booking ON food_donation_pickups(booking_id);
