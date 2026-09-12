import { Router } from 'express';
import { BookingController } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = Router();

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

router.get('/my-bookings', authenticate, BookingController.getMyBookings);

export default router;
