import { Router } from 'express';
import { EscrowMilestonesController } from '../controllers/escrowMilestonesController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// 1. Get milestones for a booking
router.get('/milestones/:booking_id', EscrowMilestonesController.getMilestones);

// 2. Client approves deliverables and releases Milestone 3 (30%)
router.post('/milestones/:booking_id/approve-delivery', EscrowMilestonesController.approveDelivery);

// 3. Get double-entry escrow ledger audit trail
router.get('/ledger/:booking_id', EscrowMilestonesController.getLedger);

export default router;
