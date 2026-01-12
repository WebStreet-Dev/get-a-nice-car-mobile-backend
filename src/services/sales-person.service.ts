import { SalesPerson } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export class SalesPersonService {
  /**
   * Get all active sales persons
   */
  async getAllSalesPersons(): Promise<SalesPerson[]> {
    return prisma.salesPerson.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get sales person by ID
   */
  async getSalesPersonById(id: string): Promise<SalesPerson> {
    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id },
    });

    if (!salesPerson) {
      throw new NotFoundError('Sales person');
    }

    return salesPerson;
  }

  /**
   * Get all sales persons including inactive (admin only)
   */
  async getAllSalesPersonsAdmin(): Promise<SalesPerson[]> {
    return prisma.salesPerson.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create a sales person (admin only)
   */
  async createSalesPerson(data: {
    name: string;
    phone: string;
    email: string;
    photoPath: string;
    sortOrder?: number;
  }): Promise<SalesPerson> {
    const salesPerson = await prisma.salesPerson.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        photoPath: data.photoPath,
        sortOrder: data.sortOrder || 0,
      },
    });

    logger.info('Sales person created', { salesPersonId: salesPerson.id });

    return salesPerson;
  }

  /**
   * Update a sales person (admin only)
   */
  async updateSalesPerson(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      photoPath?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<SalesPerson> {
    const existing = await prisma.salesPerson.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Sales person');
    }

    const salesPerson = await prisma.salesPerson.update({
      where: { id },
      data,
    });

    logger.info('Sales person updated', { salesPersonId: id });

    return salesPerson;
  }

  /**
   * Delete a sales person (admin only)
   */
  async deleteSalesPerson(id: string): Promise<void> {
    const existing = await prisma.salesPerson.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Sales person');
    }

    // Soft delete by setting isActive to false
    await prisma.salesPerson.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('Sales person deleted', { salesPersonId: id });
  }
}

export const salesPersonService = new SalesPersonService();
export default salesPersonService;
