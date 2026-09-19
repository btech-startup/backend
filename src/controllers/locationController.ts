import { Request, Response } from 'express';
import { LocationService } from '../services/locationService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { UserRole } from '../types/index';

export class LocationController {
  static async updateLocation(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (user.role !== UserRole.VENDOR) {
         return sendError(res, 'Only vendors can update location', 403);
      }
      
      const { latitude, longitude } = req.body;
      const location = await LocationService.trackVendorLocation(user.id, latitude, longitude);
      sendSuccess(res, 'Location updated successfully', location);
    } catch (error: any) {
      sendError(res, 'Failed to update location', 500, error.message);
    }
  }

  static async getVendorLocation(req: Request, res: Response) {
    try {
      const { vendorId } = req.params;
      const location = await LocationService.getVendorLocation(vendorId);
      sendSuccess(res, 'Vendor location fetched successfully', location);
    } catch (error: any) {
      sendError(res, 'Failed to fetch vendor location', 500, error.message);
    }
  }

  static async getNearbyVendors(req: Request, res: Response) {
    try {
      const latitude = parseFloat(req.query.lat as string);
      const longitude = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string) || 10;
      const category = req.query.category as string;

      if (isNaN(latitude) || isNaN(longitude)) {
        return sendError(res, 'Valid latitude and longitude are required', 400);
      }

      const vendors = await LocationService.getNearbyVendors(latitude, longitude, radius, category);
      sendSuccess(res, 'Nearby vendors fetched successfully', vendors);
    } catch (error: any) {
      sendError(res, 'Failed to fetch nearby vendors', 500, error.message);
    }
  }

  static async getCheckinStatus(req: Request, res: Response) {
    try {
      const { bookingId } = req.params;
      const checkin = await LocationService.getBookingCheckinStatus(bookingId);
      sendSuccess(res, 'Check-in status fetched successfully', checkin);
    } catch (error: any) {
      sendError(res, 'Failed to fetch check-in status', 500, error.message);
    }
  }

  static async getCheckinHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (user.role !== UserRole.VENDOR) {
         return sendError(res, 'Only vendors can view their check-in history', 403);
      }
      const history = await LocationService.getCheckinHistory(user.id);
      sendSuccess(res, 'Check-in history fetched successfully', history);
    } catch (error: any) {
      sendError(res, 'Failed to fetch check-in history', 500, error.message);
    }
  }
}
