import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
import downpaymentController from '../controllers/downpayment.controller.js';
import roleController from '../controllers/role.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createDownpaymentCategorySchema,
  updateDownpaymentCategorySchema,
} from '../validators/downpayment.validator.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// ==================== DASHBOARD ====================

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get('/dashboard', adminController.getDashboard.bind(adminController));

// ==================== USERS ====================

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get('/users', adminController.getUsers.bind(adminController));

/**
 * @route   PUT /api/v1/admin/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Admin
 */
router.put('/users/:id/toggle-status', adminController.toggleUserStatus.bind(adminController));

/**
 * @route   PUT /api/v1/admin/users/:id/role
 * @desc    Change user role (SUPER_ADMIN only)
 * @access  Super Admin
 */
router.put('/users/:id/role', adminController.changeUserRole.bind(adminController));

/**
 * @route   GET /api/v1/admin/users/pending
 * @desc    Get pending users
 * @access  Admin
 */
router.get('/users/pending', adminController.getPendingUsers.bind(adminController));

/**
 * @route   PUT /api/v1/admin/users/:id/approve
 * @desc    Approve user account
 * @access  Admin
 */
router.put('/users/:id/approve', adminController.approveUser.bind(adminController));

/**
 * @route   PUT /api/v1/admin/users/:id/reject
 * @desc    Reject user account
 * @access  Admin
 */
router.put('/users/:id/reject', adminController.rejectUser.bind(adminController));

/**
 * @route   POST /api/v1/admin/users/create-internal
 * @desc    Create internal user (employee)
 * @access  Super Admin
 */
router.post('/users/create-internal', adminController.createInternalUser.bind(adminController));

// ==================== APPOINTMENTS ====================

/**
 * @route   GET /api/v1/admin/appointments
 * @desc    Get all appointments
 * @access  Admin
 */
router.get('/appointments', adminController.getAppointments.bind(adminController));

/**
 * @route   PUT /api/v1/admin/appointments/:id/status
 * @desc    Update appointment status
 * @access  Admin
 */
router.put('/appointments/:id/status', adminController.updateAppointmentStatus.bind(adminController));

/**
 * @route   PUT /api/v1/admin/appointments/:id/approve
 * @desc    Approve appointment
 * @access  Admin
 */
router.put('/appointments/:id/approve', adminController.approveAppointment.bind(adminController));

/**
 * @route   PUT /api/v1/admin/appointments/:id/reject
 * @desc    Reject appointment
 * @access  Admin
 */
router.put('/appointments/:id/reject', adminController.rejectAppointment.bind(adminController));

// ==================== DEPARTMENTS ====================

/**
 * @route   GET /api/v1/admin/departments
 * @desc    Get all departments (including inactive)
 * @access  Admin
 */
router.get('/departments', adminController.getDepartments.bind(adminController));

/**
 * @route   POST /api/v1/admin/departments
 * @desc    Create department
 * @access  Admin
 */
router.post('/departments', adminController.createDepartment.bind(adminController));

/**
 * @route   PUT /api/v1/admin/departments/:id
 * @desc    Update department
 * @access  Admin
 */
router.put('/departments/:id', adminController.updateDepartment.bind(adminController));

/**
 * @route   DELETE /api/v1/admin/departments/:id
 * @desc    Delete department
 * @access  Admin
 */
router.delete('/departments/:id', adminController.deleteDepartment.bind(adminController));

// ==================== FAQS ====================

/**
 * @route   GET /api/v1/admin/faqs
 * @desc    Get all FAQs (including unpublished)
 * @access  Admin
 */
router.get('/faqs', adminController.getFaqs.bind(adminController));

/**
 * @route   POST /api/v1/admin/faqs
 * @desc    Create FAQ
 * @access  Admin
 */
router.post('/faqs', adminController.createFaq.bind(adminController));

/**
 * @route   PUT /api/v1/admin/faqs/:id
 * @desc    Update FAQ
 * @access  Admin
 */
router.put('/faqs/:id', adminController.updateFaq.bind(adminController));

/**
 * @route   DELETE /api/v1/admin/faqs/:id
 * @desc    Delete FAQ
 * @access  Admin
 */
