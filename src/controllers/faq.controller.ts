import { Request, Response, NextFunction } from 'express';
import { FAQCategory } from '@prisma/client';
import faqService from '../services/faq.service.js';
import { sendSuccess } from '../utils/response.js';

export class FAQController {
  /**
   * Get all FAQs
   * GET /api/v1/faqs
   */
  async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { category } = req.query;
      const faqs = await faqService.getAllFAQs(
        category as FAQCategory | undefined
      );
      sendSuccess(res, faqs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get FAQ by ID
   * GET /api/v1/faqs/:id
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const faq = await faqService.getFAQById(id);
      sendSuccess(res, faq);
    } catch (error) {
      next(error);
    }
  }
}

export const faqController = new FAQController();
export default faqController;



