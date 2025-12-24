import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  updateProfileSchema,
  updateFcmTokenSchema,
} from '../validators/user.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', userController.getProfile.bind(userController));

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/me',
  validate(updateProfileSchema),
  userController.updateProfile.bind(userController)
);

/**
 * @route   PUT /api/v1/users/me/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
router.put(
  '/me/fcm-token',
  validate(updateFcmTokenSchema),
  userController.updateFcmToken.bind(userController)
);

/**
 * @route   DELETE /api/v1/users/me/fcm-token
 * @desc    Remove FCM token
 * @access  Private
 */
router.delete(
  '/me/fcm-token',
  userController.removeFcmToken.bind(userController)
);

export default router;



