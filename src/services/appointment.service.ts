import { Appointment, AppointmentStatus } from '@prisma/client';
import prisma from './prisma.service.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import { CreateAppointmentInput, UpdateAppointmentInput, AppointmentQueryInput } from '../validators/appointment.validator.js';

export class AppointmentService {
  /**
   * Create a new appointment
   */
  async createAppointment(
    userId: string,
    data: CreateAppointmentInput
  ): Promise<Appointment> {
    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new NotFoundError('Department');
    }

    if (!department.isActive) {
      throw new ForbiddenError('Department is not active');
    }

    // Parse dateTime
    const dateTime = new Date(data.dateTime);

    // Check if date is in the past
    if (dateTime < new Date()) {
      throw new ForbiddenError('Cannot create appointment in the past');
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        departmentId: data.departmentId,
        dateTime,
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
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    logger.info('Appointment created', { appointmentId: appointment.id, userId });

    return appointment;
  }

  /**
   * Get user's appointments with pagination and filters
   */
  async getUserAppointments(
    userId: string,
    query: AppointmentQueryInput
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const { page = 1, limit = 10, status, departmentId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      ...(status && { status }),
      ...(departmentId && { departmentId }),
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateTime: 'desc' },
        include: {
          department: true,
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { appointments, total };
  }

  /**
   * Get appointment by ID
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
    data: UpdateAppointmentInput
  ): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment');
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenError('You do not have access to this appointment');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new ForbiddenError('Cannot update a completed appointment');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ForbiddenError('Cannot update a cancelled appointment');
    }

    // If department is being updated, verify it exists
    if (data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        throw new NotFoundError('Department');
      }

      if (!department.isActive) {
        throw new ForbiddenError('Department is not active');
      }
    }

    // Parse dateTime if provided
    const updateData: any = { ...data };
    if (data.dateTime) {
      const dateTime = new Date(data.dateTime);
      if (dateTime < new Date()) {
        throw new ForbiddenError('Cannot update appointment to a past date');
      }
      updateData.dateTime = dateTime;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
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

    logger.info('Appointment updated', { appointmentId, userId });

    return updatedAppointment;
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    appointmentId: string,
    userId: string
  ): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment');
    }

    if (appointment.userId !== userId) {
      throw new ForbiddenError('You do not have access to this appointment');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ForbiddenError('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new ForbiddenError('Cannot cancel a completed appointment');
    }

    const cancelledAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
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

    logger.info('Appointment cancelled', { appointmentId, userId });

    return cancelledAppointment;
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
