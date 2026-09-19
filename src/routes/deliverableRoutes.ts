import { Router } from 'express';
import { DeliverableController } from '../controllers/deliverableController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

router.post('/', DeliverableController.create);
router.post('/:id/submit', authorize(UserRole.VENDOR), DeliverableController.submit);
router.post('/:id/approve', authorize(UserRole.CUSTOMER), DeliverableController.approve);
router.post('/:id/revision', authorize(UserRole.CUSTOMER), DeliverableController.requestRevision);
router.get('/booking/:bookingId', DeliverableController.getByBooking);

export default router;
