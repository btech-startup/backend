import { Request, Response, NextFunction } from 'express';
import { FamilyContributionRepository } from '../repositories/familyContributionRepository.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class FamilyContributionController {
  static async inviteSponsor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { booking_id, contributor_name, relation, target_amount } = req.body;
      const contribution = await FamilyContributionRepository.createContribution({
        booking_id,
        contributor_name,
        relation,
        target_amount: Number(target_amount),
      });

      sendSuccess(
        res,
        'Family contribution invite generated',
        {
          contribution,
          inviteLink: `https://eventwise.in/family-pool/${contribution.id}`,
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  static async getPoolStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { booking_id } = req.params;
      const contributions = await FamilyContributionRepository.findByBookingId(booking_id);
      sendSuccess(res, 'Family contribution pool status retrieved', contributions);
    } catch (error) {
      next(error);
    }
  }
}
