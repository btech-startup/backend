# Event Management Platform - Complete API Reference

This document provides complete, exhaustive API specifications for all endpoints across the **Vendor** and **User** domains.

- **Base URL**: `http://localhost:5000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:5000/api-docs`

---

## 📌 Global Headers & Authentication

For public and user-facing endpoints:
```http
Content-Type: application/json
```

For protected vendor endpoints:
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```
*Obtain the JWT token via `/api/v1/auth/verify-otp`.*

---

## 📑 Endpoints Overview

| Category | Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- | :--- |
| **User Directory** | `GET` | `/user/vendors` | None | Search & browse verified vendors with category/city filters |
| **User Directory** | `GET` | `/user/vendors/:id` | None | Get vendor profile, portfolio, packages, and integration values |
| **User Banking** | `GET` | `/user/vendors/:id/banking` | None | Get verified vendor banking, IFSC, and UPI ID for payments |
| **User Chatbot** | `POST` | `/user/deals/chatbot` | None | Initiate automated deal negotiation with AI chatbot |
| **User Chatbot** | `POST` | `/user/deals/:dealId/negotiate` | None | Multi-turn negotiation: send message or counter-offer |
| **User Chatbot** | `GET` | `/user/deals/:dealId` | None | Retrieve deal details, chat history, and settlement breakdown |
| **Testing Helper** | `GET` | `/user/sample-vendors` | None | Get all 6 sample vendors with test payloads and IDs |
| **Authentication** | `POST` | `/auth/send-otp` | None | Dispatch 6-digit OTP to vendor phone |
| **Authentication** | `POST` | `/auth/verify-otp` | None | Verify OTP and receive JWT Bearer token |
| **KYC Compliance** | `POST` | `/vendor/kyc/aadhaar/send-otp` | Bearer | Send Aadhaar verification OTP |
| **KYC Compliance** | `POST` | `/vendor/kyc/aadhaar/verify-otp` | Bearer | Verify Aadhaar OTP (Masks storage) |
| **KYC Compliance** | `POST` | `/vendor/kyc/pan/verify` | Bearer | Verify PAN format & holder name |
| **KYC Compliance** | `POST` | `/vendor/kyc/bank/verify` | Bearer | Verify Bank Account & IFSC via Penny Drop |
| **KYC Compliance** | `GET` | `/vendor/kyc/status` | Bearer | Get full 3-tier compliance status |
| **Vendor Profile** | `GET` | `/vendor/profile` | Bearer | Get authenticated vendor profile |
| **Vendor Profile** | `PUT` | `/vendor/profile` | Bearer | Update business details, category, address |
| **Vendor Dashboard**| `GET` | `/vendor/dashboard/stats` | Bearer | Get dashboard metrics and alerts |
| **Price Card** | `POST` | `/vendor/price-card` | Bearer | Create service package rate card |
| **Price Card** | `GET` | `/vendor/price-card` | Bearer | List all price cards for vendor |
| **Price Card** | `GET` | `/vendor/price-card/:id` | Bearer | Get single price card by ID |
| **Price Card** | `PUT` | `/vendor/price-card/:id` | Bearer | Update price card package |
| **Price Card** | `DELETE`| `/vendor/price-card/:id` | Bearer | Delete price card package |
| **Price Card** | `GET` | `/vendor/price-card/public/:vendorId` | None | Client view of vendor active price packages |

---

## 🌟 1. User-Side Endpoints

### 1.1 Browse Vendors Directory
`GET /api/v1/user/vendors`

**Query Parameters:**
- `category` *(optional)*: `DECORATION`, `CATERING`, `PHOTOGRAPHY`, `SOUND_DJ`, `MAKEUP_ARTIST`, `VENUE`
- `city` *(optional)*: e.g. `Bangalore`, `Mumbai`, `Delhi`
- `search` *(optional)*: Text search across business name, bio, city
- `page` *(optional, default 1)*: Page number
- `limit` *(optional, default 10)*: Results per page

**Sample Response (200 OK):**
```json
{
  "success": true,
  "message": "Vendors retrieved successfully",
  "data": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "vendors": [
      {
        "id": "70421caf-a7ef-4cad-9960-48ba6fabf7a7",
        "businessName": "Royal Grand Decorators & Events",
        "category": "DECORATION",
        "ownerName": "Vikram Sharma",
        "rating": 4.9,
        "reviewCount": 48,
        "experienceYears": 10,
        "city": "Bangalore",
        "state": "Karnataka",
        "profileImage": "https://images.unsplash.com/photo-1519741497674-611481863552",
        "startingPrice": 55000,
        "verifiedBadge": true,
        "activePackagesCount": 2,
        "integrationValues": {
          "hasChatbotDeal": true,
          "acceptsOnlinePayments": true,
          "upiId": "royalgrand@okhdfcbank"
        }
      }
    ]
  }
}
```

---

### 1.2 Get Vendor Public Profile with Integration Values
`GET /api/v1/user/vendors/:id`

**Path Parameters:**
- `id` *(required)*: Vendor UUID (e.g. `70421caf-a7ef-4cad-9960-48ba6fabf7a7`)

**Sample Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "70421caf-a7ef-4cad-9960-48ba6fabf7a7",
    "businessName": "Royal Grand Decorators & Events",
    "category": "DECORATION",
    "ownerName": "Vikram Sharma",
    "rating": 4.9,
    "reviewCount": 48,
    "experienceYears": 10,
    "bio": "Premier luxury wedding and event decorators with 10+ years of royal theme creations.",
    "address": "42 MG Road, Indiranagar",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560038",
    "phone": "+919876500001",
    "email": "contact@royalgrandevents.com",
    "profileImage": "https://images.unsplash.com/photo-1519741497674-611481863552",
    "portfolioUrls": [
      "https://images.unsplash.com/photo-1519741497674-611481863552",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6"
    ],
    "verifiedBadge": true,
    "priceCards": [
      {
        "id": "pc-royal-decor-01",
        "title": "Royal Grand Mandap & Floral Stage Decor Package",
        "category": "DECORATION",
        "price": 85000,
        "pricingUnit": "PER_EVENT",
        "inclusions": [
          "Exotic imported floral stage backdrop (35ft x 15ft)",
          "Grand red carpet walkway with 12 floral lit pillars"
        ],
        "terms": "30% advance deposit to secure date, balance on event morning."
      }
    ],
    "integrationValues": {
      "banking": {
        "bankName": "HDFC Bank",
        "accountHolderName": "Royal Grand Events PVT LTD",
        "accountNumberMasked": "XXXXXX0192",
        "ifscCode": "HDFC0001234",
        "upiId": "royalgrand@okhdfcbank",
        "isBankVerified": true,
        "acceptedPaymentModes": ["UPI", "NEFT", "IMPS", "DEBIT_CREDIT_CARDS", "NET_BANKING"],
        "advancePercentageRequired": 30,
        "paymentTerms": "Standard 30% advance on booking, balance payable on event date."
      },
      "chatbot": {
        "enabled": true,
        "botName": "Royal Grand Decorators & Events Deal Assistant",
        "welcomeMessage": "Hi there! I am the automated deal assistant for Royal Grand Decorators & Events.",
        "maxNegotiableDiscountPercent": 15,
        "instantDealEligibility": true,
        "negotiationModes": ["PRICE_DISCOUNT", "CUSTOM_INCLUSIONS", "DATE_LOCKING"],
        "endpoint": "/api/v1/user/deals/chatbot"
      }
    }
  }
}
```

