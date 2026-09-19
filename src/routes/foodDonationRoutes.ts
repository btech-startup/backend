import { Router } from 'express';
import { FoodDonationController } from '../controllers/foodDonationController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateMiddleware';

const router = Router();

router.post(
  '/dispatch',
  authenticate,
  validateBody(['booking_id', 'estimated_meals_count', 'food_type']),
  FoodDonationController.dispatchPickup
);

router.get('/list', authenticate, FoodDonationController.listPickups);

export default router;
