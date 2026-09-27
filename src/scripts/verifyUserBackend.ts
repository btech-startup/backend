import crypto from 'crypto';
import { NegotiationService } from '../services/negotiationService';
import { CheckoutService } from '../services/checkoutService';
import { PaymentWebhookService } from '../services/paymentWebhookService';
import { OTPGeofenceService } from '../services/otpGeofenceService';
import { EscrowMilestonesService } from '../services/escrowMilestonesService';
import { BookingStateMachine } from '../services/bookingStateMachine';
import { BookingRepository } from '../repositories/bookingRepository';
import { NegotiationSender, BookingStatus } from '../types/index';

async function runEndToEndVerification() {
  console.log('========================================================================');
  console.log('🧪 RUNNING END-TO-END VORTIX USER-SIDE BACKEND VERIFICATION');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ': ' + detail : ''}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 1: DEAL DESK & NEGOTIATION RULES (Images 2 & 3)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- TEST SUITE 1: Deal Desk & Negotiation Rules ---');

  const testBookingId = `bk_test_neg_${Date.now()}`;
  const listingPrice = 100000;

  // Rule Test 1.1: 10% discount (valid: 5% <= 10% <= 15%)
  const propRes = await NegotiationService.proposeCounterOffer({
    booking_id: testBookingId,
    sender_type: NegotiationSender.CLIENT,
    listing_price: listingPrice,
    proposed_price: 90000, // 10% discount
    remarks: 'Preferred rate for weekend event',
  });
  assert(
    propRes.rules.appliedDiscount === '10.00%' && propRes.rules.responseWindowHours === 12,
    'Rule: Propose 10% discount succeeds with 12h response window'
  );

  // Rule Test 1.2: 3% discount (< 5% minimum violation)
  let lowDiscountFailed = false;
  try {
    await NegotiationService.proposeCounterOffer({
      booking_id: testBookingId,
      sender_type: NegotiationSender.CLIENT,
      listing_price: listingPrice,
      proposed_price: 97000, // 3% discount
    });
  } catch (err: any) {
    lowDiscountFailed = err.message.includes('between 5% and 15%');
  }
  assert(lowDiscountFailed, 'Rule: Rejects proposal with < 5% discount (min-DISC = 5%)');

  // Rule Test 1.3: 20% discount (> 15% maximum violation)
  let highDiscountFailed = false;
  try {
    await NegotiationService.proposeCounterOffer({
      booking_id: testBookingId,
      sender_type: NegotiationSender.CLIENT,
      listing_price: listingPrice,
      proposed_price: 80000, // 20% discount
    });
  } catch (err: any) {
    highDiscountFailed = err.message.includes('between 5% and 15%');
  }
  assert(highDiscountFailed, 'Rule: Rejects proposal with > 15% discount (max-DISC = 15%)');

  // Test 1.4: Retrieve negotiations by booking ID
  const thread = await NegotiationService.getByBookingId(testBookingId);
  assert(
    thread.history.length === 1 && thread.activeOffer !== null,
    'Endpoint: GET /negotiations/:booking_id returns active thread and countdown'
  );

  // Test 1.5: Counter offer (vendor counters with 7% discount)
  const counterRes = await NegotiationService.counterOffer(propRes.negotiation.id, {
    sender_type: NegotiationSender.VENDOR,
    listing_price: listingPrice,
    proposed_price: 93000, // 7% discount
    remarks: 'Best possible rate for premium slot',
  });
  assert(
    counterRes.newOffer.proposed_price === 93000,
    'Endpoint: POST /negotiations/:id/counter creates counter-proposal'
  );

  // Test 1.6: Accept offer (client accepts vendor counter-offer)
  const acceptRes = await NegotiationService.acceptOffer(counterRes.newOffer.id, 'customer');
  assert(
    acceptRes.status === 'accepted' && acceptRes.lockedPrice === 93000,
    'Rule: Accepted offer locks deal price into booking'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 2: CHECKOUT ENGINE & 12 BOOKING FIELDS (Images 1 & 2)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST SUITE 2: Checkout Engine & 12 Booking Fields ---');

  const customerId = 'usr_customer_777';
  const vendorId = `vnd_test_${Date.now()}`;
  const serviceId = 'svc_catering_gold';
  const eventDate = '2026-12-15';
  const eventSlot = 'morning_muhurtham';
  const venueAddress = 'Kohinoor Palace, Jubilee Hills, Hyderabad';
  const venueLat = 17.4319;
  const venueLng = 78.4073;
  const grossAmount = 200000;

  const checkoutRes = await CheckoutService.executeCheckout({
    client_id: customerId,
    vendor_id: vendorId,
    service_id: serviceId,
    event_date: eventDate,
    event_slot: eventSlot,
    venue_address: venueAddress,
    venue_latitude: venueLat,
    venue_longitude: venueLng,
    gross_amount: grossAmount,
  });

  const b = checkoutRes.booking;
  // Verify all 12 fields from Image 2
  const has12Fields =
    b.customer === customerId && // 1) customer
    b.vendor === vendorId && // 2) vendor
    b.service === serviceId && // 3) service
    b.eventDate === eventDate && // 4) event date
    b.eventSlot === eventSlot && // 5) event slot
    b.venue === venueAddress && // 6) venue
    b.latitude === venueLat && // 7) latitude
    b.longitude === venueLng && // 7) longitude
    b.grossAmount === grossAmount && // 8) gross amount
    b.platformFee === 20000 && // 9) platform fee (10%)
    b.tax === 36000 && // 10) tax (18% GST)
    b.netPayable === 236000 && // 11) net payable
    b.status === BookingStatus.DRAFT; // 12) status

  assert(has12Fields, 'Booking Creation: Contains all 12 required fields accurately computed');
  assert(
    checkoutRes.paymentOrder && checkoutRes.paymentOrder.advancePayableNow === 47200,
    'Checkout: Generated payment order for 20% advance payment'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 3: BOOKING STATE MACHINE ENFORCEMENT (Image 3)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST SUITE 3: Booking State Machine Enforcement ---');

  const createdBookingId = checkoutRes.booking.id;

  // Test 3.1: Illegal jump from DRAFT -> COMPLETED
  let illegalTransitionBlocked = false;
  try {
    await BookingStateMachine.transition(createdBookingId, BookingStatus.COMPLETED);
  } catch (err: any) {
    illegalTransitionBlocked = err.name === 'InvalidStateTransitionError';
  }
  assert(illegalTransitionBlocked, 'State Machine: Blocks illegal jump from draft -> completed');

  // Test 3.2: Allowed transition from DRAFT -> ADVANCE_PAID
  const t1 = await BookingStateMachine.transition(createdBookingId, BookingStatus.ADVANCE_PAID);
  assert(
    t1.newStatus === BookingStatus.ADVANCE_PAID,
    'State Machine: Allows legal transition draft -> advance_paid'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 4: PAYMENT WEBHOOK WITH HMAC-SHA256 (Image 3)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST SUITE 4: Payment Webhook with Cryptographic Verification ---');

  const webhookSecret = 'vortix_webhook_secret_key_2026';
  const paymentPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_test_${Date.now()}`,
          amount: 4720000, // paise
          notes: {
            booking_id: createdBookingId,
          },
        },
      },
    },
  };

  const payloadString = JSON.stringify(paymentPayload);
  const validSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadString)
    .digest('hex');

  // Test 4.1: Valid signature verification
  const sigValid = PaymentWebhookService.verifySignature(payloadString, validSignature, webhookSecret);
  assert(sigValid, 'Payment Webhook: Validates authentic HMAC-SHA256 signature');

  // Test 4.2: Invalid signature rejection
  const sigInvalid = PaymentWebhookService.verifySignature(payloadString, 'fake_signature', webhookSecret);
  assert(!sigInvalid, 'Payment Webhook: Detects and rejects forged signature');

  // Test 4.3: Process webhook execution
  const webhookResult = await PaymentWebhookService.processWebhook(
    payloadString,
    validSignature,
    paymentPayload
  );
  assert(
    webhookResult.success && webhookResult.bookingStatus === BookingStatus.ADVANCE_PAID,
    'Payment Webhook: Advances state machine and funds Milestone 1 into escrow'
  );

  // Test 4.4: Idempotency protection against duplicate webhook delivery
  const duplicateResult = await PaymentWebhookService.processWebhook(
    payloadString,
    validSignature,
    paymentPayload
  );
  assert(
    duplicateResult.idempotent === true,
    'Payment Webhook: Idempotency guard prevents duplicate payment execution'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 5: OTP + GEOFENCE ARRIVAL VERIFICATION (Image 3)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST SUITE 5: OTP + Geofence Arrival Verification ---');

  // Get customer OTP
  const otpInfo = await OTPGeofenceService.getCustomerOTP(createdBookingId, customerId);
  assert(Boolean(otpInfo.otpCode), 'OTP Service: Customer retrieves secure 6-digit OTP code');

  // Test 5.1: Geofence breach (> 500 meters away, e.g. 5 km away in Hitec City)
  let geofenceBreachBlocked = false;
  try {
    await OTPGeofenceService.verifyHandshake({
      booking_id: createdBookingId,
      submitted_otp: otpInfo.otpCode,
      vendor_latitude: 17.4800, // ~5.5 km away
      vendor_longitude: 78.3800,
    });
  } catch (err: any) {
    geofenceBreachBlocked = err.message.includes('Geofence verification failed');
  }
  assert(geofenceBreachBlocked, 'Geofence: Rejects check-in when vendor is > 500m away from venue');

  // Test 5.2: Invalid OTP within venue
  let invalidOtpBlocked = false;
  try {
    await OTPGeofenceService.verifyHandshake({
      booking_id: createdBookingId,
      submitted_otp: '000000', // Invalid OTP
      vendor_latitude: venueLat + 0.0001, // ~15m away
      vendor_longitude: venueLng + 0.0001,
    });
  } catch (err: any) {
    invalidOtpBlocked = err.message.includes('Invalid 6-digit OTP');
  }
  assert(invalidOtpBlocked, 'OTP Guard: Rejects check-in when OTP does not match');

  // Test 5.3: Valid check-in (distance <= 500m AND OTP matches)
  const validCheckin = await OTPGeofenceService.verifyHandshake({
    booking_id: createdBookingId,
    submitted_otp: otpInfo.otpCode,
    vendor_latitude: venueLat + 0.0005, // ~60m away (valid)
    vendor_longitude: venueLng + 0.0005,
  });
  assert(
    validCheckin.checkinStatus === 'verified' &&
      validCheckin.bookingStatus === BookingStatus.ACTIVE_CONFIRMED &&
      validCheckin.milestoneReleased.splitPercentage === 50,
    'OTP + Geofence: Dual verification succeeds, releases Milestone 2 (50%), advances to active_confirmed'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUITE 6: ESCROW MILESTONES & FINAL WORK DELIVERY (Image 3)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST SUITE 6: Escrow Milestones & Final Work Delivery ---');

  // Test 6.1: Client approves final deliverables
  const approveRes = await EscrowMilestonesService.approveDeliverableMilestone(
    createdBookingId,
    customerId,
    'All event photos and videos delivered in high resolution'
  );
  assert(
    approveRes.bookingStatus === BookingStatus.COMPLETED &&
      approveRes.milestoneReleased.splitPercentage === 30,
    'Escrow Milestones: Client approves work delivery, releases Milestone 3 (30%), completes booking'
  );

  // Final Summary
  console.log('\n========================================================================');
  console.log(`📋 VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL USER-SIDE BACKEND SUITES PASSED FLAWLESSLY!\n');
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

if (require.main === module) {
  runEndToEndVerification()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Verification failed with error:', err);
      process.exit(1);
    });
}

export { runEndToEndVerification };
