import { Router } from 'express';
import { FoodDonationController } from '../controllers/foodDonationController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = Router();

router.post(
  '/dispatch',
  authenticate,
  validateBody(['booking_id', 'estimated_meals_count', 'food_type']),
  FoodDonationController.dispatchPickup
);

router.get('/list', authenticate, FoodDonationController.listPickups);

export default router;
