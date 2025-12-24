import { Appointment, AppointmentStatus, NotificationType } from '@prisma/client';
import prisma from './prisma.service.js';
import logger from '../utils/logger.js';
import notificationService from './notification.service.js';

export class AppointmentReminderService {
  /**
   * Schedule reminders for an appointment
   * Creates reminder records for 24h and 1h before appointment
   */
  async scheduleReminders(appointmentId: string, appointmentDate: Date): Promise<void> {
    // Calculate reminder times
    const reminder24h = new Date(appointmentDate);
    reminder24h.setHours(reminder24h.getHours() - 24);

    const reminder1h = new Date(appointmentDate);
    reminder1h.setHours(reminder1h.getHours() - 1);

    // Only schedule if reminders are in the future
    const now = new Date();

    if (reminder24h > now) {
      await prisma.appointmentReminder.create({
        data: {
          appointmentId,
          reminderType: '24h',
          scheduledFor: reminder24h,
        },
      });
      logger.info('24h reminder scheduled', { appointmentId, scheduledFor: reminder24h });
    }

    if (reminder1h > now) {
      await prisma.appointmentReminder.create({
        data: {
          appointmentId,
          reminderType: '1h',
          scheduledFor: reminder1h,
        },
      });
      logger.info('1h reminder scheduled', { appointmentId, scheduledFor: reminder1h });
    }
  }

  /**
   * Send reminders that are due
   * Called by cron job
   */
  async sendDueReminders(): Promise<void> {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minute window

    // Find reminders that are due (within next 5 minutes) and not yet sent
    const dueReminders = await prisma.appointmentReminder.findMany({
      where: {
        sentAt: null,
        scheduledFor: {
          gte: now,
          lte: fiveMinutesFromNow,
        },
      },
      include: {
        appointment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    logger.info('Checking for due reminders', { count: dueReminders.length });

    for (const reminder of dueReminders) {
      // Only send if appointment is confirmed
      if (reminder.appointment.status !== AppointmentStatus.CONFIRMED) {
        // Mark as sent to avoid retrying
        await prisma.appointmentReminder.update({
          where: { id: reminder.id },
          data: { sentAt: now },
        });
        continue;
      }

      try {
        const appointmentDate = new Date(reminder.appointment.dateTime);
        const reminderText =
          reminder.reminderType === '24h'
            ? `You have an appointment with ${reminder.appointment.department.name} tomorrow at ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
            : `You have an appointment with ${reminder.appointment.department.name} in 1 hour at ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;

        // Create notification
        await notificationService.createNotification({
          userId: reminder.appointment.userId,
          title: 'Appointment Reminder',
          message: reminderText,
          type: NotificationType.APPOINTMENT,
          data: {
            appointmentId: reminder.appointment.id,
            departmentName: reminder.appointment.department.name,
            dateTime: appointmentDate.toISOString(),
            reminderType: reminder.reminderType,
          },
        });

        // Send push notification
        await notificationService.sendPushNotification(reminder.appointment.userId, {
          title: 'Appointment Reminder',
          body: reminderText,
        });

        // Mark reminder as sent
        await prisma.appointmentReminder.update({
          where: { id: reminder.id },
          data: { sentAt: now },
        });

        logger.info('Reminder sent', {
          reminderId: reminder.id,
          appointmentId: reminder.appointment.id,
          reminderType: reminder.reminderType,
        });
      } catch (error) {
        logger.error('Failed to send reminder', {
          reminderId: reminder.id,
          error,
        });
      }
    }
  }

  /**
   * Clean up old reminders (older than 7 days)
   */
  async cleanupOldReminders(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.appointmentReminder.deleteMany({
      where: {
        sentAt: {
          not: null,
        },
        scheduledFor: {
          lt: sevenDaysAgo,
        },
      },
    });

    if (result.count > 0) {
      logger.info('Cleaned up old reminders', { count: result.count });
    }
  }
}

export const appointmentReminderService = new AppointmentReminderService();
export default appointmentReminderService;

