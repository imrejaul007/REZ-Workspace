import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { randomInt } from 'crypto';

export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
}

export interface NotificationJob {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  notificationId?: string;
}

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  @Process('send')
  async handleSend(job: Job<NotificationJob>): Promise<{ success: boolean; error?: string }> {
    const { type, userId, title, message, data, actionUrl } = job.data;
    const attempts = job.attemptsMade + 1;

    this.logger.debug(
      `Attempt ${attempts}/${job.opts.attempts} for ${type} notification to user ${userId}`,
    );

    this.logger.log(`Processing job ${job.id} of type ${type} for user ${userId}`);

    try {
      switch (type) {
        case NotificationType.EMAIL:
          await this.sendEmail(userId, title, message, data);
          break;
        case NotificationType.PUSH:
          await this.sendPush(userId, title, message, data);
          break;
        case NotificationType.SMS:
          await this.sendSMS(userId, message, data);
          break;
        case NotificationType.IN_APP:
          // In-app notifications are handled by the service directly
          this.logger.debug(`In-app notification logged for user ${userId}: ${title}`);
          break;
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      this.logger.log(`Successfully sent ${type} notification to user ${userId}`);
      this.logger.log(`Job ${job.id} completed successfully for user ${userId}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send ${type} notification to user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.error(
        `Job ${job.id} failed for user ${userId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Re-throw to trigger Bull's retry mechanism
      throw error;
    }
  }

  private async sendEmail(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // TODO: Integrate with actual email service (e.g., SendGrid, AWS SES, Nodemailer)
    // For now, simulate email sending
    this.logger.debug(`Sending email to user ${userId}: ${title}`);

    // Simulate network call
    await this.simulateNetworkDelay();

    // Example integration point:
    // await this.emailService.send({
    //   to: user.email,
    //   subject: title,
    //   html: this.renderEmailTemplate(message, data),
    // });
  }

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // TODO: Integrate with Expo Push, Firebase Cloud Messaging, or similar
    this.logger.debug(`Sending push notification to user ${userId}: ${title}`);

    // Simulate network call
    await this.simulateNetworkDelay();

    // Example integration point for Expo:
    // const tokens = await this.getUserDeviceTokens(userId);
    // await this.expo.sendPushNotificationsAsync(
    //   tokens.map(token => ({
    //     to: token.token,
    //     title,
    //     body,
    //     data,
    //   }))
    // );
  }

  private async sendSMS(
    userId: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // TODO: Integrate with SMS service (e.g., Twilio, MSG91)
    this.logger.debug(`Sending SMS to user ${userId}: ${message.substring(0, 50)}...`);

    // Simulate network call
    await this.simulateNetworkDelay();

    // Example integration point for Twilio:
    // await this.twilioClient.messages.create({
    //   body: message,
    //   to: user.phone,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    // });
  }

  private async simulateNetworkDelay(): Promise<void> {
    // Simulate variable network latency (100-500ms)
    const delay = randomInt(100, 501);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
