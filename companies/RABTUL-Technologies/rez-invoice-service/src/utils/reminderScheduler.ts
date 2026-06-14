import * as cron from 'node-cron';
import { InvoiceModel } from '../models/Invoice';
import { EmailService } from '../services/emailService';
import { Logger } from '../utils/logger';

export class ReminderScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private invoiceModel: InvoiceModel;
  private emailService: EmailService;
  private logger: Logger;

  constructor(invoiceModel: InvoiceModel) {
    this.invoiceModel = invoiceModel;
    this.emailService = new EmailService();
    this.logger = new Logger();
  }

  start(): void {
    if (this.cronJob) {
      this.logger.warn('Reminder scheduler is already running');
      return;
    }

    // Default: Run every day at 9 AM
    const schedule = process.env.REMINDER_SCHEDULE || '0 9 * * *';

    if (!cron.validate(schedule)) {
      this.logger.error('Invalid cron schedule', { schedule });
      return;
    }

    this.cronJob = cron.schedule(schedule, async () => {
      await this.runReminders();
    });

    this.logger.info('Reminder scheduler started', { schedule });
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.logger.info('Reminder scheduler stopped');
    }
  }

  async runReminders(): Promise<void> {
    this.logger.info('Starting reminder job');

    try {
      const overdueInvoices = await this.invoiceModel.getOverdueInvoices();
      this.logger.info(`Found ${overdueInvoices.length} overdue invoices`);

      const firstReminderDays = parseInt(process.env.FIRST_REMINDER_DAYS || '7');
      const secondReminderDays = parseInt(process.env.SECOND_REMINDER_DAYS || '14');
      const finalReminderDays = parseInt(process.env.FINAL_REMINDER_DAYS || '21');

      const today = new Date();

      for (const invoice of overdueInvoices) {
        if (!invoice.customerAddress.email) {
          this.logger.warn('No customer email for invoice', { invoiceId: invoice.id });
          continue;
        }

        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Check last reminder sent
        const lastReminder = invoice.reminders[invoice.reminders.length - 1];
        const daysSinceLastReminder = lastReminder
          ? Math.floor((today.getTime() - new Date(lastReminder.sentAt).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;

        let reminderType: 'first' | 'second' | 'final' | null = null;

        if (daysOverdue >= finalReminderDays) {
          reminderType = 'final';
        } else if (daysOverdue >= secondReminderDays && daysSinceLastReminder >= (secondReminderDays - firstReminderDays)) {
          reminderType = 'second';
        } else if (daysOverdue >= firstReminderDays && daysSinceLastReminder >= firstReminderDays) {
          reminderType = 'first';
        }

        if (reminderType) {
          try {
            const result = await this.emailService.sendReminder(
              invoice,
              reminderType,
              invoice.customerAddress.email
            );

            if (result.success) {
              await this.invoiceModel.addReminder(invoice.id, {
                sentAt: today.toISOString(),
                type: reminderType,
                recipientEmail: invoice.customerAddress.email
              });

              this.logger.info(`Sent ${reminderType} reminder`, {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                recipient: invoice.customerAddress.email
              });
            } else {
              this.logger.error(`Failed to send reminder`, {
                invoiceId: invoice.id,
                error: result.error
              });
            }
          } catch (error) {
            this.logger.error(`Error sending reminder`, {
              invoiceId: invoice.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      this.logger.info('Reminder job completed');
    } catch (error) {
      this.logger.error('Reminder job failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Manual trigger for testing
  async triggerNow(): Promise<void> {
    await this.runReminders();
  }
}
