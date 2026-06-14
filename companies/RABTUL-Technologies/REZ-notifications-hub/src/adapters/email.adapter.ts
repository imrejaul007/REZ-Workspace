import nodemailer from 'nodemailer';
import { BaseAdapter } from './base.adapter';
import { Notification, SendResult } from '../types';
import { config } from '../config';
import logger from '../utils/logger';

export class EmailAdapter extends BaseAdapter {
  readonly channel = 'email';
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private initialize(): void {
    if (!config.smtp.host) {
      logger.warn('Email adapter: SMTP not configured');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });

    logger.info('Email adapter initialized');
  }

  async send(notification: Notification): Promise<SendResult> {
    if (!this.transporter) {
      return this.createFailureResult('Email service not configured');
    }

    const recipientEmail = this.getRecipientEmail(notification);
    if (!recipientEmail) {
      return this.createFailureResult('No recipient email provided');
    }

    const content = this.parseContent(notification.renderedContent);

    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to: recipientEmail,
        subject: content.subject || 'REZ Platform Notification',
        text: content.body,
        html: content.htmlBody || this.textToHtml(content.body),
      });

      logger.info('Email sent successfully', {
        notificationId: notification.id,
        messageId: info.messageId,
      });

      return this.createSuccessResult(info.messageId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Email send failed', {
        notificationId: notification.id,
        error: errorMessage,
      });

      return this.createFailureResult(errorMessage);
    }
  }

  private getRecipientEmail(notification: Notification): string | undefined {
    return notification.metadata?.recipientEmail as string | undefined;
  }

  private parseContent(content: string): { subject?: string; body: string; htmlBody?: string } {
    // Content format: "Subject: ...\n\nBody: ..."
    const subjectMatch = content.match(/^Subject:\s*(.+?)\n/i);
    const bodyMatch = content.match(/\n\n([\s\S]+)$/);

    return {
      subject: subjectMatch?.[1],
      body: bodyMatch?.[1] || content,
      htmlBody: content.includes('<') ? bodyMatch?.[1] : undefined,
    };
  }

  private textToHtml(text: string): string {
    return text
      .split('\n')
      .map((line) => `<p>${line || '&nbsp;'}</p>`)
      .join('');
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
