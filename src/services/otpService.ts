import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OTPRepository } from '../repositories/otpRepository';
import { UserRepository } from '../repositories/userRepository';
import { IUser, OTPPurpose, UserRole } from '../types/index';
import { generateToken } from '../utils/jwt';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class AuthError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export class OTPService {
  /**
   * Helper to normalize phone numbers (strip spaces, dashes, parentheses)
   */
  public static normalizePhoneNumber(phone: string): string {
    if (!phone) {
      throw new AuthError('Phone number is required', 400);
    }
    const trimmed = phone.trim().replace(/[\s\-\(\)]/g, '');
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      throw new AuthError('Invalid phone number: Must contain at least 10 digits', 400);
    }
    return trimmed;
  }

  /**
   * Generates and dispatches a 6-digit OTP code to the specified phone number
   */
  public static async sendOTP(data: {
    phone_number: string;
    purpose?: OTPPurpose;
  }): Promise<{
    phone_number: string;
    purpose: OTPPurpose;
    expires_in_seconds: number;
    message: string;
    otp?: string;
    user_exists: boolean;
  }> {
    const phoneNumber = this.normalizePhoneNumber(data.phone_number);
    const purpose: OTPPurpose = data.purpose || 'general';

    // Verify user status based on purpose
    const existingUser = await UserRepository.findByPhone(phoneNumber);
    const userExists = Boolean(existingUser);

    if (purpose === 'login' && !existingUser) {
      throw new AuthError(
        `No account found with phone number ${phoneNumber}. Please register first.`,
        400
      );
    }

    if (purpose === 'register' && existingUser) {
      throw new AuthError(
        `An account already exists with phone number ${phoneNumber}. Please log in.`,
        400
      );
    }

    // Invalidate prior pending OTPs for this purpose
    await OTPRepository.invalidatePendingOTPs(phoneNumber, purpose);

    // Generate cryptographic 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const expiresInSeconds = 600; // 10 minutes
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Persist OTP
    await OTPRepository.createOTP({
      phone_number: phoneNumber,
      otp_code: otpCode,
      purpose,
      expires_at: expiresAt,
    });

    logger.info(
      `📲 [SMS Dispatch Simulation] OTP for ${phoneNumber} (${purpose}): [${otpCode}] (Valid for 10m)`
    );

    return {
      phone_number: phoneNumber,
      purpose,
      expires_in_seconds: expiresInSeconds,
      message: `OTP sent successfully to ${phoneNumber}`,
      // In development / test mode, return the OTP in the payload for friction-free developer workflow
      ...(env.NODE_ENV !== 'production' && { otp: otpCode }),
      user_exists: userExists,
    };
  }

  /**
   * Verifies an OTP code for a phone number
   */
  public static async verifyOTP(data: {
    phone_number: string;
    otp: string;
    purpose?: OTPPurpose;
  }): Promise<{
    verified: boolean;
    phone_number: string;
    purpose: OTPPurpose;
    message: string;
  }> {
    const phoneNumber = this.normalizePhoneNumber(data.phone_number);
    const submittedOtp = data.otp ? data.otp.trim() : '';
    const purpose: OTPPurpose = data.purpose || 'general';

    if (!submittedOtp) {
      throw new AuthError('OTP code is required', 400);
    }

    // Dev bypass test code support for test environments
    const isDevBypass = env.NODE_ENV !== 'production' && submittedOtp === '123456';

    const otpRecord = await OTPRepository.findLatestValidOTP(phoneNumber, purpose);

    if (!otpRecord && !isDevBypass) {
      throw new AuthError(
        'No active OTP found or OTP has expired. Please request a new OTP.',
        400
      );
    }

    if (otpRecord) {
      if (otpRecord.otp_code !== submittedOtp && !isDevBypass) {
        throw new AuthError('Invalid OTP code. Please enter the correct 6-digit code.', 400);
      }
      await OTPRepository.markAsVerified(otpRecord.id);
    }

    logger.info(`✅ [OTP Verified] Successfully verified OTP for ${phoneNumber} (${purpose})`);

    return {
      verified: true,
      phone_number: phoneNumber,
      purpose,
      message: 'OTP verified successfully',
    };
  }

  /**
   * Verifies OTP and logs in the user
   */
  public static async loginWithOTP(data: {
    phone_number: string;
    otp: string;
  }): Promise<{
    user: Omit<IUser, 'password_hash'>;
    token: string;
  }> {
    const phoneNumber = this.normalizePhoneNumber(data.phone_number);

    // 1. Verify OTP for login
    await this.verifyOTP({
      phone_number: phoneNumber,
      otp: data.otp,
      purpose: 'login',
    });

    // 2. Fetch User
    const user = await UserRepository.findByPhone(phoneNumber);
    if (!user) {
      throw new AuthError(
        `User not found with phone number ${phoneNumber}. Please register.`,
        404
      );
    }

    // 3. Issue Token
    const token = generateToken(user);
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Verifies OTP and registers a new user
   */
  public static async registerWithOTP(data: {
    phone_number: string;
    otp: string;
    full_name: string;
    email?: string;
    password?: string;
    role?: UserRole;
  }): Promise<{
    user: Omit<IUser, 'password_hash'>;
    token: string;
  }> {
    const phoneNumber = this.normalizePhoneNumber(data.phone_number);

    if (!data.full_name || !data.full_name.trim()) {
      throw new AuthError('Full name is required for registration', 400);
    }

    // 1. Check if user already exists
    const existingUser = await UserRepository.findByPhone(phoneNumber);
    if (existingUser) {
      throw new AuthError(
        `User with phone number ${phoneNumber} already exists. Please log in.`,
        400
      );
    }

    // 2. Verify OTP for register
    await this.verifyOTP({
      phone_number: phoneNumber,
      otp: data.otp,
      purpose: 'register',
    });

    // 3. Hash password if provided
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    // 4. Create User
    const newUser = await UserRepository.create({
      phone_number: phoneNumber,
      full_name: data.full_name.trim(),
      email: data.email?.trim(),
      password_hash: hashedPassword,
      role: data.role || UserRole.CUSTOMER,
    });

    // 5. Issue Token
    const token = generateToken(newUser);
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      token,
    };
  }
}
