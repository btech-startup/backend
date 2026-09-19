import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/bookingService';
import { sendSuccess, sendError } from '../utils/apiResponse';

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

  /**
   * GET /bookings/:id - Full booking details with vendor, milestones, checkin, deliverables, escrow
   */
  static async getBookingDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const details = await BookingService.getBookingDetails(id);
      sendSuccess(res, 'Booking details retrieved', details);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /bookings/vendor-bookings - Vendor's received bookings
   */
  static async getVendorBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const bookings = await BookingService.getVendorBookings(userId);
      sendSuccess(res, 'Vendor bookings retrieved', bookings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /bookings/:id/cancel - Cancel a booking
   */
  static async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const result = await BookingService.cancelBooking(id, userId);
      sendSuccess(res, 'Booking cancellation processed', result);
    } catch (error) {
      next(error);
    }
  }
}
