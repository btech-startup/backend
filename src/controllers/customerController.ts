import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customerService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ServiceCategory } from '../types/index.js';

export class CustomerController {
  static async calculateBudgetSplit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { totalBudget, guestCount } = req.body;
      const result = CustomerService.calculateBudgetSplit(Number(totalBudget), Number(guestCount));
      sendSuccess(res, 'Reverse budget allocation computed', result);
    } catch (error) {
      next(error);
    }
  }

  static async searchVendors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.query;
      const vendors = await CustomerService.searchVendors(category as ServiceCategory);
      sendSuccess(res, 'Verified vendors retrieved', vendors);
    } catch (error) {
      next(error);
    }
  }
}
