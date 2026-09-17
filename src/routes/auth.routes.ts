import { Router } from 'express';
import { AuthController, sendOtpSchema, verifyOtpSchema } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: Send OTP to vendor mobile number
 *     description: |
 *       Sends a 6-digit verification code. In mock development mode, the OTP is returned directly in the response (`data.devOtp`) for instant testing.
 *       
 *       **Sample Pre-configured Vendors to test with:**
 *       - `+919876500001` - Royal Grand Decorators & Events (Bangalore)
 *       - `+919876500002` - Saffron Spice Caterers & Banquets (Mumbai)
 *       - `+919876500003` - PixelCraft Luxury Wedding Photography (Delhi)
 *       - `+919876500004` - SoundWave DJ & Stage Production (Hyderabad)
 *       - `+919876500005` - Glamour Bridal Artistry by Ananya (Bangalore)
 *       - `+919876500006` - The Grand Heritage Palace & Lawns (Jaipur)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+919876500001"
 *                 description: "Vendor phone with country code (e.g. +919876500001)"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/send-otp', validateRequest(sendOtpSchema), AuthController.sendOtp);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify mobile OTP and issue vendor JWT session
 *     description: |
 *       Verifies the OTP and returns a JWT Bearer token.
 *       For pre-configured sample vendors, you can use the devOtp returned from `/send-otp` or `123456`.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+919876500001"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login or registration successful
 */
router.post('/verify-otp', validateRequest(verifyOtpSchema), AuthController.verifyOtp);

export default router;
