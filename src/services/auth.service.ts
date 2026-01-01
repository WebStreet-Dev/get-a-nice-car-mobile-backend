import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role, AccountStatus, NotificationType, UserType } from '@prisma/client';
import prisma from './prisma.service.js';
import config from '../config/index.js';
import { AppError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js';
import { AuthTokens, TokenPayload } from '../types/index.js';
import logger from '../utils/logger.js';
import adminNotificationService from './admin-notification.service.js';
import notificationService from './notification.service.js';

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokens(user: Pick<User, 'id' | 'email' | 'role'>): AuthTokens {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as string,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Register a new user
   */
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user with PENDING status
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: Role.USER,
        accountStatus: AccountStatus.PENDING,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    logger.info('User registered', { userId: user.id, email: user.email });

    // Send notification to admins
    adminNotificationService.notifyUserRegistered({
      userId: user.id,
      userName: user.name,
      email: user.email,
    }).catch((err) => {
      logger.error('Failed to send user registration notification', { error: err });
    });

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Check account status
    if (user.accountStatus === AccountStatus.PENDING) {
      throw new AppError('Your account is pending approval. Nicecar inc will review and accept your account.', 403);
    }

    if (user.accountStatus === AccountStatus.REJECTED) {
      throw new AppError(
        user.rejectedReason || 'Your account has been rejected. Please contact support for more information.',
        403
      );
    }

    // Verify password
    const isValid = await this.comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    logger.info('User logged in', { userId: user.id, email: user.email });

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.id,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or disabled');
    }

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Delete old refresh token and store new one
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    logger.info('Token refreshed', { userId: user.id });

    return tokens;
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = this.verifyRefreshToken(refreshToken);
      await prisma.refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId: payload.id,
        },
      });
      logger.info('User logged out', { userId: payload.id });
    } catch (error) {
      // Silently fail if token is invalid
      logger.warn('Logout with invalid token');
    }
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    // Calculate expiry
    const expiresAt = new Date();
    const expiryDays = parseInt(config.jwt.refreshExpiry.replace('d', ''), 10) || 7;
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    // Clean up old refresh tokens for this user (keep only last 5)
    const tokens = await prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (tokens.length > 5) {
      const tokensToDelete = tokens.slice(5).map((t) => t.id);
      await prisma.refreshToken.deleteMany({
        where: { id: { in: tokensToDelete } },
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isValid = await this.comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    logger.info('Password changed', { userId });
  }

  /**
   * Approve user account
   */
  async approveUser(userId: string, approvedBy: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.accountStatus === AccountStatus.APPROVED) {
      throw new AppError('User is already approved');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: AccountStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy,
      },
    });

    // Send notification to user (includes push notification)
    await notificationService.createNotification({
      userId,
      title: 'Account Approved',
      message: 'Your account has been approved. You can now access all features.',
      type: NotificationType.ACCOUNT_APPROVED,
    }).catch((err) => {
      logger.error('Failed to send account approval notification', { userId, error: err });
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    logger.info('User approved', { userId, approvedBy });

    return userWithoutPassword;
  }

  /**
   * Reject user account
   */
  async rejectUser(userId: string, rejectedReason: string, rejectedBy: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.accountStatus === AccountStatus.REJECTED) {
      throw new AppError('User is already rejected');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: AccountStatus.REJECTED,
        rejectedReason,
      },
    });

    // Send notification to user (includes push notification)
    await notificationService.createNotification({
      userId,
      title: 'Account Rejected',
      message: rejectedReason || 'Your account has been rejected. Please contact support for more information.',
      type: NotificationType.ACCOUNT_REJECTED,
      data: { rejectedReason },
    }).catch((err) => {
      logger.error('Failed to send account rejection notification', { userId, error: err });
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    logger.info('User rejected', { userId, rejectedBy, rejectedReason });

    return userWithoutPassword;
  }

  /**
   * Create internal user (employee)
   */
  async createInternalUser(
    data: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: Role;
      customRoleId?: string;
    },
    createdBy: string
  ): Promise<Omit<User, 'passwordHash'>> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user with APPROVED status (internal users don't need approval)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
        accountStatus: AccountStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: createdBy,
        customRoleId: data.customRoleId,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    logger.info('Internal user created', { userId: user.id, email: user.email, createdBy });

    return userWithoutPassword;
  }
}

export const authService = new AuthService();
export default authService;




