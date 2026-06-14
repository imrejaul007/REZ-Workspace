import nodemailer, { Transporter, SendMailOptions, TestAccount } from 'nodemailer';
import { SendEmailOptions, EmailDeliveryResult, EmailTrackingData } from '../types/emailTypes';
import { EmailTemplate, DeliveryRecord, UnsubscribeRecord, isContactUnsubscribed } from '../models/Automation';
import { parseTemplate, generateUnsubscribeToken, normalizeEmail, maskSensitiveData } from '../utils/helpers';
import logger from '../utils/logger';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

interface TransporterWithTest extends Transporter {
  testAccount?: TestAccount;
}

class EmailService {
  private transporter: TransporterWithTest | null = null;
  private smtpConfig: SmtpConfig | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the email service with SMTP configuration
   */
  async initialize(config: SmtpConfig): Promise<void> {
    try {
      this.smtpConfig = config;

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.user
          ? {
              user: config.user,
              pass: config.password,
            }
          : undefined,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 10, // Max 10 messages per second
      });

      // Verify connection
      await this.transporter.verify();
      this.isInitialized = true;
      logger.info('Email service initialized successfully', {
        host: config.host,
        port: config.port,
        from: config.from,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to initialize email service', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Initialize with test account (for development/testing)
   */
  async initializeWithTestAccount(): Promise<void> {
    try {
      const testAccount = await nodemailer.createTestAccount();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        pool: true,
        maxConnections: 5,
        rateLimit: 10,
      });

      (this.transporter as TransporterWithTest).testAccount = testAccount;

      this.isInitialized = true;
      logger.info('Email service initialized with test account', {
        user: testAccount.user,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to initialize email service with test account', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.transporter !== null;
  }

  /**
   * Send an email
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailDeliveryResult> {
    if (!this.isReady() || !this.transporter || !this.smtpConfig) {
      throw new Error('Email service is not initialized');
    }

    const {
      to,
      subject,
      htmlContent,
      textContent,
      from,
      replyTo,
      attachments,
      headers,
      campaignId,
      contact,
      templateId,
      variables,
    } = options;

    const normalizedTo = normalizeEmail(to);

    // Check if contact is unsubscribed
    if (contact) {
      const isUnsubscribed = await isContactUnsubscribed({ email: normalizedTo }, 'email');
      if (isUnsubscribed) {
        logger.info('Skipping email - contact is unsubscribed', {
          to: maskSensitiveData(normalizedTo, 'email'),
        });
        return {
          success: false,
          messageId: '',
          error: 'Contact is unsubscribed',
        };
      }
    }

    // Parse template variables
    let parsedSubject = subject;
    let parsedHtml = htmlContent;
    let parsedText = textContent;

    if (variables) {
      parsedSubject = parseTemplate(subject, variables);
      parsedHtml = parseTemplate(htmlContent, variables);
      if (textContent) {
        parsedText = parseTemplate(textContent, variables);
      }
    }

    // Add unsubscribe link
    const unsubscribeToken = generateUnsubscribeToken(normalizedTo, 'email');
    const unsubscribeUrl = `${process.env.APP_URL || 'https://rezapp.com'}/unsubscribe?token=${unsubscribeToken}&channel=email`;

    // Insert unsubscribe link into HTML (before </body>)
    if (parsedHtml) {
      const unsubscribeHtml = `
        <div style="font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
          <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> from this list
        </div>
      `;
      parsedHtml = parsedHtml.replace('</body>', `${unsubscribeHtml}</body>`);

      // Add tracking pixel
      const trackingPixel = `
        <img src="${process.env.APP_URL || 'https://rezapp.com'}/api/track/open?message_id={MESSAGE_ID}&campaign=${campaignId || ''}" width="1" height="1" style="display:none" />
      `;
      parsedHtml = parsedHtml.replace('</body>', `${trackingPixel}</body>`);
    }

    const mailOptions: SendMailOptions = {
      from: from || this.smtpConfig.from,
      to: normalizedTo,
      subject: parsedSubject,
      html: parsedHtml,
      text: parsedText,
      replyTo: replyTo || this.smtpConfig.from,
      attachments: attachments
        ? attachments.map((att) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType,
            path: att.path,
          }))
        : undefined,
      headers: {
        ...headers,
        'X-Campaign-Id': campaignId || '',
        'X-Template-Id': templateId || '',
        'X-Track-Open': 'true',
        'X-Track-Click': 'true',
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      // Log delivery record
      if (campaignId && contact) {
        await DeliveryRecord.create({
          campaignId,
          contact: { email: normalizedTo, ...contact },
          channel: 'email',
          templateId,
          status: 'sent',
          sentAt: new Date(),
          metadata: {
            messageId: info.messageId,
            subject: parsedSubject,
          },
        });
      }

      logger.info('Email sent successfully', {
        to: maskSensitiveData(normalizedTo, 'email'),
        subject: parsedSubject,
        messageId: info.messageId,
        campaignId,
      });

      // Get preview URL for test accounts
      let previewUrl: string | undefined;
      if ((this.transporter as TransporterWithTest).testAccount) {
        const testAccount = (this.transporter as TransporterWithTest).testAccount!;
        previewUrl = nodemailer.getTestMessageUrl(info);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
        response: info.response,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failure
      if (campaignId && contact) {
        await DeliveryRecord.create({
          campaignId,
          contact: { email: normalizedTo, ...contact },
          channel: 'email',
          templateId,
          status: 'failed',
          failedAt: new Date(),
          errorMessage,
          metadata: {
            subject: parsedSubject,
          },
        });
      }

      logger.error('Failed to send email', {
        to: maskSensitiveData(normalizedTo, 'email'),
        subject: parsedSubject,
        error: errorMessage,
        campaignId,
      });

      return {
        success: false,
        messageId: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Send email using a template
   */
  async sendWithTemplate(
    to: string,
    templateId: string,
    variables: Record<string, string | number | boolean | null | undefined>,
    options?: {
      campaignId?: string;
      contact?: { firstName?: string; lastName?: string; userId?: string; metadata?: Record<string, unknown> };
      scheduledFor?: Date;
      priority?: number;
    }
  ): Promise<EmailDeliveryResult> {
    // Fetch template
    const template = await EmailTemplate.findById(templateId);
    if (!template) {
      return {
        success: false,
        messageId: '',
        error: 'Template not found',
      };
    }

    if (!template.isActive) {
      return {
        success: false,
        messageId: '',
        error: 'Template is not active',
      };
    }

    return this.sendEmail({
      to,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      campaignId: options?.campaignId,
      contact: options?.contact,
      templateId,
      variables,
    });
  }

  /**
   * Send bulk emails
   */
  async sendBulk(
    recipients: Array<{
      to: string;
      variables?: Record<string, string | number | boolean | null | undefined>;
    }>,
    templateId: string,
    options?: {
      campaignId?: string;
      rateLimit?: number; // Emails per second
    }
  ): Promise<{
    successful: number;
    failed: number;
    results: EmailDeliveryResult[];
  }> {
    const template = await EmailTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const results: EmailDeliveryResult[] = [];
    let successful = 0;
    let failed = 0;

    const rateLimit = options?.rateLimit || 10; // Default 10 emails per second
    const delay = 1000 / rateLimit;

    for (const recipient of recipients) {
      const result = await this.sendWithTemplate(recipient.to, templateId, recipient.variables || {}, {
        campaignId: options?.campaignId,
      });

      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Rate limiting delay
      if (delay > 0 && results.length < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    logger.info('Bulk email send completed', {
      campaignId: options?.campaignId,
      total: recipients.length,
      successful,
      failed,
    });

    return { successful, failed, results };
  }

  /**
   * Handle unsubscribe request
   */
  async handleUnsubscribe(
    email: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = normalizeEmail(email);

    // Check if already unsubscribed
    const existing = await UnsubscribeRecord.findOne({
      'contact.email': normalizedEmail,
      channel: 'email',
    });

    if (existing) {
      return {
        success: true,
        message: 'Email already unsubscribed',
      };
    }

    // Create unsubscribe record
    await UnsubscribeRecord.create({
      contact: { email: normalizedEmail },
      channel: 'email',
      reason: reason || 'User clicked unsubscribe link',
      source: 'link_click',
      unsubscribedAt: new Date(),
    });

    logger.info('Contact unsubscribed from email', {
      email: maskSensitiveData(normalizedEmail, 'email'),
    });

    return {
      success: true,
      message: 'Successfully unsubscribed',
    };
  }

  /**
   * Track email open
   */
  async trackOpen(
    messageId: string,
    campaignId?: string
  ): Promise<void> {
    try {
      const record = await DeliveryRecord.findOne({
        'metadata.messageId': messageId,
      });

      if (record && record.status === 'sent') {
        record.status = 'opened';
        record.openedAt = new Date();
        await record.save();

        if (campaignId) {
          await Campaign.updateOne(
            { _id: campaignId },
            { $inc: { openedCount: 1 } }
          );
        }

        logger.debug('Email open tracked', { messageId, campaignId });
      }
    } catch (error) {
      logger.error('Failed to track email open', { messageId, error });
    }
  }

  /**
   * Track email click
   */
  async trackClick(
    messageId: string,
    url: string,
    campaignId?: string
  ): Promise<void> {
    try {
      const record = await DeliveryRecord.findOne({
        'metadata.messageId': messageId,
      });

      if (record) {
        if (record.status === 'sent' || record.status === 'opened') {
          record.status = 'clicked';
        }
        record.clickedAt = new Date();
        record.metadata = {
          ...record.metadata,
          clickedUrls: [...((record.metadata?.clickedUrls as string[]) || []), url],
        };
        await record.save();

        if (campaignId) {
          await Campaign.updateOne(
            { _id: campaignId },
            { $inc: { clickedCount: 1 } }
          );
        }

        logger.debug('Email click tracked', { messageId, url, campaignId });
      }
    } catch (error) {
      logger.error('Failed to track email click', { messageId, error });
    }
  }

  /**
   * Handle bounced email
   */
  async handleBounce(
    email: string,
    bounceType: 'hard' | 'soft',
    bounceReason?: string
  ): Promise<void> {
    const normalizedEmail = normalizeEmail(email);

    try {
      // Update delivery records
      await DeliveryRecord.updateMany(
        {
          'contact.email': normalizedEmail,
          channel: 'email',
          status: { $in: ['sent', 'delivered', 'opened'] },
        },
        {
          status: 'bounced',
          errorMessage: `${bounceType} bounce: ${bounceReason || 'Unknown'}`,
        }
      );

      // Create unsubscribe record for hard bounces
      if (bounceType === 'hard') {
        await UnsubscribeRecord.findOneAndUpdate(
          {
            'contact.email': normalizedEmail,
            channel: 'email',
          },
          {
            contact: { email: normalizedEmail },
            channel: 'email',
            reason: `Hard bounce: ${bounceReason}`,
            source: 'bounce',
            unsubscribedAt: new Date(),
          },
          { upsert: true }
        );
      }

      logger.info('Email bounce processed', {
        email: maskSensitiveData(normalizedEmail, 'email'),
        bounceType,
      });
    } catch (error) {
      logger.error('Failed to handle bounce', { email, error });
    }
  }

  /**
   * Get email service status
   */
  getStatus(): {
    initialized: boolean;
    host?: string;
    port?: number;
    from?: string;
  } {
    if (!this.smtpConfig) {
      return { initialized: false };
    }

    return {
      initialized: this.isInitialized,
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      from: this.smtpConfig.from,
    };
  }

  /**
   * Close the email service
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.isInitialized = false;
      logger.info('Email service closed');
    }
  }
}

// Import Campaign for tracking
import { Campaign } from '../models/Automation';

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
