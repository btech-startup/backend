# User-Side Integration Guide: Chatbot Deal Negotiation

This document details the architecture, decision engine, state machine, and frontend integration for the **User-Side Chatbot Deal Negotiation Engine**.

---

## 💡 Overview & Problem Statement

In the event management industry (weddings, banquets, catering, photography, decor), pricing is rarely static. Clients frequently negotiate packages based on:
- Event date (weekday vs peak wedding season weekend)
- Guest count (e.g. 200 vs 800 guests)
- Custom bundle requests (e.g., removing drone footage or adding extra floral pillars)
- Budget constraints

Waiting days for manual vendor responses causes high drop-offs. The **EventWave AI Deal Assistant** resolves this by automating real-time, policy-compliant price negotiations, counter-offers, and deal contracts 24/7.

---

## 🔄 Deal Negotiation Lifecycle

```
[ Client browses Vendor / Package ]
               |
               v
[ Client sends Deal Request: event date, guest count, budget offer ]
  --> POST /api/v1/user/deals/chatbot
               |
               v
+-------------------------------------------------------------+
|               Chatbot AI Decision Engine                    |
+-------------------------------------------------------------+
|  1. Evaluates requested discount:                          |
|     discount% = ((standardPrice - offeredPrice) / standard) |
|                                                             |
|  Case A: discount <= 0% (Full price or higher)             |
|     -> Instant Acceptance at standard price.                |
|                                                             |
|  Case B: 0% < discount <= 15% (Within approved margin)     |
|     -> DEAL_ACCEPTED: Locks in client offer.                |
|                                                             |
|  Case C: discount > 15% (Below margin)                      |
|     -> NEGOTIATING: Chatbot counters at 12% discount        |
|        plus complimentary value-add upgrades.               |
+-------------------------------------------------------------+
               |
               v
[ Chatbot returns AI message + contract breakdown + banking snapshot ]
               |
               v
[ Client sends counter-offer or question ]
  --> POST /api/v1/user/deals/:dealId/negotiate
               |
               v
[ Deal locked in DEAL_ACCEPTED ]
               |
               v
[ Client views settlement details & deposits 30% advance via UPI ]
```

---

## 🤖 Decision Engine Parameters

| Parameter | Default Value | Description |
| :--- | :--- | :--- |
| **Max Auto-Negotiable Discount** | `15%` | Maximum discount the chatbot can accept without manual vendor escalation. |
| **Counter-Offer Baseline** | `12%` | Default counter-offer percentage generated when a user asks for >15%. |
| **Booking Advance Percentage** | `30%` | Deposit required from client upon deal acceptance to lock date. |
| **Remaining Settlement Due** | `70%` | Balance payable on event date setup morning. |
| **Currency** | `INR (₹)` | Platform default currency. |

---

## 📊 Deal State Machine

```
              +-------------+
              |   INQUIRY   |
              +-------------+
                     |
                     v
              +-------------+
              | NEGOTIATING | <---------+
              +-------------+           |
                     |                  | (Counter-offer outside limit)
                     +------------------+
                     |
                     | (Offer within approved limit)
                     v
             +---------------+
             | DEAL_ACCEPTED |
             +---------------+
                     |
                     | (Advance payment initiated)
                     v
            +-----------------+
            | PAYMENT_PENDING |
            +-----------------+
                     |
                     | (30% advance verified via UPI / Bank)
                     v
               +-----------+
               | CONFIRMED |
               +-----------+
```

---

## 📡 Endpoints Specification

### 1. Initiate Deal with Chatbot
- **Method**: `POST`
- **Path**: `/api/v1/user/deals/chatbot`
- **Auth**: None (Public client-facing)

**Request Body:**
```typescript
interface CreateChatbotDealDto {
  vendorId: string;           // Required
  priceCardId?: string;       // Optional target package
  clientName: string;         // Required (e.g., "Sunita Mehra")
  clientPhone: string;        // Required (e.g., "+919911223344")
  clientEmail?: string;       // Optional
  eventType: string;          // Required (e.g., "Sangeet & Wedding")
  eventDate?: string;         // Optional (e.g., "2026-11-28")
  guestCount?: number;        // Optional (e.g., 400)
  offeredPrice?: number;      // Optional proposed price
  userMessage?: string;       // Optional custom greeting or inquiry
}
```

---

### 2. Multi-turn Chatbot Negotiation
- **Method**: `POST`
- **Path**: `/api/v1/user/deals/:dealId/negotiate`
- **Auth**: None

**Request Body:**
```typescript
interface NegotiateDealDto {
  userMessage: string;        // Required: user inquiry or question
  counterOffer?: number;      // Optional: updated numeric offer
}
```

---

### 3. Retrieve Deal & Settlement Breakdown
- **Method**: `GET`
- **Path**: `/api/v1/user/deals/:dealId`
- **Auth**: None

---

## 💻 Frontend Integration Examples

### React / TypeScript Example Hook

```typescript
import { useState } from 'react';

export function useChatbotDeal(vendorId: string, priceCardId?: string) {
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const startDeal = async (payload: {
    clientName: string;
    clientPhone: string;
    eventType: string;
    offeredPrice: number;
    userMessage: string;
  }) => {
    setLoading(true);
    const res = await fetch('http://localhost:5000/api/v1/user/deals/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId, priceCardId, ...payload }),
    });
    const json = await res.json();
    setDeal(json.data);
    setLoading(false);
    return json.data;
  };

  const sendNegotiationTurn = async (userMessage: string, counterOffer?: number) => {
    if (!deal) return;
    setLoading(true);
    const res = await fetch(`http://localhost:5000/api/v1/user/deals/${deal.dealId}/negotiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage, counterOffer }),
    });
    const json = await res.json();
    setDeal((prev: any) => ({ ...prev, ...json.data }));
    setLoading(false);
    return json.data;
  };

  return { deal, loading, startDeal, sendNegotiationTurn };
}
```

---

### cURL Negotiation Turn Example

```bash
# Step 1: Start Deal
curl -X POST http://localhost:5000/api/v1/user/deals/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "70421caf-a7ef-4cad-9960-48ba6fabf7a7",
    "priceCardId": "pc-royal-decor-01",
    "clientName": "Aisha Kapoor",
    "clientPhone": "+919811122233",
    "eventType": "Wedding & Reception",
    "offeredPrice": 75000,
    "userMessage": "Can you offer 75k for the Royal Mandap package?"
  }'

# Step 2: Send Counter-Offer
curl -X POST http://localhost:5000/api/v1/user/deals/<DEAL_ID>/negotiate \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "If we confirm right now, can we lock this rate?",
    "counterOffer": 75000
  }'
```
