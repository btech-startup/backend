import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CalendarService } from '../services/calendar.service';
import { CalendarSlotType } from '../types';

export const blockDatesSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must follow YYYY-MM-DD format (e.g. 2026-12-15)'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must follow YYYY-MM-DD format (e.g. 2026-12-18)')
    .optional(),
  title: z.string().max(120).optional(),
  eventType: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
  slotType: z.nativeEnum(CalendarSlotType).optional(),
});

export const verifyDateQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must follow YYYY-MM-DD format (e.g. 2026-12-15)'),
  slotType: z.nativeEnum(CalendarSlotType).optional(),
});

export class CalendarController {
  /**
   * Public: Get monthly or date-range calendar showing available vs booked dates for a vendor
   */
  public static async getVendorCalendarPublic(req: Request, res: Response): Promise<void> {
    try {
      const { vendorId } = req.params;
      const { month, startDate, endDate } = req.query;

      const result = await CalendarService.getVendorCalendar(vendorId, {
        month: month as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        isPublic: true,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch vendor calendar',
      });
    }
  }

  /**
   * Public: Verify whether a vendor is free or has an event on a specific date
   */
  public static async verifyDatePublic(req: Request, res: Response): Promise<void> {
    try {
      const { vendorId } = req.params;
      const { date, slotType } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          message: 'Date query parameter is required in YYYY-MM-DD format (e.g. 2026-12-15)',
        });
        return;
      }

      const result = await CalendarService.verifyDateAvailability(
        vendorId,
        date as string,
        (slotType as CalendarSlotType) || CalendarSlotType.FULL_DAY,
        true
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to verify date availability',
      });
    }
  }

  /**
   * Vendor (Protected): Get vendor's full calendar schedule including private client details
   */
  public static async getVendorCalendarProtected(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { month, startDate, endDate } = req.query;

      const result = await CalendarService.getVendorCalendar(vendorId, {
        month: month as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        isPublic: false,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch your calendar schedule',
      });
    }
  }

  /**
   * Vendor (Protected): Manually block date(s) on calendar
   */
  public static async blockDatesProtected(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const result = await CalendarService.blockDates(vendorId, req.body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to block dates on calendar',
      });
    }
  }

  /**
   * Vendor (Protected): Unblock date on calendar
   */
  public static async unblockDateProtected(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { id } = req.params;

      const result = await CalendarService.unblockDate(vendorId, id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to unblock date',
      });
    }
  }

  /**
   * Vendor (Protected): Quick verify date availability
   */
  public static async verifyDateProtected(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const vendorId = req.vendorId!;
      const { date, slotType } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          message: 'Date query parameter is required in YYYY-MM-DD format (e.g. 2026-12-15)',
        });
        return;
      }

      const result = await CalendarService.verifyDateAvailability(
        vendorId,
        date as string,
        (slotType as CalendarSlotType) || CalendarSlotType.FULL_DAY,
        false
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to verify date availability',
      });
    }
  }
}
