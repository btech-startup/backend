import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateBody } from '../middleware/validateMiddleware';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Traditional password/phone auth
router.post('/register', validateBody(['phone_number', 'full_name']), AuthController.register);
router.post('/login', validateBody(['phone_number']), AuthController.login);

// Unified Authentication: Login if user exists, Create new user if not exists
router.post(
  '/login-or-register',
  validateBody(['phone_number']),
  AuthController.loginOrRegister
);

// Unified OTP Authentication: Login if exists, Create if new
router.post(
  '/otp/login-or-register',
  validateBody(['phone_number', 'otp']),
  AuthController.loginOrRegisterWithOTP
);

// OTP Authentication: Send OTP (for login, register, or general phone verification)
router.post('/send-otp', validateBody(['phone_number']), AuthController.sendOTP);
router.post('/otp/send', validateBody(['phone_number']), AuthController.sendOTP);

// OTP Authentication: Verify OTP standalone
router.post('/verify-otp', validateBody(['phone_number', 'otp']), AuthController.verifyOTP);
router.post('/otp/verify', validateBody(['phone_number', 'otp']), AuthController.verifyOTP);

// OTP Authentication: Login with OTP
router.post('/login-otp', validateBody(['phone_number', 'otp']), AuthController.loginWithOTP);
router.post('/otp/login', validateBody(['phone_number', 'otp']), AuthController.loginWithOTP);
router.post('/otp/verify-login', validateBody(['phone_number', 'otp']), AuthController.loginWithOTP);

// OTP Authentication: Register with OTP
router.post(
  '/register-otp',
  validateBody(['phone_number', 'otp', 'full_name']),
  AuthController.registerWithOTP
);
router.post(
  '/otp/register',
  validateBody(['phone_number', 'otp', 'full_name']),
  AuthController.registerWithOTP
);
router.post(
  '/otp/verify-register',
  validateBody(['phone_number', 'otp', 'full_name']),
  AuthController.registerWithOTP
);

// Authenticated User Profile Endpoints (Secured via JWT Authorization Middleware)
router.get('/me', authenticate, AuthController.getMe);
router.put('/me', authenticate, AuthController.updateMe);

export default router;


