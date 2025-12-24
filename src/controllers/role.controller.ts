import { Request, Response, NextFunction } from 'express';
import roleService from '../services/role.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { Role } from '@prisma/client';
import { ForbiddenError } from '../middleware/errorHandler.js';

export class RoleController {
  /**
   * Get all roles
   * GET /api/v1/admin/roles
   */
  async getAll(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const roles = await roleService.getAllRoles();
      sendSuccess(res, roles);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role by ID
   * GET /api/v1/admin/roles/:id
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(id);
      sendSuccess(res, role);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create role
   * POST /api/v1/admin/roles
   */
  async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Only SUPER_ADMIN can create roles
      if (req.user?.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenError('Only Super Admin can create roles');
      }

      const { name, description, permissions } = req.body;

      if (!name || !permissions || !Array.isArray(permissions)) {
        throw new Error('Name and permissions array are required');
      }

      const role = await roleService.createRole({
        name,
        description,
        permissions,
      });

      sendCreated(res, role, 'Role created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update role
   * PUT /api/v1/admin/roles/:id
   */
  async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Only SUPER_ADMIN can update roles
      if (req.user?.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenError('Only Super Admin can update roles');
      }

      const { id } = req.params;
      const { name, description, permissions } = req.body;

      const role = await roleService.updateRole(id, {
        name,
        description,
        permissions,
      });

      sendSuccess(res, role, 'Role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete role
   * DELETE /api/v1/admin/roles/:id
   */
  async delete(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Only SUPER_ADMIN can delete roles
      if (req.user?.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenError('Only Super Admin can delete roles');
      }

      const { id } = req.params;
      await roleService.deleteRole(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign role to user
   * POST /api/v1/admin/users/:id/assign-role
   */
  async assignToUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Only SUPER_ADMIN can assign roles
      if (req.user?.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenError('Only Super Admin can assign roles');
      }

      const { id } = req.params;
      const { roleId } = req.body;

      if (!roleId) {
        throw new Error('Role ID is required');
      }

      await roleService.assignRoleToUser(id, roleId);
      sendSuccess(res, null, 'Role assigned successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove role from user
   * DELETE /api/v1/admin/users/:id/role
   */
  async removeFromUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Only SUPER_ADMIN can remove roles
      if (req.user?.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenError('Only Super Admin can remove roles');
      }

      const { id } = req.params;
      await roleService.removeRoleFromUser(id);
      sendSuccess(res, null, 'Role removed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const roleController = new RoleController();
export default roleController;

