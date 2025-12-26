import { Response, NextFunction } from 'express';
import userService from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { UpdateProfileInput, UpdateFcmTokenInput } from '../validators/user.validator.js';

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
      await userService.updateFcmToken(req.user!.id, fcmToken);
      sendSuccess(res, null, 'FCM token updated successfully');
    } catch (error) {
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




