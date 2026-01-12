import { Router } from 'express';
import salesPersonController from '../controllers/sales-person.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/sales-persons
 * @desc    Get all active sales persons
 * @access  Public
 */
router.get('/', salesPersonController.getAll.bind(salesPersonController));

/**
 * @route   GET /api/v1/sales-persons/:id
 * @desc    Get sales person by ID
 * @access  Public
 */
router.get('/:id', salesPersonController.getById.bind(salesPersonController));

export default router;
