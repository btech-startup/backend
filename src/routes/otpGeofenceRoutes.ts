import { Router } from 'express';
import { OTPGeofenceController } from '../controllers/otpGeofenceController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateMiddleware';

const router = Router();

router.use(authenticate);

// 1. Customer retrieves 6-digit OTP code for on-site handover
router.get('/otp/:booking_id', OTPGeofenceController.getCustomerOTP);

// 2. Vendor submits on-site coordinates and OTP code for dual-factor verification
router.post(
  '/verify',
  validateBody(['booking_id', 'submitted_otp', 'vendor_latitude', 'vendor_longitude']),
  OTPGeofenceController.verifyCheckin
);

export default router;
