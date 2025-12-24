import { Router } from 'express';
import faqController from '../controllers/faq.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/faqs
 * @desc    Get all FAQs (optionally filter by category)
 * @access  Public
 */
router.get('/', faqController.getAll.bind(faqController));

/**
 * @route   GET /api/v1/faqs/:id
 * @desc    Get FAQ by ID
 * @access  Public
 */
router.get('/:id', faqController.getById.bind(faqController));

export default router;



