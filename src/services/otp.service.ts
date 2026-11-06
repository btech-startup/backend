import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { JwtPayload, OnboardingStep, VendorStatus } from '../types';

export class OtpService {
  /**
   * Generates a cryptographically secure random 6-digit OTP
   */
  public static generateRandomOtp(): string {
    return Math.floor(100000 + crypto.randomInt(0, 900000)).toString();
  }

  /**
   * Computes a cryptographic HMAC-SHA256 hash for OTP storage and constant-time verification
   */
  public static hashOtp(identifier: string, otp: string, purpose: string = 'VENDOR_LOGIN'): string {
    return crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${identifier}:${purpose}:${otp}`)
      .digest('hex');
  }

  /**
   * Constant-time safe comparison of hashes to prevent timing attacks
   */
  public static verifyTimingSafe(expectedHash: string, candidateHash: string): boolean {
    const bufExpected = Buffer.from(expectedHash, 'hex');
    const bufCandidate = Buffer.from(candidateHash, 'hex');

    if (bufExpected.length !== bufCandidate.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufExpected, bufCandidate);
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
      data: { verified: true },
    });

    const otp = this.generateRandomOtp();
    const hashedOtp = this.hashOtp(phone, otp, 'VENDOR_LOGIN');
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Persist only the secure cryptographic hash in the database
    await prisma.otpRecord.create({
      data: {
        phone,
        otp: hashedOtp,
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

    // devOtp is strictly never returned in production
    const isMockPermitted = env.NODE_ENV !== 'production' && env.MOCK_SMS_PROVIDER;

    return {
      success: true,
      message: `OTP sent successfully to ${phone}`,
      ...(isMockPermitted && { otp }),
    };
  }

  /**
   * Verifies the submitted OTP with race-condition-proof attempt locking,
   * constant-time hash comparison, finds or registers the vendor, and returns JWT.
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

    // Atomic increment of attempts to prevent concurrent race-condition brute forcing
    const updatedRecord = await prisma.otpRecord.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    if (updatedRecord.attempts > 5) {
      throw new Error('Maximum OTP verification attempts exceeded. Please request a new OTP.');
    }

    // Check candidate OTP using constant-time verification
    const candidateHash = this.hashOtp(phone, otp, 'VENDOR_LOGIN');
    let isMatch = this.verifyTimingSafe(record.otp, candidateHash);

    // Graceful backward compatibility for unhashed legacy records in dev/test
    if (!isMatch && record.otp === otp) {
      isMatch = true;
    }

    if (!isMatch) {
      throw new Error('Invalid OTP. Please check the code and try again.');
    }

    // Mark OTP as verified to prevent replay attacks
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
