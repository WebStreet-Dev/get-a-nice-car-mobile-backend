import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordWithCodeSchema,
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
 * @route   GET /api/v1/auth/login
 * @desc    Return 405 - login requires POST (avoids "route not found" when OPTIONS is proxied as GET or link is opened)
 */
router.get('/login', (_req, res) => {
  res.status(405).json({
    success: false,
    error: 'Method not allowed. Use POST to log in.',
  });
});

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
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset (sends 6-digit code to email)
 * @access  Public
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController)
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with email + 6-digit code
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(resetPasswordWithCodeSchema),
  authController.resetPassword.bind(authController)
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








