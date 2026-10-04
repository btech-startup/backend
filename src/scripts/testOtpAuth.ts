import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runOtpTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING OTP AUTHENTICATION (SEND, VERIFY, LOGIN, REGISTER) TESTS');
  console.log('========================================================================\n');

  const testPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
  console.log(`📱 Test Phone Number: ${testPhone}\n`);

  // 1. Test Send OTP for registration
  console.log('--- TEST 1: Send OTP for Registration ---');
  const sendRegRes = await fetch(`${BASE_URL}/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      purpose: 'register',
    }),
  });
  const sendRegData: any = await sendRegRes.json();
  console.log('Send Register OTP Response:', sendRegData);
  assert.strictEqual(sendRegRes.status, 200, 'Send OTP for registration returns 200');
  assert.strictEqual(sendRegData.success, true, 'Send OTP returns success: true');
  assert(Boolean(sendRegData.data.otp), 'Send OTP returns generated OTP in dev mode');
  const regOtp = sendRegData.data.otp;
  console.log(`✅ [PASS] OTP sent successfully: ${regOtp}\n`);

  // 2. Test Invalid OTP for Registration
  console.log('--- TEST 2: Register with Invalid OTP (Should Fail) ---');
  const invalidRegRes = await fetch(`${BASE_URL}/auth/otp/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      otp: '000000',
      full_name: 'Pooja Verma',
    }),
  });
  const invalidRegData: any = await invalidRegRes.json();
  console.log('Invalid OTP Register Response:', invalidRegData);
  assert.strictEqual(invalidRegRes.status, 400, 'Invalid OTP registration returns 400');
  assert.strictEqual(invalidRegData.success, false, 'Invalid OTP registration fails');
  console.log('✅ [PASS] Invalid OTP correctly rejected\n');

  // 3. Test Register with Valid OTP
  console.log('--- TEST 3: Register and Verify with Valid OTP ---');
  const validRegRes = await fetch(`${BASE_URL}/auth/otp/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      otp: regOtp,
      full_name: 'Pooja Verma',
      email: 'pooja.verma@example.com',
      role: 'customer',
    }),
  });
  const validRegData: any = await validRegRes.json();
  console.log('Valid Register Response:', validRegData);
  assert.strictEqual(validRegRes.status, 201, 'Registration returns 201 Created');
  assert.strictEqual(validRegData.success, true, 'Registration succeeds');
  assert(Boolean(validRegData.data.token), 'Registration returns JWT token');
  assert.strictEqual(validRegData.data.user.full_name, 'Pooja Verma');
  console.log('✅ [PASS] User successfully registered and authenticated via OTP\n');

  // 4. Test Re-registration of existing user (Should Fail)
  console.log('--- TEST 4: Send Register OTP for Already Registered User (Should Fail) ---');
  const dupSendRes = await fetch(`${BASE_URL}/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      purpose: 'register',
    }),
  });
  const dupSendData: any = await dupSendRes.json();
  console.log('Duplicate Register OTP Response:', dupSendData);
  assert.strictEqual(dupSendRes.status, 400, 'Duplicate registration returns 400');
  assert.strictEqual(dupSendData.success, false);
  console.log('✅ [PASS] Duplicate registration send OTP blocked\n');

  // 5. Test Send OTP for Login
  console.log('--- TEST 5: Send OTP for Login ---');
  const sendLoginRes = await fetch(`${BASE_URL}/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      purpose: 'login',
    }),
  });
  const sendLoginData: any = await sendLoginRes.json();
  console.log('Send Login OTP Response:', sendLoginData);
  assert.strictEqual(sendLoginRes.status, 200, 'Send Login OTP returns 200');
  assert.strictEqual(sendLoginData.success, true);
  const loginOtp = sendLoginData.data.otp;
  console.log(`✅ [PASS] Login OTP sent successfully: ${loginOtp}\n`);

  // 6. Test Login with Invalid OTP
  console.log('--- TEST 6: Login with Invalid OTP (Should Fail) ---');
  const invalidLoginRes = await fetch(`${BASE_URL}/auth/otp/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      otp: '999999',
    }),
  });
  const invalidLoginData: any = await invalidLoginRes.json();
  console.log('Invalid Login Response:', invalidLoginData);
  assert.strictEqual(invalidLoginRes.status, 400, 'Invalid Login returns 400');
  assert.strictEqual(invalidLoginData.success, false);
  console.log('✅ [PASS] Invalid Login OTP correctly rejected\n');

  // 7. Test Login with Valid OTP
  console.log('--- TEST 7: Login with Valid OTP ---');
  const validLoginRes = await fetch(`${BASE_URL}/auth/otp/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      otp: loginOtp,
    }),
  });
  const validLoginData: any = await validLoginRes.json();
  console.log('Valid Login Response:', validLoginData);
  assert.strictEqual(validLoginRes.status, 200, 'Valid Login returns 200 OK');
  assert.strictEqual(validLoginData.success, true);
  assert(Boolean(validLoginData.data.token), 'Login returns JWT token');
  assert.strictEqual(validLoginData.data.user.phone_number, testPhone);
  console.log('✅ [PASS] User successfully logged in via OTP\n');

  // 8. Test Alternate Alias Route: /auth/send-otp and /auth/login-otp
  console.log('--- TEST 8: Test Route Aliases (/auth/send-otp & /auth/login-otp) ---');
  const aliasSendRes = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      purpose: 'login',
    }),
  });
  const aliasSendData: any = await aliasSendRes.json();
  assert.strictEqual(aliasSendRes.status, 200);
  const aliasOtp = aliasSendData.data.otp;

  const aliasLoginRes = await fetch(`${BASE_URL}/auth/login-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      otp: aliasOtp,
    }),
  });
  const aliasLoginData: any = await aliasLoginRes.json();
  assert.strictEqual(aliasLoginRes.status, 200);
  assert(Boolean(aliasLoginData.data.token));
  console.log('✅ [PASS] Alias endpoints (/auth/send-otp and /auth/login-otp) work perfectly!\n');

  console.log('========================================================================');
  console.log('🎉 ALL 8 OTP AUTHENTICATION TEST SUITES PASSED FLAWLESSLY!');
  console.log('========================================================================\n');
}

runOtpTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
