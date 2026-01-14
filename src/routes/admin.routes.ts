import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
import downpaymentController from '../controllers/downpayment.controller.js';
import roleController from '../controllers/role.controller.js';
import salesPersonController from '../controllers/sales-person.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createDownpaymentCategorySchema,
  updateDownpaymentCategorySchema,
} from '../validators/downpayment.validator.js';
import logger from '../utils/logger.js';

// Controllers should be loaded at this point

const router = Router();

// Log all admin route requests for debugging (before auth to see all attempts)
router.use((req, res, next) => {
  logger.info(`Admin route attempt: ${req.method} ${req.originalUrl || req.url}, path: ${req.path}, baseUrl: ${req.baseUrl}`);
  next();
});

// Test route to verify router is working (before auth)
router.get('/test', (req, res) => {
  logger.info('Admin test route hit - router is working');
  res.json({ 
    success: true, 
    message: 'Admin router is working', 
    path: req.path, 
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl
  });
});

// All admin routes require authentication and admin role
// Note: authenticate and adminOnly will throw errors that are caught by errorHandler
router.use(authenticate);
router.use(adminOnly);

// Log successful authentication
router.use((req, res, next) => {
  logger.info(`Admin route authenticated: ${req.method} ${req.path}, user: ${(req as any).user?.email}`);
  next();
});

// ==================== DASHBOARD ====================

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));

// ==================== CLIENTS ====================

/**
 * @route   GET /api/v1/admin/clients
 * @desc    Get all clients
 * @access  Admin
 */
router.get('/clients', (req, res, next) => {
  adminController.getClients(req, res, next);
});

/**
 * @route   PUT /api/v1/admin/clients/:id/toggle-status
 * @desc    Toggle client active status
 * @access  Admin
 */
router.put('/clients/:id/toggle-status', adminController.toggleClientStatus.bind(adminController));

/**
 * @route   GET /api/v1/admin/clients/pending
 * @desc    Get pending clients
 * @access  Admin
 */
router.get('/clients/pending', adminController.getPendingClients.bind(adminController));

/**
 * @route   PUT /api/v1/admin/clients/:id/approve
 * @desc    Approve client account
 * @access  Admin
 */
router.put('/clients/:id/approve', adminController.approveClient.bind(adminController));

/**
 * @route   PUT /api/v1/admin/clients/:id/reject
 * @desc    Reject client account
 * @access  Admin
 */
router.put('/clients/:id/reject', adminController.rejectClient.bind(adminController));

// ==================== EMPLOYEES ====================

/**
 * @route   GET /api/v1/admin/employees
 * @desc    Get all employees
 * @access  Admin
 */
router.get('/employees', adminController.getEmployees.bind(adminController));

/**
 * @route   POST /api/v1/admin/employees
 * @desc    Create employee
 * @access  Admin
 */
router.post('/employees', adminController.createEmployee.bind(adminController));

/**
 * @route   PUT /api/v1/admin/employees/:id
 * @desc    Update employee
 * @access  Admin
 */
router.put('/employees/:id', adminController.updateEmployee.bind(adminController));

/**
 * @route   PUT /api/v1/admin/employees/:id/toggle-status
 * @desc    Toggle employee active status
 * @access  Admin
 */
router.put('/employees/:id/toggle-status', adminController.toggleEmployeeStatus.bind(adminController));

/**
 * @route   PUT /api/v1/admin/employees/:id/role
 * @desc    Change employee role (SUPER_ADMIN only)
 * @access  Super Admin
 */
router.put('/employees/:id/role', adminController.changeEmployeeRole.bind(adminController));

/**
 * @route   DELETE /api/v1/admin/employees/:id
 * @desc    Delete employee
 * @access  Admin
 */
router.delete('/employees/:id', adminController.deleteEmployee.bind(adminController));

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

/**
 * @route   PUT /api/v1/admin/breakdown/:id/approve
 * @desc    Approve breakdown request
 * @access  Admin
 */
router.put('/breakdown/:id/approve', adminController.approveBreakdown.bind(adminController));

/**
 * @route   PUT /api/v1/admin/breakdown/:id/reject
 * @desc    Reject breakdown request
 * @access  Admin
 */
router.put('/breakdown/:id/reject', adminController.rejectBreakdown.bind(adminController));

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
router.delete('/roles/:id', (req, res, next) => {
  roleController.delete(req, res, next);
});

/**
 * @route   POST /api/v1/admin/employees/:id/assign-role
 * @desc    Assign role to employee
 * @access  Super Admin
 */
router.post('/employees/:id/assign-role', roleController.assignToUser.bind(roleController));

/**
 * @route   DELETE /api/v1/admin/employees/:id/role
 * @desc    Remove role from employee
 * @access  Super Admin
 */
router.delete('/employees/:id/role', roleController.removeFromUser.bind(roleController));

// ==================== SALES PERSONS ====================

/**
 * @route   GET /api/v1/admin/sales-persons
 * @desc    Get all sales persons (including inactive)
 * @access  Admin
 */
router.get('/sales-persons', salesPersonController.getAllAdmin.bind(salesPersonController));

/**
 * @route   POST /api/v1/admin/sales-persons
 * @desc    Create sales person
 * @access  Admin
 */
router.post('/sales-persons', salesPersonController.create.bind(salesPersonController));

/**
 * @route   PUT /api/v1/admin/sales-persons/:id
 * @desc    Update sales person
 * @access  Admin
 */
router.put('/sales-persons/:id', salesPersonController.update.bind(salesPersonController));

/**
 * @route   DELETE /api/v1/admin/sales-persons/:id
 * @desc    Delete sales person
 * @access  Admin
 */
router.delete('/sales-persons/:id', salesPersonController.delete.bind(salesPersonController));

export default router;




