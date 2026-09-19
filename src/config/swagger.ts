export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'EventWise Backend API',
    version: '2.0.0-PROD-SPEC',
    description: `
## 🏛️ EventWise Platform REST API Specification

Production-Ready Backend Engine for the **EventWise Platform**, engineered to serve:
1. **Customer Mobile Application** (React Native / Expo)
2. **Vendor Mobile Application** (React Native / Expo)
3. **Admin & Operations Web Command Center** (React / Vite Web Portal)

### Key Architectural Highlights
- **Escrow Payout Engine**: 3-Stage Milestone Splitter (20% Advance Lock, 50% Geofenced Check-In, 30% Work Delivery)
- **Geofenced Check-In**: Haversine distance verification within 500m of event venue
- **Anti-Circumvention Chat Guard**: 4-stage Regex/NLP filter scrubbing phone numbers, UPI handles, and external URLs
- **Specialized Cultural Modules**: Reverse Budget Splitter, Panchangam Muhurtham Radar, Annadanam Surplus Food Donation, and Family UPI Contribution Pool.
    `,
    contact: {
      name: 'EventWise Architecture Team',
      email: 'support@eventwise.app',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server (/api/v1)',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from `/auth/login` or `/auth/register`',
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
      RegisterRequest: {
        type: 'object',
        required: ['phone_number', 'full_name', 'role'],
        properties: {
          phone_number: { type: 'string', example: '+919876543210' },
          full_name: { type: 'string', example: 'Arjun Sharma' },
          email: { type: 'string', example: 'arjun@example.com' },
          password: { type: 'string', example: 'Password@123' },
          role: {
            type: 'string',
            enum: ['customer', 'vendor', 'admin', 'ops_agent'],
            example: 'customer',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['phone_number'],
        properties: {
          phone_number: { type: 'string', example: '+919876543210' },
          password: { type: 'string', example: 'Password@123' },
        },
      },
      BudgetSplitRequest: {
        type: 'object',
        required: ['totalBudget', 'guestCount'],
        properties: {
          totalBudget: { type: 'number', example: 500000, description: 'Total budget in INR' },
          guestCount: { type: 'number', example: 350, description: 'Estimated guest headcount' },
          eventType: { type: 'string', example: 'wedding', enum: ['wedding', 'reception', 'engagement', 'birthday', 'corporate'] },
        },
      },
      VendorKYCRequest: {
        type: 'object',
        required: ['business_name', 'category', 'aadhaar_masked', 'bank_account_number', 'bank_ifsc', 'virtual_payment_address'],
        properties: {
          business_name: { type: 'string', example: 'Sri Lakshmi Mandapam & Catering' },
          category: { type: 'string', example: 'catering', enum: ['catering', 'photography', 'decor', 'music_dj', 'venue', 'makeup'] },
          aadhaar_masked: { type: 'string', example: 'XXXXXXXX1234' },
          bank_account_number: { type: 'string', example: '918273645012' },
          bank_ifsc: { type: 'string', example: 'HDFC0001234' },
          virtual_payment_address: { type: 'string', example: 'srilakshmi@upi' },
        },
      },
      AddServiceRequest: {
        type: 'object',
        required: ['title', 'description', 'base_price', 'price_unit'],
        properties: {
          title: { type: 'string', example: 'Traditional South Indian Wedding Feast (Banana Leaf)' },
          description: { type: 'string', example: 'Full 3-course pure veg meal including Payasam, 21 items' },
          base_price: { type: 'number', example: 450 },
          price_unit: { type: 'string', example: 'per_plate', enum: ['per_plate', 'per_day', 'fixed', 'per_hour'] },
        },
      },
      BookingCheckoutRequest: {
        type: 'object',
        required: ['vendor_id', 'service_id', 'event_date', 'event_slot', 'venue_address', 'venue_latitude', 'venue_longitude', 'gross_amount'],
        properties: {
          vendor_id: { type: 'string', example: 'e3b0c442-98fc-1c14-9afb-4c8996fb9242' },
          service_id: { type: 'string', example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' },
          event_date: { type: 'string', format: 'date', example: '2026-11-20' },
          event_slot: { type: 'string', example: 'morning', enum: ['morning', 'evening', 'full_day'] },
          venue_address: { type: 'string', example: 'Raj Mahal Palace, MG Road, Bengaluru' },
          venue_latitude: { type: 'number', example: 12.9716 },
          venue_longitude: { type: 'number', example: 77.5946 },
          gross_amount: { type: 'number', example: 125000, description: 'Total agreed booking amount in INR' },
        },
      },
      NegotiationProposeRequest: {
        type: 'object',
        required: ['booking_id', 'sender_type', 'listing_price', 'proposed_price'],
        properties: {
          booking_id: { type: 'string', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          sender_type: { type: 'string', enum: ['customer', 'vendor'], example: 'customer' },
          listing_price: { type: 'number', example: 100000 },
          proposed_price: { type: 'number', example: 92000, description: 'Counter-offer within 5%-15% margin' },
        },
      },
      CheckinVerifyOTPRequest: {
        type: 'object',
        required: ['booking_id', 'submitted_otp', 'vendor_latitude', 'vendor_longitude'],
        properties: {
          booking_id: { type: 'string', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          submitted_otp: { type: 'string', example: '482910', description: '6-digit OTP given by Customer on venue arrival' },
          vendor_latitude: { type: 'number', example: 12.9718 },
          vendor_longitude: { type: 'number', example: 77.5949 },
        },
      },
      ChatSanitizeRequest: {
        type: 'object',
        required: ['receiverId', 'message'],
        properties: {
          receiverId: { type: 'string', example: 'usr_829103' },
          message: { type: 'string', example: 'Call me on 9845012345 or gpay on my upi test@okaxis' },
        },
      },
      SOSDispatchRequest: {
        type: 'object',
        required: ['original_booking_id', 'replacement_vendor_id', 'surge_bonus_percentage', 'reason'],
        properties: {
          original_booking_id: { type: 'string', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          replacement_vendor_id: { type: 'string', example: 'v_replace_9182' },
          surge_bonus_percentage: { type: 'number', example: 20 },
          reason: { type: 'string', example: 'Original vendor vehicle breakdown 2 hours prior to Muhurtham' },
        },
      },
      DisputeResolveRequest: {
        type: 'object',
        required: ['disputeId', 'refundAmount', 'notes'],
        properties: {
          disputeId: { type: 'string', example: 'dsp_881920' },
          refundAmount: { type: 'number', example: 35000 },
          notes: { type: 'string', example: 'Decorator failed to supply flower canopy; 35k refunded to customer escrow wallet.' },
        },
      },
      FoodDonationRequest: {
        type: 'object',
        required: ['booking_id', 'estimated_meals_count', 'food_type'],
        properties: {
          booking_id: { type: 'string', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          estimated_meals_count: { type: 'number', example: 75 },
          food_type: { type: 'string', example: 'Vegetarian full meal (Rice, Sambar, Sabji, Sweets)' },
        },
      },
      FamilyPoolInviteRequest: {
        type: 'object',
        required: ['booking_id', 'contributor_name', 'relation', 'target_amount'],
        properties: {
          booking_id: { type: 'string', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          contributor_name: { type: 'string', example: 'Ramesh Uncle (Maternal)' },
          relation: { type: 'string', example: 'uncle' },
          target_amount: { type: 'number', example: 25000 },
        },
      },
    },
  },
  tags: [
    { name: 'System & Health', description: 'Core gateway and operational health diagnostics' },
    { name: 'Authentication', description: 'User registration & JWT phone login across all 4 roles' },
    { name: 'Customer Mobile App', description: 'Budget splitter, category vendor discovery & cart flows' },
    { name: 'Vendor Mobile App', description: 'KYC submission, service catalog management & escrow balances' },
    { name: 'Bookings & Escrow', description: '3-stage escrow milestone checkout & active booking ledger' },
    { name: 'Negotiation & Counter-Offers', description: '12-hour structured counter-offer window (5%-15% margin)' },
    { name: 'Geofenced Check-In', description: '500m Haversine distance & OTP verification (unlocks 50% Milestone 2)' },
    { name: 'Chat & Anti-Circumvention', description: '4-stage regex/NLP leakage scrubbing (Phone numbers, UPI, External links)' },
    { name: 'Admin Command Center', description: 'Emergency SOS dispatch, dispute arbitration & real-time analytics' },
    { name: 'Annadanam Food Donation', description: 'Surplus wedding & event food redistribution logistics' },
    { name: 'Panchangam Muhurtham Radar', description: 'Auspicious wedding dates & astrology calendar' },
    { name: 'Family UPI Contribution Pool', description: 'Split event costs among extended family members' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System & Health'],
        summary: 'Master Health Check Endpoint',
        description: 'Returns operational status, database adapter state, and active feature flags.',
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
        tags: ['Authentication'],
        summary: 'Register New User',
        description: 'Creates a new account for Customer, Vendor, Admin, or Ops Agent.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: { description: 'User successfully created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with Phone & Password',
        description: 'Authenticates user and returns JWT bearer token with assigned role.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: { description: 'Authenticated successfully with JWT', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/customer/budget-split': {
      post: {
        tags: ['Customer Mobile App'],
        summary: 'Reverse Budget Allocation Splitter',
        description: 'Splits total budget intelligently across Catering (40%), Venue (25%), Decor (15%), Photography (10%), etc.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BudgetSplitRequest' } } },
        },
        responses: {
          200: { description: 'Calculated budget allocation', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/customer/vendors': {
      get: {
        tags: ['Customer Mobile App'],
        summary: 'Search & Filter Verified Vendors',
        description: 'Returns active vendors filtered by service category, city, rating, and price.',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'e.g. catering, photography, decor' },
          { name: 'city', in: 'query', schema: { type: 'string' }, description: 'e.g. Bengaluru, Mumbai' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'List of verified vendors', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/vendor/kyc': {
      post: {
        tags: ['Vendor Mobile App'],
        summary: 'Submit Vendor KYC & Bank Verification',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/VendorKYCRequest' } } },
        },
        responses: {
          200: { description: 'KYC submitted for automated verification', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/vendor/services': {
      post: {
        tags: ['Vendor Mobile App'],
        summary: 'Add Service Package to Catalog',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddServiceRequest' } } },
        },
        responses: {
          201: { description: 'Service package created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/vendor/payouts': {
      get: {
        tags: ['Vendor Mobile App'],
        summary: 'Get Real-Time Escrow & Payout Balances',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Vendor escrow balances and transaction history', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/bookings/checkout': {
      post: {
        tags: ['Bookings & Escrow'],
        summary: 'Single Cart Checkout (20% Advance Lock)',
        security: [{ BearerAuth: [] }],
        description: 'Locks 20% advance payment in double-entry Escrow ledger and schedules Milestone 2 & 3.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingCheckoutRequest' } } },
        },
        responses: {
          201: { description: 'Booking confirmed and escrow ledger initialized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/bookings/my-bookings': {
      get: {
        tags: ['Bookings & Escrow'],
        summary: 'List User Active & Completed Bookings',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of bookings with milestone payout statuses', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/negotiations/propose': {
      post: {
        tags: ['Negotiation & Counter-Offers'],
        summary: 'Propose Structured Counter-Offer',
        security: [{ BearerAuth: [] }],
        description: 'Initiates a 12-hour counter-offer window constrained within allowed platform margin (5%-15%).',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/NegotiationProposeRequest' } } },
        },
        responses: {
          200: { description: 'Counter-offer submitted', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/events/checkin/verify-otp': {
      post: {
        tags: ['Geofenced Check-In'],
        summary: 'On-Site Geofenced OTP Venue Check-In',
        security: [{ BearerAuth: [] }],
        description: 'Calculates Haversine distance (<500m) and validates OTP. Upon success, releases 50% Milestone 2 payout automatically.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CheckinVerifyOTPRequest' } } },
        },
        responses: {
          200: { description: 'Check-in verified and Milestone 2 payout released', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          400: { description: 'Geofence breach or invalid OTP' },
        },
      },
    },
    '/chat/sanitize': {
      post: {
        tags: ['Chat & Anti-Circumvention'],
        summary: 'Real-Time Anti-Circumvention Sanitizer',
        security: [{ BearerAuth: [] }],
        description: 'Scans messages for direct contact exchange (phone digits, WhatsApp links, UPI IDs, social tags) and redacts violations.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatSanitizeRequest' } } },
        },
        responses: {
          200: { description: 'Sanitized message output with shadow violation alert flag', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/admin/sos/dispatch': {
      post: {
        tags: ['Admin Command Center'],
        summary: '1-Click Emergency SOS Backup Vendor Dispatch',
        security: [{ BearerAuth: [] }],
        description: 'Instantly re-routes a critical booking to an approved SOS standby vendor with surge bonus incentive.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SOSDispatchRequest' } } },
        },
        responses: {
          200: { description: 'SOS vendor dispatched', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/admin/disputes/resolve': {
      post: {
        tags: ['Admin Command Center'],
        summary: 'Tribunal Dispute Resolution Settlement',
        security: [{ BearerAuth: [] }],
        description: 'Arbitrates escrow funds between customer refund and vendor compensation.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DisputeResolveRequest' } } },
        },
        responses: {
          200: { description: 'Dispute resolved and ledger rebalanced', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/admin/analytics': {
      get: {
        tags: ['Admin Command Center'],
        summary: 'Command Center Key Metrics & GMV',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'GMV, commission earnings, and operational statistics', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/admin/chat-violations': {
      get: {
        tags: ['Admin Command Center'],
        summary: 'Audit In-App Chat Leakage Violations',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Audit log of intercepted circumvention attempts', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/annadanam/dispatch': {
      post: {
        tags: ['Annadanam Food Donation'],
        summary: 'Schedule Surplus Event Food Pickup',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FoodDonationRequest' } } },
        },
        responses: {
          200: { description: 'NGO partner pickup dispatched', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/annadanam/list': {
      get: {
        tags: ['Annadanam Food Donation'],
        summary: 'List Registered Food Rescue Pickups',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of active food donation requests', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/muhurtham/upcoming': {
      get: {
        tags: ['Panchangam Muhurtham Radar'],
        summary: 'Get Auspicious Wedding Dates (Panchangam)',
        responses: {
          200: { description: 'Upcoming auspicious dates and time windows', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/family-pool/invite': {
      post: {
        tags: ['Family UPI Contribution Pool'],
        summary: 'Invite Family Member to Sponsor Event Milestone',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FamilyPoolInviteRequest' } } },
        },
        responses: {
          200: { description: 'Contribution invitation link generated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/family-pool/pool/{booking_id}': {
      get: {
        tags: ['Family UPI Contribution Pool'],
        summary: 'Check Family Pool Contribution Progress',
        parameters: [
          { name: 'booking_id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Current aggregated family pool progress', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
  },
};
