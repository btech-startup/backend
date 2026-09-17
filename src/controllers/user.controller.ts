import { Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service';

export const createChatbotDealSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID format').or(z.string().min(5)),
  priceCardId: z.string().optional(),
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  clientPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Valid phone number is required'),
  clientEmail: z.string().email('Invalid email address').optional(),
  eventType: z.string().min(2, 'Event type is required (e.g. Wedding, Birthday, Corporate)'),
  eventDate: z.string().optional(),
  guestCount: z.number().int().positive().optional(),
  offeredPrice: z.number().positive('Offered price must be positive').optional(),
  userMessage: z.string().max(1000).optional(),
});

export const negotiateDealSchema = z.object({
  userMessage: z.string().min(1, 'Message cannot be empty').max(1000),
  counterOffer: z.number().positive('Counter offer must be positive').optional(),
});

export class UserController {
  /**
   * List all verified vendors with filters & search
   */
  public static async listVendors(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const city = req.query.city as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await UserService.getVendors({
        category,
        city,
        search,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        message: 'Vendors retrieved successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to retrieve vendors',
      });
    }
  }

  /**
   * Get single vendor public profile with packages, banking, & chatbot config
   */
  public static async getVendorDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const vendor = await UserService.getVendorDetail(id);

      res.status(200).json({
        success: true,
        data: vendor,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Vendor not found',
      });
    }
  }

  /**
   * Get vendor verified banking details for client settlements
   */
  public static async getVendorBanking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const banking = await UserService.getVendorBankingDetails(id);

      res.status(200).json({
        success: true,
        message: 'Vendor banking details retrieved successfully',
        data: banking,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Failed to retrieve banking details',
      });
    }
  }

  /**
   * Deal with Chatbot: Initiate an automated deal negotiation
   */
  public static async startChatbotDeal(req: Request, res: Response): Promise<void> {
    try {
      const deal = await UserService.initiateChatbotDeal(req.body);

      res.status(201).json({
        success: true,
        message: 'Chatbot deal negotiation initiated successfully',
        data: deal,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to initiate chatbot deal',
      });
    }
  }

  /**
   * Multi-turn Chatbot Negotiation: Send counter-offer or message
   */
  public static async negotiateDeal(req: Request, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const { userMessage, counterOffer } = req.body;

      const result = await UserService.negotiateChatbotDeal({
        dealId,
        userMessage,
        counterOffer,
      });

      res.status(200).json({
        success: true,
        message: 'Chatbot reply generated and deal updated',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to negotiate deal',
      });
    }
  }

  /**
   * Get Deal Details with chat history and payment breakdown
   */
  public static async getDeal(req: Request, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const deal = await UserService.getDeal(dealId);

      res.status(200).json({
        success: true,
        data: deal,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Deal not found',
      });
    }
  }

  /**
   * Get all sample vendors for instant frontend testing and configuration
   */
  public static async getSampleVendors(req: Request, res: Response): Promise<void> {
    try {
      const samples = await UserService.getSampleVendors();

      res.status(200).json({
        success: true,
        message: 'Sample vendors retrieved with configuration details and ready-to-use payloads',
        count: samples.length,
        data: samples,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to retrieve sample vendors',
      });
    }
  }
}
