import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING JWT AUTHORIZATION & EVENT / EVENT TYPE CRUD VERIFICATION');
  console.log('========================================================================\n');

  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  const testPhone = `+9197${randomDigits}`;

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Unified Auth - Create New User If Not Exists
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 1: Unified Auth: Create New User If Not Exists ---');
  const regRes = await fetch(`${BASE_URL}/auth/login-or-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      password: 'StrongPassword123!',
      full_name: 'Vikramaditya Rao',
      email: 'vikram.rao@example.com',
    }),
  });
  const regData: any = await regRes.json();
  console.log('New User Response:', regData);
  assert.strictEqual(regRes.status, 201, 'Should return 201 for new user creation');
  assert.strictEqual(regData.success, true);
  assert.strictEqual(regData.data.is_new_user, true);
  assert(Boolean(regData.data.token), 'JWT token must be generated');
  const userToken = regData.data.token;
  const userId = regData.data.user.id;
  console.log(`✅ [PASS] New user created with JWT token (User ID: ${userId})\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Unified Auth - Login For Existing Account
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 2: Unified Auth: Login For Existing Account ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login-or-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      password: 'StrongPassword123!',
    }),
  });
  const loginData: any = await loginRes.json();
  console.log('Existing Account Login Response:', loginData);
  assert.strictEqual(loginRes.status, 200, 'Should return 200 for existing user login');
  assert.strictEqual(loginData.success, true);
  assert.strictEqual(loginData.data.is_new_user, false);
  assert.strictEqual(loginData.data.user.id, userId);
  console.log('✅ [PASS] Existing user successfully logged in\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: JWT Authorization Middleware (/auth/me)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 3: JWT Authorization Middleware: Get & Update Profile ---');
  // 3.1: Reject without token
  const unauthMe = await fetch(`${BASE_URL}/auth/me`);
  assert.strictEqual(unauthMe.status, 401, 'Unauthenticated request should return 401');

  // 3.2: Authenticated request
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const meData: any = await meRes.json();
  console.log('Profile Response:', meData);
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meData.data.id, userId);
  assert.strictEqual(meData.data.full_name, 'Vikramaditya Rao');

  // 3.3: Update profile
  const updateMeRes = await fetch(`${BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ full_name: 'Vikramaditya K. Rao' }),
  });
  const updateMeData: any = await updateMeRes.json();
  assert.strictEqual(updateMeRes.status, 200);
  assert.strictEqual(updateMeData.data.full_name, 'Vikramaditya K. Rao');
  console.log('✅ [PASS] JWT middleware protected profile access and update verified\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Event Types CRUD Operations
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 4: Event Types CRUD Operations ---');
  const typeCode = `mehendi_${Date.now()}`;

  // 4.1: Create Event Type
  const createTypeRes = await fetch(`${BASE_URL}/events/types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Mehendi & Dholak Gala',
      code: typeCode,
      description: 'Traditional Mehendi ceremony with henna artists and folk singers',
      suggested_budget_min: 150000,
      suggested_budget_max: 600000,
      default_guest_count: 150,
    }),
  });
  const createTypeData: any = await createTypeRes.json();
  console.log('Create Event Type Response:', createTypeData);
  assert.strictEqual(createTypeRes.status, 201);
  const eventTypeId = createTypeData.data.id;
  assert.strictEqual(createTypeData.data.code, typeCode);
  console.log(`✅ [PASS] Event type created (ID: ${eventTypeId})`);

  // 4.2: Get All Event Types
  const allTypesRes = await fetch(`${BASE_URL}/events/types`);
  const allTypesData: any = await allTypesRes.json();
  assert.strictEqual(allTypesRes.status, 200);
  assert(allTypesData.data.length >= 1);
  console.log(`✅ [PASS] Get all event types returned ${allTypesData.data.length} categories`);

  // 4.3: Get Event Type by ID
  const getTypeRes = await fetch(`${BASE_URL}/events/types/${eventTypeId}`);
  const getTypeData: any = await getTypeRes.json();
  assert.strictEqual(getTypeRes.status, 200);
  assert.strictEqual(getTypeData.data.name, 'Mehendi & Dholak Gala');
  console.log('✅ [PASS] Get single event type by ID verified');

  // 4.4: Update Event Type
  const updateTypeRes = await fetch(`${BASE_URL}/events/types/${eventTypeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Updated: Grand Mehendi Gala with live sufi and folk band',
      default_guest_count: 180,
    }),
  });
  const updateTypeData: any = await updateTypeRes.json();
  assert.strictEqual(updateTypeRes.status, 200);
  assert.strictEqual(updateTypeData.data.default_guest_count, 180);
  console.log('✅ [PASS] Update event type verified');

  // 4.5: Delete Event Type
  const deleteTypeRes = await fetch(`${BASE_URL}/events/types/${eventTypeId}`, {
    method: 'DELETE',
  });
  const deleteTypeData: any = await deleteTypeRes.json();
  assert.strictEqual(deleteTypeRes.status, 200);
  assert.strictEqual(deleteTypeData.data.deleted, true);
  console.log('✅ [PASS] Delete event type verified\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: User Events CRUD Operations (Secured by JWT Authorization)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 5: User Events CRUD Operations (Secured with JWT) ---');

  // 5.1: Create Event without JWT token (Must Fail)
  const unauthEventRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Unauthorized Wedding',
      event_date: '2026-12-10',
    }),
  });
  assert.strictEqual(unauthEventRes.status, 401, 'Create event without token should return 401');
  console.log('✅ [PASS] Unauthenticated event creation blocked (401 Unauthorized)');

  // 5.2: Create Event with JWT Bearer Token
  const createEventRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: "Rao Family Grand Wedding & Muhurtham",
      event_type: 'Wedding Ceremony',
      event_date: '2026-11-28',
      start_time: '09:00 AM',
      end_time: '02:00 PM',
      venue_name: 'Hyatt Regency Crystal Ballroom',
      venue_address: 'Road No 2, Banjara Hills, Hyderabad',
      guest_count: 350,
      estimated_budget: 1200000,
      notes: 'South Indian Brahmin style wedding catering and Purohit rituals',
    }),
  });
  const createEventData: any = await createEventRes.json();
  console.log('Create Event Response:', createEventData);
  assert.strictEqual(createEventRes.status, 201);
  const eventId = createEventData.data.id;
  assert.strictEqual(createEventData.data.user_id, userId);
  assert.strictEqual(createEventData.data.status, 'planning');
  console.log(`✅ [PASS] User event created (Event ID: ${eventId})`);

  // 5.3: Get All User Events
  const userEventsRes = await fetch(`${BASE_URL}/events`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const userEventsData: any = await userEventsRes.json();
  assert.strictEqual(userEventsRes.status, 200);
  assert(userEventsData.data.some((e: any) => e.id === eventId));
  console.log(`✅ [PASS] Retrieved user events (${userEventsData.data.length} found)`);

  // 5.4: Get Event by ID
  const getEventRes = await fetch(`${BASE_URL}/events/${eventId}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const getEventData: any = await getEventRes.json();
  assert.strictEqual(getEventRes.status, 200);
  assert.strictEqual(getEventData.data.title, "Rao Family Grand Wedding & Muhurtham");
  console.log('✅ [PASS] Get single event by ID verified');

  // 5.5: Update Event
  const updateEventRes = await fetch(`${BASE_URL}/events/${eventId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      guest_count: 400,
      estimated_budget: 1400000,
      status: 'confirmed',
    }),
  });
  const updateEventData: any = await updateEventRes.json();
  assert.strictEqual(updateEventRes.status, 200);
  assert.strictEqual(updateEventData.data.guest_count, 400);
  assert.strictEqual(updateEventData.data.status, 'confirmed');
  console.log('✅ [PASS] Update event details verified');

  // 5.6: Delete Event
  const deleteEventRes = await fetch(`${BASE_URL}/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const deleteEventData: any = await deleteEventRes.json();
  assert.strictEqual(deleteEventRes.status, 200);
  assert.strictEqual(deleteEventData.data.deleted, true);
  console.log('✅ [PASS] Delete event verified');

  console.log('\n========================================================================');
  console.log('🎉 ALL JWT AUTH & EVENT CRUD TEST SUITES COMPLETED SUCCESSFULLY!');
  console.log('========================================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
