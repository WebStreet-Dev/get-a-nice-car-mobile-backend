import { BreakdownRequest, BreakdownLocationType, BreakdownStatus } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

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
      throw new ForbiddenError('You already have an active breakdown request');
    }

    const request = await prisma.breakdownRequest.create({
      data: {
        userId,
        latitude: data.latitude,
        longitude: data.longitude,
        locationType: data.locationType,
        liveDurationMinutes: data.liveDurationMinutes,
        notes: data.notes,
        status: BreakdownStatus.PENDING,
      },
    });

    logger.info('Breakdown request created', { requestId: request.id, userId });

    return request;
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

    if (request.status !== BreakdownStatus.IN_PROGRESS && request.status !== BreakdownStatus.PENDING) {
      throw new ForbiddenError('Cannot update location for a resolved request');
    }

    if (request.locationType !== BreakdownLocationType.LIVE) {
      throw new ForbiddenError('Location updates are only allowed for LIVE requests');
    }

    // Update main location
    await prisma.breakdownRequest.update({
      where: { id: requestId },
      data: {
        latitude,
        longitude,
      },
    });

    // Create location update record
    await prisma.breakdownLocationUpdate.create({
      data: {
        breakdownRequestId: requestId,
        latitude,
        longitude,
      },
    });

    logger.info('Breakdown location updated', { requestId, userId });
  }

  /**
   * Get active breakdown request for user
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
          take: 10, // Last 10 location updates
        },
      },
    });
  }

  /**
   * Get breakdown request by ID
   */
  async getRequestById(requestId: string, userId: string): Promise<BreakdownRequest> {
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
      throw new ForbiddenError('Cannot cancel a resolved request');
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
}

export const breakdownService = new BreakdownService();
export default breakdownService;
