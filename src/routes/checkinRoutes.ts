import { Router } from 'express';
import { CheckinController } from '../controllers/checkinController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = Router();

router.post(
  '/verify-otp',
  authenticate,
  validateBody(['booking_id', 'submitted_otp', 'vendor_latitude', 'vendor_longitude']),
  CheckinController.verifyOTP
);

export default router;
