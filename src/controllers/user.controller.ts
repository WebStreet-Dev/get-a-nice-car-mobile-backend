import { Response, NextFunction } from 'express';
import userService from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { UpdateProfileInput, UpdateFcmTokenInput } from '../validators/user.validator.js';
import logger from '../utils/logger.js';

export class UserController {
  /**
   * Get current user profile
   * GET /api/v1/users/me
   */
  async getProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await userService.getUserById(req.user!.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   * PUT /api/v1/users/me
   */
  async updateProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = req.body as UpdateProfileInput;
      const user = await userService.updateProfile(req.user!.id, data);
      sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update FCM token for push notifications
   * PUT /api/v1/users/me/fcm-token
   */
  async updateFcmToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fcmToken } = req.body as UpdateFcmTokenInput;
      
      // Additional validation (validator already checks for presence, but add extra checks)
      if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.trim().length === 0) {
        return next(new Error('FCM token is required and must be a non-empty string'));
      }

      // Validate token format (FCM tokens are typically long strings)
      if (fcmToken.length < 50) {
        logger.warn('FCM token seems too short', { 
          userId: req.user!.id, 
          tokenLength: fcmToken.length 
        });
        // Don't fail, but log warning - some tokens might be shorter
      }

      logger.info('FCM token update request received', {
        userId: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        tokenLength: fcmToken.length,
        tokenPrefix: fcmToken.substring(0, 20) + '...',
      });

      await userService.updateFcmToken(req.user!.id, fcmToken);
      
      logger.info('FCM token update completed successfully', {
        userId: req.user!.id,
        email: req.user!.email,
      });
      
      sendSuccess(res, null, 'FCM token updated successfully');
    } catch (error) {
      logger.error('Failed to update FCM token', { 
        userId: req.user!.id, 
        error: error instanceof Error ? error.message : error 
      });
      next(error);
    }
  }

  /**
   * Remove FCM token (for logout)
   * DELETE /api/v1/users/me/fcm-token
   */
  async removeFcmToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await userService.removeFcmToken(req.user!.id);
      sendSuccess(res, null, 'FCM token removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
export default userController;








