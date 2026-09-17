import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { KycService } from '../services/kyc.service';

export const sendAadhaarOtpSchema = z.object({
  aadhaarNumber: z
    .string()
    .transform((val) => val.replace(/\s+/g, ''))
    .refine((val) => /^\d{12}$/.test(val), {
      message: 'Aadhaar number must be exactly 12 digits',
    }),
});

export const verifyAadhaarSchema = z.object({
  aadhaarNumber: z
    .string()
    .transform((val) => val.replace(/\s+/g, ''))
    .refine((val) => /^\d{12}$/.test(val), {
      message: 'Aadhaar number must be exactly 12 digits',
    }),
  otp: z.string().length(6, 'Aadhaar OTP must be 6 digits'),
  fullName: z.string().optional(),
});

export const verifyPanSchema = z.object({
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F)'),
  panHolderName: z.string().min(2, 'PAN holder name must be at least 2 characters'),
});

export const verifyBankSchema = z.object({
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{9,18}$/, 'Bank account number must be between 9 and 18 digits'),
  ifsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g., HDFC0001234)'),
  accountHolderName: z.string().min(2, 'Account holder name must be at least 2 characters'),
});

export class KycController {
  public static async sendAadhaarOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { aadhaarNumber } = req.body;
      const result = await KycService.sendAadhaarOtp(vendorId, aadhaarNumber);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          maskedAadhaar: KycService.maskAadhaar(aadhaarNumber),
          devOtp: result.otp,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send Aadhaar OTP',
      });
    }
  }

  public static async verifyAadhaar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { aadhaarNumber, otp, fullName } = req.body;
      const kyc = await KycService.verifyAadhaar(vendorId, aadhaarNumber, otp, fullName);

      res.status(200).json({
        success: true,
        message: 'Aadhaar successfully verified',
        data: {
          aadhaarVerified: kyc.aadhaarVerified,
          maskedAadhaar: kyc.aadhaarNumber,
          aadhaarName: kyc.aadhaarName,
          isFullyVerified: kyc.isFullyVerified,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Aadhaar verification failed',
      });
    }
  }

  public static async verifyPan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { panNumber, panHolderName } = req.body;
      const kyc = await KycService.verifyPan(vendorId, panNumber, panHolderName);

      res.status(200).json({
        success: true,
        message: 'PAN card successfully verified',
        data: {
          panVerified: kyc.panVerified,
          panNumber: kyc.panNumber,
          panHolderName: kyc.panHolderName,
          isFullyVerified: kyc.isFullyVerified,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'PAN verification failed',
      });
    }
  }

  public static async verifyBankAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { accountNumber, ifsc, accountHolderName } = req.body;
      const kyc = await KycService.verifyBankAccount(vendorId, accountNumber, ifsc, accountHolderName);

      res.status(200).json({
        success: true,
        message: 'Bank account successfully verified via penny drop validation',
        data: {
          bankVerified: kyc.bankVerified,
          maskedAccount: kyc.bankAccountNumber,
          bankIfsc: kyc.bankIfsc,
          bankName: kyc.bankName,
          accountHolderName: kyc.bankAccountName,
          isFullyVerified: kyc.isFullyVerified,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Bank account verification failed',
      });
    }
  }

  public static async getKycStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const status = await KycService.getKycStatus(vendorId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch KYC status',
      });
    }
  }
}
