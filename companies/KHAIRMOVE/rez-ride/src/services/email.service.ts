import { Injectable, Logger } from '@nestjs/common';

/**
 * Email Service - Transactional emails
 */
@Injectable()
export class EmailService {
  private logger = new Logger('EmailService');
  private sgMail = require('@sendgrid/mail');

  async send(to: string, template: string, data: any): Promise<void> {
    this.logger.log(`Email sent to ${to}: ${template}`);
    // In production: await this.sgMail.send({ to, from: 'noreply@rezride.com', templateId: template, dynamicTemplateData: data });
  }

  async sendWelcome(to: string, name: string): Promise<void> {
    await this.send(to, 'd-welcome', { name });
  }

  async sendReceipt(to: string, ride: any): Promise<void> {
    await this.send(to, 'd-receipt', ride);
  }
}
