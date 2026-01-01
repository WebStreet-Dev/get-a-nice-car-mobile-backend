import { User, Role, AccountStatus } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError, AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id },
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
    data: { name?: string; phone?: string }
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    logger.info('User profile updated', { userId });

    return userWithoutPassword;
  }

  /**
   * Update FCM token for push notifications
   */
  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    logger.info('FCM token updated', { userId });
  }

  /**
   * Remove FCM token (for logout)
   */
  async removeFcmToken(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });

    logger.info('FCM token removed', { userId });
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{
    users: Omit<User, 'passwordHash'>[];
    total: number;
  }> {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithoutPassword = users.map((user) => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return { users: usersWithoutPassword, total };
  }

  /**
   * Get all clients (admin only)
   */
  async getAllClients(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{
    clients: Omit<User, 'passwordHash'>[];
    total: number;
  }> {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;

    const where = {
      userType: 'CLIENT' as const,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const clientsWithoutPassword = clients.map((client) => {
      const { passwordHash: _, ...clientWithoutPassword } = client;
      return clientWithoutPassword;
    });

    return { clients: clientsWithoutPassword, total };
  }

  /**
   * Get all employees (admin only)
   */
  async getAllEmployees(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{
    employees: Omit<User, 'passwordHash'>[];
    total: number;
  }> {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;

    const where = {
      userType: 'EMPLOYEE' as const,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const employeesWithoutPassword = employees.map((employee) => {
      const { passwordHash: _, ...employeeWithoutPassword } = employee;
      return employeeWithoutPassword;
    });

    return { employees: employeesWithoutPassword, total };
  }

  /**
   * Toggle user active status (admin only)
   */
  async toggleUserStatus(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Prevent disabling/deleting super admin
    if (user.role === Role.SUPER_ADMIN) {
      throw new AppError('Super admin accounts cannot be disabled', 403);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    logger.info('User status toggled', { userId, isActive: updatedUser.isActive });

    return userWithoutPassword;
  }

  /**
   * Change user role (SUPER_ADMIN only)
   */
  async changeUserRole(userId: string, role: Role): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Prevent changing super admin role
    if (user.role === Role.SUPER_ADMIN) {
      throw new AppError('Super admin role cannot be changed', 403);
    }

    // Prevent assigning super admin role to other users
    if (role === Role.SUPER_ADMIN) {
      throw new AppError('Cannot assign super admin role', 403);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    logger.info('User role changed', { userId, oldRole: user.role, newRole: role });

    return userWithoutPassword;
  }

  /**
   * Get pending users (admin only) - DEPRECATED, use getPendingClients
   */
  async getPendingUsers(options: {
    page: number;
    limit: number;
  }): Promise<{
    users: Omit<User, 'passwordHash'>[];
    total: number;
  }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const where = {
      accountStatus: AccountStatus.PENDING,
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithoutPassword = users.map((user) => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return { users: usersWithoutPassword, total };
  }

  /**
   * Get pending clients (admin only)
   */
  async getPendingClients(options: {
    page: number;
    limit: number;
  }): Promise<{
    clients: Omit<User, 'passwordHash'>[];
    total: number;
  }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const where = {
      accountStatus: AccountStatus.PENDING,
      userType: 'CLIENT' as const,
    };

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const clientsWithoutPassword = clients.map((client) => {
      const { passwordHash: _, ...clientWithoutPassword } = client;
      return clientWithoutPassword;
    });

    return { clients: clientsWithoutPassword, total };
  }
}

export const userService = new UserService();
export default userService;




