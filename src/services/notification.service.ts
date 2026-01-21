import { Notification, NotificationType } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

// Firebase Admin SDK (initialize if credentials are provided)
let firebaseAdmin: typeof import('firebase-admin') | null = null;

async function initializeFirebase() {
  if (config.firebase.projectId && config.firebase.privateKey && config.firebase.clientEmail) {
    try {
      firebaseAdmin = await import('firebase-admin');
      
      if (!firebaseAdmin.apps.length) {
        firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert({
            projectId: config.firebase.projectId,
            privateKey: config.firebase.privateKey,
            clientEmail: config.firebase.clientEmail,
          }),
        });
        logger.info('Firebase Admin SDK initialized');
      }
    } catch (error) {
      logger.warn('Firebase Admin SDK not initialized', { error });
    }
  } else {
    logger.warn('Firebase credentials not configured - push notifications disabled');
  }
}

// Initialize Firebase on module load
initializeFirebase();

export class NotificationService {
  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      page: number;
      limit: number;
      unreadOnly?: boolean;
    }
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const { page, limit, unreadOnly } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have access to this notification');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return result.count;
  }

  /**
   * Create a notification
   */
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    data?: Record<string, unknown>;
  }): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        data: (data.data || {}) as any,
      },
    });

    // Send push notification if user has FCM token
    // Include type in FCM data payload so client can detect appointment status changes
    await this.sendPushNotification(data.userId, {
      title: data.title,
      body: data.message,
      data: {
        ...data.data,
        type: data.type, // Include notification type in FCM data
      },
    });

    logger.info('Notification created', { notificationId: notification.id, userId: data.userId });

    return notification;
  }

  /**
   * Send push notification via FCM
   */
  async sendPushNotification(
    userId: string,
    payload: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }
  ): Promise<boolean> {
    if (!firebaseAdmin) {
      logger.debug('Firebase not initialized, skipping push notification');
      return false;
    }

    try {
      // Get user's FCM token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (!user?.fcmToken) {
        logger.debug('User has no FCM token', { userId });
        return false;
      }

      // Send notification
      await firebaseAdmin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ? Object.fromEntries(
          Object.entries(payload.data).map(([k, v]) => [k, String(v)])
        ) : undefined,
        android: {
          priority: 'high',
          notification: {
            channelId: 'high_importance_channel',
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'content-available': 1,
            },
          },
        },
      });

      logger.info('Push notification sent', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to send push notification', { userId, error });
      return false;
    }
  }

  /**
   * Send push notification to multiple users (admin only)
   */
  async sendBroadcastNotification(
    userIds: string[],
    payload: {
      title: string;
      body: string;
      type: NotificationType;
      data?: Record<string, unknown>;
    }
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        // Create notification in database
        await this.createNotification({
          userId,
          title: payload.title,
          message: payload.body,
          type: payload.type,
          data: payload.data,
        });
        sent++;
      } catch (error) {
        failed++;
        logger.error('Failed to send notification', { userId, error });
      }
    }

    return { sent, failed };
  }

  /**
   * Send notification to all users (admin only)
   */
  async sendToAllUsers(payload: {
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, unknown>;
  }): Promise<{ sent: number; failed: number }> {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    return this.sendBroadcastNotification(
      users.map((u) => u.id),
      payload
    );
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have access to this notification');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;



