import { Request, Response, NextFunction } from 'express';
import { NegotiationService } from '../services/negotiationService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class NegotiationController {
  static async propose(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NegotiationService.proposeCounterOffer(req.body);
      sendSuccess(res, 'Counter-offer submitted', result, 201);
    } catch (error) {
      next(error);
    }
  }
}
