import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

async function seedDatabase() {
  console.log('[Seeder] Connecting to PostgreSQL database...');
  const client = new Client({ connectionString: env.DATABASE_URL });

  try {
    await client.connect();
    console.log('[Seeder] Connection successful. Seeding mock accounts...');

    const passHash = await bcrypt.hash('Password123!', 10);

    // 1. Seed Users
    const customerUserRes = await client.query(
      `INSERT INTO users (phone_number, full_name, email, password_hash, role)
       VALUES ('+919876543210', 'Rahul Sharma (Customer)', 'rahul@example.com', $1, 'customer')
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id;`,
      [passHash]
    );
    const customerId = customerUserRes.rows[0].id;

    const vendorUserRes = await client.query(
      `INSERT INTO users (phone_number, full_name, email, password_hash, role)
       VALUES ('+919876543211', 'Royal Banquet & Catering (Vendor)', 'vendor@example.com', $1, 'vendor')
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id;`,
      [passHash]
    );
    const vendorUserId = vendorUserRes.rows[0].id;

    const adminUserRes = await client.query(
      `INSERT INTO users (phone_number, full_name, email, password_hash, role)
       VALUES ('+919876543212', 'System Administrator', 'admin@eventwise.com', $1, 'admin')
       ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id;`,
      [passHash]
    );

    // 2. Seed Vendor KYC & Service Catalog
    const vendorRes = await client.query(
      `INSERT INTO vendors (user_id, business_name, category, aadhaar_masked, bank_account_number, bank_ifsc, virtual_payment_address, is_kyc_verified)
       VALUES ($1, 'Royal Grand Banquet & Caterers', 'banquet_hall', 'XXXX-XXXX-1234', '918273645019', 'HDFC0001234', 'royalbanquet@hdfcbank', TRUE)
       ON CONFLICT (user_id) DO UPDATE SET business_name = EXCLUDED.business_name
       RETURNING id;`,
      [vendorUserId]
    );
    const vendorId = vendorRes.rows[0].id;

    await client.query(
      `INSERT INTO vendor_services (vendor_id, title, description, base_price, price_unit, max_capacity)
       VALUES ($1, 'Deluxe Banquet & Catering Package', 'Complete AC hall + 300 Veg/Non-Veg per plate catering setup', 75000.00, 'per_event', 300)
       ON CONFLICT DO NOTHING;`,
      [vendorId]
    );

    console.log('✅ [Seeder] Mock Customer, Vendor, and Admin accounts seeded successfully.');
    console.log('📱 Customer Credentials: Phone: +919876543210 | Password: Password123!');
    console.log('🏪 Vendor Credentials:   Phone: +919876543211 | Password: Password123!');
    console.log('⚡ Admin Credentials:    Phone: +919876543212 | Password: Password123!');
  } catch (error) {
    console.error('❌ [Seeder Failed]:', error);
  } finally {
    await client.end();
  }
}

seedDatabase();
