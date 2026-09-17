# User-Side Integration Guide: Banking & Payment Settlement

This document outlines the architecture, compliance verification, and public settlement specifications for **Vendor Banking & UPI Payment Details**.

---

## 🛡️ Why Verified Banking Matters

Event bookings involve high-value transactions (ranging from ₹25,000 for bridal makeup to ₹5,00,000+ for venues and catering). Clients require:
1. **Authenticity Guarantee**: Assurance that payments are going to a verified, KYC-compliant business.
2. **Immediate Advance Settlement**: A direct, verified UPI ID (Google Pay, PhonePe, Paytm, BHIM) or NEFT/IMPS bank details to secure event dates.
3. **Escrow Protection**: Clear payment milestone schedules preventing vendor cancellations or disputes.

---

## 🏦 3-Tier KYC Compliance Workflow

Before a vendor's banking details become visible to clients, the vendor must pass our automated compliance pipeline:

```
[ Vendor Enters Bank Details: Account Number + IFSC + Holder Name ]
                                |
                                v
[ 1. IFSC Regex Validation: /^[A-Z]{4}0[A-Z0-9]{6}$/ ]
                                |
                                v
[ 2. Penny Drop Simulation (Mock NPCI / Bank Gateway) ]
  - Simulates ₹1 credit to vendor account.
  - Matches returned registered bank account name with KYC name.
                                |
                                v
[ 3. Auto-Assignment of Verified UPI ID ]
  - e.g. "royalgrand@okhdfcbank"
                                |
                                v
[ 4. Vendor Status Advances to VERIFIED & Documents are Masked ]
```

---

## 🔒 Security & Data Masking Policy

To comply with data privacy standards:
- **Bank Account Number**: Always masked on public endpoints:
  - Original: `9182736450192`
  - Stored / Exposed: `XXXXXX0192`
- **Aadhaar Number**: Always masked (`XXXXXXXX5544`).
- **IFSC Code**: Publicly exposed for valid routing (e.g. `HDFC0001234`).
- **Bank Name & Registered Account Name**: Publicly exposed to prevent fraud.
- **UPI ID**: Publicly exposed for instant 1-click payments in mobile apps.

---

## 📡 Banking Endpoints Reference

### 1. Retrieve Vendor Banking Details
`GET /api/v1/user/vendors/:id/banking`

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

### 2. Integration Values in Public Vendor Profile
`GET /api/v1/user/vendors/:id`

The `integrationValues.banking` object is included automatically in the vendor's public profile:

```json
{
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
    }
  }
}
```

---

## 💳 Payment Schedule & Escrow Terms

All accepted deals automatically calculate payment milestones:

| Stage | Milestone | Percentage | Timing |
| :--- | :--- | :--- | :--- |
| **Milestone 1** | Booking Deposit | `30%` | Payable immediately upon deal acceptance via UPI to lock the calendar date. |
| **Milestone 2** | Event Delivery | `70%` | Payable on event date morning after setup inspection. |

---

## 📱 Frontend Deep Link Integration (UPI Intent)

You can generate direct UPI payment links in mobile and web applications:

```typescript
export function generateUpiPaymentUrl(params: {
  upiId: string;
  accountHolderName: string;
  amount: number;
  dealId: string;
  notes: string;
}) {
  const { upiId, accountHolderName, amount, dealId, notes } = params;
  const encodedName = encodeURIComponent(accountHolderName);
  const encodedNotes = encodeURIComponent(`${notes} (Ref: ${dealId})`);
  
  // Standard UPI URI format supported by GPay, PhonePe, Paytm, BHIM
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNotes}`;
}
```

---

## 🧪 Testing with Pre-Configured Sample Vendor Banks

| Business Name | Bank Name | IFSC Code | Masked Account | UPI ID |
| :--- | :--- | :--- | :--- | :--- |
| **Royal Grand Decorators** | `HDFC Bank` | `HDFC0001234` | `XXXXXX0192` | `royalgrand@okhdfcbank` |
| **Saffron Spice Caterers** | `ICICI Bank` | `ICIC0000104` | `XXXXXX5521` | `saffronspice@icici` |
| **PixelCraft Photography** | `State Bank of India` | `SBIN0000691` | `XXXXXX4489` | `pixelcraft@oksbi` |
| **SoundWave DJ** | `Axis Bank` | `UTIB0000512` | `XXXXXX7733` | `soundwave@axisbank` |
| **Glamour Bridal Makeup** | `Kotak Mahindra Bank`| `KKBK0008056` | `XXXXXX8891` | `ananya.sen@kotak` |
| **Grand Heritage Palace** | `Bank of Baroda` | `BARB0JAIPUR` | `XXXXXX3311` | `grandheritage@barodampay` |
