import logger from './utils/logger';

/**
 * Email Service
 *
 * Nodemailer-based email delivery
 */

import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';

interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, unknown>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.fromEmail = process.env.EMAIL_FROM || 'noreply@rez.app';
    this.fromName = process.env.EMAIL_FROM_NAME || 'ReZ';
  }

  async initialize(): Promise<void> {
    logger.info('Email Service initialized');
  }

  /**
   * Send email
   */
  async send(payload: EmailPayload): Promise<boolean> {
    try {
      const html = payload.html || (payload.template ? this.renderTemplate(payload.template, payload.data || {}) : '');

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: payload.to,
        subject: payload.subject,
        html,
        text: payload.text || html.replace(/<[^>]*>/g, ''),
      });

      logger.info(`Email sent to ${payload.to}`);
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  /**
   * Render Handlebars template
   */
  private renderTemplate(templateName: string, data: Record<string, unknown>): string {
    const templates: Record<string, string> = {
      streak_milestone: `
        <h1>🔥 Congratulations!</h1>
        <p>You've reached a {{streakDays}}-day streak!</p>
        <p>Keep it up and earn more rewards!</p>
      `,
      tier_upgrade: `
        <h1>⭐ You've Upgraded!</h1>
        <p>Welcome to the {{newTier}} tier!</p>
        <p>Enjoy exclusive benefits as a {{newTier}} member.</p>
      `,
      badge_earned: `
        <h1>🏆 New Badge!</h1>
        <p>You've earned the "{{badgeName}}" badge!</p>
      `,
      welcome: `
        <h1>Welcome to ReZ!</h1>
        <p>Start earning points, streaks, and badges today.</p>
      `,
    };

    const template = templates[templateName] || templates.welcome;
    const compiled = Handlebars.compile(template);
    return compiled(data);
  }

  /**
   * Send bulk emails
   */
  async sendBulk(recipients: EmailPayload[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.send(recipient);
      if (result) success++;
      else failed++;
    }

    return { success, failed };
  }
}
