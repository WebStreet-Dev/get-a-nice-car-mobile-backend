import * as cron from 'node-cron';
import appointmentReminderService from '../services/appointment-reminder.service.js';
import logger from '../utils/logger.js';

/**
 * Start the appointment reminder cron job
 * Runs every 15 minutes to check for due reminders
 */
export function startAppointmentReminderJob(): void {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      logger.info('Running appointment reminder job');
      await appointmentReminderService.sendDueReminders();
    } catch (error) {
      logger.error('Error in appointment reminder job', { error });
    }
  });

  // Cleanup old reminders daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Running reminder cleanup job');
      await appointmentReminderService.cleanupOldReminders();
    } catch (error) {
      logger.error('Error in reminder cleanup job', { error });
    }
  });

  logger.info('Appointment reminder cron jobs started');
}

