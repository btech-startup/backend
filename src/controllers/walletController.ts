import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { WalletService } from '../services/walletService';

export class WalletController {
  static async getBalance(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const wallet = await WalletService.getBalance(userId);
      return sendSuccess(res, 'Wallet balance retrieved successfully', wallet);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve balance', 500, error);
    }
  }

  static async creditBalance(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { amount, description, bookingId } = req.body;
      const wallet = await WalletService.creditWallet(userId, amount, description, bookingId);
      return sendSuccess(res, 'Wallet credited successfully', wallet);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to credit wallet', 500, error);
    }
  }

  static async withdrawFunds(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { amount } = req.body;
      const wallet = await WalletService.withdrawFunds(userId, amount);
      return sendSuccess(res, 'Funds withdrawn successfully', wallet);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to withdraw funds', 500, error);
    }
  }

  static async getTransactions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const transactions = await WalletService.getTransactionHistory(userId);
      return sendSuccess(res, 'Transactions retrieved successfully', transactions);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve transactions', 500, error);
    }
  }
}
