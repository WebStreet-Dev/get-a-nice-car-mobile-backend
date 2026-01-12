import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from '../validators/auth.validator.js';
import { AuthRequest } from '../types/index.js';

export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(
    req: Request<unknown, unknown, RegisterInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, phone, password } = req.body;

      const result = await authService.register({
        name,
        email,
        phone,
        password,
      });

      sendCreated(res, result, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(
    req: Request<unknown, unknown, LoginInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refresh(
    req: Request<unknown, unknown, RefreshTokenInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const tokens = await authService.refreshToken(refreshToken);

      sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(
    req: Request<unknown, unknown, RefreshTokenInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;

      await authService.logout(refreshToken);

      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * PUT /api/v1/auth/change-password
   */
  async changePassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body as ChangePasswordInput;
      const userId = req.user!.id;

      await authService.changePassword(userId, currentPassword, newPassword);

      sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user info
   * GET /api/v1/auth/me
   */
  async me(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await authService.getUserById(req.user!.id);

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;








