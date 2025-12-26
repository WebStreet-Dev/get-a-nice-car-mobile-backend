import { FAQ, FAQCategory } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export class FAQService {
  /**
   * Get all published FAQs
   */
  async getAllFAQs(category?: FAQCategory): Promise<FAQ[]> {
    return prisma.fAQ.findMany({
      where: {
        isPublished: true,
        ...(category && { category }),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get FAQ by ID
   */
  async getFAQById(id: string): Promise<FAQ> {
    const faq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundError('FAQ');
    }

    return faq;
  }

  /**
   * Get all FAQs including unpublished (admin only)
   */
  async getAllFAQsAdmin(): Promise<FAQ[]> {
    return prisma.fAQ.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create a FAQ (admin only)
   */
  async createFAQ(data: {
    question: string;
    answer: string;
    category: FAQCategory;
    sortOrder?: number;
    isPublished?: boolean;
  }): Promise<FAQ> {
    const faq = await prisma.fAQ.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category,
        sortOrder: data.sortOrder || 0,
        isPublished: data.isPublished ?? true,
      },
    });

    logger.info('FAQ created', { faqId: faq.id });

    return faq;
  }

  /**
   * Update a FAQ (admin only)
   */
  async updateFAQ(
    id: string,
    data: {
      question?: string;
      answer?: string;
      category?: FAQCategory;
      sortOrder?: number;
      isPublished?: boolean;
    }
  ): Promise<FAQ> {
    const existing = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('FAQ');
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data,
    });

    logger.info('FAQ updated', { faqId: id });

    return faq;
  }

  /**
   * Delete a FAQ (admin only)
   */
  async deleteFAQ(id: string): Promise<void> {
    const existing = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('FAQ');
    }

    await prisma.fAQ.delete({
      where: { id },
    });

    logger.info('FAQ deleted', { faqId: id });
  }
}

export const faqService = new FAQService();
export default faqService;




