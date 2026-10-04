import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess } from '../utils/apiResponse';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone_number, full_name, email, password, role } = req.body;
      const result = await AuthService.register({ phone_number, full_name, email, password, role });
      sendSuccess(res, 'User registered successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone_number, password } = req.body;
      const result = await AuthService.login(phone_number, password);
      sendSuccess(res, 'User logged in successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone_number, purpose } = req.body;
      const result = await AuthService.sendOTP({ phone_number, purpose });
      sendSuccess(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone_number, otp, purpose } = req.body;
      const result = await AuthService.verifyOTP({ phone_number, otp, purpose });
      sendSuccess(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async loginWithOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone_number, otp } = req.body;
      const result = await AuthService.loginWithOTP({ phone_number, otp });
      sendSuccess(res, 'User logged in successfully via OTP', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async registerWithOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone_number, otp, full_name, email, password, role } = req.body;
      const result = await AuthService.registerWithOTP({
        phone_number,
        otp,
        full_name,
        email,
        password,
        role,
      });
      sendSuccess(res, 'User registered and verified successfully via OTP', result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async loginOrRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone_number, password, full_name, email, role } = req.body;
      const result = await AuthService.loginOrRegister({
        phone_number,
        password,
        full_name,
        email,
        role,
      });
      const message = result.is_new_user
        ? 'New user account created and authenticated successfully'
        : 'Existing user account logged in successfully';
      const statusCode = result.is_new_user ? 201 : 200;
      sendSuccess(res, message, result, statusCode);
    } catch (error) {
      next(error);
    }
  }

  static async loginOrRegisterWithOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone_number, otp, full_name, email, role } = req.body;
      const result = await AuthService.loginOrRegisterWithOTP({
        phone_number,
        otp,
        full_name,
        email,
        role,
      });
      const message = result.is_new_user
        ? 'New user account created and verified via OTP'
        : 'Existing user account authenticated via OTP';
      const statusCode = result.is_new_user ? 201 : 200;
      sendSuccess(res, message, result, statusCode);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const user = await AuthService.getProfile(req.user.id);
      sendSuccess(res, 'User profile fetched successfully', user || req.user, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { full_name, email } = req.body;
      const updated = await AuthService.updateProfile(req.user.id, { full_name, email });
      sendSuccess(res, 'User profile updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }
}