---

### 1.3 Get Vendor Verified Banking Details
`GET /api/v1/user/vendors/:id/banking`

**Path Parameters:**
- `id` *(required)*: Vendor UUID

**Sample Response (200 OK):**
```json
{
  "success": true,
  "message": "Vendor banking details retrieved successfully",
  "data": {
    "vendorId": "70421caf-a7ef-4cad-9960-48ba6fabf7a7",
    "businessName": "Royal Grand Decorators & Events",
    "category": "DECORATION",
    "verifiedCompliance": true,
    "banking": {
      "accountHolderName": "Royal Grand Events PVT LTD",
      "bankName": "HDFC Bank",
      "accountNumberMasked": "XXXXXX0192",
      "ifscCode": "HDFC0001234",
      "upiId": "royalgrand@okhdfcbank",
      "isPennyDropVerified": true,
      "verifiedAt": "2026-09-17T07:11:20.869Z"
    },
    "paymentSchedule": {
      "bookingDepositAdvance": "30% of agreed deal total",
      "eventExecutionDue": "70% on event date morning"
    },
    "instructions": "Direct UPI transfers to royalgrand@okhdfcbank are protected under EventWave escrow terms until service confirmation."
  }
}
```

---

### 1.4 Deal with Chatbot: Initiate Negotiation
`POST /api/v1/user/deals/chatbot`

