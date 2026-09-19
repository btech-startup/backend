import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateBody } from '../middleware/validateMiddleware';

const router = Router();

router.post('/register', validateBody(['phone_number', 'full_name']), AuthController.register);
router.post('/login', validateBody(['phone_number']), AuthController.login);

export default router;
