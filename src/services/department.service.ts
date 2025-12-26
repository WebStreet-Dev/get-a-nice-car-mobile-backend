import { Department } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export class DepartmentService {
  /**
   * Get all active departments
   */
  async getAllDepartments(): Promise<Department[]> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fb0ff7d9-eaac-4432-9ff3-49e4f0e88573',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'department.service.ts:11',message:'Before database query',data:{prismaExists:!!prisma,queryType:'findMany'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      const result = await prisma.department.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fb0ff7d9-eaac-4432-9ff3-49e4f0e88573',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'department.service.ts:16',message:'Database query succeeded',data:{resultCount:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return result;
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fb0ff7d9-eaac-4432-9ff3-49e4f0e88573',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'department.service.ts:21',message:'Database query failed',data:{errorMessage:error?.message,errorCode:error?.code,errorName:error?.name,hasCredentials:error?.message?.includes('credentials')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw error;
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id: string): Promise<Department> {
    const department = await prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundError('Department');
    }

    return department;
  }

  /**
   * Get all departments including inactive (admin only)
   */
  async getAllDepartmentsAdmin(): Promise<Department[]> {
    return prisma.department.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create a department (admin only)
   */
  async createDepartment(data: {
    name: string;
    phone: string;
    email: string;
    description: string;
    icon: string;
    sortOrder?: number;
  }): Promise<Department> {
    const department = await prisma.department.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        description: data.description,
        icon: data.icon,
        sortOrder: data.sortOrder || 0,
      },
    });

    logger.info('Department created', { departmentId: department.id });

    return department;
  }

  /**
   * Update a department (admin only)
   */
  async updateDepartment(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      description?: string;
      icon?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<Department> {
    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Department');
    }

    const department = await prisma.department.update({
      where: { id },
      data,
    });

    logger.info('Department updated', { departmentId: id });

    return department;
  }

  /**
   * Delete a department (admin only)
   */
  async deleteDepartment(id: string): Promise<void> {
    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Department');
    }

    // Soft delete by setting isActive to false
    await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('Department deleted', { departmentId: id });
  }
}

export const departmentService = new DepartmentService();
export default departmentService;





