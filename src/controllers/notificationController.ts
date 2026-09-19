import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const notifications = await NotificationService.getUserNotifications(userId, limit, offset);
      sendSuccess(res, 'Notifications fetched successfully', notifications);
    } catch (error: any) {
      sendError(res, 'Failed to fetch notifications', 500, error.message);
    }
  }

  static async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const count = await NotificationService.getUnreadCount(userId);
      sendSuccess(res, 'Unread count fetched successfully', { count });
    } catch (error: any) {
      sendError(res, 'Failed to fetch unread count', 500, error.message);
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const notification = await NotificationService.markAsRead(id, userId);
      sendSuccess(res, 'Notification marked as read', notification);
    } catch (error: any) {
      sendError(res, 'Failed to mark notification as read', 500, error.message);
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const notifications = await NotificationService.markAllAsRead(userId);
      sendSuccess(res, 'All notifications marked as read', notifications);
    } catch (error: any) {
      sendError(res, 'Failed to mark all notifications as read', 500, error.message);
    }
  }
}
