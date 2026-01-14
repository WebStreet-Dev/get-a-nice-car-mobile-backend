import { Location } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export class LocationService {
  /**
   * Get all active locations (public)
   */
  async getActiveLocations(): Promise<Location[]> {
    return prisma.location.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get all locations including inactive (admin)
   */
  async getAllLocations(): Promise<Location[]> {
    return prisma.location.findMany({
      orderBy: { sortOrder: 'asc' },
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
   * Create a new location (admin)
   */
  async createLocation(data: {
    name: string;
    address: string;
    googleMapsLink?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<Location> {
    const location = await prisma.location.create({
      data: {
        name: data.name,
        address: data.address,
        googleMapsLink: data.googleMapsLink || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    logger.info('Location created', { locationId: location.id });

    return location;
  }

  /**
   * Update a location (admin)
   */
  async updateLocation(
    id: string,
    data: {
      name?: string;
      address?: string;
      googleMapsLink?: string | null;
      sortOrder?: number;
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
   * Delete a location (admin)
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

  /**
   * Toggle location active status (admin)
   */
  async toggleLocationStatus(id: string): Promise<Location> {
    const existing = await prisma.location.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Location');
    }

    const location = await prisma.location.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    logger.info('Location status toggled', { locationId: id, isActive: location.isActive });

    return location;
  }
}

export const locationService = new LocationService();
export default locationService;
