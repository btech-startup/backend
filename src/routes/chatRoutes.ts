import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticate } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateMiddleware';

const router = Router();

router.post(
  '/sanitize',
  authenticate,
  validateBody(['receiverId', 'message']),
  ChatController.sanitize
);

export default router;
