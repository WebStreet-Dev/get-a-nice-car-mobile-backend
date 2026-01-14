import { Location } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export class LocationService {
  /**
   * Get all locations
   */
  async getAllLocations(): Promise<Location[]> {
    return prisma.location.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get active locations only
   */
  async getActiveLocations(): Promise<Location[]> {
    return prisma.location.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get location by ID
   */
  async getLocationById(id: string): Promise<Location> {
    const location = await prisma.location.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundError('Location');
    }

    return location;
  }

  /**
   * Create a location
   */
  async createLocation(data: {
    label: string;
    address: string;
    mapLink: string;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<Location> {
    const location = await prisma.location.create({
      data: {
        label: data.label,
        address: data.address,
        mapLink: data.mapLink,
        displayOrder: data.displayOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    logger.info('Location created', { locationId: location.id });

    return location;
  }

  /**
   * Update a location
   */
  async updateLocation(
    id: string,
    data: {
      label?: string;
      address?: string;
      mapLink?: string;
      displayOrder?: number;
      isActive?: boolean;
    }
  ): Promise<Location> {
    const existing = await prisma.location.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Location');
    }

    const location = await prisma.location.update({
      where: { id },
      data,
    });

    logger.info('Location updated', { locationId: id });

    return location;
  }

  /**
   * Delete a location
   */
  async deleteLocation(id: string): Promise<void> {
    const existing = await prisma.location.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Location');
    }

    await prisma.location.delete({
      where: { id },
    });

    logger.info('Location deleted', { locationId: id });
  }
}

export const locationService = new LocationService();
export default locationService;
