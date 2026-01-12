import { BreakdownRequest, BreakdownStatus, BreakdownLocationType, NotificationType } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError, AppError, ForbiddenError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import adminNotificationService from './admin-notification.service.js';
import notificationService from './notification.service.js';

export class BreakdownService {
  /**
   * Create a new breakdown request
   */
  async createBreakdownRequest(
    userId: string,
    data: {
      latitude: number;
      longitude: number;
      locationType: BreakdownLocationType;
      liveDurationMinutes?: number;
      notes?: string;
    }
  ): Promise<BreakdownRequest> {
    // Check if user has an active breakdown request
    const activeRequest = await prisma.breakdownRequest.findFirst({
      where: {
        userId,
        status: {
          in: [BreakdownStatus.PENDING, BreakdownStatus.IN_PROGRESS],
        },
      },
    });

    if (activeRequest) {
      throw new AppError('You already have an active breakdown request');
    }

    // Validate live duration if location type is LIVE
    if (data.locationType === BreakdownLocationType.LIVE && !data.liveDurationMinutes) {
      throw new AppError('Live duration is required for live location sharing');
    }

    const breakdownRequest = await prisma.breakdownRequest.create({
      data: {
        userId,
        latitude: data.latitude,
        longitude: data.longitude,
        locationType: data.locationType,
        liveDurationMinutes: data.liveDurationMinutes,
        notes: data.notes,
        status: BreakdownStatus.PENDING,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    logger.info('Breakdown request created', { requestId: breakdownRequest.id, userId });

    // Send notification to admins
    adminNotificationService.notifyBreakdownRequest({
      requestId: breakdownRequest.id,
      userName: breakdownRequest.user.name,
      latitude: data.latitude,
      longitude: data.longitude,
    }).catch((err) => {
      logger.error('Failed to send breakdown notification', { error: err });
    });

    return breakdownRequest;
  }

  /**
   * Update location for a live breakdown request
   */
  async updateLocation(
    requestId: string,
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    const request = await prisma.breakdownRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Breakdown request');
    }

    if (request.userId !== userId) {
      throw new ForbiddenError('You do not have access to this breakdown request');
    }

    if (request.locationType !== BreakdownLocationType.LIVE) {
      throw new AppError('Location updates are only allowed for live location sharing');
    }

    if (request.status === BreakdownStatus.RESOLVED) {
      throw new AppError('Cannot update location for resolved requests');
    }

    // Add location update
    await prisma.breakdownLocationUpdate.create({
      data: {
        breakdownRequestId: requestId,
        latitude,
        longitude,
      },
    });

    // Update main request location
    await prisma.breakdownRequest.update({
      where: { id: requestId },
      data: {
        latitude,
        longitude,
      },
    });

    logger.info('Breakdown location updated', { requestId });
  }

  /**
   * Get active breakdown request for a user
   */
  async getActiveRequest(userId: string): Promise<BreakdownRequest | null> {
    return prisma.breakdownRequest.findFirst({
      where: {
        userId,
        status: {
          in: [BreakdownStatus.PENDING, BreakdownStatus.IN_PROGRESS],
        },
      },
      include: {
        locationUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  /**
   * Get breakdown request by ID
   */
  async getRequestById(
    requestId: string,
    userId: string
  ): Promise<BreakdownRequest> {
    const request = await prisma.breakdownRequest.findUnique({
      where: { id: requestId },
      include: {
        locationUpdates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Breakdown request');
    }

    if (request.userId !== userId) {
      throw new ForbiddenError('You do not have access to this breakdown request');
    }

    return request;
  }

  /**
   * Cancel a breakdown request
   */
  async cancelRequest(requestId: string, userId: string): Promise<BreakdownRequest> {
    const request = await prisma.breakdownRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Breakdown request');
    }

    if (request.userId !== userId) {
      throw new ForbiddenError('You do not have access to this breakdown request');
    }

    if (request.status === BreakdownStatus.RESOLVED) {
      throw new AppError('Cannot cancel a resolved request');
    }

    const updatedRequest = await prisma.breakdownRequest.update({
      where: { id: requestId },
      data: {
        status: BreakdownStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });

    logger.info('Breakdown request cancelled', { requestId, userId });

    return updatedRequest;
  }

  /**
   * Get all breakdown requests (admin only)
   */
  async getAllRequests(options: {
    page: number;
    limit: number;
    status?: BreakdownStatus;
  }): Promise<{ requests: BreakdownRequest[]; total: number }> {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [requests, total] = await Promise.all([
      prisma.breakdownRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          locationUpdates: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.breakdownRequest.count({ where }),
    ]);

    return { requests, total };
  }

  /**
   * Update breakdown request status (admin only)
   */
  async updateRequestStatus(
    requestId: string,
    status: BreakdownStatus,
    assignedTo?: string
  ): Promise<BreakdownRequest> {
    const request = await prisma.breakdownRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Breakdown request');
    }

    const updatedRequest = await prisma.breakdownRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(status === BreakdownStatus.RESOLVED && { resolvedAt: new Date() }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    logger.info('Breakdown request status updated', { requestId, status });

    // Send notification to user when status changes
    if (status === BreakdownStatus.IN_PROGRESS) {
      // Breakdown assigned/accepted
      await notificationService.createNotification({
        userId: request.userId,
        title: 'Breakdown Request Accepted',
        message: 'Your breakdown request has been accepted and help is on the way.',
        type: NotificationType.SERVICE,
        data: {
          requestId: request.id,
          status: 'IN_PROGRESS',
        },
      }).catch((err) => {
        logger.error('Failed to send breakdown acceptance notification', { error: err });
      });

      // Notify admin that breakdown was assigned
      if (assignedTo) {
        adminNotificationService.notifyBreakdownAssigned({
          requestId: request.id,
          userName: request.user.name,
          assignedTo,
        }).catch((err) => {
          logger.error('Failed to send breakdown assignment notification', { error: err });
        });
      }
    } else if (status === BreakdownStatus.RESOLVED) {
      // Breakdown resolved
      await notificationService.createNotification({
        userId: request.userId,
        title: 'Breakdown Resolved',
        message: 'Your breakdown request has been resolved.',
        type: NotificationType.SERVICE,
        data: {
          requestId: request.id,
          status: 'RESOLVED',
        },
      }).catch((err) => {
        logger.error('Failed to send breakdown resolution notification', { error: err });
      });
    }

    return updatedRequest;
  }

  /**
   * Approve breakdown request (admin only) - moves from PENDING to IN_PROGRESS
   */
  async approveBreakdown(requestId: string, assignedTo?: string): Promise<BreakdownRequest> {
    return this.updateRequestStatus(requestId, BreakdownStatus.IN_PROGRESS, assignedTo);
  }

  /**
   * Reject breakdown request (admin only) - marks as RESOLVED with rejection
   */
  async rejectBreakdown(requestId: string): Promise<BreakdownRequest> {
    const request = await prisma.breakdownRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Breakdown request');
    }

    if (request.status !== BreakdownStatus.PENDING) {
      throw new AppError('Only pending breakdown requests can be rejected');
    }

    const updatedRequest = await prisma.breakdownRequest.update({
      where: { id: requestId },
      data: {
        status: BreakdownStatus.RESOLVED,
        resolvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Send notification to user
    await notificationService.createNotification({
      userId: request.userId,
      title: 'Breakdown Request Rejected',
      message: 'Your breakdown request has been rejected. Please contact support for assistance.',
      type: NotificationType.SERVICE,
      data: {
        requestId: request.id,
        status: 'RESOLVED',
      },
    }).catch((err) => {
      logger.error('Failed to send breakdown rejection notification', { error: err });
    });

    logger.info('Breakdown request rejected', { requestId });

    return updatedRequest;
  }
}

export const breakdownService = new BreakdownService();
export default breakdownService;




