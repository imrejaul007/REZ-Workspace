import cron from 'node-cron';
import { ChronicCondition, Alert } from '../models/chronicCare';
import alertService from './alertService';
import logger from '../utils/logger';

class SchedulerService {
  private jobs: cron.ScheduledTask[] = [];

  /**
   * Initialize all scheduled jobs
   */
  init(): void {
    // Run daily check for medication reminders at 8 AM
    this.jobs.push(
      cron.schedule('0 8 * * *', async () => {
        await this.checkMedicationReminders();
      })
    );

    // Run daily check for appointment reminders at 9 AM
    this.jobs.push(
      cron.schedule('0 9 * * *', async () => {
        await this.checkAppointmentReminders();
      })
    );

    // Check for concerning trends every 6 hours
    this.jobs.push(
      cron.schedule('0 */6 * * *', async () => {
        await this.checkTrends();
      })
    );

    // Clean up old acknowledged alerts daily at midnight
    this.jobs.push(
      cron.schedule('0 0 * * *', async () => {
        await this.cleanupOldAlerts();
      })
    );

    logger.info('Scheduler service initialized', {
      jobs: this.jobs.length
    });
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    for (const job of this.jobs) {
      job.stop();
    }
    this.jobs = [];
    logger.info('Scheduler service stopped');
  }

  /**
   * Check for medication reminders
   */
  private async checkMedicationReminders(): Promise<void> {
    try {
      logger.info('Running medication reminder check');

      // Get all active conditions with medications
      const conditions = await ChronicCondition.find({
        status: { $in: ['active', 'managed'] },
        'medications.0': { $exists: true }
      });

      for (const condition of conditions) {
        for (const medication of condition.medications) {
          if (medication.name && medication.frequency) {
            // Create a reminder alert
            await alertService.createMedicationReminder(
              condition.patientId,
              condition._id.toString(),
              medication.name,
              new Date()
            );
          }
        }
      }

      logger.info('Medication reminder check completed', {
        conditionsChecked: conditions.length
      });
    } catch (error) {
      logger.error('Error in medication reminder check:', error);
    }
  }

  /**
   * Check for upcoming appointments
   */
  private async checkAppointmentReminders(): Promise<void> {
    try {
      logger.info('Running appointment reminder check');

      // This would typically integrate with a calendar/appointment system
      // For now, this is a placeholder that checks for conditions that need follow-up
      const conditions = await ChronicCondition.find({
        status: { $in: ['active', 'managed'] }
      });

      for (const condition of conditions) {
        // Check if it's been more than 90 days since diagnosis or last update
        const daysSinceUpdate = Math.floor(
          (Date.now() - condition.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceUpdate > 90) {
          await alertService.createAlert({
            patientId: condition.patientId,
            conditionId: condition._id.toString(),
            type: 'appointment_due',
            severity: 'medium',
            message: `It's been ${daysSinceUpdate} days since your last ${condition.conditionType} check-up. Schedule an appointment.`,
            details: {
              lastUpdate: condition.updatedAt.toISOString(),
              daysSinceUpdate
            }
          });
        }
      }

      logger.info('Appointment reminder check completed', {
        conditionsChecked: conditions.length
      });
    } catch (error) {
      logger.error('Error in appointment reminder check:', error);
    }
  }

  /**
   * Check for concerning trends
   */
  private async checkTrends(): Promise<void> {
    try {
      logger.info('Running trend analysis');

      const conditions = await ChronicCondition.find({
        status: { $in: ['active', 'managed'] }
      });

      for (const condition of conditions) {
        // This would typically calculate trends and create alerts
        // For now, this is a simplified check
        const alert = await alertService.createTrendAlert(
          condition.patientId,
          condition._id.toString(),
          'blood_sugar', // Would be dynamic based on condition type
          'stable',
          { note: 'Scheduled trend check' }
        );

        if (alert) {
          logger.info('Trend alert created', {
            conditionId: condition._id.toString(),
            patientId: condition.patientId
          });
        }
      }

      logger.info('Trend analysis completed', {
        conditionsChecked: conditions.length
      });
    } catch (error) {
      logger.error('Error in trend analysis:', error);
    }
  }

  /**
   * Clean up old acknowledged alerts (older than 30 days)
   */
  private async cleanupOldAlerts(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Alert.deleteMany({
        acknowledged: true,
        acknowledgedAt: { $lt: thirtyDaysAgo }
      });

      if (result.deletedCount > 0) {
        logger.info('Old alerts cleaned up', {
          deletedCount: result.deletedCount
        });
      }
    } catch (error) {
      logger.error('Error cleaning up old alerts:', error);
    }
  }
}

export default new SchedulerService();
