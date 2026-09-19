import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types/index';
import { validateBody } from '../middleware/validateMiddleware';

const router = Router();

router.post(
  '/sos/dispatch',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPS_AGENT),
  validateBody(['original_booking_id', 'replacement_vendor_id', 'surge_bonus_percentage', 'reason']),
  AdminController.dispatchSOS
);

router.post(
  '/disputes/resolve',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPS_AGENT),
  validateBody(['disputeId', 'refundAmount', 'notes']),
  AdminController.resolveDispute
);

router.get(
  '/analytics',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPS_AGENT),
  AdminController.getAnalytics
);

router.get(
  '/chat-violations',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.OPS_AGENT),
  AdminController.getChatLogs
);

export default router;
