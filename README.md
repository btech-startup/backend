# Event Management Platform - Vendor & User Experience Backend

A production-ready TypeScript backend service built with **Node.js, Express, Prisma ORM, and SQLite / PostgreSQL** for the Event Management platform.

It powers both **Vendor Onboarding & Management** and **User-Side Integration (Chatbot Deal Negotiation, Verified Banking Details, and Public Vendor Discovery)**.

> 📖 **Comprehensive Documentation Folder**:
> All detailed documentation is organized in the **[`docs/`](./docs/README.md)** folder:
> - **[API Reference](./docs/API_REFERENCE.md)**: Full endpoint specifications & schemas
> - **[Chatbot Deal Integration Guide](./docs/CHATBOT_DEALS_GUIDE.md)**: AI negotiation engine & state machine
> - **[Banking & Payments Guide](./docs/BANKING_AND_PAYMENTS.md)**: Penny-drop, UPI ID, and escrow schedules
> - **[Sample Vendors Catalog](./docs/SAMPLE_VENDORS_CATALOG.md)**: Test credentials, IDs, and cURL commands
> - **[Postman Collection](./docs/EVENT_MANAGEMENT_API.postman_collection.json)**: Ready-to-import Postman collection

---

## 🌟 Key Highlights & Feature Matrix

### 🤖 1. User-Side Chatbot Deal Negotiation & Booking
- **Deal with Chatbot (`POST /api/v1/user/deals/chatbot`)**: Clients can negotiate event service pricing directly with an automated AI Deal Assistant.
- **Smart Decision Engine**: Automatically evaluates the client's budget and package rates, calculates feasible discount margins (up to 15%), crafts conversational AI negotiation messages, and itemizes complimentary perks.
- **Multi-Turn Bargaining (`POST /api/v1/user/deals/:dealId/negotiate`)**: Exchange counter-offers and messages with the chatbot.
- **Contract & Settlement Summary (`GET /api/v1/user/deals/:dealId`)**: Generates an agreed deal snapshot with deposit payment schedules (30% booking deposit, 70% post-event) and vendor banking details.

### 🏦 2. User-Side Banking & Payment Details
- **Verified Banking Endpoint (`GET /api/v1/user/vendors/:id/banking`)**: Retrieve bank name, account holder name, IFSC code, masked account number, and **direct UPI ID** (e.g., `royalgrand@okhdfcbank`) for escrow booking advances.
- **Integration Values in Vendor Profile (`GET /api/v1/user/vendors/:id`)**: Comprehensive public profile containing badges, portfolio URLs, rating, price packages, and embedded `integrationValues` (both `chatbot` config and `banking` settlement info).

### 👥 3. Vendor Registration & Three-Tier KYC
- **Mobile SMS OTP Login (`POST /api/v1/auth/send-otp` & `/verify-otp`)**: Instant OTP generation with JWT session issuance.
- **Aadhaar Verification**: 12-digit format check, simulated UIDAI OTP validation, and masked storage (`XXXXXXXX1234`).
- **PAN Card Verification**: Indian PAN regex validation (`[A-Z]{5}[0-9]{4}[A-Z]{1}`) with holder name matching.
- **Bank Account Penny-Drop Verification**: Account number and Indian IFSC check. Once Aadhaar, PAN, and Bank are verified, vendor status auto-advances to `VERIFIED`.

### 🏷️ 4. Vendor Rate Cards & Dashboard
- **Price Card Management (`/api/v1/vendor/price-card`)**: Create, update, list, and delete packages with pricing units (`PER_EVENT`, `PER_DAY`, `PER_HOUR`, `PER_PLATE`, `FIXED`), inclusions, and terms.
- **Dashboard Metrics (`/api/v1/vendor/dashboard/stats`)**: Overview of active packages, KYC verification, and system notifications.

---

## 🧪 Pre-Configured Sample Vendors Directory for Testing

The system comes pre-seeded with 6 realistic vendors across diverse categories. You can query them at anytime via `GET /api/v1/user/sample-vendors`:

