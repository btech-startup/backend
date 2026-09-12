import { Router } from 'express';
import { MuhurthamController } from '../controllers/muhurthamController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { UserRole } from '../types/index.js';

const router = Router();

router.get('/upcoming', MuhurthamController.getUpcoming);
router.post('/add', authenticate, authorize(UserRole.ADMIN), MuhurthamController.addDate);

export default router;
