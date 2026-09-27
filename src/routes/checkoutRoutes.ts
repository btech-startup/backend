import { Router } from 'express';
import { CheckoutController } from '../controllers/checkoutController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateMiddleware';

const router = Router();

/**
 * POST /api/v1/checkout
 * Protected endpoint for Customer checkout
 */
router.post(
  '/',
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
  CheckoutController.checkout
);

export default router;
