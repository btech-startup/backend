import { Request, Response, NextFunction } from 'express';
import { FoodDonationRepository } from '../repositories/foodDonationRepository.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class FoodDonationController {
  static async dispatchPickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { booking_id, estimated_meals_count, food_type } = req.body;
      const pickup = await FoodDonationRepository.createPickup({
        booking_id,
        estimated_meals_count: Number(estimated_meals_count),
        food_type,
      });
      sendSuccess(res, 'Annadanam excess food donation pickup dispatched to NGO volunteer', pickup, 201);
    } catch (error) {
      next(error);
    }
  }

  static async listPickups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pickups = await FoodDonationRepository.findAllPickups();
      sendSuccess(res, 'Annadanam pickups retrieved', pickups);
    } catch (error) {
      next(error);
    }
  }
}
