import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateMiddleware';
import { UserRole } from '../types/index';

const router = Router();

// Create a new booking with escrow checkout
router.post(
  '/checkout',
  authenticate,
  validateBody([
    'vendor_id',
    'service_id',
    'event_date',
    'event_slot',
    'venue_address',
    'venue_latitude',
    'venue_longitude',
    'gross_amount',
  ]),
  BookingController.checkout
);

// Get authenticated customer's bookings
router.get('/my-bookings', authenticate, BookingController.getMyBookings);

// Get vendor's received bookings
router.get(
  '/vendor-bookings',
  authenticate,
  authorize(UserRole.VENDOR),
  BookingController.getVendorBookings
);

// Get full booking details (milestones, vendor, checkin, deliverables, escrow)
router.get('/:id', authenticate, BookingController.getBookingDetails);

// Cancel a booking
router.post('/:id/cancel', authenticate, BookingController.cancelBooking);

export default router;
