import { User } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import { UpdateProfileInput } from '../validators/user.validator.js';

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
      },
    });

    logger.info('User profile updated', { userId });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Update FCM token for push notifications
   */
  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    logger.info('FCM token updated', { userId });
  }

  /**
   * Remove FCM token
   */
  async removeFcmToken(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });

    logger.info('FCM token removed', { userId });
  }
}

export const userService = new UserService();
export default userService;
