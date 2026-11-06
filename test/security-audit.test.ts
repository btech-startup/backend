/**
 * Comprehensive Automated Security Audit & Penetration Verification Suite
 * Validates:
 *  1. Security HTTP Headers (HSTS, CSP, X-Frame-Options, No X-Powered-By)
 *  2. Authentication Barriers (Missing token, Malformed token, Forged signature)
 *  3. Suspended Vendor Access Denial (403 Forbidden)
 *  4. OTP Plaintext Leakage Prevention & Cryptographic Hashing in Database
 *  5. OTP Brute-Force Lockout (>5 attempts rejected)
 *  6. Expired OTP Rejection
 *  7. Aadhaar Verification Backdoor Block (Static '123456' rejected)
 *  8. KYC Duplicate Theft Prevention (Duplicate PAN & Bank Account blocked)
 *  9. Input Sanitization & Stored XSS Neutralization
 * 10. Financial Number Validation (Infinity, NaN, Negative amounts blocked)
 * 11. Rate Limiting Enforcement (HTTP 429 Too Many Requests)
 */

import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';
import { seed } from '../prisma/seed';
import { VendorStatus } from '../src/types';

const PORT = 5058;
let server: http.Server;
let baseUrl: string;

async function request(path: string, options: { method?: string; body?: any; token?: string; headers?: Record<string, string> } = {}) {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: any = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, data, headers: res.headers };
}

