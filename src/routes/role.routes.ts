import { Router } from 'express';
import roleController from '../controllers/role.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

// All role routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

/**
 * @route   GET /api/v1/admin/roles
 * @desc    Get all roles
 * @access  Admin
 */
router.get('/', roleController.getAll.bind(roleController));

/**
 * @route   GET /api/v1/admin/roles/:id
 * @desc    Get role by ID
 * @access  Admin
 */
router.get('/:id', roleController.getById.bind(roleController));

/**
 * @route   POST /api/v1/admin/roles
 * @desc    Create role
 * @access  Super Admin
 */
router.post('/', roleController.create.bind(roleController));

/**
 * @route   PUT /api/v1/admin/roles/:id
 * @desc    Update role
 * @access  Super Admin
 */
router.put('/:id', roleController.update.bind(roleController));

/**
 * @route   DELETE /api/v1/admin/roles/:id
 * @desc    Delete role
 * @access  Super Admin
 */
router.delete('/:id', roleController.delete.bind(roleController));

/**
 * @route   POST /api/v1/admin/users/:id/assign-role
 * @desc    Assign role to user
 * @access  Super Admin
 */
router.post('/users/:id/assign-role', roleController.assignToUser.bind(roleController));

/**
 * @route   DELETE /api/v1/admin/users/:id/role
 * @desc    Remove role from user
 * @access  Super Admin
 */
router.delete('/users/:id/role', roleController.removeFromUser.bind(roleController));

export default router;

