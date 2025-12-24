import { CustomRole } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError, AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export class RoleService {
  /**
   * Get all roles
   */
  async getAllRoles(): Promise<CustomRole[]> {
    return prisma.customRole.findMany({
      orderBy: [
        { isSystemRole: 'desc' }, // System roles first
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<CustomRole> {
    const role = await prisma.customRole.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role');
    }

    return role;
  }

  /**
   * Create a new role
   */
  async createRole(data: {
    name: string;
    description?: string;
    permissions: string[];
  }): Promise<CustomRole> {
    // Check if role with same name exists
    const existing = await prisma.customRole.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError('Role with this name already exists', 409);
    }

    const role = await prisma.customRole.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        isSystemRole: false,
      },
    });

    logger.info('Role created', { roleId: role.id, roleName: role.name });

    return role;
  }

  /**
   * Update a role
   */
  async updateRole(
    id: string,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
    }
  ): Promise<CustomRole> {
    const existing = await prisma.customRole.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Role');
    }

    if (existing.isSystemRole) {
      throw new AppError('Cannot modify system roles', 403);
    }

    // Check if name is being changed and if new name already exists
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.customRole.findUnique({
        where: { name: data.name },
      });

      if (nameExists) {
        throw new AppError('Role with this name already exists', 409);
      }
    }

    const role = await prisma.customRole.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
      },
    });

    logger.info('Role updated', { roleId: role.id, roleName: role.name });

    return role;
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<void> {
    const role = await prisma.customRole.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!role) {
      throw new NotFoundError('Role');
    }

    if (role.isSystemRole) {
      throw new AppError('Cannot delete system roles', 403);
    }

    if (role.users.length > 0) {
      throw new AppError('Cannot delete role that is assigned to users', 400);
    }

    await prisma.customRole.delete({
      where: { id },
    });

    logger.info('Role deleted', { roleId: id, roleName: role.name });
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const role = await prisma.customRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundError('Role');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { customRoleId: roleId },
    });

    logger.info('Role assigned to user', { userId, roleId, roleName: role.name });
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { customRoleId: null },
    });

    logger.info('Role removed from user', { userId });
  }
}

export const roleService = new RoleService();
export default roleService;