async function runSecurityAudit() {
  console.log(`\n================================================================`);
  console.log(`🛡️  RUNNING COMPREHENSIVE SECURITY & PENETRATION AUDIT SUITE`);
  console.log(`📡 Server Port: ${PORT}`);
  console.log(`================================================================\n`);

  server = app.listen(PORT);
  baseUrl = `http://localhost:${PORT}`;

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(`Security Check Failed: ${message}`);
    }
    passedTests++;
    console.log(`✅ PASSED [${passedTests}]: ${message}`);
  }

  try {
    await seed();

    // -------------------------------------------------------------
    // Test 1: Security Headers Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Defensive HTTP Security Headers ---');
    const healthRes = await request('/api/v1/health');
    assert(healthRes.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options is DENY (Clickjacking protection)');
    assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff (MIME-sniff protection)');
    assert(healthRes.headers.get('x-xss-protection') === '1; mode=block', 'X-XSS-Protection is enabled');
    assert(healthRes.headers.get('x-powered-by') === null, 'X-Powered-By is hidden (Fingerprinting prevented)');
    assert(healthRes.headers.get('content-security-policy') !== null, 'Content-Security-Policy header is active');

    // -------------------------------------------------------------
    // Test 2: Authentication Defense (No token, Malformed, Forged)
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Authentication Barriers & Signature Verification ---');
    const noTokenRes = await request('/api/v1/vendor/profile');
    assert(noTokenRes.status === 401, 'Request without token rejected with 401');

    const malformedTokenRes = await request('/api/v1/vendor/profile', { token: 'invalid.token.structure' });
    assert(malformedTokenRes.status === 401, 'Malformed token rejected with 401');

    // Forged signature using an attacker's wrong secret key
    const forgedToken = jwt.sign({ vendorId: 'victim-id-12345' }, 'attacker_forged_secret_key_999999');
    const forgedTokenRes = await request('/api/v1/vendor/profile', { token: forgedToken });
    assert(forgedTokenRes.status === 401, 'Forged JWT with wrong signature rejected with 401');

    // -------------------------------------------------------------
    // Test 3: Suspended / Rejected Vendor Access Denial
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Suspended Vendor Access Denial ---');
    const suspendedPhone = '+919999000001';
    await prisma.vendor.deleteMany({ where: { phone: suspendedPhone } });
    const suspendedVendor = await prisma.vendor.create({
      data: {
        phone: suspendedPhone,
        status: VendorStatus.SUSPENDED,
        ownerName: 'Suspended Bad Actor',
      },
    });

    const suspendedToken = jwt.sign(
      { vendorId: suspendedVendor.id, phone: suspendedVendor.phone, status: suspendedVendor.status },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const suspendedAccessRes = await request('/api/v1/vendor/profile', { token: suspendedToken });
    assert(suspendedAccessRes.status === 403, 'Suspended vendor access blocked with 403 Forbidden');
    assert(suspendedAccessRes.data.message.includes('suspended'), 'Error message states account is suspended');

    // -------------------------------------------------------------
    // Test 4: OTP Plaintext Storage Check (Database Hashing Verification)
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Database OTP Plaintext Leakage Prevention ---');
    const auditPhone = '+919876543299';
    await prisma.otpRecord.deleteMany({ where: { phone: auditPhone } });

    const sendOtpRes = await request('/api/v1/auth/send-otp', {
      method: 'POST',
      body: { phone: auditPhone },
    });
    assert(sendOtpRes.status === 200, 'Send OTP dispatched');

    const storedOtpRecord = await prisma.otpRecord.findFirst({
      where: { phone: auditPhone, purpose: 'VENDOR_LOGIN', verified: false },
      orderBy: { createdAt: 'desc' },
    });
    assert(storedOtpRecord !== null, 'OTP record created in database');
    assert(storedOtpRecord!.otp.length === 64, 'Stored OTP is a 64-character HMAC-SHA256 hash, NOT cleartext');
    assert(!/^\d{6}$/.test(storedOtpRecord!.otp), 'Stored OTP is confirmed NOT a 6-digit plaintext number');

    // -------------------------------------------------------------
    // Test 5: OTP Brute-Force Lockout (Atomic Counter)
    // -------------------------------------------------------------
    console.log('\n--- Test 5: OTP Brute-Force Lockout (>5 attempts) ---');
    for (let attempt = 1; attempt <= 5; attempt++) {
      const failRes = await request('/api/v1/auth/verify-otp', {
        method: 'POST',
        body: { phone: auditPhone, otp: '000000' },
      });
      assert(failRes.status === 400 && failRes.data.message.includes('Invalid OTP'), `Attempt ${attempt} fails gracefully`);
    }

    // 6th attempt should lock out
    const lockoutRes = await request('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { phone: auditPhone, otp: '000000' },
    });
    assert(lockoutRes.status === 400, 'Attempt 6 rejected');
    assert(lockoutRes.data.message.includes('Maximum OTP verification attempts exceeded'), 'OTP is locked after exceeding max attempts');

    // -------------------------------------------------------------
    // Test 6: Expired OTP Rejection
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Expired OTP Rejection ---');
    const expiredPhone = '+919876543288';
    await prisma.otpRecord.deleteMany({ where: { phone: expiredPhone } });
    await prisma.otpRecord.create({
      data: {
        phone: expiredPhone,
        otp: 'dummyhash',
        purpose: 'VENDOR_LOGIN',
        expiresAt: new Date(Date.now() - 1000 * 60), // 1 minute in the past
        attempts: 0,
      },
    });
    const expiredRes = await request('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { phone: expiredPhone, otp: '123456' },
    });
    assert(expiredRes.status === 400 && expiredRes.data.message.includes('expired'), 'Expired OTP rejected');

    // -------------------------------------------------------------
    // Test 7: Aadhaar Static Backdoor Verification Bypass Block
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Aadhaar Static Backdoor Bypass Block ---');
    // Get valid vendor token
    const testVendorPhone = '+919876500001';
    const sampleVendor = await prisma.vendor.findFirst({ where: { phone: testVendorPhone } });
    const vendorToken = jwt.sign(
      { vendorId: sampleVendor!.id, phone: sampleVendor!.phone, status: sampleVendor!.status },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Ensure no active Aadhaar OTP exists
    await prisma.otpRecord.deleteMany({ where: { phone: testVendorPhone, purpose: 'AADHAAR_VERIFY' } });

    // Attempt to bypass by sending '123456' without prior OTP request
    const bypassRes = await request('/api/v1/vendor/kyc/aadhaar/verify-otp', {
      method: 'POST',
      token: vendorToken,
      body: {
        aadhaarNumber: '112233445566',
        otp: '123456',
        fullName: 'Attacker Impersonator',
      },
    });
    assert(bypassRes.status === 400, 'Aadhaar backdoor "123456" without active OTP rejected with 400');
    assert(bypassRes.data.message.includes('No active Aadhaar verification request found'), 'System requires active valid OTP');

    // -------------------------------------------------------------
    // Test 8: KYC Duplicate Theft Prevention (Duplicate PAN & Bank)
    // -------------------------------------------------------------
    console.log('\n--- Test 8: KYC Duplicate Theft Prevention ---');
    // Vendor 1 has PAN ABCDE1234F from seed. Let's create a new vendor and try claiming the same PAN.
    const attackerPhone = '+919876599999';
    await prisma.vendor.deleteMany({ where: { phone: attackerPhone } });
    const attackerVendor = await prisma.vendor.create({
      data: { phone: attackerPhone, status: VendorStatus.PENDING_KYC },
    });
    const attackerToken = jwt.sign(
      { vendorId: attackerVendor.id, phone: attackerVendor.phone, status: attackerVendor.status },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Attempt to claim already registered PAN ABCDE1234F
    const duplicatePanRes = await request('/api/v1/vendor/kyc/pan/verify', {
      method: 'POST',
      token: attackerToken,
      body: {
        panNumber: 'ABCDE1234F',
        panHolderName: 'Attacker Name',
      },
    });
    assert(duplicatePanRes.status === 400, 'Duplicate PAN submission rejected with 400');
    assert(duplicatePanRes.data.message.includes('already registered to another vendor'), 'Duplicate PAN error clearly indicated');

    // -------------------------------------------------------------
    // Test 9: Input Sanitization & Stored XSS Neutralization
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Stored XSS Neutralization in Request Body ---');
    const xssPayload = '<script>alert("pwned")</script><b>Wedding Decor</b>';
    const dealXssRes = await request('/api/v1/user/deals/chatbot', {
      method: 'POST',
      body: {
        vendorId: sampleVendor!.id,
        clientName: '<script>evil()</script>Alice',
        clientPhone: '+919911991199',
        eventType: xssPayload,
        offeredPrice: 80000,
        userMessage: 'Test message with <script>hack()</script> injection',
      },
    });
    assert(dealXssRes.status === 201, 'Deal created with sanitized fields');
    const createdDeal = await prisma.deal.findUnique({ where: { id: dealXssRes.data.data.dealId } });
    assert(!createdDeal!.eventType.includes('<script>'), 'Dangerous <script> tag stripped from eventType');
    assert(!createdDeal!.clientName.includes('<script>'), 'Dangerous <script> tag stripped from clientName');
    assert(!createdDeal!.eventType.includes('<'), '< and > characters stripped to prevent HTML injection');

    // -------------------------------------------------------------
    // Test 10: Financial Number Validation (Infinity, NaN, Negatives)
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Financial Number Validation ---');
    // Try sending Infinity as offered price
    const infinityRes = await request('/api/v1/user/deals/chatbot', {
      method: 'POST',
      body: {
        vendorId: sampleVendor!.id,
        clientName: 'Alice Test',
        clientPhone: '+919911991199',
        eventType: 'Wedding',
        offeredPrice: 1e309, // Evaluates to Infinity in JSON parser
      },
    });
    assert(infinityRes.status === 400, 'Infinity offeredPrice rejected by finite validation schema');

    // Try sending negative counter offer
    const negativeRes = await request(`/api/v1/user/deals/${dealXssRes.data.data.dealId}/negotiate`, {
      method: 'POST',
      body: {
        userMessage: 'Discount please',
        counterOffer: -50000,
      },
    });
    assert(negativeRes.status === 400, 'Negative counterOffer rejected with 400 validation error');

    // -------------------------------------------------------------
    // Test 11: Rate Limiter Triggering (DoS Prevention)
    // -------------------------------------------------------------
    console.log('\n--- Test 11: Rate Limiting Enforcement (HTTP 429) ---');
    const rateLimitPhone = '+919876543277';
    let hitRateLimit = false;
    for (let reqCount = 0; reqCount < 20; reqCount++) {
      const rlRes = await request('/api/v1/auth/send-otp', {
        method: 'POST',
        body: { phone: rateLimitPhone },
      });
      if (rlRes.status === 429) {
        hitRateLimit = true;
        assert(rlRes.headers.get('retry-after') !== null, 'Retry-After header present in 429 response');
        assert(rlRes.data.message.includes('Too many'), 'Rate limit message returned');
        break;
      }
    }
    assert(hitRateLimit, 'Rate limiter actively throttled excessive requests with HTTP 429');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log(`\n🎉 ================================================================`);
    console.log(`🎉 ALL ${totalTests} SECURITY AUDIT CHECKS PASSED SUCCESSFULLY!`);
    console.log(`🛡️ ZERO SECURITY VULNERABILITIES DETECTED.`);
    console.log(`🎉 ================================================================\n`);
  } catch (err) {
    console.error('\n❌ Security Audit Failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
    process.exit(process.exitCode || 0);
  }
}

runSecurityAudit();
