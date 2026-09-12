import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/bookingService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class BookingController {
  static async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!.id;
      const result = await BookingService.checkout({
        client_id: clientId,
        ...req.body,
      });
      sendSuccess(res, 'Booking created and advance funded in escrow', result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!.id;
      const bookings = await BookingService.getClientBookings(clientId);
      sendSuccess(res, 'Client bookings retrieved', bookings);
    } catch (error) {
      next(error);
    }
  }
}
