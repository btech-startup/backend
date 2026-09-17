/**
 * End-to-End Test Runner for Event Management Vendor Backend
 * Verifies:
 *  1. Send Mobile OTP
 *  2. Verify Mobile OTP & Get JWT
 *  3. KYC: Aadhaar OTP Send & Verify
 *  4. KYC: PAN Card Verification
 *  5. KYC: Bank Account & IFSC Penny Drop Verification
 *  6. Check KYC Status (Full Verification)
 *  7. Vendor Profile & Dashboard Overview
 *  8. Vendor Profile Update
 *  9. Create Vendor Price Card / Rate Package
 * 10. Get Vendor Price Cards
 * 11. Update Vendor Price Card
 * 12. Public Client View for Price Cards
 */

import http from 'http';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';

const PORT = 5055;
let server: http.Server;
let baseUrl: string;

async function request(path: string, options: { method?: string; body?: any; token?: string } = {}) {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runE2ETests() {
  console.log('🔄 Starting Test Server on port', PORT);
  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  const testPhone = '+919876500001';

  try {
    // Cleanup any existing test vendor
    await prisma.vendor.deleteMany({ where: { phone: testPhone } });
    await prisma.otpRecord.deleteMany({ where: { phone: testPhone } });

    console.log('\n--- Step 1: Send Mobile OTP ---');
    const sendOtpRes = await request('/api/v1/auth/send-otp', {
      method: 'POST',
      body: { phone: testPhone },
    });
    console.log('Status:', sendOtpRes.status);
    console.log('Response:', sendOtpRes.data);
    if (!sendOtpRes.data.success) throw new Error('Send OTP failed');
    const otp = sendOtpRes.data.data.devOtp;

    console.log('\n--- Step 2: Verify Mobile OTP & Get JWT Token ---');
    const verifyOtpRes = await request('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { phone: testPhone, otp },
    });
    console.log('Status:', verifyOtpRes.status);
    console.log('Response:', verifyOtpRes.data);
    if (!verifyOtpRes.data.success) throw new Error('Verify OTP failed');
    const token = verifyOtpRes.data.data.token;
    const vendorId = verifyOtpRes.data.data.vendor.id;
    console.log('🔑 JWT Token Received. Vendor ID:', vendorId);

    console.log('\n--- Step 3: Aadhaar KYC (Send OTP & Verify) ---');
    const testAadhaar = '998877665544';
    const aadhaarOtpRes = await request('/api/v1/vendor/kyc/aadhaar/send-otp', {
      method: 'POST',
      token,
      body: { aadhaarNumber: testAadhaar },
    });
    console.log('Aadhaar Send OTP Status:', aadhaarOtpRes.status, aadhaarOtpRes.data);
    const aadhaarDevOtp = aadhaarOtpRes.data.data.devOtp || '123456';

    const aadhaarVerifyRes = await request('/api/v1/vendor/kyc/aadhaar/verify-otp', {
      method: 'POST',
      token,
      body: {
        aadhaarNumber: testAadhaar,
        otp: aadhaarDevOtp,
        fullName: 'Vikram Sharma',
      },
    });
    console.log('Aadhaar Verify Status:', aadhaarVerifyRes.status, aadhaarVerifyRes.data);
    if (!aadhaarVerifyRes.data.success) throw new Error('Aadhaar verify failed');

    console.log('\n--- Step 4: PAN KYC Verification ---');
    const panVerifyRes = await request('/api/v1/vendor/kyc/pan/verify', {
      method: 'POST',
      token,
      body: {
        panNumber: 'ABCDE1234F',
        panHolderName: 'Vikram Sharma',
      },
    });
    console.log('PAN Verify Status:', panVerifyRes.status, panVerifyRes.data);
    if (!panVerifyRes.data.success) throw new Error('PAN verify failed');

    console.log('\n--- Step 5: Bank Account & IFSC Verification ---');
    const bankVerifyRes = await request('/api/v1/vendor/kyc/bank/verify', {
      method: 'POST',
      token,
      body: {
        accountNumber: '9182736450192',
        ifsc: 'HDFC0001234',
        accountHolderName: 'Vikram Sharma',
      },
    });
    console.log('Bank Verify Status:', bankVerifyRes.status, bankVerifyRes.data);
    if (!bankVerifyRes.data.success) throw new Error('Bank verify failed');

    console.log('\n--- Step 6: KYC Status Check ---');
    const kycStatusRes = await request('/api/v1/vendor/kyc/status', { token });
    console.log('KYC Status:', kycStatusRes.status, JSON.stringify(kycStatusRes.data, null, 2));
    if (!kycStatusRes.data.data.isFullyVerified) {
      throw new Error('Expected vendor KYC to be fully verified!');
    }
    if (kycStatusRes.data.data.vendorStatus !== 'VERIFIED') {
      throw new Error('Expected vendor status to be VERIFIED!');
    }

    console.log('\n--- Step 7: Vendor Profile & Dashboard Stats ---');
    const profileRes = await request('/api/v1/vendor/profile', { token });
    console.log('Current Profile:', profileRes.data);
    const statsRes = await request('/api/v1/vendor/dashboard/stats', { token });
    console.log('Dashboard Stats:', statsRes.data);

    console.log('\n--- Step 8: Update Vendor Profile ---');
    const updateProfileRes = await request('/api/v1/vendor/profile', {
      method: 'PUT',
      token,
      body: {
        businessName: 'Royal Grand Decorators & Events',
        ownerName: 'Vikram Sharma',
        category: 'DECORATION',
        email: 'vikram.royaldecor@example.com',
        bio: 'Premier luxury wedding and event decorators with 10+ years of royal theme creations.',
        experienceYears: 10,
        address: '42 MG Road, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
      },
    });
    console.log('Update Profile Status:', updateProfileRes.status, updateProfileRes.data);
    if (!updateProfileRes.data.success) throw new Error('Update profile failed');

    console.log('\n--- Step 9: Create Vendor Price Card / Rate Package ---');
    const createPriceCardRes = await request('/api/v1/vendor/price-card', {
      method: 'POST',
      token,
      body: {
        title: 'Royal Mandap & Floral Stage Decor Package',
        category: 'DECORATION',
        description: 'Exquisite fresh exotic floral backdrop, illuminated walkway, LED entrance arch, and royal sofas.',
        price: 85000,
        pricingUnit: 'PER_EVENT',
        inclusions: [
          'Exotic imported floral stage backdrop (30ft x 15ft)',
          'Grand red carpet walkway with 10 floral pillars',
          'Warm ambient spotlights and fairy-light chandeliers',
          'Royal bride & groom banquet seating chairs',
        ],
        terms: '30% advance on booking, 70% post installation on event morning.',
      },
    });
    console.log('Create Price Card Status:', createPriceCardRes.status, createPriceCardRes.data);
    if (!createPriceCardRes.data.success) throw new Error('Create price card failed');
    const priceCardId = createPriceCardRes.data.data.id;

    console.log('\n--- Step 10: Get Vendor Price Cards ---');
    const getPriceCardsRes = await request('/api/v1/vendor/price-card', { token });
    console.log('Vendor Price Cards:', getPriceCardsRes.data);
    if (getPriceCardsRes.data.data.length === 0) throw new Error('Expected at least 1 price card');

    console.log('\n--- Step 11: Update Vendor Price Card ---');
    const updatePriceCardRes = await request(`/api/v1/vendor/price-card/${priceCardId}`, {
      method: 'PUT',
      token,
      body: {
        price: 95000,
        terms: 'Updated terms: 20% advance booking deposit.',
      },
    });
    console.log('Update Price Card Status:', updatePriceCardRes.status, updatePriceCardRes.data);
    if (updatePriceCardRes.data.data.price !== 95000) {
      throw new Error('Price card price update failed');
    }

    console.log('\n--- Step 12: Public View of Vendor Price Cards ---');
    const publicPriceCardsRes = await request(`/api/v1/vendor/price-card/public/${vendorId}`);
    console.log('Public Client View:', publicPriceCardsRes.data);
    if (!publicPriceCardsRes.data.success) throw new Error('Public price card retrieval failed');

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL 12 END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY!');
    console.log('🎉 ========================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}
runE2ETests();