**Request Body Schema:**
```json
{
  "vendorId": "70421caf-a7ef-4cad-9960-48ba6fabf7a7",
  "priceCardId": "pc-royal-decor-01",
  "clientName": "Aisha Kapoor",
  "clientPhone": "+919811122233",
  "clientEmail": "aisha.kapoor@example.com",
  "eventType": "Wedding & Reception",
  "eventDate": "2026-12-15",
  "guestCount": 500,
  "offeredPrice": 75000,
  "userMessage": "Hi! We love your Royal Mandap decor. Can you offer a package discount to ₹75,000?"
}
```

**Sample Response (201 Created):**
```json
{
  "success": true,
  "message": "Chatbot deal negotiation initiated successfully",
  "data": {
    "dealId": "571d53af-8a65-4a16-aa38-7ee4f5803a32",
    "vendor": {
      "id": "70421caf-a7ef-4cad-9960-48ba6fabf7a7",
      "businessName": "Royal Grand Decorators & Events",
      "category": "DECORATION"
    },
    "clientName": "Aisha Kapoor",
    "status": "DEAL_ACCEPTED",
    "originalPrice": 85000,
    "offeredPrice": 75000,
    "agreedPrice": 75000,
    "discountPercent": 11.8,
    "chatbotResponse": "Great news, Aisha Kapoor! 🎉 We have evaluated your offer of ₹75,000 for \"Royal Grand Mandap & Floral Stage Decor Package\". We are happy to accept your proposed deal (11.8% special discount)! We have reserved the slot for your Wedding & Reception.",
    "paymentDetails": {
      "originalPrice": 85000,
      "offeredPrice": 75000,
      "agreedPrice": 75000,
      "discountPercent": 11.8,
      "advancePayable": 22500,
      "balanceRemaining": 52500,
      "currency": "INR",
      "bankingSettlement": {
        "accountHolderName": "Royal Grand Events PVT LTD",
        "bankName": "HDFC Bank",
        "ifscCode": "HDFC0001234",
        "accountNumberMasked": "XXXXXX0192",
        "upiId": "royalgrand@okhdfcbank"
      },
      "paymentSchedule": "30% booking advance required to seal date, 70% payable on event execution."
    }
  }
}
```

---

### 1.5 Multi-turn Negotiation with Chatbot
`POST /api/v1/user/deals/:dealId/negotiate`

**Request Body Schema:**
```json
{
  "userMessage": "Can we lock in at ₹75,000 if we pay the 30% booking advance today?",
  "counterOffer": 75000
}
```

**Sample Response (200 OK):**
```json
{
  "success": true,
  "message": "Chatbot reply generated and deal updated",
  "data": {
    "dealId": "571d53af-8a65-4a16-aa38-7ee4f5803a32",
    "status": "DEAL_ACCEPTED",
    "agreedPrice": 75000,
    "discountPercent": 11.8,
    "chatbotResponse": "Deal accepted! 🤝 We have locked in your negotiated price of ₹75,000 (11.8% discount). To finalize your booking for Wedding & Reception, please deposit the 30% booking advance of ₹22,500 via UPI to royalgrand@okhdfcbank.",
    "chatHistory": [
      { "sender": "USER", "message": "Hi! Can you offer a discount to ₹75,000?" },
      { "sender": "CHATBOT", "message": "Great news! We can offer ₹75,000." },
      { "sender": "USER", "message": "Can we lock in at ₹75,000 if we pay the 30% advance today?" },
      { "sender": "CHATBOT", "message": "Deal accepted! 🤝 Please deposit the 30% advance..." }
    ]
  }
}
```

---

### 1.6 Retrieve Deal Details & Payment Breakdown
`GET /api/v1/user/deals/:dealId`

