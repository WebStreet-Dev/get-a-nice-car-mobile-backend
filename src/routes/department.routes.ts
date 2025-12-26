import { Router } from 'express';
import departmentController from '../controllers/department.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/departments
 * @desc    Get all departments
 * @access  Public
 */
router.get('/', departmentController.getAll.bind(departmentController));

/**
 * @route   GET /api/v1/departments/:id
 * @desc    Get department by ID
 * @access  Public
 */
router.get('/:id', departmentController.getById.bind(departmentController));

export default router;




