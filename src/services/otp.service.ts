import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { JwtPayload, OnboardingStep, VendorStatus } from '../types';

export class OtpService {
  /**
   * Generates a secure random 6-digit OTP
   */
  private static generateRandomOtp(): string {
    return Math.floor(100000 + crypto.randomInt(0, 900000)).toString();
  }

  /**
   * Sends OTP for vendor phone authentication
   */
  public static async sendOtp(phone: string): Promise<{ success: boolean; message: string; otp?: string }> {
    // Invalidate existing active OTPs for this phone and purpose
    await prisma.otpRecord.updateMany({
      where: {
        phone,
        purpose: 'VENDOR_LOGIN',
        verified: false,
      },
      data: { verified: true }, // invalidate old ones
    });

    // In dev mode or mock mode, generate standard or random OTP
    const otp = this.generateRandomOtp();
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpRecord.create({
      data: {
        phone,
        otp,
        purpose: 'VENDOR_LOGIN',
        expiresAt,
      },
    });

    console.log(`\n========================================`);
    console.log(`📲 [SMS GATEWAY SIMULATION]`);
    console.log(`To: ${phone}`);
    console.log(`Your EventWave Vendor Verification Code is: ${otp}`);
    console.log(`Valid for: ${env.OTP_EXPIRY_MINUTES} minutes`);
    console.log(`========================================\n`);

    // In mock SMS mode, we return the OTP in the response for seamless testing
    return {
      success: true,
      message: `OTP sent successfully to ${phone}`,
      ...(env.MOCK_SMS_PROVIDER && { otp }),
    };
  }

  /**
   * Verifies the submitted OTP, finds or registers the vendor, and returns JWT
   */
  public static async verifyOtp(
    phone: string,
    otp: string
  ): Promise<{
    token: string;
    isNewVendor: boolean;
    vendor: any;
  }> {
    const record = await prisma.otpRecord.findFirst({
      where: {
        phone,
        purpose: 'VENDOR_LOGIN',
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new Error('No active OTP request found for this phone number. Please request a new OTP.');
    }

    if (new Date() > record.expiresAt) {
      throw new Error('OTP has expired. Please request a new OTP.');
    }

    if (record.attempts >= 5) {
      throw new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.');
    }

    // Increment attempts
    await prisma.otpRecord.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    if (record.otp !== otp) {
      throw new Error('Invalid OTP. Please check the code and try again.');
    }

    // Mark OTP as verified
    await prisma.otpRecord.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Check if vendor already exists
    let vendor = await prisma.vendor.findUnique({
      where: { phone },
      include: { kyc: true },
    });

    let isNewVendor = false;

    if (!vendor) {
      isNewVendor = true;
      vendor = await prisma.vendor.create({
        data: {
          phone,
          status: VendorStatus.PENDING_KYC,
          onboardingStep: OnboardingStep.KYC_VERIFICATION,
          kyc: {
            create: {},
          },
        },
        include: { kyc: true },
      });
    }

    // Generate JWT Token
    const payload: JwtPayload = {
      vendorId: vendor.id,
      phone: vendor.phone,
      status: vendor.status,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    return {
      token,
      isNewVendor,
      vendor: {
        id: vendor.id,
        phone: vendor.phone,
        status: vendor.status,
        onboardingStep: vendor.onboardingStep,
        businessName: vendor.businessName,
        category: vendor.category,
        kyc: vendor.kyc,
      },
    };
  }
}
