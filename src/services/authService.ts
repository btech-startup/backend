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
}
