import { Router } from 'express';
import breakdownController from '../controllers/breakdown.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createBreakdownRequestSchema,
  updateLocationSchema,
  breakdownIdSchema,
} from '../validators/breakdown.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/breakdown
 * @desc    Create a new breakdown request
 * @access  Private
 */
router.post(
  '/',
  validate(createBreakdownRequestSchema),
  breakdownController.create.bind(breakdownController)
);

/**
 * @route   GET /api/v1/breakdown/active
 * @desc    Get active breakdown request
 * @access  Private
 */
router.get('/active', breakdownController.getActive.bind(breakdownController));

/**
 * @route   GET /api/v1/breakdown/:id
 * @desc    Get breakdown request by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(breakdownIdSchema, 'params'),
  breakdownController.getById.bind(breakdownController)
);

/**
 * @route   PUT /api/v1/breakdown/:id/location
 * @desc    Update location for a live breakdown request
 * @access  Private
 */
router.put(
  '/:id/location',
  validate(breakdownIdSchema, 'params'),
  validate(updateLocationSchema),
  breakdownController.updateLocation.bind(breakdownController)
);

/**
 * @route   DELETE /api/v1/breakdown/:id
 * @desc    Cancel a breakdown request
 * @access  Private
 */
router.delete(
  '/:id',
  validate(breakdownIdSchema, 'params'),
  breakdownController.cancel.bind(breakdownController)
);

export default router;




