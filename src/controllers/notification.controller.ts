import { Response, NextFunction } from 'express';
import notificationService from '../services/notification.service.js';
import { sendSuccess, sendPaginated, sendNoContent } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export class NotificationController {
  /**
   * Get user's notifications
   * GET /api/v1/notifications
   */
  async getAll(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const { notifications, total, unreadCount } = await notificationService.getUserNotifications(
        req.user!.id,
        { page, limit, unreadOnly }
      );

      res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PUT /api/v1/notifications/:id/read
   */
  async markAsRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id, req.user!.id);
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/v1/notifications/read-all
   */
  async markAllAsRead(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const count = await notificationService.markAllAsRead(req.user!.id);
      sendSuccess(res, { count }, `${count} notifications marked as read`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification
   * DELETE /api/v1/notifications/:id
   */
  async delete(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await notificationService.deleteNotification(id, req.user!.id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;








