import { Request, Response, NextFunction } from 'express';
import { OTPGeofenceService } from '../services/otpGeofenceService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class OTPGeofenceController {
  /**
   * POST /api/v1/checkin/verify
   * Vendor checks in on-site with GPS coordinates and Customer's 6-digit OTP
   */
  public static async verifyCheckin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OTPGeofenceService.verifyHandshake(req.body);
      sendSuccess(res, 'Venue check-in verified and Milestone 2 released', result);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }

  /**
   * GET /api/v1/checkin/otp/:booking_id
   * Customer views 6-digit OTP code to hand over to vendor
   */
  public static async getCustomerOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { booking_id } = req.params;
      const clientId = req.user!.id;
      const result = await OTPGeofenceService.getCustomerOTP(booking_id, clientId);
      sendSuccess(res, 'Customer check-in OTP code retrieved', result);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 400);
    }
  }
}
