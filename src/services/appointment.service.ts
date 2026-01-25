import { Appointment, AppointmentStatus, NotificationType } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError, ForbiddenError, AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import adminNotificationService from './admin-notification.service.js';
import notificationService from './notification.service.js';
import vcitaService from './vcita.service.js';
import appointmentReminderService from './appointment-reminder.service.js';
import emailService from './email.service.js';
import emailTemplateService from './email-template.service.js';

export class AppointmentService {
  /**
   * Create a new appointment
   * For Sales department, returns null (client should redirect to vCita)
   * For other departments, creates appointment with PENDING status
   */
  async createAppointment(
    userId: string,
    data: {
      departmentId: string;
      dateTime: string;
      vehicleOfInterest?: string;
      notes?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
    }
  ): Promise<Appointment | null> {
    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department || !department.isActive) {
      throw new NotFoundError('Department');
    }

    // Check if Sales department - return null (client should redirect to vCita)
    if (vcitaService.isSalesDepartment(department.name)) {
      logger.info('Sales appointment - redirecting to vCita', { userId, departmentId: data.departmentId });
      return null; // Signal to client to redirect to vCita
    }

    // Validate date is in the future
    const appointmentDate = new Date(data.dateTime);
    if (appointmentDate <= new Date()) {
      throw new AppError('Appointment date must be in the future');
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        departmentId: data.departmentId,
        dateTime: appointmentDate,
        vehicleOfInterest: data.vehicleOfInterest,
        notes: data.notes,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        status: AppointmentStatus.PENDING,
      },
      include: {
        department: true,
        user: {
          select: { name: true },
        },
      },
    });

    logger.info('Appointment created', { appointmentId: appointment.id, userId });

    // Send notification to admins
    logger.info('Sending admin notification for new appointment', {
      appointmentId: appointment.id,
      userName: appointment.user.name,
      departmentName: appointment.department.name,
    });
    
    adminNotificationService.notifyAppointmentCreated({
      appointmentId: appointment.id,
      userName: appointment.user.name,
      departmentName: appointment.department.name,
      dateTime: appointmentDate,
    }).catch((err) => {
      logger.error('Failed to send appointment notification', { 
        appointmentId: appointment.id,
        error: err 
      });
    });

    // Send email notification for ALL form submissions
    this.sendFormSubmissionEmail(appointment).catch((err) => {
      logger.error('Failed to send form submission email', {
        appointmentId: appointment.id,
        error: err,
      });
    });

    // Schedule reminders (will be sent when appointment is approved)
    // Reminders are scheduled when appointment status changes to CONFIRMED

    return appointment;
  }

  /**
   * Get appointments for a user
   */
  async getUserAppointments(
    userId: string,
    options: {
      page: number;
      limit: number;
      status?: AppointmentStatus;
      departmentId?: string;
    }
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const { page, limit, status, departmentId } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
      ...(departmentId && { departmentId }),
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateTime: 'asc' },
        include: {
          department: true,
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { appointments, total };
  }

  /**
   * Get a single appointment by ID
   */
  async getAppointmentById(
    appointmentId: string,
    userId: string
  ): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        department: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment');
    }

    // Check if user owns this appointment
    if (appointment.userId !== userId) {
      throw new ForbiddenError('You do not have access to this appointment');
    }

    return appointment;
  }

  /**
   * Update an appointment
   */
  async updateAppointment(
    appointmentId: string,
    userId: string,
    data: {
      departmentId?: string;
      dateTime?: string;
      vehicleOfInterest?: string | null;
      notes?: string | null;
      contactName?: string | null;
      contactEmail?: string | null;
      contactPhone?: string | null;
    }
  ): Promise<Appointment> {
    // Get existing appointment
    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existing) {
      throw new NotFoundError('Appointment');
    }

    // Check if user owns this appointment
    if (existing.userId !== userId) {
      throw new ForbiddenError('You do not have access to this appointment');
    }

    // Cannot update cancelled or completed appointments
    if (existing.status === AppointmentStatus.CANCELLED || existing.status === AppointmentStatus.COMPLETED) {
      throw new AppError('Cannot update cancelled or completed appointments');
    }

    // Verify department if being updated
    if (data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department || !department.isActive) {
        throw new NotFoundError('Department');
      }
    }

    // Validate date if being updated
    if (data.dateTime) {
      const appointmentDate = new Date(data.dateTime);
      if (appointmentDate <= new Date()) {
        throw new AppError('Appointment date must be in the future');
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.dateTime && { dateTime: new Date(data.dateTime) }),
        ...(data.vehicleOfInterest !== undefined && { vehicleOfInterest: data.vehicleOfInterest }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.contactName !== undefined && { contactName: data.contactName }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
      },
      include: {
        department: true,
      },
    });

    logger.info('Appointment updated', { appointmentId, userId });

    return appointment;
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string, userId: string): Promise<Appointment> {
    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existing) {
      throw new NotFoundError('Appointment');
    }

    // Check if user owns this appointment
    if (existing.userId !== userId) {
      throw new ForbiddenError('You do not have access to this appointment');
    }

    // Cannot cancel already cancelled or completed appointments
    if (existing.status === AppointmentStatus.CANCELLED) {
      throw new AppError('Appointment is already cancelled');
    }

    if (existing.status === AppointmentStatus.COMPLETED) {
      throw new AppError('Cannot cancel a completed appointment');
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED },
      include: {
        department: true,
      },
    });

    logger.info('Appointment cancelled', { appointmentId, userId });

    return appointment;
  }

  /**
   * Get all appointments (admin only)
   */
  async getAllAppointments(options: {
    page: number;
    limit: number;
    status?: AppointmentStatus;
    departmentId?: string;
    userId?: string;
  }): Promise<{ appointments: Appointment[]; total: number }> {
    const { page, limit, status, departmentId, userId } = options;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(departmentId && { departmentId }),
      ...(userId && { userId }),
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateTime: 'desc' },
        include: {
          department: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { appointments, total };
  }

  /**
   * Update appointment status (admin only)
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<Appointment> {
    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Appointment');
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        department: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    logger.info('Appointment status updated', { appointmentId, status });

    // Send notification to user when appointment is approved or rejected
    if (status === AppointmentStatus.CONFIRMED) {
      await notificationService.createNotification({
        userId: appointment.userId,
        title: 'Appointment Approved',
        message: `Your appointment with ${appointment.department.name} on ${new Date(appointment.dateTime).toLocaleDateString()} has been approved.`,
        type: NotificationType.APPOINTMENT_APPROVED,
        data: {
          appointmentId: appointment.id,
          departmentName: appointment.department.name,
          dateTime: appointment.dateTime.toISOString(),
        },
      }).catch((err) => {
        logger.error('Failed to send appointment approval notification', { error: err });
      });

      // Schedule reminders for confirmed appointment
      await appointmentReminderService.scheduleReminders(appointment.id, appointment.dateTime).catch((err) => {
        logger.error('Failed to schedule reminders', { appointmentId: appointment.id, error: err });
      });
    } else if (status === AppointmentStatus.CANCELLED && existing.status === AppointmentStatus.PENDING) {
      // Only send rejection notification if it was pending
      await notificationService.createNotification({
        userId: appointment.userId,
        title: 'Appointment Rejected',
        message: `Your appointment with ${appointment.department.name} has been cancelled.`,
        type: NotificationType.APPOINTMENT_REJECTED,
        data: {
          appointmentId: appointment.id,
          departmentName: appointment.department.name,
        },
      }).catch((err) => {
        logger.error('Failed to send appointment rejection notification', { error: err });
      });
    }

    return appointment;
  }

  /**
   * Approve appointment (admin only)
   */
  async approveAppointment(appointmentId: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, AppointmentStatus.CONFIRMED);
  }

  /**
   * Check if department is Service
   */
  private isServiceDepartment(departmentName: string): boolean {
    return departmentName.toLowerCase() === 'service';
  }

  /**
   * Send email notification for ALL form submissions
   * Sends to email configured in FORM_SUBMISSION_EMAIL env variable
   */
  private async sendFormSubmissionEmail(
    appointment: Appointment & {
      department: { name: string; email: string };
      user: { name: string };
    }
  ): Promise<void> {
    if (!emailService.isAvailable()) {
      logger.warn('Email service not available, skipping form submission email');
      return;
    }

    // Recipient email - configurable via FORM_SUBMISSION_EMAIL env variable
    const recipientEmail = process.env.FORM_SUBMISSION_EMAIL || 'NCmechanicshop@gmail.com';

    try {
      // Generate email template
      const { html, text } = emailTemplateService.generateFormSubmissionEmail({
        appointment,
      });

      // Get customer name for subject
      const customerName = appointment.contactName || appointment.user.name || 'Customer';
      const departmentName = appointment.department.name;

      logger.info('Preparing to send form submission email', {
        appointmentId: appointment.id,
        to: recipientEmail,
        department: departmentName,
        customerName,
      });

      // Send email
      await emailService.sendEmail(
        recipientEmail,
        `New Form Submission - ${departmentName} Department - ${customerName}`,
        html,
        text
      );

      logger.info('Form submission email sent successfully', {
        appointmentId: appointment.id,
        to: recipientEmail,
        department: departmentName,
        customerName,
      });
    } catch (error: any) {
      logger.error('Failed to send form submission email - Full error details', {
        appointmentId: appointment.id,
        to: recipientEmail,
        error: error.message,
        code: error.code,
        stack: error.stack,
        department: appointment.department.name,
      });
      // Don't throw - email failure shouldn't prevent appointment creation
      // But log it so we can debug
    }
  }

  /**
   * Reject appointment (admin only)
   */
  async rejectAppointment(appointmentId: string): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, AppointmentStatus.CANCELLED);
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;




