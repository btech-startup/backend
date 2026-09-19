import { Request, Response, NextFunction } from 'express';
import { CheckinService } from '../services/checkinService';
import { sendSuccess } from '../utils/apiResponse';

export class CheckinController {
  static async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CheckinService.verifyGeofencedOTP(req.body);
      sendSuccess(res, 'Geofenced OTP venue check-in verified', result);
    } catch (error) {
      next(error);
    }
  }
}
