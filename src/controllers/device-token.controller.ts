import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import logger from '../utils/logger.js';
import * as deviceTokenService from '../services/device-token.service.js';
import type { RegisterDeviceTokenInput } from '../validators/device-token.validator.js';

export class DeviceTokenController {
  /**
   * POST /api/v1/device-token
   * Register FCM token for guest devices (no auth). Enables broadcast to all app installs.
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fcmToken } = req.body as RegisterDeviceTokenInput;
      await deviceTokenService.registerDeviceToken(fcmToken);
      logger.info('Guest device token registered', {
        tokenPrefix: fcmToken.substring(0, 20) + '...',
      });
      sendSuccess(res, null, 'Device token registered');
    } catch (error) {
      next(error);
    }
  }
}

export default new DeviceTokenController();
