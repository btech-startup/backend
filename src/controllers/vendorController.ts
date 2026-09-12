import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendorService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class VendorController {
  static async submitKYC(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const vendor = await VendorService.submitKYC(userId, req.body);
      sendSuccess(res, 'Vendor KYC submitted successfully', vendor, 201);
    } catch (error) {
      next(error);
    }
  }

  static async addService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const service = await VendorService.addCatalogService(userId, req.body);
      sendSuccess(res, 'Service added to vendor catalog', service, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getPayouts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const payouts = await VendorService.getVendorPayouts(userId);
      sendSuccess(res, 'Real-time escrow payout details retrieved', payouts);
    } catch (error) {
      next(error);
    }
  }
}
