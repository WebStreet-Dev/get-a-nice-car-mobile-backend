import { Router } from 'express';
import locationController from '../controllers/location.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/locations
 * @desc    Get all active locations
 * @access  Public
 */
router.get('/', locationController.getActive.bind(locationController));

/**
 * @route   GET /api/v1/locations/:id
 * @desc    Get location by ID
 * @access  Public
 */
router.get('/:id', locationController.getById.bind(locationController));

export default router;
