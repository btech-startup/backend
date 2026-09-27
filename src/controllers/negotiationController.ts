import { Request, Response, NextFunction } from 'express';
import { NegotiationService } from '../services/negotiationService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class NegotiationController {
  /**
   * POST /api/v1/negotiations/propose
   */
  static async propose(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NegotiationService.proposeCounterOffer(req.body);
      sendSuccess(res, 'Counter-offer submitted successfully', result, 201);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/negotiations/:booking_id
   */
  static async getByBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { booking_id } = req.params;
      const result = await NegotiationService.getByBookingId(booking_id);
      sendSuccess(res, 'Negotiation history retrieved', result);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/negotiations/:id/accept
   */
  static async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const actorRole = req.user?.role;
      const result = await NegotiationService.acceptOffer(id, actorRole);
      sendSuccess(res, 'Offer accepted and deal locked', result);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/negotiations/:id/counter
   */
  static async counter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await NegotiationService.counterOffer(id, req.body);
      sendSuccess(res, 'Counter-offer submitted', result, 201);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/negotiations/:id/reject
   */
  static async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const actorRole = req.user?.role;
      const remarks = req.body?.remarks;
      const result = await NegotiationService.rejectOffer(id, actorRole, remarks);
      sendSuccess(res, 'Offer rejected', result);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.message, error.statusCode);
        return;
      }
      next(error);
    }
  }
}
