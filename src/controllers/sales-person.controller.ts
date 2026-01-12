import { Request, Response, NextFunction } from 'express';
import salesPersonService from '../services/sales-person.service.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export class SalesPersonController {
  /**
   * Get all active sales persons
   * GET /api/v1/sales-persons
   */
  async getAll(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const salesPersons = await salesPersonService.getAllSalesPersons();
      sendSuccess(res, salesPersons);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sales person by ID
   * GET /api/v1/sales-persons/:id
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const salesPerson = await salesPersonService.getSalesPersonById(id);
      sendSuccess(res, salesPerson);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all sales persons including inactive (admin only)
   * GET /api/v1/admin/sales-persons
   */
  async getAllAdmin(
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const salesPersons = await salesPersonService.getAllSalesPersonsAdmin();
      sendSuccess(res, salesPersons);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a sales person (admin only)
   * POST /api/v1/admin/sales-persons
   */
  async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, phone, email, photoPath, sortOrder } = req.body;
      const salesPerson = await salesPersonService.createSalesPerson({
        name,
        phone,
        email,
        photoPath,
        sortOrder,
      });
      sendSuccess(res, salesPerson, 'Sales person created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a sales person (admin only)
   * PUT /api/v1/admin/sales-persons/:id
   */
  async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { name, phone, email, photoPath, sortOrder, isActive } = req.body;
      const salesPerson = await salesPersonService.updateSalesPerson(id, {
        name,
        phone,
        email,
        photoPath,
        sortOrder,
        isActive,
      });
      sendSuccess(res, salesPerson, 'Sales person updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a sales person (admin only)
   * DELETE /api/v1/admin/sales-persons/:id
   */
  async delete(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await salesPersonService.deleteSalesPerson(id);
      sendSuccess(res, null, 'Sales person deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const salesPersonController = new SalesPersonController();
export default salesPersonController;
