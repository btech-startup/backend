import { Request, Response, NextFunction } from 'express';
import { ChatGuardService } from '../services/chatGuardService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class ChatController {
  static async sanitize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = req.user!.id;
      const { receiverId, message } = req.body;
      const result = await ChatGuardService.processMessage(senderId, receiverId, message);
      sendSuccess(res, 'Chat message processed by anti-circumvention pipeline', result);
    } catch (error) {
      next(error);
    }
  }
}
