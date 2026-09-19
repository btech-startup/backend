import { Router } from 'express';
import { MuhurthamController } from '../controllers/muhurthamController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { UserRole } from '../types/index';

const router = Router();

router.get('/upcoming', MuhurthamController.getUpcoming);
router.post('/add', authenticate, authorize(UserRole.ADMIN), MuhurthamController.addDate);

export default router;
