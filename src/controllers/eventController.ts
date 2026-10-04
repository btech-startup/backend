import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/eventService';
import { sendSuccess } from '../utils/apiResponse';

export class EventController {
  // ──────────────────────────────────────────────────────────────────────────
  // EVENT TYPE CONTROLLERS
  // ──────────────────────────────────────────────────────────────────────────

  static async createEventType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EventService.createEventType(req.body);
      sendSuccess(res, 'Event type created successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAllEventTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isActive = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
      const result = await EventService.getAllEventTypes(isActive !== undefined ? { is_active: isActive } : undefined);
      sendSuccess(res, 'Event types retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getEventTypeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EventService.getEventTypeById(req.params.id);
      sendSuccess(res, 'Event type retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateEventType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EventService.updateEventType(req.params.id, req.body);
      sendSuccess(res, 'Event type updated successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteEventType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EventService.deleteEventType(req.params.id);
      sendSuccess(res, 'Event type deleted successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // USER EVENT CONTROLLERS (Secured by JWT Authentication)
  // ──────────────────────────────────────────────────────────────────────────

  static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await EventService.createEvent(userId, req.body);
      sendSuccess(res, 'Event created successfully', result, 201);
    } catch (error: any) {
      if (error && error.errors) {
        res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors,
        });
        return;
      }
      next(error);
    }
  }

  static async getUserEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        status,
        event_date,
        from_date,
        to_date,
        city,
        location,
        min_guests,
        max_guests,
        min_budget,
        max_budget,
        search,
      } = req.query;

      const filter = {
        status: status ? String(status) : undefined,
        event_date: event_date ? String(event_date) : undefined,
        from_date: from_date ? String(from_date) : undefined,
        to_date: to_date ? String(to_date) : undefined,
        city: city ? String(city) : undefined,
        location: location ? String(location) : undefined,
        min_guests: min_guests ? Number(min_guests) : undefined,
        max_guests: max_guests ? Number(max_guests) : undefined,
        min_budget: min_budget ? Number(min_budget) : undefined,
        max_budget: max_budget ? Number(max_budget) : undefined,
        search: search ? String(search) : undefined,
      };

      const result = await EventService.getUserEvents(userId, filter);
      sendSuccess(res, `Retrieved ${result.length} customer event(s)`, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await EventService.getEventById(userId, req.params.id);
      sendSuccess(res, 'Event retrieved successfully with booking history', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await EventService.updateEvent(userId, req.params.id, req.body);
      sendSuccess(res, 'Event updated successfully', result, 200);
    } catch (error: any) {
      if (error && error.errors) {
        res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors,
        });
        return;
      }
      next(error);
    }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await EventService.deleteEvent(userId, req.params.id);
      sendSuccess(res, 'Event deleted successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BOOKING HISTORY CONTROLLERS
  // ──────────────────────────────────────────────────────────────────────────

  static async getUserBookingHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const history = await EventService.getUserBookingHistory(userId);
      sendSuccess(res, 'Customer booking history retrieved successfully', history, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getEventBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await EventService.getEventBookings(userId, req.params.id);
      sendSuccess(res, 'Event booking history retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }
}
