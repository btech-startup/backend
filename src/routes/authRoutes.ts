import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = Router();

router.post('/register', validateBody(['phone_number', 'full_name']), AuthController.register);
router.post('/login', validateBody(['phone_number']), AuthController.login);

export default router;
