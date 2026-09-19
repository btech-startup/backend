import { Request, Response, NextFunction } from 'express';
import { MuhurthamRepository } from '../repositories/muhurthamRepository';
import { sendSuccess } from '../utils/apiResponse';

export class MuhurthamController {
  static async getUpcoming(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dates = await MuhurthamRepository.getUpcomingAuspiciousDates();
      sendSuccess(res, 'Panchangam auspicious Muhurtham dates retrieved', dates);
    } catch (error) {
      next(error);
    }
  }

  static async addDate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { calendar_date, panchangam_event, demand_multiplier } = req.body;
      const date = await MuhurthamRepository.addDate({
        calendar_date,
        panchangam_event,
        demand_multiplier: Number(demand_multiplier),
      });
      sendSuccess(res, 'Auspicious Muhurtham date added', date, 201);
    } catch (error) {
      next(error);
    }
  }
}
