import { Router } from 'express';
import { VendorController } from '../controllers/vendorController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types/index';
import { validateBody } from '../middleware/validateMiddleware';

const router = Router();

router.post(
  '/kyc',
  authenticate,
  authorize(UserRole.VENDOR),
  validateBody(['business_name', 'category', 'aadhaar_masked', 'bank_account_number', 'bank_ifsc', 'virtual_payment_address']),
  VendorController.submitKYC
);

router.post(
  '/services',
  authenticate,
  authorize(UserRole.VENDOR),
  validateBody(['title', 'description', 'base_price', 'price_unit']),
  VendorController.addService
);

router.get(
  '/payouts',
  authenticate,
  authorize(UserRole.VENDOR),
  VendorController.getPayouts
);

export default router;
