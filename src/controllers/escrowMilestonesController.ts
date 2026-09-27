import { Request, Response, NextFunction } from 'express';
import { EscrowMilestonesService } from '../services/escrowMilestonesService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class EscrowMilestonesController {
  /**
   * GET /api/v1/escrow/milestones/:booking_id
   */
  public static async getMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { booking_id } = req.params;
      const result = await EscrowMilestonesService.getMilestonesByBooking(booking_id);
      sendSuccess(res, 'Booking milestones retrieved', result);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  /**
   * POST /api/v1/escrow/milestones/:booking_id/approve-delivery
   * Client approves deliverables and releases Milestone 3 (30%)
   */
  public static async approveDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { booking_id } = req.params;
      const clientId = req.user!.id;
      const notes = req.body?.notes;
      const result = await EscrowMilestonesService.approveDeliverableMilestone(
        booking_id,
        clientId,
        notes
      );
      sendSuccess(res, 'Milestone 3 approved and released', result);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  /**
   * GET /api/v1/escrow/ledger/:booking_id
   */
  public static async getLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { booking_id } = req.params;
      const result = await EscrowMilestonesService.getEscrowLedger(booking_id);
      sendSuccess(res, 'Double-entry escrow ledger retrieved', result);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}
