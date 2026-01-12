import { Router } from 'express';
import appointmentController from '../controllers/appointment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentIdSchema,
  appointmentQuerySchema,
} from '../validators/appointment.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/appointments
 * @desc    Create a new appointment
 * @access  Private
 */
router.post(
  '/',
  validate(createAppointmentSchema),
  appointmentController.create.bind(appointmentController)
);

/**
 * @route   GET /api/v1/appointments
 * @desc    Get user's appointments
 * @access  Private
 */
router.get(
  '/',
  validate(appointmentQuerySchema, 'query'),
  appointmentController.getAll.bind(appointmentController)
);

/**
 * @route   GET /api/v1/appointments/:id
 * @desc    Get a single appointment
 * @access  Private
 */
router.get(
  '/:id',
  validate(appointmentIdSchema, 'params'),
  appointmentController.getById.bind(appointmentController)
);

/**
 * @route   PUT /api/v1/appointments/:id
 * @desc    Update an appointment
 * @access  Private
 */
router.put(
  '/:id',
  validate(appointmentIdSchema, 'params'),
  validate(updateAppointmentSchema),
  appointmentController.update.bind(appointmentController)
);

/**
 * @route   DELETE /api/v1/appointments/:id
 * @desc    Cancel an appointment
 * @access  Private
 */
router.delete(
  '/:id',
  validate(appointmentIdSchema, 'params'),
  appointmentController.cancel.bind(appointmentController)
);

export default router;








