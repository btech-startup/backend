import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/userRepository';
import { IUser, UserRole } from '../types/index';
import { generateToken } from '../utils/jwt';

export class AuthService {
  static async register(userData: {
    phone_number: string;
    full_name: string;
    email?: string;
    password?: string;
    role?: UserRole;
  }): Promise<{ user: Omit<IUser, 'password_hash'>; token: string }> {
    const existingUser = await UserRepository.findByPhone(userData.phone_number);
    if (existingUser) {
      throw new Error('User with this phone number already exists');
    }

    const hashedPassword = userData.password
      ? await bcrypt.hash(userData.password, 10)
      : undefined;

    const newUser = await UserRepository.create({
      phone_number: userData.phone_number,
      full_name: userData.full_name,
      email: userData.email,
      password_hash: hashedPassword,
      role: userData.role || UserRole.CUSTOMER,
    });

    const token = generateToken(newUser);
    const { password_hash, ...userWithoutPassword } = newUser;

    return { user: userWithoutPassword, token };
  }

  static async login(
    phone_number: string,
    password?: string
  ): Promise<{ user: Omit<IUser, 'password_hash'>; token: string }> {
    const user = await UserRepository.findByPhone(phone_number);
    if (!user) {
      throw new Error('User not found with this phone number');
    }

    if (user.password_hash && password) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new Error('Invalid phone number or password');
      }
    }

    const token = generateToken(user);
    const { password_hash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  static async sendOTP(data: { phone_number: string; purpose?: import('../types/index').OTPPurpose }) {
    const { OTPService } = await import('./otpService');
    return OTPService.sendOTP(data);
  }

  static async verifyOTP(data: { phone_number: string; otp: string; purpose?: import('../types/index').OTPPurpose }) {
    const { OTPService } = await import('./otpService');
    return OTPService.verifyOTP(data);
  }

  static async loginWithOTP(data: { phone_number: string; otp: string }) {
    const { OTPService } = await import('./otpService');
    return OTPService.loginWithOTP(data);
  }

  static async registerWithOTP(data: {
    phone_number: string;
    otp: string;
    full_name: string;
    email?: string;
    password?: string;
    role?: UserRole;
  }) {
    const { OTPService } = await import('./otpService');
    return OTPService.registerWithOTP(data);
  }

  /**
   * Unified Authentication:
   * If account exists for phone_number -> logs in
   * If account does not exist -> automatically creates user and logs in
   */
  static async loginOrRegister(data: {
    phone_number: string;
    password?: string;
    full_name?: string;
    email?: string;
    role?: UserRole;
  }): Promise<{ is_new_user: boolean; user: Omit<IUser, 'password_hash'>; token: string }> {
    const existingUser = await UserRepository.findByPhone(data.phone_number);

    if (existingUser) {
      // Existing account -> Login
      if (existingUser.password_hash && data.password) {
        const isMatch = await bcrypt.compare(data.password, existingUser.password_hash);
        if (!isMatch) {
          throw new Error('Invalid phone number or password for existing account');
        }
      }

      const token = generateToken(existingUser);
      const { password_hash: _, ...userWithoutPassword } = existingUser;
      return { is_new_user: false, user: userWithoutPassword, token };
    }

    // New account -> Register
    const fallbackName = data.full_name?.trim() || `User-${data.phone_number.slice(-4)}`;
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const newUser = await UserRepository.create({
      phone_number: data.phone_number,
      full_name: fallbackName,
      email: data.email,
      password_hash: hashedPassword,
      role: data.role || UserRole.CUSTOMER,
    });

    const token = generateToken(newUser);
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return { is_new_user: true, user: userWithoutPassword, token };
  }

  /**
   * Seamless OTP Authentication:
   * Verifies OTP, then if user exists -> logs in, otherwise creates user and logs in
   */
  static async loginOrRegisterWithOTP(data: {
    phone_number: string;
    otp: string;
    full_name?: string;
    email?: string;
    role?: UserRole;
  }): Promise<{ is_new_user: boolean; user: Omit<IUser, 'password_hash'>; token: string }> {
    const { OTPService } = await import('./otpService');

    // 1. Verify OTP code
    await OTPService.verifyOTP({
      phone_number: data.phone_number,
      otp: data.otp,
      purpose: 'general',
    });

    const existingUser = await UserRepository.findByPhone(data.phone_number);

    if (existingUser) {
      const token = generateToken(existingUser);
      const { password_hash: _, ...userWithoutPassword } = existingUser;
      return { is_new_user: false, user: userWithoutPassword, token };
    }

    // Register new user
    const fallbackName = data.full_name?.trim() || `User-${data.phone_number.slice(-4)}`;
    const newUser = await UserRepository.create({
      phone_number: data.phone_number,
      full_name: fallbackName,
      email: data.email,
      role: data.role || UserRole.CUSTOMER,
    });

    const token = generateToken(newUser);
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return { is_new_user: true, user: userWithoutPassword, token };
  }

  static async getProfile(userId: string): Promise<Omit<IUser, 'password_hash'> | null> {
    const user = await UserRepository.findById(userId);
    if (!user) return null;
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateProfile(
    userId: string,
    data: { full_name?: string; email?: string }
  ): Promise<Omit<IUser, 'password_hash'> | null> {
    const updated = await UserRepository.update(userId, data);
    if (!updated) return null;
    const { password_hash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}


