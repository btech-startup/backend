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
}
