export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Vortix User-Side Backend Engine & Customer API',
    version: '1.0.0-PROD-USER-SPEC',
    description: `
# 📱 Vortix User-Side Backend Engine Specification

High-security, rule-based RESTful API designed specifically for the **Vortix Customer/User Mobile & Web Applications**, engineered according to system specifications:

---

### 🏛️ Core User-Side Capabilities & Rules

1. **Redis Distributed Slot Lock & Checkout (Image 1)**:
   - Atomic Redlock mutex acquisition before checkout creation.
   - Throws \`SlotConflictError\` resulting in **HTTP 409 Conflict** if slot is locked or active.
   - On success: Persists booking with all **12 required fields** and generates payment order.

2. **Deal Desk & Structured Counter-Offers (Images 2 & 3)**:
   - **5%–15% Discount Window**: Strictly validates discount percentage against listing price.
   - **12-Hour Expiration Timer**: Automatically enforces response window for proposals and counters.
   - **Accepted Offer Locking**: Price locks into booking draft upon agreement.

3. **Booking State Machine (Image 3)**:
   - Strict linear progression: \`draft\` ➔ \`negotiating\` ➔ \`advance_paid\` ➔ \`active_confirmed\` ➔ \`completed\`.

4. **Cryptographic Payment Webhooks (Image 3)**:
   - HMAC-SHA256 signature verification with constant-time equality check.
   - Idempotency guard preventing replay attacks and duplicate milestone funding.

5. **Dual-Factor Physical Check-In (Image 3)**:
   - Haversine distance engine ($\le 500\\text{m}$ radius from venue coordinates).
   - 6-digit customer-held OTP handshake verification releasing Milestone 2 (50% payout).

6. **3-Stage Double-Entry Escrow Milestones (Image 3)**:
   - **Milestone 1 (20% Advance Lock)**: Funded on payment webhook.
   - **Milestone 2 (50% Event Check-in)**: Released on OTP + Geofence match.
   - **Milestone 3 (30% Work Delivery)**: Released on customer sign-off of deliverables.
    `,
    contact: {
      name: 'Vortix User Engineering Team',
      email: 'user-support@vortix.platform',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local User-Side API Gateway (/api/v1)',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Customer JWT token obtained from `/auth/login` or `/auth/register`',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Detailed error message' },
        },
      },
      ConflictResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'integer', example: 409 },
          error: { type: 'string', example: 'SlotConflict' },
          message: {
            type: 'string',
            example: 'Slot is currently locked or being booked by another customer. Please choose a different slot.',
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['phone_number', 'full_name', 'role'],
        properties: {
          phone_number: { type: 'string', example: '+919876543210' },
          full_name: { type: 'string', example: 'Aditi Sharma' },
          email: { type: 'string', example: 'aditi.sharma@example.com' },
          password: { type: 'string', example: 'SecureUserPassword123!' },
          role: { type: 'string', enum: ['customer'], example: 'customer' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['phone_number', 'password'],
        properties: {
          phone_number: { type: 'string', example: '+919876543210' },
          password: { type: 'string', example: 'SecureUserPassword123!' },
        },
      },
      BudgetSplitRequest: {
        type: 'object',
        required: ['totalBudget', 'guestCount'],
        properties: {
          totalBudget: { type: 'number', example: 1200000, description: 'Total wedding budget in INR' },
          guestCount: { type: 'integer', example: 400, description: 'Expected attendee headcount' },
        },
      },
      BookingCheckoutRequest: {
        type: 'object',
        required: [
          'vendor_id',
          'service_id',
          'event_date',
          'event_slot',
          'venue_address',
          'venue_latitude',
          'venue_longitude',
          'gross_amount',
        ],
        properties: {
          vendor_id: { type: 'string', format: 'uuid', example: 'd3b07384-d113-4c4f-9ef4-d3a33d9f36f9' },
          service_id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' },
          event_date: { type: 'string', format: 'date', example: '2026-12-15' },
          event_slot: { type: 'string', example: 'morning_muhurtham' },
          venue_address: { type: 'string', example: 'Grand Kohinoor Palace, Road 36, Jubilee Hills, Hyderabad' },
          venue_latitude: { type: 'number', format: 'double', example: 17.4319 },
          venue_longitude: { type: 'number', format: 'double', example: 78.4073 },
          gross_amount: { type: 'number', example: 250000 },
          customer_phone: { type: 'string', example: '+919876543210' },
        },
      },
      NegotiationProposeRequest: {
        type: 'object',
        required: ['booking_id', 'sender_type', 'listing_price', 'proposed_price'],
        properties: {
          booking_id: { type: 'string', example: 'bk_wedding_01' },
          sender_type: { type: 'string', enum: ['client', 'vendor'], example: 'client' },
          listing_price: { type: 'number', example: 200000 },
          proposed_price: { type: 'number', example: 180000, description: 'Must be within 5% to 15% discount' },
          remarks: { type: 'string', example: 'Requesting discount for auspicious morning muhurtham' },
        },
      },
      NegotiationCounterRequest: {
        type: 'object',
        required: ['sender_type', 'listing_price', 'proposed_price'],
        properties: {
          sender_type: { type: 'string', enum: ['client', 'vendor'], example: 'client' },
          listing_price: { type: 'number', example: 200000 },
          proposed_price: { type: 'number', example: 185000, description: 'Must be within 5% to 15% discount' },
          remarks: { type: 'string', example: 'Revised counter offer' },
        },
      },
      CheckinVerifyOTPRequest: {
        type: 'object',
        required: ['booking_id', 'submitted_otp', 'vendor_latitude', 'vendor_longitude'],
        properties: {
          booking_id: { type: 'string', format: 'uuid', example: 'c1a6d05c-05bf-4409-a8f2-2b3e612a0400' },
          submitted_otp: { type: 'string', example: '849201', description: 'Customer 6-digit handshake OTP' },
          vendor_latitude: { type: 'number', example: 17.4320 },
          vendor_longitude: { type: 'number', example: 78.4074 },
        },
      },
      ApproveDeliveryRequest: {
        type: 'object',
        properties: {
          notes: { type: 'string', example: 'Photographs and raw reels inspected and approved.' },
        },
      },
      FamilyPoolInviteRequest: {
        type: 'object',
        required: ['booking_id', 'contributor_name', 'relation', 'target_amount'],
        properties: {
          booking_id: { type: 'string', format: 'uuid' },
          contributor_name: { type: 'string', example: 'Raghavan Uncle' },
          relation: { type: 'string', example: 'uncle' },
          target_amount: { type: 'number', example: 25000 },
        },
      },
      FoodDonationRequest: {
        type: 'object',
        required: ['booking_id', 'estimated_meals_count', 'food_type'],
        properties: {
          booking_id: { type: 'string', format: 'uuid' },
          estimated_meals_count: { type: 'integer', example: 120 },
          food_type: { type: 'string', example: 'pure_veg_buffet' },
        },
      },
    },
  },
  tags: [
    { name: '1. Customer Authentication', description: 'Sign-up, sign-in, and JWT session handling for user accounts' },
    { name: '2. Budget Planner & Vendor Discovery', description: 'Smart reverse budget splitter and vendor search' },
    { name: '3. Deal Desk & Counter-Offers', description: 'Structured 5%-15% discount negotiation with 12-hour response window' },
    { name: '4. Redis Redlock Slot Checkout', description: 'Distributed mutex slot reservation, 12-field booking creation & HTTP 409 conflict handling' },
    { name: '5. Customer Bookings & State Machine', description: 'Booking detail tracking, milestone statuses, and customer cancellations' },
    { name: '6. Payment Webhook & Advance Funding', description: 'HMAC-SHA256 signature verification, idempotency guard, and Milestone 1 escrow funding' },
    { name: '7. On-Site Check-In (OTP & Geofence)', description: 'Customer check-in OTP retrieval and dual-factor Haversine verification (<=500m)' },
    { name: '8. 3-Stage Escrow Milestones', description: 'Double-entry escrow ledger and customer sign-off releasing Milestone 3 (30%)' },
    { name: '9. Cultural User Features', description: 'Panchangam muhurtham calendar, Split-Family UPI pool, and Annadanam food rescue' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['1. Customer Authentication'],
        summary: 'User Gateway Health Check',
        description: 'Returns health status, active user-side feature flags, and engine version.',
        responses: {
          200: {
            description: 'Gateway is healthy and operational',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['1. Customer Authentication'],
        summary: 'Register Customer Account',
        description: 'Creates a new user profile with verified phone number and hashed credentials.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: { description: 'Customer account created successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['1. Customer Authentication'],
        summary: 'Customer Login',
        description: 'Authenticates customer credentials and returns JWT bearer token.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Logged in successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          401: { description: 'Invalid phone or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/customer/budget-split': {
      post: {
        tags: ['2. Budget Planner & Vendor Discovery'],
        summary: 'Reverse Wedding Budget Splitter',
        description: 'Intelligently allocates total budget across Catering (40%), Venue (25%), Photography (15%), Decor (10%), etc.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BudgetSplitRequest' } } },
        },
        responses: {
          200: { description: 'Computed category allocations and per-plate budget', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/customer/vendors': {
      get: {
        tags: ['2. Budget Planner & Vendor Discovery'],
        summary: 'Discover Verified Vendors',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['banquet_hall', 'photography', 'catering', 'decor_sound', 'makeup_artist'] } },
        ],
        responses: {
          200: { description: 'List of verified vendors with ratings and starting packages', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/checkout': {
      post: {
        tags: ['4. Redis Redlock Slot Checkout'],
        summary: 'Slot Checkout with Redis Redlock Mutex (12 Fields)',
        security: [{ BearerAuth: [] }],
        description:
          'Acquires Redis Distributed Slot Lock on vendor slot. Returns HTTP 409 Conflict if held. On success, persists all 12 required fields and initiates payment order.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingCheckoutRequest' } } },
        },
        responses: {
          201: { description: 'Booking created with 12 fields and payment initiated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          409: { description: 'Slot is locked or already reserved by another customer', content: { 'application/json': { schema: { $ref: '#/components/schemas/ConflictResponse' } } } },
        },
      },
    },
    '/negotiations/propose': {
      post: {
        tags: ['3. Deal Desk & Counter-Offers'],
        summary: 'Propose Structured Counter-Offer (5%–15% Window)',
        security: [{ BearerAuth: [] }],
        description: 'Initiates a 12-hour response window. Discount must be strictly between 5% and 15% of listing price.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/NegotiationProposeRequest' } } },
        },
        responses: {
          201: { description: 'Counter-offer transmitted with 12-hour window', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          400: { description: 'Discount outside 5%-15% window or invalid params' },
        },
      },
    },
    '/negotiations/{booking_id}': {
      get: {
        tags: ['3. Deal Desk & Counter-Offers'],
        summary: 'Get Negotiation Thread for Booking',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'booking_id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Negotiation history and active countdown timer' },
        },
      },
    },
    '/negotiations/{id}/accept': {
      post: {
        tags: ['3. Deal Desk & Counter-Offers'],
        summary: 'Accept Counter-Offer & Lock Deal',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Offer accepted and deal price locked into booking draft' },
          400: { description: '12-hour window expired or already finalized' },
        },
      },
    },
    '/negotiations/{id}/counter': {
      post: {
        tags: ['3. Deal Desk & Counter-Offers'],
        summary: 'Submit Counter-Proposal to Offer',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/NegotiationCounterRequest' } } },
        },
        responses: {
          201: { description: 'Counter-offer registered; 12-hour response window reset' },
        },
      },
    },
    '/negotiations/{id}/reject': {
      post: {
        tags: ['3. Deal Desk & Counter-Offers'],
        summary: 'Reject Counter-Offer',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Offer rejected and thread terminated' },
        },
      },
    },
    '/bookings/my-bookings': {
      get: {
        tags: ['5. Customer Bookings & State Machine'],
        summary: 'List Authenticated Customer Bookings',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Customer bookings with milestone funding and state machine statuses' },
        },
      },
    },
    '/bookings/{id}': {
      get: {
        tags: ['5. Customer Bookings & State Machine'],
        summary: 'Get Booking Details with Milestones & Escrow Ledger',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Comprehensive booking breakdown (vendor, milestones, check-in, deliverables, escrow)' },
        },
      },
    },
    '/bookings/{id}/cancel': {
      post: {
        tags: ['5. Customer Bookings & State Machine'],
        summary: 'Cancel Booking & Refund Unreleased Milestones',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Booking cancelled and eligible escrow refunds scheduled' },
        },
      },
    },
    '/payments/webhook': {
      post: {
        tags: ['6. Payment Webhook & Advance Funding'],
        summary: 'HMAC-SHA256 Signed Payment Webhook',
        description: 'Processes payment confirmation, verifies cryptographic signature, moves state to advance_paid, and funds Milestone 1.',
        responses: {
          200: { description: 'Payment verified and Milestone 1 funded into escrow' },
          401: { description: 'Invalid cryptographic signature' },
        },
      },
    },
    '/checkin/otp/{booking_id}': {
      get: {
        tags: ['7. On-Site Check-In (OTP & Geofence)'],
        summary: 'Customer Retrieves Check-In OTP Code',
        security: [{ BearerAuth: [] }],
        description: 'Customer retrieves their 6-digit handshake OTP to give to vendor upon arrival.',
        parameters: [{ name: 'booking_id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: '6-digit OTP code and instructions' },
        },
      },
    },
    '/checkin/verify': {
      post: {
        tags: ['7. On-Site Check-In (OTP & Geofence)'],
        summary: 'On-Site Geofenced OTP Handshake (<= 500m)',
        security: [{ BearerAuth: [] }],
        description: 'Validates vendor GPS within 500m of venue and matches 6-digit OTP to release Milestone 2 (50%).',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckinVerifyOTPRequest' } } },
        },
        responses: {
          200: { description: 'Check-in verified and Milestone 2 released' },
          400: { description: 'Geofence breach or invalid OTP' },
        },
      },
    },
    '/escrow/milestones/{booking_id}': {
      get: {
        tags: ['8. 3-Stage Escrow Milestones'],
        summary: 'Inspect 3-Stage Escrow Milestones',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'booking_id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'List of milestones (20% Advance, 50% Check-in, 30% Delivery)' },
        },
      },
    },
    '/escrow/milestones/{booking_id}/approve-delivery': {
      post: {
        tags: ['8. 3-Stage Escrow Milestones'],
        summary: 'Customer Approves Delivery & Releases Milestone 3 (30%)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'booking_id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApproveDeliveryRequest' } } },
        },
        responses: {
          200: { description: 'Deliverables approved, final 30% released, booking COMPLETED' },
        },
      },
    },
    '/escrow/ledger/{booking_id}': {
      get: {
        tags: ['8. 3-Stage Escrow Milestones'],
        summary: 'Get Double-Entry Escrow Ledger for Booking',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'booking_id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Double-entry escrow ledger audit records' },
        },
      },
    },
    '/muhurtham/upcoming': {
      get: {
        tags: ['9. Cultural User Features'],
        summary: 'Auspicious Panchangam Muhurtham Dates',
        responses: {
          200: { description: 'Upcoming auspicious dates and time windows' },
        },
      },
    },
    '/family-pool/invite': {
      post: {
        tags: ['9. Cultural User Features'],
        summary: 'Invite Family Member to Split-Pool',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FamilyPoolInviteRequest' } } },
        },
        responses: {
          200: { description: 'Family contribution invitation generated' },
        },
      },
    },
    '/family-pool/pool/{booking_id}': {
      get: {
        tags: ['9. Cultural User Features'],
        summary: 'Check Family Pool Contribution Progress',
        parameters: [{ name: 'booking_id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Aggregated family pool contribution progress' },
        },
      },
    },
    '/annadanam/dispatch': {
      post: {
        tags: ['9. Cultural User Features'],
        summary: 'Request Annadanam Food Rescue Pickup',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FoodDonationRequest' } } },
        },
        responses: {
          200: { description: 'Food donation pickup dispatched to NGO partner' },
        },
      },
    },
  },
};
