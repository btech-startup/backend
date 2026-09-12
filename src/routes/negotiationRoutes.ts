import { Router } from 'express';
import { NegotiationController } from '../controllers/negotiationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = Router();

router.post(
  '/propose',
  authenticate,
  validateBody(['booking_id', 'sender_type', 'listing_price', 'proposed_price']),
  NegotiationController.propose
);

export default router;
