import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';
import { sendSuccess } from '../utils/apiResponse';

export class AdminController {
  static async dispatchSOS(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.dispatchSOSBackup(req.body);
      sendSuccess(res, '1-Click SOS emergency vendor replacement dispatched', result);
    } catch (error) {
      next(error);
    }
  }

  static async resolveDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { disputeId, refundAmount, notes } = req.body;
      const result = await AdminService.resolveDispute(disputeId, Number(refundAmount), notes);
      sendSuccess(res, 'Dispute tribunal resolution recorded', result);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await AdminService.getPlatformAnalytics();
      sendSuccess(res, 'Platform analytics retrieved', analytics);
    } catch (error) {
      next(error);
    }
  }

  static async getChatLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await AdminService.getChatAuditLogs();
      sendSuccess(res, 'Chat violation audit logs retrieved', logs);
    } catch (error) {
      next(error);
    }
  }
}
