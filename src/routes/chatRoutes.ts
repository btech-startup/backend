import { Router } from 'express';
import { ChatController } from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = Router();

router.post(
  '/sanitize',
  authenticate,
  validateBody(['receiverId', 'message']),
  ChatController.sanitize
);

export default router;