router.delete('/faqs/:id', adminController.deleteFaq.bind(adminController));

// ==================== BREAKDOWN REQUESTS ====================

/**
 * @route   GET /api/v1/admin/breakdown
 * @desc    Get all breakdown requests
 * @access  Admin
 */
router.get('/breakdown', adminController.getBreakdownRequests.bind(adminController));

/**
 * @route   PUT /api/v1/admin/breakdown/:id/status
 * @desc    Update breakdown request status
 * @access  Admin
 */
router.put('/breakdown/:id/status', adminController.updateBreakdownStatus.bind(adminController));

// ==================== NOTIFICATIONS ====================

/**
 * @route   POST /api/v1/admin/notifications/broadcast
 * @desc    Send notification to all users
 * @access  Admin
 */
router.post('/notifications/broadcast', adminController.sendBroadcastNotification.bind(adminController));

/**
 * @route   POST /api/v1/admin/notifications/send
 * @desc    Send notification to specific users
 * @access  Admin
 */
router.post('/notifications/send', adminController.sendNotification.bind(adminController));

// ==================== DOWNPAYMENT CATEGORIES ====================

/**
 * @route   GET /api/v1/admin/downpayment
 * @desc    Get all downpayment categories (including inactive)
 * @access  Admin
 */
router.get('/downpayment', downpaymentController.getAll.bind(downpaymentController));

/**
 * @route   POST /api/v1/admin/downpayment
 * @desc    Create downpayment category
 * @access  Admin
 */
router.post(
  '/downpayment',
  validate(createDownpaymentCategorySchema),
  downpaymentController.create.bind(downpaymentController)
);

/**
 * @route   PUT /api/v1/admin/downpayment/:id
 * @desc    Update downpayment category
 * @access  Admin
 */
router.put(
  '/downpayment/:id',
  validate(updateDownpaymentCategorySchema),
  downpaymentController.update.bind(downpaymentController)
);

/**
 * @route   PUT /api/v1/admin/downpayment/:id/toggle
 * @desc    Toggle downpayment category status
 * @access  Admin
 */
router.put('/downpayment/:id/toggle', downpaymentController.toggleStatus.bind(downpaymentController));

/**
 * @route   DELETE /api/v1/admin/downpayment/:id
 * @desc    Delete downpayment category
 * @access  Admin
 */
router.delete('/downpayment/:id', downpaymentController.delete.bind(downpaymentController));

// ==================== ADMIN NOTIFICATIONS ====================

/**
 * @route   GET /api/v1/admin/alerts
 * @desc    Get admin notifications (breakdown alerts, etc.)
 * @access  Admin
 */
router.get('/alerts', adminController.getAdminNotifications.bind(adminController));

/**
 * @route   PUT /api/v1/admin/alerts/:id/read
 * @desc    Mark admin notification as read
 * @access  Admin
 */
router.put('/alerts/:id/read', adminController.markAdminNotificationRead.bind(adminController));

/**
 * @route   PUT /api/v1/admin/alerts/read-all
 * @desc    Mark all admin notifications as read
 * @access  Admin
 */
router.put('/alerts/read-all', adminController.markAllAdminNotificationsRead.bind(adminController));

// ==================== ROLES ====================

/**
 * @route   GET /api/v1/admin/roles
 * @desc    Get all roles
 * @access  Admin
 */
router.get('/roles', roleController.getAll.bind(roleController));

/**
 * @route   GET /api/v1/admin/roles/:id
 * @desc    Get role by ID
 * @access  Admin
 */
router.get('/roles/:id', roleController.getById.bind(roleController));

/**
 * @route   POST /api/v1/admin/roles
 * @desc    Create role
 * @access  Super Admin
 */
router.post('/roles', roleController.create.bind(roleController));

/**
 * @route   PUT /api/v1/admin/roles/:id
 * @desc    Update role
 * @access  Super Admin
 */
router.put('/roles/:id', roleController.update.bind(roleController));

/**
 * @route   DELETE /api/v1/admin/roles/:id
 * @desc    Delete role
 * @access  Super Admin
 */
router.delete('/roles/:id', roleController.delete.bind(roleController));

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




