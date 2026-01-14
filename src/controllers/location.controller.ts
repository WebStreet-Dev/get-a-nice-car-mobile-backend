import { Request, Response, NextFunction } from 'express';
import locationService from '../services/location.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';

export class LocationController {
  /**
   * Get all locations
   * GET /api/v1/locations
   */
  async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { active } = req.query;
      const locations = active === 'true'
        ? await locationService.getActiveLocations()
        : await locationService.getAllLocations();
      sendSuccess(res, locations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get location by ID
   * GET /api/v1/locations/:id
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const location = await locationService.getLocationById(id);
      sendSuccess(res, location);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a location
   * POST /api/v1/locations
   */
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const location = await locationService.createLocation(req.body);
      sendCreated(res, location);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a location
   * PUT /api/v1/locations/:id
   */
  async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const location = await locationService.updateLocation(id, req.body);
      sendSuccess(res, location);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a location
   * DELETE /api/v1/locations/:id
   */
  async delete(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await locationService.deleteLocation(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const locationController = new LocationController();
export default locationController;
