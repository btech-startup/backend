import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { VendorService } from '../services/vendor.service';
import { VendorCategory } from '../types';

export const updateVendorProfileSchema = z.object({
  ownerName: z.string().min(2).max(100).optional(),
  businessName: z.string().min(2).max(150).optional(),
  category: z
    .nativeEnum(VendorCategory, {
      errorMap: () => ({
        message: `Category must be one of: ${Object.values(VendorCategory).join(', ')}`,
      }),
    })
    .or(z.string().min(2))
    .optional(),
  email: z.string().email('Invalid email address format').optional(),
  bio: z.string().max(1000, 'Bio cannot exceed 1000 characters').optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
  profileImage: z.string().url('Profile image must be a valid URL').optional(),
  portfolioUrls: z.array(z.string().url('Each portfolio URL must be valid')).optional(),
});

export class VendorController {
  public static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const profile = await VendorService.getProfile(vendorId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to retrieve vendor profile',
      });
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const profile = await VendorService.updateProfile(vendorId, req.body);

      res.status(200).json({
        success: true,
        message: 'Vendor profile updated successfully',
        data: profile,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update vendor profile',
      });
    }
  }

  public static async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const stats = await VendorService.getDashboardStats(vendorId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch dashboard stats',
      });
    }
  }
}
