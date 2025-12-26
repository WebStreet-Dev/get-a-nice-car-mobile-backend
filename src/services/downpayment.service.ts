import { DownpaymentCategory } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export class DownpaymentService {
  /**
   * Get all active downpayment categories (public)
   */
  async getActiveCategories(): Promise<DownpaymentCategory[]> {
    return prisma.downpaymentCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get all downpayment categories including inactive (admin)
   */
  async getAllCategories(): Promise<DownpaymentCategory[]> {
    return prisma.downpaymentCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<DownpaymentCategory> {
    const category = await prisma.downpaymentCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundError('Downpayment category');
    }

    return category;
  }

  /**
   * Create a new downpayment category (admin)
   */
  async createCategory(data: {
    label: string;
    priceLimit: number;
    url: string;
    color: string;
    icon: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<DownpaymentCategory> {
    const category = await prisma.downpaymentCategory.create({
      data: {
        label: data.label,
        priceLimit: data.priceLimit,
        url: data.url,
        color: data.color,
        icon: data.icon,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    logger.info('Downpayment category created', { categoryId: category.id });

    return category;
  }

  /**
   * Update a downpayment category (admin)
   */
  async updateCategory(
    id: string,
    data: {
      label?: string;
      priceLimit?: number;
      url?: string;
      color?: string;
      icon?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<DownpaymentCategory> {
    const existing = await prisma.downpaymentCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Downpayment category');
    }

    const category = await prisma.downpaymentCategory.update({
      where: { id },
      data,
    });

    logger.info('Downpayment category updated', { categoryId: id });

    return category;
  }

  /**
   * Delete a downpayment category (admin)
   */
  async deleteCategory(id: string): Promise<void> {
    const existing = await prisma.downpaymentCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Downpayment category');
    }

    await prisma.downpaymentCategory.delete({
      where: { id },
    });

    logger.info('Downpayment category deleted', { categoryId: id });
  }

  /**
   * Toggle category active status (admin)
   */
  async toggleCategoryStatus(id: string): Promise<DownpaymentCategory> {
    const existing = await prisma.downpaymentCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Downpayment category');
    }

    const category = await prisma.downpaymentCategory.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    logger.info('Downpayment category status toggled', { categoryId: id, isActive: category.isActive });

    return category;
  }
}

export const downpaymentService = new DownpaymentService();
export default downpaymentService;




