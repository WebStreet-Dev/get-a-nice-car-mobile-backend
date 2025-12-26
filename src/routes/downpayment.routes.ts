import { Router } from 'express';
import downpaymentController from '../controllers/downpayment.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/downpayment
 * @desc    Get all active downpayment categories
 * @access  Public
 */
router.get('/', downpaymentController.getActive.bind(downpaymentController));

/**
 * @route   GET /api/v1/downpayment/:id
 * @desc    Get downpayment category by ID
 * @access  Public
 */
router.get('/:id', downpaymentController.getById.bind(downpaymentController));

export default router;




