import { Response, NextFunction } from 'express';
import breakdownService from '../services/breakdown.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import {
  CreateBreakdownRequestInput,
  UpdateLocationInput,
} from '../validators/breakdown.validator.js';

export class BreakdownController {
  /**
   * Create a new breakdown request
   * POST /api/v1/breakdown
   */
  async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = req.body as CreateBreakdownRequestInput;
      const request = await breakdownService.createBreakdownRequest(
        req.user!.id,
        {
          latitude: data.latitude,
          longitude: data.longitude,
          locationType: data.locationType as any,
          liveDurationMinutes: data.liveDurationMinutes,
          notes: data.notes,
        }
      );
      sendCreated(res, request, 'Breakdown assistance request submitted');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update location for a live breakdown request
   * PUT /api/v1/breakdown/:id/location
   */
  async updateLocation(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { latitude, longitude } = req.body as UpdateLocationInput;
      await breakdownService.updateLocation(id, req.user!.id, latitude, longitude);
      sendSuccess(res, null, 'Location updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active breakdown request
   * GET /api/v1/breakdown/active
   */
  async getActive(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const request = await breakdownService.getActiveRequest(req.user!.id);
      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get breakdown request by ID
   * GET /api/v1/breakdown/:id
   */
  async getById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const request = await breakdownService.getRequestById(id, req.user!.id);
      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel a breakdown request
   * DELETE /api/v1/breakdown/:id
   */
  async cancel(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const request = await breakdownService.cancelRequest(id, req.user!.id);
      sendSuccess(res, request, 'Breakdown request cancelled');
    } catch (error) {
      next(error);
    }
  }
}

export const breakdownController = new BreakdownController();
export default breakdownController;