| Business Name | Category | City | Phone (For Login) | Mock OTP | Vendor ID | UPI ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Royal Grand Decorators** | `DECORATION` | Bangalore | `+919876500001` | `123456` | `70421caf-a7ef-4cad-9960-48ba6fabf7a7` | `royalgrand@okhdfcbank` |
| **Saffron Spice Caterers** | `CATERING` | Mumbai | `+919876500002` | `123456` | `81b23cdf-b8ef-4dac-8871-59cb7eabf8b8` | `saffronspice@icici` |
| **PixelCraft Photography** | `PHOTOGRAPHY` | New Delhi | `+919876500003` | `123456` | `92c34def-c9fa-4ebd-9982-60dc8fbca9c9` | `pixelcraft@oksbi` |
| **SoundWave DJ & Stage** | `SOUND_DJ` | Hyderabad | `+919876500004` | `123456` | `a3d45ef0-da0b-4fce-aa93-71ed90cdba0a` | `soundwave@axisbank` |
| **Glamour Bridal Artistry** | `MAKEUP_ARTIST` | Bangalore | `+919876500005` | `123456` | `b4e56f01-eb1c-40df-bb04-82fe01deca1b` | `ananya.sen@kotak` |
| **The Grand Heritage Palace**| `VENUE` | Jaipur | `+919876500006` | `123456` | `c5f67012-fc2d-41e0-cc15-930f12efdb2c` | `grandheritage@barodampay` |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Push Database Schema & Seed Data
```bash
npm run db:push
npm run db:seed
```

### 3. Start Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

### 4. Interactive Swagger OpenAPI Docs
Open your browser and navigate to:
```
http://localhost:5000/api-docs
```
*All endpoints in Swagger UI include pre-filled sample vendor IDs, phone numbers, and request bodies ready to execute with one click!*

### 5. Run Test Suites
```bash
# Run User & Chatbot Deal Negotiation E2E Tests
npm run test:user

# Run Vendor Onboarding & KYC E2E Tests
npm run test:e2e
```

---

## 📡 API Endpoints Reference

### 🌟 1. User Experience & Chatbot Deals
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`  | `/api/v1/user/sample-vendors` | Get all sample vendors with test payloads & credentials |
| `GET`  | `/api/v1/user/vendors` | Browse verified vendors (supports `category`, `city`, `search`, pagination) |
| `GET`  | `/api/v1/user/vendors/:id` | Get public vendor profile + packages + **integration values** |
| `GET`  | `/api/v1/user/vendors/:id/banking` | Get verified vendor banking & UPI settlement details |
| `POST` | `/api/v1/user/deals/chatbot` | **Deal with Chatbot**: AI package price bargaining & contract quote |
| `POST` | `/api/v1/user/deals/:dealId/negotiate` | Send counter-offer or message to chatbot |
| `GET`  | `/api/v1/user/deals/:dealId` | View negotiated deal status, chat history, and banking breakdown |

### 🔐 2. Vendor Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/send-otp` | Send 6-digit OTP to vendor mobile number |
| `POST` | `/api/v1/auth/verify-otp` | Verify OTP and return JWT Bearer token |

### 📋 3. Vendor KYC Verification (Protected)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/vendor/kyc/aadhaar/send-otp` | Send Aadhaar verification OTP |
| `POST` | `/api/v1/vendor/kyc/aadhaar/verify-otp` | Verify Aadhaar OTP (Masks number) |
| `POST` | `/api/v1/vendor/kyc/pan/verify` | Verify PAN card and holder name |
| `POST` | `/api/v1/vendor/kyc/bank/verify` | Verify bank account & IFSC via penny drop |
| `GET`  | `/api/v1/vendor/kyc/status` | Get compliance verification status |

### 💼 4. Vendor Profile & Dashboard (Protected)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`  | `/api/v1/vendor/profile` | Get authenticated vendor profile |
| `PUT`  | `/api/v1/vendor/profile` | Update profile, category, bio, address |
| `GET`  | `/api/v1/vendor/dashboard/stats` | Get dashboard overview & stats |

### 🏷️ 5. Price Card / Rate Card
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/vendor/price-card` | Vendor | Create service package rate |
| `GET`  | `/api/v1/vendor/price-card` | Vendor | List all price cards for vendor |
| `GET`  | `/api/v1/vendor/price-card/:id` | Vendor | Get single price card |
| `PUT`  | `/api/v1/vendor/price-card/:id` | Vendor | Update price card package |
| `DELETE`| `/api/v1/vendor/price-card/:id` | Vendor | Delete price card package |
| `GET`  | `/api/v1/vendor/price-card/public/:vendorId` | Public | Client view of vendor packages |

---

## 💻 Example cURL Commands

### 1. Initiate Deal with Chatbot
```bash
curl -X POST http://localhost:5000/api/v1/user/deals/chatbot \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### 2. Multi-turn Negotiation with Chatbot
```bash
curl -X POST http://localhost:5000/api/v1/user/deals/<dealId>/negotiate \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Can we lock in at ₹75,000 if we pay the 30% booking advance today?",
    "counterOffer": 75000
  }'
```

### 3. Retrieve Vendor Banking Details for Settlement
```bash
curl http://localhost:5000/api/v1/user/vendors/70421caf-a7ef-4cad-9960-48ba6fabf7a7/banking
```

### 4. Vendor Login with Pre-configured Sample Vendor
```bash
# Step 1: Send OTP
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876500001"}'

# Step 2: Verify OTP
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876500001", "otp": "123456"}'
```
