import { Request, Response, NextFunction } from 'express';
import locationService from '../services/location.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import {
  CreateLocationInput,
  UpdateLocationInput,
} from '../validators/location.validator.js';

export class LocationController {
  /**
   * Get all active locations (public)
   * GET /api/v1/locations
   */
  async getActive(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const locations = await locationService.getActiveLocations();
      sendSuccess(res, locations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all locations (admin)
   * GET /api/v1/admin/locations
   */
  async getAll(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const locations = await locationService.getAllLocations();
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
   * Create a new location (admin)
   * POST /api/v1/admin/locations
   */
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = req.body as CreateLocationInput;
      const location = await locationService.createLocation(data);
      sendCreated(res, location, 'Location created');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a location (admin)
   * PUT /api/v1/admin/locations/:id
   */
  async update(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as UpdateLocationInput;
      const location = await locationService.updateLocation(id, data);
      sendSuccess(res, location, 'Location updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a location (admin)
   * DELETE /api/v1/admin/locations/:id
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

  /**
   * Toggle location status (admin)
   * PUT /api/v1/admin/locations/:id/toggle
   */
  async toggleStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const location = await locationService.toggleLocationStatus(id);
      sendSuccess(res, location, 'Location status toggled');
    } catch (error) {
      next(error);
    }
  }
}

export const locationController = new LocationController();
export default locationController;
