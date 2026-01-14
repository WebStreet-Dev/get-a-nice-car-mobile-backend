import { Router } from 'express';
import locationController from '../controllers/location.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createLocationSchema,
  updateLocationSchema,
  locationIdSchema,
} from '../validators/location.validator.js';

const router = Router();

// Public routes - Get all locations (active only for public)
router.get(
  '/',
  locationController.getAll.bind(locationController)
);

// Public route - Get location by ID
router.get(
  '/:id',
  validate(locationIdSchema, 'params'),
  locationController.getById.bind(locationController)
);

// Protected admin routes - require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// Create location
router.post(
  '/',
  validate(createLocationSchema),
  locationController.create.bind(locationController)
);

// Update location
router.put(
  '/:id',
  validate(locationIdSchema, 'params'),
  validate(updateLocationSchema),
  locationController.update.bind(locationController)
);

// Delete location
router.delete(
  '/:id',
  validate(locationIdSchema, 'params'),
  locationController.delete.bind(locationController)
);

export default router;
