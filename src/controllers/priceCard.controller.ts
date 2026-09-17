import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { PriceCardService } from '../services/priceCard.service';
import { PricingUnit } from '../types';

export const createPriceCardSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  category: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().min(0, 'Price must be a positive amount'),
  pricingUnit: z
    .nativeEnum(PricingUnit, {
      errorMap: () => ({
        message: `Pricing unit must be one of: ${Object.values(PricingUnit).join(', ')}`,
      }),
    })
    .optional(),
  inclusions: z.array(z.string()).optional(),
  terms: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const updatePriceCardSchema = createPriceCardSchema.partial();

export class PriceCardController {
  public static async createPriceCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const priceCard = await PriceCardService.createPriceCard(vendorId, req.body);

      res.status(201).json({
        success: true,
        message: 'Price card package created successfully',
        data: priceCard,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create price card',
      });
    }
  }

  public static async getVendorPriceCards(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const cards = await PriceCardService.getVendorPriceCards(vendorId);

      res.status(200).json({
        success: true,
        data: cards,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch price cards',
      });
    }
  }

  public static async getPriceCardById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { id } = req.params;
      const card = await PriceCardService.getPriceCardById(vendorId, id);

      res.status(200).json({
        success: true,
        data: card,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Price card not found',
      });
    }
  }

  public static async updatePriceCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { id } = req.params;
      const card = await PriceCardService.updatePriceCard(vendorId, id, req.body);

      res.status(200).json({
        success: true,
        message: 'Price card updated successfully',
        data: card,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update price card',
      });
    }
  }

  public static async deletePriceCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { id } = req.params;
      const result = await PriceCardService.deletePriceCard(vendorId, id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete price card',
      });
    }
  }

  public static async getPublicPriceCards(req: Request, res: Response): Promise<void> {
    try {
      const { vendorId } = req.params;
      const result = await PriceCardService.getPublicVendorPriceCards(vendorId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Failed to fetch public price cards',
      });
    }
  }
}
