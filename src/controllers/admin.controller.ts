import { Request, Response, NextFunction } from 'express';
import { AppointmentStatus, BreakdownStatus, FAQCategory, NotificationType, Role } from '@prisma/client';
import prisma from '../services/prisma.service.js';
import userService from '../services/user.service.js';
import appointmentService from '../services/appointment.service.js';
import departmentService from '../services/department.service.js';
import faqService from '../services/faq.service.js';
import breakdownService from '../services/breakdown.service.js';
import notificationService from '../services/notification.service.js';
import adminNotificationService from '../services/admin-notification.service.js';
import authService from '../services/auth.service.js';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { ForbiddenError, AppError } from '../middleware/errorHandler.js';
import { AVAILABLE_PERMISSIONS } from '../constants/permissions.js';

export class AdminController {
  // ==================== DASHBOARD ====================

  /**
   * Get dashboard statistics
   * GET /api/v1/admin/dashboard
   */
  async getDashboard(
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const [
        totalClients,
        totalAppointments,
        pendingAppointments,
        activeBreakdowns,
        totalDepartments,
        totalFaqs,
      ] = await Promise.all([
        prisma.user.count({ where: { userType: 'CLIENT' } }),
        prisma.appointment.count(),
        prisma.appointment.count({ where: { status: AppointmentStatus.PENDING } }),
        prisma.breakdownRequest.count({
          where: { status: { in: [BreakdownStatus.PENDING, BreakdownStatus.IN_PROGRESS] } },
        }),
        prisma.department.count({ where: { isActive: true } }),
        prisma.fAQ.count({ where: { isPublished: true } }),
      ]);

      // Get recent appointments
      const recentAppointments = await prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: { select: { name: true } },
        },
      });

      sendSuccess(res, {
        stats: {
          totalClients,
          totalAppointments,
          pendingAppointments,
          activeBreakdowns,
          totalDepartments,
          totalFaqs,
        },
        recentAppointments,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== CLIENTS ====================

  /**
   * Get all clients
   * GET /api/v1/admin/clients
   */
  async getClients(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const { clients, total } = await userService.getAllClients({ page, limit, search });
      sendPaginated(res, clients, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle client status
   * PUT /api/v1/admin/clients/:id/toggle-status
   */
  async toggleClientStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const client = await userService.toggleUserStatus(id);
      sendSuccess(res, client, 'Client status updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending clients
   * GET /api/v1/admin/clients/pending
   */
  async getPendingClients(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { clients, total } = await userService.getPendingClients({ page, limit });
      sendPaginated(res, clients, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve client
   * PUT /api/v1/admin/clients/:id/approve
   */
  async approveClient(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const approvedBy = req.user?.id || '';
      const client = await authService.approveUser(id, approvedBy);
      sendSuccess(res, client, 'Client approved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject client
   * PUT /api/v1/admin/clients/:id/reject
   */
  async rejectClient(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const rejectedBy = req.user?.id || '';

      if (!reason || reason.trim().length === 0) {
        throw new AppError('Rejection reason is required', 400);
      }

      const client = await authService.rejectUser(id, reason, rejectedBy);
      sendSuccess(res, client, 'Client rejected successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==================== EMPLOYEES ====================

  /**
   * Get all employees
   * GET /api/v1/admin/employees
   */
  async getEmployees(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;

      const { employees, total } = await userService.getAllEmployees({ page, limit, search });
      sendPaginated(res, employees, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create employee
   * POST /api/v1/admin/employees
   */
  async createEmployee(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Both ADMIN and SUPER_ADMIN can create employees
      if (req.user?.role !== Role.ADMIN && req.user?.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenError('Only Admin and Super Admin can create employees');
      }

      const { name, email, phone, password, role, customRoleId } = req.body;
      const createdBy = req.user?.id || '';

      const employee = await authService.createInternalUser(
        { name, email, phone, password, role: role || Role.USER, customRoleId },
        createdBy
      );
      sendCreated(res, employee, 'Employee created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update employee
   * PUT /api/v1/admin/employees/:id
   */
  async updateEmployee(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, phone } = req.body;

      const employee = await userService.updateProfile(id, { name, phone });
      sendSuccess(res, employee, 'Employee updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle employee status
   * PUT /api/v1/admin/employees/:id/toggle-status
   */
  async toggleEmployeeStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const employee = await userService.toggleUserStatus(id);
      sendSuccess(res, employee, 'Employee status updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change employee role (SUPER_ADMIN only)
   * PUT /api/v1/admin/employees/:id/role
   */
  async changeEmployeeRole(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Only SUPER_ADMIN can change roles
      if (req.user?.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenError('Only Super Admin can change employee roles');
      }

      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      if (!Object.values(Role).includes(role)) {
        throw new ForbiddenError(`Invalid role: ${role}`);
      }

      // Prevent changing own role
      if (req.user?.id === id) {
        throw new ForbiddenError('Cannot change your own role');
      }

      const employee = await userService.changeUserRole(id, role);
      sendSuccess(res, employee, 'Employee role updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete employee
   * DELETE /api/v1/admin/employees/:id
   */
  async deleteEmployee(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if employee exists and is actually an employee
      const employee = await userService.getUserById(id);
      
      // Prevent deleting super admin
      if (employee.role === Role.SUPER_ADMIN) {
        throw new ForbiddenError('Super admin accounts cannot be deleted');
      }

      // Soft delete by setting isActive to false
      await userService.toggleUserStatus(id);
      sendSuccess(res, null, 'Employee deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==================== APPOINTMENTS ====================

  /**
   * Get all appointments
   * GET /api/v1/admin/appointments
   */
  async getAppointments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as AppointmentStatus | undefined;
      const departmentId = req.query.departmentId as string | undefined;

      const { appointments, total } = await appointmentService.getAllAppointments({
        page,
        limit,
        status,
        departmentId,
      });
      sendPaginated(res, appointments, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update appointment status
   * PUT /api/v1/admin/appointments/:id/status
   */
  async updateAppointmentStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const appointment = await appointmentService.updateAppointmentStatus(id, status);
      sendSuccess(res, appointment, 'Appointment status updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve appointment
   * PUT /api/v1/admin/appointments/:id/approve
   */
  async approveAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await appointmentService.approveAppointment(id);
      sendSuccess(res, appointment, 'Appointment approved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject appointment
   * PUT /api/v1/admin/appointments/:id/reject
   */
  async rejectAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await appointmentService.rejectAppointment(id);
      sendSuccess(res, appointment, 'Appointment rejected successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==================== DEPARTMENTS ====================

  /**
   * Get all departments (including inactive)
   * GET /api/v1/admin/departments
   */
  async getDepartments(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const departments = await departmentService.getAllDepartmentsAdmin();
      sendSuccess(res, departments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create department
   * POST /api/v1/admin/departments
   */
  async createDepartment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const department = await departmentService.createDepartment(req.body);
      sendCreated(res, department, 'Department created');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update department
   * PUT /api/v1/admin/departments/:id
   */
  async updateDepartment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const department = await departmentService.updateDepartment(id, req.body);
      sendSuccess(res, department, 'Department updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete department
   * DELETE /api/v1/admin/departments/:id
   */
  async deleteDepartment(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await departmentService.deleteDepartment(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ==================== FAQS ====================

  /**
   * Get all FAQs (including unpublished)
   * GET /api/v1/admin/faqs
   */
  async getFaqs(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const faqs = await faqService.getAllFAQsAdmin();
      sendSuccess(res, faqs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create FAQ
   * POST /api/v1/admin/faqs
   */
  async createFaq(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const faq = await faqService.createFAQ(req.body);
      sendCreated(res, faq, 'FAQ created');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update FAQ
   * PUT /api/v1/admin/faqs/:id
   */
  async updateFaq(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const faq = await faqService.updateFAQ(id, req.body);
      sendSuccess(res, faq, 'FAQ updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete FAQ
   * DELETE /api/v1/admin/faqs/:id
   */
  async deleteFaq(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await faqService.deleteFAQ(id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ==================== BREAKDOWN REQUESTS ====================

  /**
   * Get all breakdown requests
   * GET /api/v1/admin/breakdown
   */
  async getBreakdownRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as BreakdownStatus | undefined;

      const { requests, total } = await breakdownService.getAllRequests({
        page,
        limit,
        status,
      });
      sendPaginated(res, requests, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update breakdown request status
   * PUT /api/v1/admin/breakdown/:id/status
   */
  async updateBreakdownStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status, assignedTo } = req.body;
      const request = await breakdownService.updateRequestStatus(id, status, assignedTo);
      sendSuccess(res, request, 'Breakdown request status updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve breakdown request
   * PUT /api/v1/admin/breakdown/:id/approve
   */
  async approveBreakdown(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      const request = await breakdownService.approveBreakdown(id, assignedTo);
      sendSuccess(res, request, 'Breakdown request approved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject breakdown request
   * PUT /api/v1/admin/breakdown/:id/reject
   */
  async rejectBreakdown(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const request = await breakdownService.rejectBreakdown(id);
      sendSuccess(res, request, 'Breakdown request rejected successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Send notification to all users
   * POST /api/v1/admin/notifications/broadcast
   */
  async sendBroadcastNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { title, body, type } = req.body;
      const result = await notificationService.sendToAllUsers({
        title,
        body,
        type: type as NotificationType,
      });
      sendSuccess(res, result, `Notification sent to ${result.sent} users`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send notification to specific users
   * POST /api/v1/admin/notifications/send
   */
  async sendNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userIds, title, body, type } = req.body;
      const result = await notificationService.sendBroadcastNotification(userIds, {
        title,
        body,
        type: type as NotificationType,
      });
      sendSuccess(res, result, `Notification sent to ${result.sent} users`);
    } catch (error) {
      next(error);
    }
  }

  // ==================== ADMIN NOTIFICATIONS ====================

  /**
   * Get admin notifications (breakdown alerts, etc.)
   * GET /api/v1/admin/alerts
   */
  async getAdminNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      const { notifications, total, unreadCount } = await adminNotificationService.getNotifications({
        page,
        limit,
        unreadOnly,
      });

      sendSuccess(res, { notifications, unreadCount }, undefined, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark admin notification as read
   * PUT /api/v1/admin/alerts/:id/read
   */
  async markAdminNotificationRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await adminNotificationService.markAsRead(id);
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all admin notifications as read
   * PUT /api/v1/admin/alerts/read-all
   */
  async markAllAdminNotificationsRead(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await adminNotificationService.markAllAsRead();
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available permissions
   * GET /api/v1/admin/permissions
   */
  async getPermissions(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      sendSuccess(res, AVAILABLE_PERMISSIONS);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
export default adminController;




