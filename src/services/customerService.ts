import { VendorRepository } from '../repositories/vendorRepository';
import { ServiceCategory } from '../types/index';

export class CustomerService {
  /**
   * Reverse Budget Splitter (v2.0 Middle-Class Heuristics):
   * Catering (40%), Venue (25%), Photography (15%), Decor/Sound (10%),
   * Purohit & Samagri Kit (5%), Contingency Buffer & Annadanam (5%)
   */
  static calculateBudgetSplit(totalBudget: number, guestCount: number) {
    return {
      totalBudget,
      guestCount,
      allocation: {
        catering: Math.round(totalBudget * 0.40),
        venue: Math.round(totalBudget * 0.25),
        photography: Math.round(totalBudget * 0.15),
        decorSound: Math.round(totalBudget * 0.10),
        purohitSamagri: Math.round(totalBudget * 0.05),
        contingencyAnnadanam: Math.round(totalBudget * 0.05),
      },
      perPlateBudget: Math.round((totalBudget * 0.40) / (guestCount || 1)),
    };
  }

  static async searchVendors(category?: ServiceCategory) {
    return VendorRepository.findAll(category);
  }
}
