import { Request, Response, NextFunction } from 'express';
import { CheckoutService } from '../services/checkoutService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { SlotConflictError } from '../services/redisRedlock';

export class CheckoutController {
  /**
   * POST /api/v1/checkout
   * Customer initiates slot checkout with Redis Distributed Lock
   */
  public static async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user?.id || req.body.client_id;
      if (!clientId) {
        sendError(res, 'Client authentication required for checkout', 401);
        return;
      }

      const result = await CheckoutService.executeCheckout({
        client_id: clientId,
        ...req.body,
      });

      sendSuccess(res, 'Booking created and payment initiated', result, 201);
    } catch (error: any) {
      if (error instanceof SlotConflictError || error.statusCode === 409) {
        // Return explicit HTTP 409 as required in Image 1
        res.status(409).json({
          success: false,
          statusCode: 409,
          error: 'SlotConflict',
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }
}
