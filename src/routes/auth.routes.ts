import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forceChangePasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate(registerSchema),
  authController.register.bind(authController)
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validate(loginSchema),
  authController.login.bind(authController)
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refresh.bind(authController)
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post(
  '/logout',
  validate(refreshTokenSchema),
  authController.logout.bind(authController)
);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword.bind(authController)
);

/**
 * @route   PUT /api/v1/auth/force-change-password
 * @desc    Force change password (for first login when mustChangePassword is true)
 * @access  Private
 */
router.put(
  '/force-change-password',
  authenticate,
  validate(forceChangePasswordSchema),
  authController.forceChangePassword.bind(authController)
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.me.bind(authController)
);

/**
 * @route   DELETE /api/v1/auth/account
 * @desc    Permanently delete current user account (self-service)
 * @access  Private
 */
router.delete(
  '/account',
  authenticate,
  authController.deleteAccount.bind(authController)
);

export default router;








