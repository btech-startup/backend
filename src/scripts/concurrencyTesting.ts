import { CheckoutService } from '../services/checkoutService';
import { SlotConflictError } from '../services/redisRedlock';

/**
 * Concurrency Testing Suite:
 * Proves Redis Distributed Slot Lock prevents race conditions and double bookings.
 * Fires concurrent checkout attempts for the same vendor, event_date, and event_slot.
 */
async function runConcurrencyTest() {
  console.log('========================================================================');
  console.log('🚀 RUNNING REDIS REDLOCK CONCURRENCY TEST FOR SLOT CHECKOUT');
  console.log('========================================================================\n');

  const testVendorId = `vnd_test_${Date.now()}`;
  const testServiceId = `svc_test_${Date.now()}`;
  const testDate = '2026-11-20';
  const testSlot = 'evening_reception';
  const venueAddress = 'Kohinoor Palace, Road 36, Jubilee Hills, Hyderabad';
  const venueLatitude = 17.4319;
  const venueLongitude = 78.4073;
  const grossAmount = 150000;

  const totalConcurrentUsers = 10;
  console.log(`Target: Vendor ${testVendorId} on ${testDate} [${testSlot}]`);
  console.log(`Simulating ${totalConcurrentUsers} concurrent customers pressing "Book Now" simultaneously...\n`);

  const startTime = Date.now();

  // Create array of concurrent promises
  const promises = Array.from({ length: totalConcurrentUsers }).map(async (_, index) => {
    const customerId = `usr_cust_${index + 1}`;
    try {
      const res = await CheckoutService.executeCheckout({
        client_id: customerId,
        vendor_id: testVendorId,
        service_id: testServiceId,
        event_date: testDate,
        event_slot: testSlot,
        venue_address: venueAddress,
        venue_latitude: venueLatitude,
        venue_longitude: venueLongitude,
        gross_amount: grossAmount,
      });

      return {
        customerId,
        status: 201,
        success: true,
        bookingRef: res.booking.bookingReference,
        error: null,
      };
    } catch (err: any) {
      const is409 = err instanceof SlotConflictError || err.statusCode === 409;
      return {
        customerId,
        status: is409 ? 409 : 500,
        success: false,
        bookingRef: null,
        error: err.message,
      };
    }
  });

  const results = await Promise.all(promises);
  const durationMs = Date.now() - startTime;

  console.log('------------------------------------------------------------------------');
  console.log('📊 CONCURRENCY EXECUTION RESULTS:');
  console.log('------------------------------------------------------------------------');
  results.forEach((r, idx) => {
    if (r.status === 201) {
      console.log(`  [Customer #${idx + 1} (${r.customerId})]: ✅ HTTP 201 CREATED - Booking: ${r.bookingRef}`);
    } else if (r.status === 409) {
      console.log(`  [Customer #${idx + 1} (${r.customerId})]: 🛑 HTTP 409 CONFLICT - ${r.error}`);
    } else {
      console.log(`  [Customer #${idx + 1} (${r.customerId})]: ❌ HTTP ${r.status} - ${r.error}`);
    }
  });

  const successfulCount = results.filter((r) => r.status === 201).length;
  const conflictCount = results.filter((r) => r.status === 409).length;

  console.log('\n========================================================================');
  console.log('📋 AUDIT SUMMARY:');
  console.log(`  Total Concurrent Attempts: ${totalConcurrentUsers}`);
  console.log(`  Successful Bookings (HTTP 201): ${successfulCount}`);
  console.log(`  Conflict Rejections (HTTP 409): ${conflictCount}`);
  console.log(`  Execution Duration: ${durationMs}ms`);
  console.log('========================================================================');

  if (successfulCount === 1 && conflictCount === totalConcurrentUsers - 1) {
    console.log('🎯 TEST PASSED: Exactly 1 customer secured the slot. Zero double bookings occurred!\n');
  } else {
    console.error('❌ TEST FAILED: Race condition detected!');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runConcurrencyTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}

export { runConcurrencyTest };
