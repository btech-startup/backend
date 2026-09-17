import { Router } from 'express';
import {
  KycController,
  sendAadhaarOtpSchema,
  verifyAadhaarSchema,
  verifyBankSchema,
  verifyPanSchema,
} from '../controllers/kyc.controller';
import { authenticateVendor } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

// All KYC routes require vendor JWT authentication
router.use(authenticateVendor);

/**
 * @swagger
 * /api/v1/vendor/kyc/aadhaar/send-otp:
 *   post:
 *     summary: Initiate Aadhaar OTP verification
 *     security:
 *       - bearerAuth: []
 *     tags: [KYC Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [aadhaarNumber]
 *             properties:
 *               aadhaarNumber:
 *                 type: string
 *                 example: "998877665544"
 *                 description: "12-digit Indian Aadhaar number"
 *     responses:
 *       200:
 *         description: Aadhaar OTP dispatched successfully
 */
router.post(
  '/aadhaar/send-otp',
  validateRequest(sendAadhaarOtpSchema),
  KycController.sendAadhaarOtp
);

/**
 * @swagger
 * /api/v1/vendor/kyc/aadhaar/verify-otp:
 *   post:
 *     summary: Verify Aadhaar OTP and complete Aadhaar KYC
 *     security:
 *       - bearerAuth: []
 *     tags: [KYC Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [aadhaarNumber, otp]
 *             properties:
 *               aadhaarNumber:
 *                 type: string
 *                 example: "998877665544"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               fullName:
 *                 type: string
 *                 example: "Vikram Sharma"
 *     responses:
 *       200:
 *         description: Aadhaar verified successfully and masked
 */
router.post(
  '/aadhaar/verify-otp',
  validateRequest(verifyAadhaarSchema),
  KycController.verifyAadhaar
);

/**
 * @swagger
 * /api/v1/vendor/kyc/pan/verify:
 *   post:
 *     summary: Verify Indian PAN card details
 *     security:
 *       - bearerAuth: []
 *     tags: [KYC Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [panNumber, panHolderName]
 *             properties:
 *               panNumber:
 *                 type: string
 *                 example: "ABCDE1234F"
 *                 description: "10-character PAN format (5 letters, 4 digits, 1 letter)"
 *               panHolderName:
 *                 type: string
 *                 example: "Vikram Sharma"
 *     responses:
 *       200:
 *         description: PAN card verified successfully
 */
router.post(
  '/pan/verify',
  validateRequest(verifyPanSchema),
  KycController.verifyPan
);

/**
 * @swagger
 * /api/v1/vendor/kyc/bank/verify:
 *   post:
 *     summary: Verify Bank Account and IFSC code via penny drop validation
 *     security:
 *       - bearerAuth: []
 *     tags: [KYC Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountNumber, ifsc, accountHolderName]
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "9182736450192"
 *                 description: "9-18 digit bank account number"
 *               ifsc:
 *                 type: string
 *                 example: "HDFC0001234"
 *                 description: "11-character Indian IFSC code"
 *               accountHolderName:
 *                 type: string
 *                 example: "Vikram Sharma"
 *     responses:
 *       200:
 *         description: Bank account verified via penny drop validation
 */
router.post(
  '/bank/verify',
  validateRequest(verifyBankSchema),
  KycController.verifyBankAccount
);

/**
 * @swagger
 * /api/v1/vendor/kyc/status:
 *   get:
 *     summary: Get vendor KYC verification status (Aadhaar, PAN, Bank)
 *     security:
 *       - bearerAuth: []
 *     tags: [KYC Verification]
 *     responses:
 *       200:
 *         description: Current KYC verification status
 */
router.get('/status', KycController.getKycStatus);

export default router;
