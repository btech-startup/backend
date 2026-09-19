import { Router } from 'express';
import { CheckinController } from '../controllers/checkinController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateMiddleware';

const router = Router();

router.post(
  '/verify-otp',
  authenticate,
  validateBody(['booking_id', 'submitted_otp', 'vendor_latitude', 'vendor_longitude']),
  CheckinController.verifyOTP
);

export default router;
