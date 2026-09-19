-- EventWise v3.0 Database DDL Upgrade
-- Features: Wallet, Deliverables, Notifications, Location Tracking, Integrations

-- New Enums
DO $$ BEGIN
    CREATE TYPE wallet_transaction_type AS ENUM ('credit', 'debit', 'escrow_hold', 'escrow_release', 'refund', 'withdrawal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE wallet_transaction_status AS ENUM ('pending', 'completed', 'failed', 'reversed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE deliverable_status AS ENUM ('pending', 'in_progress', 'submitted', 'approved', 'revision_requested', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'booking_created', 'booking_confirmed', 'booking_cancelled',
        'payment_received', 'milestone_released', 'checkin_verified',
        'deliverable_submitted', 'deliverable_approved',
        'negotiation_received', 'wallet_credited', 'wallet_withdrawn',
        'dispute_raised', 'dispute_resolved', 'sos_dispatched', 'general'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('initiated', 'pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Wallets
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    available_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    locked_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_withdrawn NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Wallet Transactions (Append-Only Ledger)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    transaction_type wallet_transaction_type NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    balance_after NUMERIC(14, 2) NOT NULL,
    description TEXT NOT NULL,
    reference_id VARCHAR(128) UNIQUE NOT NULL,
    status wallet_transaction_status NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Deliverables (Work Delivery Tracking)
CREATE TABLE IF NOT EXISTS deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    file_urls JSONB NOT NULL DEFAULT '[]',
    status deliverable_status NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL DEFAULT 'general',
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Vendor Location Tracking
CREATE TABLE IF NOT EXISTS vendor_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID UNIQUE NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Payment Orders (Integration Tracking)
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    gateway_provider VARCHAR(50) NOT NULL DEFAULT 'razorpay',
    gateway_order_id VARCHAR(100) UNIQUE,
    gateway_payment_id VARCHAR(100),
    gateway_signature VARCHAR(255),
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'initiated',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes for v3
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_booking ON wallet_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_ref ON wallet_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_booking ON deliverables(booking_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_vendor ON deliverables(vendor_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_locations_vendor ON vendor_locations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_booking ON payment_orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_gateway ON payment_orders(gateway_order_id);
