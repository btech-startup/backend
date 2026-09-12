import { Router } from 'express';
import { FamilyContributionController } from '../controllers/familyContributionController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = Router();

router.post(
  '/invite',
  authenticate,
  validateBody(['booking_id', 'contributor_name', 'relation', 'target_amount']),
  FamilyContributionController.inviteSponsor
);

router.get('/pool/:booking_id', FamilyContributionController.getPoolStatus);

export default router;
