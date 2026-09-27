import { Router } from 'express';
import { NegotiationController } from '../controllers/negotiationController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateMiddleware';

const router = Router();

// 1. Propose Counter-Offer
router.post(
  '/propose',
  authenticate,
  validateBody(['booking_id', 'sender_type', 'listing_price', 'proposed_price']),
  NegotiationController.propose
);

// 2. Get Negotiations for Booking
router.get(
  '/:booking_id',
  authenticate,
  NegotiationController.getByBooking
);

// 3. Accept Offer (Locks price into Booking)
router.post(
  '/:id/accept',
  authenticate,
  NegotiationController.accept
);

// 4. Counter Offer (Within 5-15% discount window, resets 12h clock)
router.post(
  '/:id/counter',
  authenticate,
  validateBody(['sender_type', 'listing_price', 'proposed_price']),
  NegotiationController.counter
);

// 5. Reject Offer
router.post(
  '/:id/reject',
  authenticate,
  NegotiationController.reject
);

export default router;
