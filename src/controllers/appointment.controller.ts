import { Response, NextFunction } from 'express';
import appointmentService from '../services/appointment.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentQueryInput,
} from '../validators/appointment.validator.js';

export class AppointmentController {
  /**
   * Create a new appointment
   * POST /api/v1/appointments
   */
  async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = req.body as CreateAppointmentInput;
      const appointment = await appointmentService.createAppointment(
        req.user!.id,
        data
      );
      sendCreated(res, appointment, 'Appointment created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's appointments
   * GET /api/v1/appointments
   */
  async getAll(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as AppointmentQueryInput;
      const { appointments, total } = await appointmentService.getUserAppointments(
        req.user!.id,
        query
      );
      sendPaginated(
        res,
        appointments,
        query.page || 1,
        query.limit || 10,
        total
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointment by ID
   * GET /api/v1/appointments/:id
   */
  async getById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await appointmentService.getAppointmentById(
        id,
        req.user!.id
      );
      sendSuccess(res, appointment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an appointment
   * PUT /api/v1/appointments/:id
   */
  async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as UpdateAppointmentInput;
      const appointment = await appointmentService.updateAppointment(
        id,
        req.user!.id,
        data
      );
      sendSuccess(res, appointment, 'Appointment updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel an appointment
   * DELETE /api/v1/appointments/:id
   */
  async cancel(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await appointmentService.cancelAppointment(
        id,
        req.user!.id
      );
      sendSuccess(res, appointment, 'Appointment cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const appointmentController = new AppointmentController();
export default appointmentController;
