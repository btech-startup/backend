import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING EVENT VALIDATION (DATE, CITY, GUESTS, BUDGET) & BOOKING HISTORY');
  console.log('========================================================================\n');

  // Step 0: Create and authenticate user
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  const testPhone = `+9199${randomDigits}`;

  const authRes = await fetch(`${BASE_URL}/auth/login-or-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: testPhone,
      full_name: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
    }),
  });
  const authData: any = await authRes.json();
  assert.strictEqual(authRes.status, 201);
  const userToken = authData.data.token;
  const userId = authData.data.user.id;
  console.log(`👤 User Authenticated: ${authData.data.user.full_name} (${testPhone})\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 1: VALIDATION & ERROR HANDLING ON POST /events
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SUITE 1: Validation on Event Creation (POST /events) ---');

  // 1.1: Missing Event Date
  const resNoDate = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Grand Royal Wedding',
      city: 'Hyderabad',
      guest_count: 400,
      estimated_budget: 1500000,
    }),
  });
  const dataNoDate: any = await resNoDate.json();
  assert.strictEqual(resNoDate.status, 400);
  assert.strictEqual(dataNoDate.success, false);
  assert(dataNoDate.message.includes('Event date is required'));
  console.log('  ✅ [PASS] Missing event_date correctly rejected (400)');

  // 1.2: Invalid Event Date Format (not YYYY-MM-DD)
  const resBadDate = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Grand Royal Wedding',
      event_date: '15-12-2026', // Invalid format
      city: 'Hyderabad',
      guest_count: 400,
      estimated_budget: 1500000,
    }),
  });
  const dataBadDate: any = await resBadDate.json();
  assert.strictEqual(resBadDate.status, 400);
  assert(dataBadDate.message.includes('format YYYY-MM-DD'));
  console.log('  ✅ [PASS] Malformed event_date correctly rejected (400)');

  // 1.3: Missing City & Location
  const resNoCity = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Grand Royal Wedding',
      event_date: '2026-12-15',
      guest_count: 400,
      estimated_budget: 1500000,
    }),
  });
  const dataNoCity: any = await resNoCity.json();
  assert.strictEqual(resNoCity.status, 400);
  assert(dataNoCity.message.includes('Location or City is required'));
  console.log('  ✅ [PASS] Missing city/location correctly rejected (400)');

  // 1.4: Invalid Guest Count (zero or negative)
  const resBadGuests = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Grand Royal Wedding',
      event_date: '2026-12-15',
      city: 'Hyderabad',
      guest_count: 0, // Invalid: must be >= 1
      estimated_budget: 1500000,
    }),
  });
  const dataBadGuests: any = await resBadGuests.json();
  assert.strictEqual(resBadGuests.status, 400);
  assert(dataBadGuests.message.includes('Guest count must be an integer of at least 1'));
  console.log('  ✅ [PASS] Invalid guest_count (0) correctly rejected (400)');

  // 1.5: Invalid Estimated Budget (negative)
  const resBadBudget = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Grand Royal Wedding',
      event_date: '2026-12-15',
      city: 'Hyderabad',
      guest_count: 350,
      estimated_budget: -50000, // Invalid: must be >= 0
    }),
  });
  const dataBadBudget: any = await resBadBudget.json();
  assert.strictEqual(resBadBudget.status, 400);
  assert(dataBadBudget.message.includes('Estimated budget must be a non-negative number'));
  console.log('  ✅ [PASS] Negative estimated_budget correctly rejected (400)');

  // 1.6: Valid Event Creation with all fields
  const resValid = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: "Ananya & Rohan's Destination Wedding",
      event_date: '2026-12-25',
      city: 'Hyderabad',
      location: 'Jubilee Hills',
      venue_name: 'Taj Falaknuma Palace',
      guest_count: 450,
      estimated_budget: 3500000,
      notes: 'Royal Nizam theme with Nawabi cuisine',
    }),
  });
  const dataValid: any = await resValid.json();
  assert.strictEqual(resValid.status, 201);
  assert.strictEqual(dataValid.success, true);
  const createdEvent = dataValid.data;
  assert.strictEqual(createdEvent.city, 'Hyderabad');
  assert.strictEqual(createdEvent.location, 'Jubilee Hills');
  assert.strictEqual(createdEvent.guest_count, 450);
  assert.strictEqual(createdEvent.estimated_budget, 3500000);
  assert.strictEqual(createdEvent.event_date, '2026-12-25');
  console.log(`  ✅ [PASS] Valid event created successfully (ID: ${createdEvent.id})\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 2: VALIDATION & UPDATE ON PUT /events/:id
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SUITE 2: Validation on Event Update (PUT /events/:id) ---');

  // 2.1: Invalid update (negative budget)
  const resPutBad = await fetch(`${BASE_URL}/events/${createdEvent.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estimated_budget: -100 }),
  });
  assert.strictEqual(resPutBad.status, 400);
  console.log('  ✅ [PASS] Invalid budget update correctly rejected (400)');

  // 2.2: Valid update of city, location, guests, budget, and date
  const resPutValid = await fetch(`${BASE_URL}/events/${createdEvent.id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      city: 'Bengaluru',
      location: 'Palace Grounds',
      guest_count: 550,
      estimated_budget: 4000000,
      event_date: '2026-12-28',
      status: 'confirmed',
    }),
  });
  const dataPutValid: any = await resPutValid.json();
  assert.strictEqual(resPutValid.status, 200);
  assert.strictEqual(dataPutValid.data.city, 'Bengaluru');
  assert.strictEqual(dataPutValid.data.location, 'Palace Grounds');
  assert.strictEqual(dataPutValid.data.guest_count, 550);
  assert.strictEqual(dataPutValid.data.estimated_budget, 4000000);
  assert.strictEqual(dataPutValid.data.event_date, '2026-12-28');
  assert.strictEqual(dataPutValid.data.status, 'confirmed');
  console.log('  ✅ [PASS] Valid PUT update of city, location, guests, and budget succeeded\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 3: GET /events QUERY FILTERS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SUITE 3: Query Filtering on GET /events ---');

  // 3.1: Filter by matching city
  const resCity = await fetch(`${BASE_URL}/events?city=Bengaluru`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const dataCity: any = await resCity.json();
  assert.strictEqual(resCity.status, 200);
  assert(dataCity.data.some((e: any) => e.id === createdEvent.id));
  console.log('  ✅ [PASS] Filter by ?city=Bengaluru matched');

  // 3.2: Filter by non-matching city
  const resNoMatch = await fetch(`${BASE_URL}/events?city=Mumbai`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const dataNoMatch: any = await resNoMatch.json();
  assert.strictEqual(resNoMatch.status, 200);
  assert(!dataNoMatch.data.some((e: any) => e.id === createdEvent.id));
  console.log('  ✅ [PASS] Filter by ?city=Mumbai returned empty list as expected');

  // 3.3: Filter by guest count range (500 to 600)
  const resGuests = await fetch(`${BASE_URL}/events?min_guests=500&max_guests=600`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const dataGuests: any = await resGuests.json();
  assert(dataGuests.data.some((e: any) => e.id === createdEvent.id));
  console.log('  ✅ [PASS] Filter by ?min_guests=500&max_guests=600 matched');

  // 3.4: Filter by budget range
  const resBudget = await fetch(`${BASE_URL}/events?min_budget=3500000`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const dataBudget: any = await resBudget.json();
  assert(dataBudget.data.some((e: any) => e.id === createdEvent.id));
  console.log('  ✅ [PASS] Filter by ?min_budget=3500000 matched\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 4: BOOKING HISTORY ENDPOINTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SUITE 4: Customer Booking History ---');

  // 4.1: Customer Booking History (/events/bookings/history)
  const resHist1 = await fetch(`${BASE_URL}/events/bookings/history`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const dataHist1: any = await resHist1.json();
  assert.strictEqual(resHist1.status, 200);
  assert(dataHist1.data.total_bookings !== undefined);
  console.log(`  ✅ [PASS] GET /events/bookings/history returned ${dataHist1.data.total_bookings} booking(s)`);

  // 4.2: Customer Booking History Alias (/bookings/history)
  const resHist2 = await fetch(`${BASE_URL}/bookings/history`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const dataHist2: any = await resHist2.json();
  assert.strictEqual(resHist2.status, 200);
  console.log('  ✅ [PASS] GET /bookings/history alias returned successfully');

  // 4.3: GET /events/:id includes booking_history field
  const resSingleEvent = await fetch(`${BASE_URL}/events/${createdEvent.id}`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const dataSingleEvent: any = await resSingleEvent.json();
  assert.strictEqual(resSingleEvent.status, 200);
  assert(Array.isArray(dataSingleEvent.data.booking_history), 'Must include booking_history array');
  console.log('  ✅ [PASS] GET /events/:id includes embedded booking_history');

  // 4.4: GET /events/:id/bookings
  const resEventBookings = await fetch(`${BASE_URL}/events/${createdEvent.id}/bookings`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const dataEventBookings: any = await resEventBookings.json();
  assert.strictEqual(resEventBookings.status, 200);
  assert.strictEqual(dataEventBookings.data.event_id, createdEvent.id);
  assert(Array.isArray(dataEventBookings.data.bookings));
  console.log('  ✅ [PASS] GET /events/:id/bookings returned successfully\n');

  console.log('========================================================================');
  console.log('🎉 ALL VALIDATION, QUERY FILTERING, AND BOOKING HISTORY TESTS PASSED!');
  console.log('========================================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
