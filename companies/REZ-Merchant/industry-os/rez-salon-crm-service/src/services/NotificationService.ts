import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { Customer } from '../models/Customer';
import { Interaction } from '../models/Interaction';
import { customerService } from './CustomerService';
import { v4 as uuidv4 } from 'uuid';
import { format, addDays } from 'date-fns';
import { logger } from '../utils/logger';

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Initialize email transporter
const emailTransporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  variables: string[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  variables: string[];
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ScheduledNotification {
  notificationId: string;
  customerId: string;
  type: 'birthday' | 'anniversary' | 'reminder' | 'promotion' | 'reengagement';
  channel: 'sms' | 'email' | 'both';
  scheduledFor: Date;
  content: {
    smsBody?: string;
    emailSubject?: string;
    emailBody?: string;
  };
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: Date;
}

class NotificationService {
  // Predefined SMS templates
  private smsTemplates: Map<string, SMSTemplate> = new Map([
    ['birthday', {
      id: 'birthday',
      name: 'Birthday Greeting',
      body: 'Happy Birthday, {{firstName}}! 🎂 Visit us today and enjoy a special birthday discount on unknown service. We look forward to celebrating with you!',
      variables: ['firstName'],
    }],
    ['anniversary', {
      id: 'anniversary',
      name: 'Anniversary Greeting',
      body: 'Happy Anniversary, {{firstName}}! 💕 Thank you for being a valued customer. Come celebrate with us and enjoy a special offer!',
      variables: ['firstName'],
    }],
    ['reengagement', {
      id: 'reengagement',
      name: 'Re-engagement',
      body: 'Hey {{firstName}}, we miss you! It\'s been {{daysSinceVisit}} days since your last visit. Come back and enjoy 20% off your next service.',
      variables: ['firstName', 'daysSinceVisit'],
    }],
    ['appointment_reminder', {
      id: 'appointment_reminder',
      name: 'Appointment Reminder',
      body: 'Hi {{firstName}}, this is a reminder for your appointment tomorrow at {{time}} for {{service}}. See you soon!',
      variables: ['firstName', 'time', 'service'],
    }],
    ['loyalty_reward', {
      id: 'loyalty_reward',
      name: 'Loyalty Reward',
      body: 'Congratulations, {{firstName}}! You\'ve earned a reward! Use code {{rewardCode}} for {{discount}} off your next visit. Valid until {{expiryDate}}.',
      variables: ['firstName', 'rewardCode', 'discount', 'expiryDate'],
    }],
    ['winback', {
      id: 'winback',
      name: 'Win Back',
      body: '{{firstName}}, we want you back! As a special gesture, enjoy {{discount}} off unknown service. Book now - this offer expires {{expiryDate}}.',
      variables: ['firstName', 'discount', 'expiryDate'],
    }],
  ]);

  // Predefined Email templates
  private emailTemplates: Map<string, EmailTemplate> = new Map([
    ['welcome', {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to {{salonName}}!',
      htmlBody: `
        <h1>Welcome, {{firstName}}!</h1>
        <p>Thank you for joining {{salonName}}. We're excited to have you!</p>
        <p>Here's what you can expect:</p>
        <ul>
          <li>Exclusive member discounts</li>
          <li>Personalized recommendations</li>
          <li>Easy appointment booking</li>
        </ul>
        <p><a href="{{bookingUrl}}">Book your first appointment</a></p>
      `,
      variables: ['firstName', 'salonName', 'bookingUrl'],
    }],
    ['birthday', {
      id: 'birthday',
      name: 'Birthday Email',
      subject: 'Happy Birthday, {{firstName}}! 🎂',
      htmlBody: `
        <h1>Happy Birthday, {{firstName}}!</h1>
        <p>We hope you have an amazing birthday!</p>
        <p>As our gift to you, enjoy <strong>{{discount}} off</strong> unknown service this week.</p>
        <p><a href="{{bookingUrl}}">Claim your birthday gift</a></p>
      `,
      variables: ['firstName', 'discount', 'bookingUrl'],
    }],
    ['promotional', {
      id: 'promotional',
      name: 'Promotional Email',
      subject: '{{subject}}',
      htmlBody: `
        <h1>{{title}}</h1>
        <p>{{body}}</p>
        <p>{{offerDetails}}</p>
        <p><a href="{{ctaUrl}}">{{ctaText}}</a></p>
      `,
      variables: ['title', 'body', 'offerDetails', 'ctaUrl', 'ctaText'],
    }],
  ]);

  /**
   * Send SMS to a phone number
   */
  async sendSMS(phone: string, message: string): Promise<NotificationResult> {
    if (!twilioClient) {
      logger.warn('Twilio not configured, simulating SMS send', { phone, message });
      return { success: true, messageId: `SIM-${uuidv4().slice(0, 8)}` };
    }

    try {
      const from = process.env.TWILIO_PHONE_NUMBER;
      if (!from) {
        throw new Error('TWILIO_PHONE_NUMBER not configured');
      }

      const result = await twilioClient.messages.create({
        body: message,
        from,
        to: phone,
      });

      logger.info(`SMS sent successfully`, { phone, messageId: result.sid });
      return { success: true, messageId: result.sid };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send SMS', { phone, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send Email
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    options: { textBody?: string; from?: string; replyTo?: string } = {}
  ): Promise<NotificationResult> {
    if (!emailTransporter) {
      logger.warn('SMTP not configured, simulating email send', { to, subject });
      return { success: true, messageId: `SIM-${uuidv4().slice(0, 8)}` };
    }

    try {
      const result = await emailTransporter.sendMail({
        from: options.from || process.env.SMTP_FROM || 'noreply@salon.com',
        to,
        subject,
        html: htmlBody,
        text: options.textBody,
        replyTo: options.replyTo,
      });

      logger.info(`Email sent successfully`, { to, subject, messageId: result.messageId });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send email', { to, subject, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send notification to customer via preferred channel
   */
  async sendToCustomer(
    customerId: string,
    message: string,
    options: {
      channel?: 'sms' | 'email' | 'both';
      subject?: string;
      emailHtml?: string;
      interactionType?: string;
    } = {}
  ): Promise<{ smsResult?: NotificationResult; emailResult?: NotificationResult }> {
    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    const channel = options.channel || customer.preferences.communicationChannel;
    const results: { smsResult?: NotificationResult; emailResult?: NotificationResult } = {};

    if (channel === 'sms' || channel === 'both') {
      if (customer.smsOptIn) {
        results.smsResult = await this.sendSMS(customer.phone, message);
      }
    }

    if (channel === 'email' || channel === 'both') {
      if (customer.email && customer.emailVerified) {
        results.emailResult = await this.sendEmail(
          customer.email,
          options.subject || 'Message from your salon',
          options.emailHtml || message
        );
      }
    }

    // Log notification interaction
    if (options.interactionType) {
      await this.logNotification(customerId, options.interactionType, channel, {
        channel,
        subject: options.subject,
      });
    }

    return results;
  }

  /**
   * Process birthday reminders
   */
  async processBirthdayReminders(): Promise<{ sent: number; failed: number }> {
    const birthdayCustomers = await customerService.getUpcomingBirthdays(7);
    let sent = 0;
    let failed = 0;

    for (const customer of birthdayCustomers) {
      try {
        const template = this.smsTemplates.get('birthday');
        if (!template) continue;

        const message = this.fillTemplate(template.body, {
          firstName: customer.name.split(' ')[0],
        });

        await this.sendToCustomer(customer.customerId, message, {
          channel: customer.preferences.communicationChannel,
          interactionType: 'birthday_sms_sent',
        });

        sent++;
      } catch (error) {
        logger.error(`Failed to send birthday reminder to ${customer.customerId}`, { error });
        failed++;
      }
    }

    logger.info(`Birthday reminders processed: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Process anniversary reminders
   */
  async processAnniversaryReminders(): Promise<{ sent: number; failed: number }> {
    const anniversaryCustomers = await customerService.getUpcomingAnniversaries(7);
    let sent = 0;
    let failed = 0;

    for (const customer of anniversaryCustomers) {
      try {
        const template = this.smsTemplates.get('anniversary');
        if (!template) continue;

        const message = this.fillTemplate(template.body, {
          firstName: customer.name.split(' ')[0],
        });

        await this.sendToCustomer(customer.customerId, message, {
          channel: customer.preferences.communicationChannel,
          interactionType: 'anniversary_sms_sent',
        });

        sent++;
      } catch (error) {
        logger.error(`Failed to send anniversary reminder to ${customer.customerId}`, { error });
        failed++;
      }
    }

    logger.info(`Anniversary reminders processed: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Process re-engagement reminders for at-risk customers
   */
  async processReengagementReminders(inactiveDays: number = 60): Promise<{
    sent: number;
    failed: number;
  }> {
    const atRiskCustomers = await customerService.getAtRiskCustomers(inactiveDays);
    let sent = 0;
    let failed = 0;

    for (const customer of atRiskCustomers) {
      try {
        const template = this.smsTemplates.get('reengagement');
        if (!template) continue;

        const message = this.fillTemplate(template.body, {
          firstName: customer.name.split(' ')[0],
          daysSinceVisit: customer.daysSinceLastVisit.toString(),
        });

        await this.sendToCustomer(customer.customerId, message, {
          channel: customer.preferences.communicationChannel,
          interactionType: 'reengagement_sms_sent',
        });

        sent++;
      } catch (error) {
        logger.error(`Failed to send reengagement reminder to ${customer.customerId}`, { error });
        failed++;
      }
    }

    logger.info(`Re-engagement reminders processed: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(
    recipients: { phone: string; customerId: string; variables?: Record<string, string> }[],
    templateId: string
  ): Promise<{ sent: number; failed: number; results: NotificationResult[] }> {
    const template = this.smsTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let sent = 0;
    let failed = 0;
    const results: NotificationResult[] = [];

    for (const recipient of recipients) {
      try {
        const message = this.fillTemplate(template.body, recipient.variables || {});

        const result = await this.sendSMS(recipient.phone, message);
        results.push(result);

        if (result.success) {
          sent++;

          // Log interaction
          await this.logNotification(recipient.customerId, 'promotional_email_sent', 'sms', {
            templateId,
          });
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { sent, failed, results };
  }

  /**
   * Send bulk email
   */
  async sendBulkEmail(
    recipients: { email: string; customerId: string; variables?: Record<string, string> }[],
    templateId: string,
    subject: string
  ): Promise<{ sent: number; failed: number; results: NotificationResult[] }> {
    const template = this.emailTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let sent = 0;
    let failed = 0;
    const results: NotificationResult[] = [];

    for (const recipient of recipients) {
      try {
        const variables = { ...recipient.variables };
        const htmlBody = this.fillTemplate(template.htmlBody, variables);

        const result = await this.sendEmail(recipient.email, subject, htmlBody);
        results.push(result);

        if (result.success) {
          sent++;

          await this.logNotification(recipient.customerId, 'promotional_email_sent', 'email', {
            templateId,
            subject,
          });
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { sent, failed, results };
  }

  /**
   * Get available SMS templates
   */
  getSMSTemplates(): SMSTemplate[] {
    return Array.from(this.smsTemplates.values());
  }

  /**
   * Get available email templates
   */
  getEmailTemplates(): EmailTemplate[] {
    return Array.from(this.emailTemplates.values());
  }

  /**
   * Add or update SMS template
   */
  addSMSTemplate(template: SMSTemplate): void {
    this.smsTemplates.set(template.id, template);
  }

  /**
   * Add or update email template
   */
  addEmailTemplate(template: EmailTemplate): void {
    this.emailTemplates.set(template.id, template);
  }

  // Helper methods

  private fillTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
  }

  private async logNotification(
    customerId: string,
    type: string,
    channel: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      const interaction = new Interaction({
        interactionId: `INT-${uuidv4().slice(0, 8).toUpperCase()}`,
        customerId,
        type: type as unknown,
        channel: channel === 'both' ? 'sms' : channel as unknown,
        metadata,
      });
      await interaction.save();
    } catch (error) {
      logger.error('Failed to log notification', { customerId, type, error });
    }
  }
}

export const notificationService = new NotificationService();
