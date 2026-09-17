import { Request, Response } from 'express';
import { z } from 'zod';
import { OtpService } from '../services/otp.service';

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must not exceed 15 digits')
    .regex(/^[+]?[0-9]{10,15}$/, 'Invalid phone number format. Example: +919876543210 or 9876543210'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export class AuthController {
  public static async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      const result = await OtpService.sendOtp(phone);
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          phone,
          ...(result.otp && { devOtp: result.otp }),
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send OTP',
      });
    }
  }

  public static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone, otp } = req.body;
      const result = await OtpService.verifyOtp(phone, otp);

      res.status(200).json({
        success: true,
        message: result.isNewVendor
          ? 'Registration successful. Please complete your KYC verification.'
          : 'Login successful. Welcome back to EventWave.',
        data: {
          token: result.token,
          isNewVendor: result.isNewVendor,
          vendor: result.vendor,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'OTP verification failed',
      });
    }
  }
}
