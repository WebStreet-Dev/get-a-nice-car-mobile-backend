import { Request, Response, NextFunction } from 'express';
import downpaymentService from '../services/downpayment.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import {
  CreateDownpaymentCategoryInput,
  UpdateDownpaymentCategoryInput,
} from '../validators/downpayment.validator.js';

export class DownpaymentController {
  /**
   * Get all active downpayment categories (public)
   * GET /api/v1/downpayment
   */
  async getActive(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories = await downpaymentService.getActiveCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all downpayment categories (admin)
   * GET /api/v1/admin/downpayment
   */
  async getAll(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories = await downpaymentService.getAllCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   * GET /api/v1/downpayment/:id
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const category = await downpaymentService.getCategoryById(id);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new downpayment category (admin)
   * POST /api/v1/admin/downpayment
   */
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = req.body as CreateDownpaymentCategoryInput;
      const category = await downpaymentService.createCategory(data);
      sendCreated(res, category, 'Downpayment category created');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a downpayment category (admin)
   * PUT /api/v1/admin/downpayment/:id
   */
  async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as UpdateDownpaymentCategoryInput;
      const category = await downpaymentService.updateCategory(id, data);
      sendSuccess(res, category, 'Downpayment category updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a downpayment category (admin)
   * DELETE /api/v1/admin/downpayment/:id
   */
  async delete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await downpaymentService.deleteCategory(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle category status (admin)
   * PUT /api/v1/admin/downpayment/:id/toggle
   */
  async toggleStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const category = await downpaymentService.toggleCategoryStatus(id);
      sendSuccess(res, category, 'Category status toggled');
    } catch (error) {
      next(error);
    }
  }
}

export const downpaymentController = new DownpaymentController();
export default downpaymentController;




