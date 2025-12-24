import { AdminNotification, AdminNotificationType, Role } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

// Firebase admin for push notifications
let firebaseAdmin: typeof import('firebase-admin') | null = null;

// Lazy initialize Firebase Admin
async function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;

  try {
    const admin = await import('firebase-admin');
    
    if (!admin.default.apps.length) {
      // Use config-based credentials (same as notification.service.ts)
      if (config.firebase.projectId && config.firebase.privateKey && config.firebase.clientEmail) {
        admin.default.initializeApp({
          credential: admin.default.credential.cert({
            projectId: config.firebase.projectId,
            privateKey: config.firebase.privateKey,
            clientEmail: config.firebase.clientEmail,
          }),
        });
        logger.info('Firebase Admin SDK initialized for admin notifications');
      } else {
        logger.warn('Firebase credentials not configured - admin push notifications disabled');
        return null;
      }
    }
    
    firebaseAdmin = admin.default;
    return firebaseAdmin;
  } catch (error) {
    logger.warn('Firebase Admin not available', { error });
    return null;
  }
}

export class AdminNotificationService {
  /**
   * Create an admin notification and optionally send FCM push
   */
  async create(data: {
    type: AdminNotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    sendPush?: boolean;
  }): Promise<AdminNotification> {
    const notification = await prisma.adminNotification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || null,
      },
    });

    logger.info('Admin notification created', { notificationId: notification.id, type: data.type });

    // Send push notification to all admins
    if (data.sendPush !== false) {
      await this.sendPushToAdmins(data.title, data.message, data.data);
    }

    return notification;
  }

  /**
   * Send push notification to all admin users
   */
  async sendPushToAdmins(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      const firebase = await getFirebaseAdmin();
      if (!firebase) {
        logger.warn('Firebase not initialized, skipping push notification');
        return;
      }

      // Get all admin and super admin FCM tokens
      const admins = await prisma.user.findMany({
        where: {
          role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
          fcmToken: { not: null },
          isActive: true,
        },
        select: { fcmToken: true },
      });

      const tokens = admins
        .map((admin) => admin.fcmToken)
        .filter((token): token is string => token !== null);

      if (tokens.length === 0) {
        logger.info('No admin FCM tokens found');
        return;
      }

      const message = {
        notification: { title, body },
        data: data ? Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ) : undefined,
        tokens,
      };

      const response = await firebase.messaging().sendEachForMulticast(message);
      logger.info('Admin push notification sent', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });

        if (failedTokens.length > 0) {
          await prisma.user.updateMany({
            where: { fcmToken: { in: failedTokens } },
            data: { fcmToken: null },
          });
          logger.info('Removed invalid FCM tokens', { count: failedTokens.length });
        }
      }
    } catch (error) {
      logger.error('Failed to send admin push notification', { error });
    }
  }

  /**
   * Get admin notifications with pagination
   */
  async getNotifications(options: {
    page: number;
    limit: number;
    unreadOnly?: boolean;
  }): Promise<{
    notifications: AdminNotification[];
    total: number;
    unreadCount: number;
  }> {
    const { page, limit, unreadOnly } = options;
    const skip = (page - 1) * limit;

    const where = unreadOnly ? { isRead: false } : {};

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminNotification.count({ where }),
      prisma.adminNotification.count({ where: { isRead: false } }),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<AdminNotification> {
    const notification = await prisma.adminNotification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError('Admin notification');
    }

    return prisma.adminNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    return prisma.adminNotification.count({
      where: { isRead: false },
    });
  }

  // ==================== HELPER METHODS FOR TRIGGERS ====================

  /**
   * Create notification for new breakdown request
   */
  async notifyBreakdownCreated(data: {
    requestId: string;
    userName: string;
    latitude: number;
    longitude: number;
  }): Promise<void> {
    await this.create({
      type: AdminNotificationType.BREAKDOWN,
      title: '🚗 New Breakdown Request',
      message: `${data.userName} has requested breakdown assistance`,
      data: {
        requestId: data.requestId,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      sendPush: true,
    });
  }

  /**
   * Create notification for new appointment
   */
  async notifyAppointmentCreated(data: {
    appointmentId: string;
    userName: string;
    departmentName: string;
    dateTime: Date;
  }): Promise<void> {
    await this.create({
      type: AdminNotificationType.APPOINTMENT,
      title: '📅 New Appointment Booked',
      message: `${data.userName} booked an appointment with ${data.departmentName}`,
      data: {
        appointmentId: data.appointmentId,
        department: data.departmentName,
        dateTime: data.dateTime.toISOString(),
      },
      sendPush: true,
    });
  }

  /**
   * Create notification for new user registration
   */
  async notifyUserRegistered(data: {
    userId: string;
    userName: string;
    email: string;
  }): Promise<void> {
    await this.create({
      type: AdminNotificationType.USER_REGISTERED,
      title: '👤 New Client Registered',
      message: `${data.userName} (${data.email}) has registered`,
      data: {
        userId: data.userId,
        name: data.userName,
        email: data.email,
      },
      sendPush: true,
    });
  }

  /**
   * Create notification for breakdown request
   */
  async notifyBreakdownRequest(data: {
    requestId: string;
    userName: string;
    latitude: number;
    longitude: number;
  }): Promise<void> {
    await this.notifyBreakdownCreated(data);
  }

  /**
   * Create notification when breakdown is assigned
   */
  async notifyBreakdownAssigned(data: {
    requestId: string;
    userName: string;
    assignedTo: string;
  }): Promise<void> {
    await this.create({
      type: AdminNotificationType.BREAKDOWN,
      title: '🚗 Breakdown Assigned',
      message: `Breakdown request from ${data.userName} has been assigned`,
      data: {
        requestId: data.requestId,
        assignedTo: data.assignedTo,
      },
      sendPush: true,
    });
  }
}

export const adminNotificationService = new AdminNotificationService();
export default adminNotificationService;




