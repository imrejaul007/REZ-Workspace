import { Injectable, Logger } from '@nestjs/common';
import { JobData, JobProcessor } from '../job-queue.service';
import { EmailService } from '../../modules/email/email.service';

@Injectable()
export class EmailJobProcessor implements JobProcessor {
  type = 'email';
  concurrency = 5; // Process up to 5 emails concurrently

  private readonly logger = new Logger(EmailJobProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  async processor(job: JobData): Promise<unknown> {
    const { payload } = job;

    this.logger.debug(`Processing email job ${job.id} for ${payload.to}`);

    try {
      let result;

      switch (payload.type) {
        case 'welcome':
          result = await this.sendWelcomeEmail(payload);
          break;
        case 'password-reset':
          result = await this.sendPasswordResetEmail(payload);
          break;
        case 'order-confirmation':
          result = await this.sendOrderConfirmationEmail(payload);
          break;
        case 'job-application-notification':
          result = await this.sendJobApplicationNotification(payload);
          break;
        case 'notification':
          result = await this.sendNotificationEmail(payload);
          break;
        default:
          throw new Error(`Unknown email type: ${payload.type}`);
      }

      this.logger.debug(`Email job ${job.id} completed successfully`);
      return result;

    } catch (error) {
      this.logger.error(`Email job ${job.id} failed:`, error);
      throw error;
    }
  }

  private async sendWelcomeEmail(payload) {
    return this.emailService.sendEmail({
      to: payload.to,
      subject: 'Welcome to RestoPapa!',
      template: 'welcome',
      templateData: {
        userName: payload.userName,
        loginUrl: payload.loginUrl,
      },
    });
  }

  private async sendPasswordResetEmail(payload) {
    return this.emailService.sendEmail({
      to: payload.to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      templateData: {
        resetUrl: payload.resetUrl,
        userName: payload.userName,
      },
    });
  }

  private async sendOrderConfirmationEmail(payload) {
    return this.emailService.sendEmail({
      to: payload.to,
      subject: `Order Confirmation #${payload.orderNumber}`,
      template: 'order-confirmation',
      templateData: {
        orderNumber: payload.orderNumber,
        orderItems: payload.orderItems,
        totalAmount: payload.totalAmount,
        customerName: payload.customerName,
      },
    });
  }

  private async sendJobApplicationNotification(payload) {
    return this.emailService.sendEmail({
      to: payload.to,
      subject: 'New Job Application Received',
      template: 'job-application-notification',
      templateData: {
        jobTitle: payload.jobTitle,
        applicantName: payload.applicantName,
        restaurantName: payload.restaurantName,
        applicationUrl: payload.applicationUrl,
      },
    });
  }

  private async sendNotificationEmail(payload) {
    return this.emailService.sendEmail({
      to: payload.to,
      subject: payload.subject,
      template: payload.template || 'notification',
      templateData: payload.context || {},
    });
  }
}