**Sample Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "571d53af-8a65-4a16-aa38-7ee4f5803a32",
    "clientName": "Aisha Kapoor",
    "status": "DEAL_ACCEPTED",
    "agreedPrice": 75000,
    "bankingSettlement": {
      "accountHolderName": "Royal Grand Events PVT LTD",
      "bankName": "HDFC Bank",
      "ifscCode": "HDFC0001234",
      "upiId": "royalgrand@okhdfcbank"
    }
  }
}
```

---

### 1.7 Sample Vendors Catalog API
`GET /api/v1/user/sample-vendors`

Returns all 6 sample vendors with test phone numbers, OTPs, vendor IDs, and ready-to-use payloads for testing.

---

## 🔐 2. Vendor Authentication Endpoints

### 2.1 Send Mobile OTP
`POST /api/v1/auth/send-otp`

**Request Body:**
```json
{
  "phone": "+919876500001"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully to registered mobile number",
  "data": {
    "phone": "+919876500001",
    "expiresInMinutes": 5,
    "devOtp": "123456"
  }
}
```

### 2.2 Verify Mobile OTP
`POST /api/v1/auth/verify-otp`

**Request Body:**
```json
{
  "phone": "+919876500001",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "vendor": {
      "id": "70421caf-a7ef-4cad-9960-48ba6fabf7a7",
      "phone": "+919876500001",
      "status": "VERIFIED"
    }
  }
}
```

---

## 📋 3. Vendor KYC Verification Endpoints (Protected)

*All KYC endpoints require the `Authorization: Bearer <JWT_TOKEN>` header.*

### 3.1 Send Aadhaar OTP
`POST /api/v1/vendor/kyc/aadhaar/send-otp`
```json
{
  "aadhaarNumber": "998877665544"
}
```

### 3.2 Verify Aadhaar OTP
`POST /api/v1/vendor/kyc/aadhaar/verify-otp`
```json
{
  "aadhaarNumber": "998877665544",
  "otp": "123456",
  "fullName": "Vikram Sharma"
}
```

### 3.3 Verify PAN Card
`POST /api/v1/vendor/kyc/pan/verify`
```json
{
  "panNumber": "ABCDE1234F",
  "panHolderName": "Vikram Sharma"
}
```

### 3.4 Verify Bank Account via Penny Drop
`POST /api/v1/vendor/kyc/bank/verify`
```json
{
  "accountNumber": "9182736450192",
  "ifsc": "HDFC0001234",
  "accountHolderName": "Vikram Sharma"
}
```

### 3.5 Check KYC Verification Status
`GET /api/v1/vendor/kyc/status`
```json
{
  "success": true,
  "data": {
    "vendorId": "70421caf-a7ef-4cad-9960-48ba6fabf7a7",
    "vendorStatus": "VERIFIED",
    "isFullyVerified": true,
    "documents": {
      "aadhaar": { "verified": true, "aadhaarNumber": "XXXXXXXX5544" },
      "pan": { "verified": true, "panNumber": "ABCDE1234F" },
      "bank": { "verified": true, "ifsc": "HDFC0001234", "bankName": "HDFC Bank" }
    }
  }
}
```

---

## 🏷️ 4. Vendor Price Card / Rate Card Endpoints

### 4.1 Create Price Card (Protected)
`POST /api/v1/vendor/price-card`
```json
{
  "title": "Royal Mandap & Floral Stage Decor Package",
  "category": "DECORATION",
  "price": 85000,
  "pricingUnit": "PER_EVENT",
  "inclusions": [
    "Exotic imported floral stage backdrop",
    "Red carpet with lit pillars"
  ],
  "terms": "30% advance deposit on booking."
}
```

### 4.2 List Vendor Price Cards (Protected)
`GET /api/v1/vendor/price-card`

### 4.3 Update Price Card (Protected)
`PUT /api/v1/vendor/price-card/:id`
```json
{
  "price": 95000,
  "terms": "20% advance booking deposit."
}
```

### 4.4 Public View of Price Cards
`GET /api/v1/vendor/price-card/public/:vendorId`
```json
{
  "success": true,
  "data": {
    "vendor": {
      "id": "70421caf-a7ef-4cad-9960-48ba6fabf7a7",
      "businessName": "Royal Grand Decorators & Events"
    },
    "priceCards": [
      {
        "id": "pc-royal-decor-01",
        "title": "Royal Grand Mandap & Floral Stage Decor Package",
        "price": 85000,
        "pricingUnit": "PER_EVENT"
      }
    ]
  }
}
```
