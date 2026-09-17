# Event Management Platform - Complete Documentation Hub

Welcome to the central documentation directory for the **Event Management Backend Platform**. This directory consolidates all architectural specifications, API references, integration guides, and testing resources into a single organized folder.

---

## 📚 Documentation Index

| Document | Description |
| :--- | :--- |
| **[1. API Reference](./API_REFERENCE.md)** | Complete specification of all endpoints (Authentication, KYC, Vendor Profile, Price Cards, User Experience, Banking, and Chatbot Deals). |
| **[2. Chatbot Deal Negotiation Guide](./CHATBOT_DEALS_GUIDE.md)** | In-depth guide on the automated AI Chatbot Deal Assistant, bargaining engine, pricing calculations, multi-turn chat, and deal state transitions. |
| **[3. Banking & Payment Settlement Guide](./BANKING_AND_PAYMENTS.md)** | Technical reference for verified vendor banking details, UPI IDs, penny-drop verification, advance payment schedules, and escrow booking. |
| **[4. Sample Vendors Catalog & Testing Guide](./SAMPLE_VENDORS_CATALOG.md)** | Directory of 6 pre-configured sample vendors with login credentials, IDs, pricing cards, and ready-to-use cURL commands. |
| **[5. Postman API Collection](./EVENT_MANAGEMENT_API.postman_collection.json)** | Complete Postman collection JSON file ready to import into Postman, Insomnia, or Thunder Client for instant testing. |

---

## 🏗️ High-Level System Architecture

```
                                  +---------------------------------------+
                                  |         Event Management Backend      |
                                  |       Node.js + Express + Prisma      |
                                  +---------------------------------------+
                                                      |
                   +----------------------------------+----------------------------------+
                   |                                                                     |
                   v                                                                     v
    +------------------------------+                                      +------------------------------+
    |        VENDOR DOMAIN         |                                      |         USER DOMAIN          |
    +------------------------------+                                      +------------------------------+
    | 1. Mobile OTP Login          |                                      | 1. Public Vendor Directory   |
    | 2. 3-Tier KYC Compliance:    |                                      | 2. Vendor Profile & Reviews  |
    |    - Aadhaar Verification    |                                      | 3. Verified Banking & UPI:   |
    |    - PAN Verification        |                                      |    - UPI ID                  |
    |    - Bank Penny Drop         |                                      |    - IFSC & Account Details  |
    | 3. Dashboard Analytics       |                                      |    - Payment Advance Terms   |
    | 4. Price Card / Rate Packages|                                      | 4. Chatbot Deal Negotiation: |
    +------------------------------+                                      |    - Automated Bargaining    |
                                                                          |    - AI Counter-offers       |
                                                                          |    - Agreement Contracts     |
                                                                          +------------------------------+
```

---

## 🚀 Quick Commands

```bash
# 1. Install dependencies
npm install

# 2. Sync database schema
npm run db:push

# 3. Seed database with 6 rich sample vendors
npm run db:seed

# 4. Start development server (auto-seeds if fresh)
npm run dev

# 5. Run User Experience & Chatbot E2E Test Suite
npm run test:user

# 6. Run Vendor Onboarding & KYC E2E Test Suite
npm run test:e2e

# 7. Production TypeScript Build
npm run build
```

---

## 🌐 Server & Documentation URLs

- **API Base URL**: `http://localhost:5000/api/v1`
- **Interactive Swagger UI**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/api/v1/health`
- **Sample Vendors Config**: `http://localhost:5000/api/v1/user/sample-vendors`
