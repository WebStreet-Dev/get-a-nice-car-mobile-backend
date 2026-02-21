import { Router } from 'express';
import deviceTokenController from '../controllers/device-token.controller.js';
import { validate } from '../middleware/validate.js';
import { registerDeviceTokenSchema } from '../validators/device-token.validator.js';

const router = Router();

/**
 * @route   POST /api/v1/device-token
 * @desc    Register FCM token for guest devices (no auth). Enables broadcast to all app installs.
 * @access  Public
 */
router.post(
  '/',
  validate(registerDeviceTokenSchema),
  deviceTokenController.register.bind(deviceTokenController)
);

export default router;
