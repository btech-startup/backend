/**
 * End-to-End Test Suite for Vendor Calendar & Event Availability
 * Verifies:
 *  1. Protected Vendor Monthly Calendar Security & Token Authorization (401 on missing, 403 on mismatched, 200 on authorized)
 *  2. Protected Date Availability Verification (401 on missing, 403 on mismatched, 200 on authorized)
 *  3. Protected Date Availability Verification for Booked Date + Nearby Suggestions
 *  4. Vendor Private Calendar Schedule Access (/api/v1/vendor/calendar)
 *  5. Vendor Manual Date Blocking (/api/v1/vendor/calendar/block)
 *  6. Vendor Date Unblocking (/api/v1/vendor/calendar/:id)
 *  7. Chatbot Deal Auto-Booking Calendar Integration
 */

import http from 'http';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { seed } from '../prisma/seed';

const PORT = 5057;
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

async function runCalendarE2ETests() {
  console.log(`\n🔄 Starting Calendar Test Server on port ${PORT}`);
  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  try {
    // 1. Seed fresh database
    await seed();

    // Fetch the sample vendor ID
    const sampleVendor = await prisma.vendor.findFirst({
      where: { phone: '+919876500001' },
      include: { priceCards: true },
    });

    if (!sampleVendor) {
      throw new Error('Sample vendor (+919876500001) not found in database');
    }

    const vendorId = sampleVendor.id;
    console.log(`Testing Vendor: "${sampleVendor.businessName}" (ID: ${vendorId})`);

    // Fetch a second vendor to test authorization boundary (mismatched token)
    const otherVendor = await prisma.vendor.findFirst({
      where: { phone: '+919876500002' },
    });
    if (!otherVendor) {
      throw new Error('Second sample vendor (+919876500002) not found in database');
    }

    // Authenticate Vendor 1
    const sendOtp1 = await request('/api/v1/auth/send-otp', {
      method: 'POST',
      body: { phone: sampleVendor.phone },
    });
    const otp1 = sendOtp1.data.data?.devOtp || '123456';
    const verifyOtp1 = await request('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { phone: sampleVendor.phone, otp: otp1 },
    });
    const vendorToken = verifyOtp1.data.data.token;

    // Authenticate Vendor 2 (for authorization cross-check)
    const sendOtp2 = await request('/api/v1/auth/send-otp', {
      method: 'POST',
      body: { phone: otherVendor.phone },
    });
    const otp2 = sendOtp2.data.data?.devOtp || '123456';
    const verifyOtp2 = await request('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { phone: otherVendor.phone, otp: otp2 },
    });
    const otherVendorToken = verifyOtp2.data.data.token;

    // ==========================================
    // Test 1: Protected Vendor Monthly Calendar Access & Authorization
    // ==========================================
    console.log('\n--- Test 1: Protected Vendor Monthly Calendar Security & Access (/user/vendors/:vendorId/calendar) ---');
    
    // 1a. Missing token -> Expect 401 Unauthorized
    const calNoTokenRes = await request(`/api/v1/user/vendors/${vendorId}/calendar?month=2026-12`);
    console.log('No-token status (Expected 401):', calNoTokenRes.status);
    if (calNoTokenRes.status !== 401 || calNoTokenRes.data.success) {
      throw new Error(`Expected 401 Unauthorized when accessing calendar without token, got ${calNoTokenRes.status}`);
    }

    // 1b. Invalid token -> Expect 401 Unauthorized
    const calInvalidTokenRes = await request(`/api/v1/user/vendors/${vendorId}/calendar?month=2026-12`, {
      token: 'invalid_malformed_jwt_token',
    });
    console.log('Invalid-token status (Expected 401):', calInvalidTokenRes.status);
    if (calInvalidTokenRes.status !== 401) {
      throw new Error(`Expected 401 for invalid token, got ${calInvalidTokenRes.status}`);
    }

    // 1c. Mismatched vendor token -> Expect 403 Forbidden
    const calWrongVendorRes = await request(`/api/v1/user/vendors/${vendorId}/calendar?month=2026-12`, {
      token: otherVendorToken,
    });
    console.log('Wrong-vendor token status (Expected 403):', calWrongVendorRes.status);
    if (calWrongVendorRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden when accessing vendor calendar with different vendor token, got ${calWrongVendorRes.status}`);
    }

    // 1d. Matching vendor token -> Expect 200 OK
    const calRes = await request(`/api/v1/user/vendors/${vendorId}/calendar?month=2026-12`, {
      token: vendorToken,
    });
    console.log('Authorized status (Expected 200):', calRes.status);
    console.log('Calendar Period:', calRes.data.data.period);
    console.log('Calendar Summary:', calRes.data.data.summary);

    if (calRes.status !== 200 || !calRes.data.success) {
      throw new Error(`Failed to fetch calendar with authorized token: ${calRes.data.message}`);
    }

    const decDays = calRes.data.data.calendar;
    if (decDays.length !== 31) {
      throw new Error(`Expected 31 days in December 2026, got ${decDays.length}`);
    }

    // Check booked day (2026-12-15)
    const day15 = decDays.find((d: any) => d.date === '2026-12-15');
    console.log('Day 2026-12-15 status:', day15);
    if (!day15 || day15.isAvailable !== false || day15.status !== 'BOOKED') {
      throw new Error('Day 2026-12-15 should be marked as BOOKED');
    }
    // Check privacy masking on public calendar
    if (day15.event?.clientPhone) {
      throw new Error('Public calendar should mask client phone number!');
    }

    // Check blocked day (2026-12-05)
    const day5 = decDays.find((d: any) => d.date === '2026-12-05');
    console.log('Day 2026-12-05 status:', day5);
    if (!day5 || day5.isAvailable !== false || day5.status !== 'BLOCKED') {
      throw new Error('Day 2026-12-05 should be marked as BLOCKED');
    }

    // Check available day (2026-12-10)
    const day10 = decDays.find((d: any) => d.date === '2026-12-10');
    console.log('Day 2026-12-10 status:', day10);
    if (!day10 || day10.isAvailable !== true || day10.status !== 'AVAILABLE') {
      throw new Error('Day 2026-12-10 should be marked as AVAILABLE');
    }

    // ==========================================
    // Test 2: Protected Date Verification Security & Access (Available Date)
    // ==========================================
    console.log('\n--- Test 2: Protected Date Verification Security & Access (2026-12-10) ---');
    
    // 2a. Missing token -> 401
    const verifyNoToken = await request(`/api/v1/user/vendors/${vendorId}/calendar/verify-date?date=2026-12-10`);
    console.log('Verify Date No-token status (Expected 401):', verifyNoToken.status);
    if (verifyNoToken.status !== 401) {
      throw new Error('Expected 401 when verifying date without token');
    }

    // 2b. Mismatched token -> 403
    const verifyWrongToken = await request(`/api/v1/user/vendors/${vendorId}/calendar/verify-date?date=2026-12-10`, {
      token: otherVendorToken,
    });
    console.log('Verify Date Wrong-token status (Expected 403):', verifyWrongToken.status);
    if (verifyWrongToken.status !== 403) {
      throw new Error('Expected 403 when verifying date with mismatched vendor token');
    }

    // 2c. Matching token -> 200
    const verifyAvailRes = await request(`/api/v1/user/vendors/${vendorId}/calendar/verify-date?date=2026-12-10`, {
      token: vendorToken,
    });
    console.log('Status:', verifyAvailRes.status);
    console.log('Verify Result:', verifyAvailRes.data.data);

    if (verifyAvailRes.status !== 200 || !verifyAvailRes.data.data.isAvailable) {
      throw new Error('Date 2026-12-10 should be verified as AVAILABLE');
    }

    // ==========================================
    // Test 3: Protected Date Verification (Booked Date + Nearby Suggestions)
    // ==========================================
    console.log('\n--- Test 3: Verify Booked Date (2026-12-15) + Recommendations ---');
    const verifyBookedRes = await request(`/api/v1/user/vendors/${vendorId}/calendar/verify-date?date=2026-12-15`, {
      token: vendorToken,
    });
    console.log('Status:', verifyBookedRes.status);
    console.log('Verify Result:', verifyBookedRes.data.data);

    if (verifyBookedRes.status !== 200 || verifyBookedRes.data.data.isAvailable !== false) {
      throw new Error('Date 2026-12-15 should be verified as NOT AVAILABLE');
    }
    if (verifyBookedRes.data.data.status !== 'BOOKED') {
      throw new Error('Status should be BOOKED');
    }
    if (!Array.isArray(verifyBookedRes.data.data.suggestedAvailableDates) || verifyBookedRes.data.data.suggestedAvailableDates.length === 0) {
      throw new Error('Expected suggested available dates for booked date conflict');
    }
    console.log('Suggested Alternatives:', verifyBookedRes.data.data.suggestedAvailableDates);

    // ==========================================
    // Test 4: Vendor Private Calendar Schedule Access
    // ==========================================
    console.log('\n--- Test 4: Vendor Private Calendar Schedule Access (/api/v1/vendor/calendar) ---');
    const vendorCalRes = await request('/api/v1/vendor/calendar?month=2026-12', {
      token: vendorToken,
    });
    console.log('Status:', vendorCalRes.status);
    const vendorDay15 = vendorCalRes.data.data.calendar.find((d: any) => d.date === '2026-12-15');
    console.log('Vendor Schedule Day 15:', vendorDay15);

    if (!vendorDay15.event || !vendorDay15.event.clientName || !vendorDay15.event.clientPhone) {
      throw new Error('Private vendor schedule must reveal full clientName and clientPhone for booked events!');
    }

    // ==========================================
    // Test 5: Vendor Manual Date Blocking
    // ==========================================
    console.log('\n--- Test 5: Vendor Manual Date Blocking (2026-12-18) ---');
    const blockRes = await request('/api/v1/vendor/calendar/block', {
      method: 'POST',
      token: vendorToken,
      body: {
        date: '2026-12-18',
        title: 'Warehouse Prop Refurbishing',
        eventType: 'MAINTENANCE',
        notes: 'Annual deep clean of royal mandap props and lighting trusses.',
        slotType: 'FULL_DAY',
      },
    });
    console.log('Block Status:', blockRes.status);
    console.log('Block Data:', blockRes.data.data);

    if (blockRes.status !== 200 || !blockRes.data.data.blockedDates.length) {
      throw new Error('Failed to block date 2026-12-18');
    }
    const blockedEntryId = blockRes.data.data.blockedDates[0].id;

    // Verify date is now blocked publicly (with token)
    const verifyBlocked = await request(`/api/v1/user/vendors/${vendorId}/calendar/verify-date?date=2026-12-18`, {
      token: vendorToken,
    });
    console.log('Verify Newly Blocked Date:', verifyBlocked.data.data);
    if (verifyBlocked.data.data.isAvailable !== false || verifyBlocked.data.data.status !== 'BLOCKED') {
      throw new Error('Date 2026-12-18 should now reflect as BLOCKED');
    }

    // ==========================================
    // Test 6: Vendor Date Unblocking
    // ==========================================
    console.log('\n--- Test 6: Vendor Unblocking Date ---');
    const unblockRes = await request(`/api/v1/vendor/calendar/${blockedEntryId}`, {
      method: 'DELETE',
      token: vendorToken,
    });
    console.log('Unblock Status:', unblockRes.status);
    console.log('Unblock Data:', unblockRes.data);

    if (unblockRes.status !== 200 || !unblockRes.data.success) {
      throw new Error('Failed to unblock date');
    }

    // Verify date is now open again (with token)
    const verifyUnblocked = await request(`/api/v1/user/vendors/${vendorId}/calendar/verify-date?date=2026-12-18`, {
      token: vendorToken,
    });
    console.log('Verify Unblocked Date:', verifyUnblocked.data.data);
    if (verifyUnblocked.data.data.isAvailable !== true || verifyUnblocked.data.data.status !== 'AVAILABLE') {
      throw new Error('Date 2026-12-18 should now be restored to AVAILABLE');
    }

    // ==========================================
    // Test 7: Chatbot Deal Auto-Booking Calendar Sync
    // ==========================================
    console.log('\n--- Test 7: Chatbot Deal Auto-Booking Calendar Sync (2026-11-12) ---');
    const targetPriceCard = sampleVendor.priceCards[0];
    const dealRes = await request('/api/v1/user/deals/chatbot', {
      method: 'POST',
      body: {
        vendorId,
        priceCardId: targetPriceCard?.id,
        clientName: 'Rahul Verma',
        clientPhone: '+919988112233',
        clientEmail: 'rahul.verma@example.com',
        eventType: 'Engagement & Cocktail Party',
        eventDate: '2026-11-12',
        guestCount: 250,
        offeredPrice: targetPriceCard ? targetPriceCard.price : 60000,
        userMessage: 'We would love to book your premium decor for our engagement on 2026-11-12!',
      },
    });

    console.log('Chatbot Deal Status:', dealRes.status);
    console.log('Deal Created:', {
      dealId: dealRes.data.data.dealId,
      status: dealRes.data.data.status,
      agreedPrice: dealRes.data.data.agreedPrice,
    });

    // Check calendar for 2026-11-12 (with token)
    const checkBookedViaDeal = await request(`/api/v1/user/vendors/${vendorId}/calendar/verify-date?date=2026-11-12`, {
      token: vendorToken,
    });
    console.log('Verify Calendar after Deal Acceptance:', checkBookedViaDeal.data.data);
    if (checkBookedViaDeal.data.data.isAvailable !== false || checkBookedViaDeal.data.data.status !== 'BOOKED') {
      throw new Error('Calendar slot for 2026-11-12 should be automatically registered as BOOKED after deal acceptance!');
    }

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL 7 CALENDAR & EVENT AVAILABILITY TESTS PASSED!');
    console.log('🎉 ========================================================\n');
  } catch (error) {
    console.error('❌ Calendar E2E Test Failed:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
  }
}

runCalendarE2ETests();
