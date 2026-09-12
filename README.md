# EventWise Backend Architecture & API Specification

Production-Ready PostgreSQL 16 RESTful API Engine for **EventWise Platform**, engineered to serve:
1. **Customer Mobile Application** (React Native / Expo)
2. **Vendor Mobile Application** (React Native / Expo)
3. **Admin & Operations Web Command Center** (React / Vite Web Portal)

---

## 🏛️ System Architecture Highlights

- **Database**: PostgreSQL 16 relational database with double-entry escrow ledger (`escrow_ledger`), milestone state machines, 12-hour structured counter-offer window, geofence verification, and dispute resolution audit.
- **Geofenced Check-In**: Haversine distance engine validating vendor presence within 500 meters of event venue before releasing Milestone 2 (50% payout).
- **Anti-Circumvention Chat Guard**: 4-stage real-time regex/NLP pipeline scrubbing phone numbers, word-spelled digits ("nine eight..."), UPI handles (`@okaxis`), and external URLs (`wa.me`, `instagram.com`).
- **Multi-Actor Role Security**: JWT authentication with 4 roles (`customer`, `vendor`, `admin`, `ops_agent`).
- **Escrow Payout Engine**: 3-Stage Milestone Splitter (20% Advance Lock, 50% Geofenced Check-in, 30% Work Delivery).

---

## 📁 Project Directory Structure

```
backend/
├── migrations/
│   └── 001_init_eventwise_schema.sql  # Complete PostgreSQL DDL
├── src/
│   ├── config/             # DB Pool & Typed Env Config
│   │   ├── db.ts
│   │   └── env.ts
│   ├── controllers/        # Multi-Actor Controllers
│   │   ├── adminController.ts
│   │   ├── authController.ts
│   │   ├── bookingController.ts
│   │   ├── chatController.ts
│   │   ├── checkinController.ts
│   │   ├── customerController.ts
│   │   ├── negotiationController.ts
│   │   └── vendorController.ts
│   ├── middleware/         # Auth, Role Guard, Error & Validation Middlewares
│   │   ├── authMiddleware.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validateMiddleware.ts
│   ├── repositories/       # PostgreSQL Data Repositories
│   │   ├── bookingRepository.ts
│   │   ├── checkinRepository.ts
│   │   ├── disputeRepository.ts
│   │   ├── escrowLedgerRepository.ts
│   │   ├── milestoneRepository.ts
│   │   ├── negotiationRepository.ts
│   │   ├── userRepository.ts
│   │   └── vendorRepository.ts
│   ├── routes/             # API Router definitions (/api/v1)
│   │   ├── adminRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── bookingRoutes.ts
│   │   ├── chatRoutes.ts
│   │   ├── checkinRoutes.ts
│   │   ├── customerRoutes.ts
│   │   ├── index.ts
│   │   ├── negotiationRoutes.ts
│   │   └── vendorRoutes.ts
│   ├── scripts/            # DB Migration & Seeding Scripts
│   │   ├── migrate.ts
│   │   └── seed.ts
│   ├── services/           # Domain Logic Services
│   │   ├── adminService.ts
│   │   ├── authService.ts
│   │   ├── bookingService.ts
│   │   ├── chatGuardService.ts
│   │   ├── checkinService.ts
│   │   ├── customerService.ts
│   │   ├── negotiationService.ts
│   │   └── vendorService.ts
│   ├── types/              # Type Declarations & Enums
│   │   ├── express.d.ts
│   │   └── index.ts
│   ├── utils/              # Helper Utilities
│   │   ├── apiResponse.ts
│   │   ├── chatGuard.ts
│   │   ├── geofence.ts
│   │   ├── jwt.ts
│   │   └── logger.ts
│   ├── app.ts              # Express App setup
│   └── server.ts           # Server Bootstrap
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📡 Key API Endpoints Reference

### 1. Common & Auth Endpoints
- `GET  /api/v1/health` - Master System & DB Health Check
- `POST /api/v1/auth/register` - Register User (`customer`, `vendor`, `admin`)
- `POST /api/v1/auth/login` - Phone & Password Authentication

### 2. Customer Mobile App (React Native / Expo)
- `POST /api/v1/customer/budget-split` - Reverse Budget Allocation Splitter
- `GET  /api/v1/customer/vendors` - List Verified Vendors by Category
- `POST /api/v1/bookings/checkout` - Single Cart Escrow Checkout (20% Advance Lock)
- `POST /api/v1/negotiations/propose` - Propose Structured Counter-Offer (5%–15% margin)

### 3. Vendor Mobile App (React Native / Expo)
- `POST /api/v1/vendor/kyc` - Submit Government ID & Bank Account Info
- `POST /api/v1/vendor/services` - Add Service Package to Catalog
- `GET  /api/v1/vendor/payouts` - View Real-Time Escrow Balances
- `POST /api/v1/events/checkin/verify-otp` - On-Site Geofenced OTP Venue Check-In (Triggers 50% Milestone 2 Payout)

### 4. Chat & Anti-Circumvention
- `POST /api/v1/chat/sanitize` - 4-stage Regex/NLP Sanitizer & Shadow Audit Logger

### 5. Admin Command Center Web Portal
- `POST /api/v1/admin/sos/dispatch` - 1-Click Emergency SOS Backup Vendor Dispatcher
- `POST /api/v1/admin/disputes/resolve` - Dispute Tribunal Settlement
- `GET  /api/v1/admin/analytics` - GMV, Commission Revenue & Booking Metrics
- `GET  /api/v1/admin/chat-violations` - In-App Chat Leakage Violation Log

---

## 💻 Database Setup Commands

```bash
# Apply PostgreSQL DDL Schema
npm run db:migrate

# Seed Initial Test Users & Vendors
npm run db:seed

# Development Mode
npm run dev

# Type Verification
npm run lint

# Production Build
npm run build
```
