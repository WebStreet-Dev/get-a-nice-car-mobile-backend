import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
router.get('/', notificationController.getAll.bind(notificationController));

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', notificationController.markAllAsRead.bind(notificationController));

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', notificationController.delete.bind(notificationController));

export default router;



