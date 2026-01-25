import { AdminNotification, AdminNotificationType, Role } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';
import webSocketService from './websocket.service.js';

// Firebase admin for push notifications
let firebaseAdmin: typeof import('firebase-admin') | null = null;

// Initialize Firebase Admin SDK at module load (eager initialization)
async function initializeFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;

  try {
    const admin = await import('firebase-admin');
    
    // Check if Firebase is already initialized
    if (admin.default.apps.length > 0) {
      firebaseAdmin = admin.default;
      logger.info('Firebase Admin SDK already initialized, reusing existing instance');
      return firebaseAdmin;
    }

    // Check if credentials are configured
    const hasProjectId = !!config.firebase.projectId;
    const hasPrivateKey = !!config.firebase.privateKey;
    const hasClientEmail = !!config.firebase.clientEmail;
    
    logger.info('Initializing Firebase Admin SDK for admin notifications', { 
      hasProjectId, 
      hasPrivateKey, 
      hasClientEmail 
    });
    
    if (hasProjectId && hasPrivateKey && hasClientEmail) {
      admin.default.initializeApp({
        credential: admin.default.credential.cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey,
          clientEmail: config.firebase.clientEmail,
        }),
      });
      firebaseAdmin = admin.default;
      logger.info('Firebase Admin SDK initialized successfully for admin notifications', { 
        projectId: config.firebase.projectId 
      });
      return firebaseAdmin;
    } else {
      logger.warn('Firebase credentials not configured - admin push notifications disabled', {
        hasProjectId,
        hasPrivateKey: hasPrivateKey ? 'yes (length: ' + config.firebase.privateKey.length + ')' : 'no',
        hasClientEmail,
      });
      return null;
    }
  } catch (error) {
    logger.error('Firebase Admin SDK initialization failed', { error });
    return null;
  }
}

// Get Firebase Admin instance (returns already initialized instance)
function getFirebaseAdmin() {
  return firebaseAdmin;
}

// Initialize Firebase on module load
initializeFirebaseAdmin().catch((error) => {
  logger.error('Failed to initialize Firebase Admin SDK at startup', { error });
});

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
    logger.info('Creating admin notification', {
      type: data.type,
      title: data.title,
      sendPush: data.sendPush !== false,
    });

    const notification = await prisma.adminNotification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        data: (data.data || null) as any,
      },
    });

    logger.info('Admin notification created in database', { 
      notificationId: notification.id, 
      type: data.type,
      createdAt: notification.createdAt.toISOString(),
    });

    // Emit WebSocket notification to connected admins
    try {
      webSocketService.emitAdminNotification({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data as Record<string, unknown> | undefined,
        createdAt: notification.createdAt.toISOString(),
      });
      logger.info('Admin notification emitted via WebSocket', {
        notificationId: notification.id,
        connectedAdmins: webSocketService.getConnectedAdminsCount(),
      });
    } catch (error) {
      logger.error('Failed to emit WebSocket notification', {
        notificationId: notification.id,
        error,
      });
      // Don't fail notification creation if WebSocket fails
    }

    // Send push notification to all admins
    if (data.sendPush !== false) {
      try {
        await this.sendPushToAdmins(data.title, data.message, data.data);
        logger.info('Push notification process completed', {
          notificationId: notification.id,
          type: data.type,
        });
      } catch (error) {
        logger.error('Failed to send push notification', {
          notificationId: notification.id,
          error,
        });
        // Don't fail notification creation if push fails
      }
    } else {
      logger.info('Push notification skipped (sendPush=false)', {
        notificationId: notification.id,
      });
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
      logger.info('Attempting to send push notification to admins', { title, body });
      
      // Ensure Firebase is initialized (should already be initialized at startup)
      if (!firebaseAdmin) {
        await initializeFirebaseAdmin();
      }
      
      const firebase = getFirebaseAdmin();
      if (!firebase) {
        logger.warn('Firebase not initialized, skipping push notification. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars.');
        return;
      }

      // Get all admin and super admin FCM tokens
      const admins = await prisma.user.findMany({
        where: {
          role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
          fcmToken: { not: null },
          isActive: true,
        },
        select: { fcmToken: true, email: true, role: true },
      });

      logger.info('Found admins for push notification', { 
        count: admins.length,
        admins: admins.map(a => ({ email: a.email, role: a.role, hasToken: !!a.fcmToken }))
      });

      const tokens = admins
        .map((admin) => admin.fcmToken)
        .filter((token): token is string => token !== null);

      if (tokens.length === 0) {
        logger.warn('No admin FCM tokens found - admins need to login from the mobile app first');
        return;
      }
      
      logger.info('Sending FCM to tokens', { tokenCount: tokens.length });

      const message = {
        notification: { title, body },
        data: data ? Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ) : undefined,
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'high_importance_channel',
            sound: 'default',
            priority: 'high' as const,
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
        tokens,
      };

      const response = await firebase.messaging().sendEachForMulticast(message);
      
      logger.info('Admin push notification delivery status', {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: tokens.length,
        adminEmails: admins.map(a => a.email),
      });

      // Log detailed failure information
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        const failureDetails: Array<{ token: string; error: string }> = [];
        
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            failureDetails.push({
              token: tokens[idx].substring(0, 20) + '...',
              error: resp.error?.message || 'Unknown error',
            });
          }
        });

        logger.warn('Some push notifications failed', {
          failedCount: failedTokens.length,
          failures: failureDetails,
        });

        // Remove invalid tokens from database
        if (failedTokens.length > 0) {
          await prisma.user.updateMany({
            where: { fcmToken: { in: failedTokens } },
            data: { fcmToken: null },
          });
          logger.info('Removed invalid FCM tokens from database', { count: failedTokens.length });
        }
      }

      // Log successful deliveries
      if (response.successCount > 0) {
        logger.info('Push notifications successfully delivered to admins', {
          count: response.successCount,
          adminEmails: admins.slice(0, response.successCount).map(a => a.email),
        });
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




