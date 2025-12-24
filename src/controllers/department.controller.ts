import { Request, Response, NextFunction } from 'express';
import departmentService from '../services/department.service.js';
import { sendSuccess } from '../utils/response.js';

export class DepartmentController {
  /**
   * Get all departments
   * GET /api/v1/departments
   */
  async getAll(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const departments = await departmentService.getAllDepartments();
      sendSuccess(res, departments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department by ID
   * GET /api/v1/departments/:id
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const department = await departmentService.getDepartmentById(id);
      sendSuccess(res, department);
    } catch (error) {
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();
export default departmentController;



