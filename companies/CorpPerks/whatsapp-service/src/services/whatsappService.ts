import { randomBytes } from 'crypto';
import { WhatsAppSubscription, WhatsAppMessage, WhatsAppTemplate } from '../models';
import { whatsAppApiClient } from './whatsappApiClient';
import { logger } from '../utils/logger';
import type { WhatsAppMessagePayload, TemplateComponent } from './whatsappApiClient';

export class WhatsAppService {
  /**
   * Subscribe an employee to WhatsApp notifications
   */
  async subscribeEmployee(data: {
    employeeId: string;
    employeeName: string;
    phoneNumber: string;
    language?: string;
    notificationPreferences?: {
      leaveApproval?: boolean;
      attendance?: boolean;
      payroll?: boolean;
      general?: boolean;
    };
  }): Promise<{ success: boolean; subscription?: unknown; error?: string }> {
    try {
      // Validate phone number format
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(data.phoneNumber.replace(/\s/g, ''))) {
        return { success: false, error: 'Invalid phone number format' };
      }

      // Check if already subscribed
      const existing = await WhatsAppSubscription.findOne({
        employeeId: data.employeeId,
      });

      if (existing) {
        // Update existing subscription
        existing.phoneNumber = data.phoneNumber;
        existing.employeeName = data.employeeName;
        if (data.language) existing.language = data.language;
        if (data.notificationPreferences) {
          existing.notificationPreferences = {
            ...existing.notificationPreferences,
            ...data.notificationPreferences,
          };
        }
        await existing.save();
        return { success: true, subscription: existing };
      }

      // Generate unique WA Business UID
      const waBusinessUid = `wa_${randomBytes(8).toString('hex')}`;

      // Create new subscription
      const subscription = new WhatsAppSubscription({
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        phoneNumber: data.phoneNumber.replace(/\s/g, ''),
        waBusinessUid,
        isVerified: false,
        notificationPreferences: {
          leaveApproval: data.notificationPreferences?.leaveApproval ?? true,
          attendance: data.notificationPreferences?.attendance ?? true,
          payroll: data.notificationPreferences?.payroll ?? true,
          general: data.notificationPreferences?.general ?? true,
        },
        status: 'active',
        language: data.language || 'en',
      });

      await subscription.save();

      // Send welcome message
      await this.sendWelcomeMessage(subscription);

      logger.info('Employee subscribed to WhatsApp', {
        employeeId: data.employeeId,
        phoneNumber: data.phoneNumber,
      });

      return { success: true, subscription };
    } catch (error) {
      logger.error('Failed to subscribe employee:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Unsubscribe an employee from WhatsApp notifications
   */
  async unsubscribeEmployee(employeeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const subscription = await WhatsAppSubscription.findOne({ employeeId });

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      subscription.status = 'inactive';
      await subscription.save();

      logger.info('Employee unsubscribed from WhatsApp', { employeeId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to unsubscribe employee:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update subscription preferences
   */
  async updateSubscription(
    employeeId: string,
    updates: {
      notificationPreferences?: {
        leaveApproval?: boolean;
        attendance?: boolean;
        payroll?: boolean;
        general?: boolean;
      };
      status?: 'active' | 'inactive' | 'paused';
      language?: string;
    }
  ): Promise<{ success: boolean; subscription?: unknown; error?: string }> {
    try {
      const subscription = await WhatsAppSubscription.findOne({ employeeId });

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      if (updates.notificationPreferences) {
        subscription.notificationPreferences = {
          ...subscription.notificationPreferences,
          ...updates.notificationPreferences,
        };
      }
      if (updates.status) subscription.status = updates.status;
      if (updates.language) subscription.language = updates.language;

      await subscription.save();

      return { success: true, subscription };
    } catch (error) {
      logger.error('Failed to update subscription:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * List subscriptions
   */
  async listSubscriptions(filters?: {
    status?: string;
    employeeId?: string;
  }): Promise<unknown[]> {
    try {
      const query: Record<string, unknown> = {};

      if (filters?.status) query.status = filters.status;
      if (filters?.employeeId) query.employeeId = filters.employeeId;

      return await WhatsAppSubscription.find(query)
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      logger.error('Failed to list subscriptions:', error);
      return [];
    }
  }

  /**
   * Send a message to an employee
   */
  async sendMessage(data: {
    employeeId: string;
    type: 'text' | 'template' | 'interactive';
    content: {
      body: string;
      header?: string;
      footer?: string;
      buttons?: { id: string; title: string }[];
      mediaUrl?: string;
      mediaCaption?: string;
    };
    templateName?: string;
    notificationCategory?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Find subscription
      const subscription = await WhatsAppSubscription.findOne({
        employeeId: data.employeeId,
        status: 'active',
      });

      if (!subscription) {
        return { success: false, error: 'Employee not subscribed or inactive' };
      }

      // Generate message ID
      const messageId = `msg_${randomBytes(8).toString('hex')}`;

      // Create message record
      const message = new WhatsAppMessage({
        messageId,
        subscriptionId: subscription._id,
        employeeId: data.employeeId,
        phoneNumber: subscription.phoneNumber,
        direction: 'outbound',
        type: data.type,
        content: {
          body: data.content.body,
          header: data.content.header,
          footer: data.content.footer,
          buttons: data.content.buttons,
          mediaUrl: data.content.mediaUrl,
          mediaCaption: data.content.mediaCaption,
        },
        status: 'queued',
        statusHistory: [{ status: 'queued', timestamp: new Date() }],
        notificationCategory: (data.notificationCategory as 'general') || 'general',
        metadata: data.metadata,
        retryCount: 0,
      });

      await message.save();

      // Send via WhatsApp API
      let result;
      if (data.type === 'template' && data.templateName) {
        result = await whatsAppApiClient.sendTemplateMessage(
          subscription.phoneNumber,
          data.templateName,
          subscription.language,
          this.buildTemplateComponents(data.content)
        );
      } else if (data.type === 'interactive' && data.content.buttons) {
        result = await whatsAppApiClient.sendInteractiveMessage(
          subscription.phoneNumber,
          data.content.body,
          data.content.buttons,
          data.content.header ? { type: 'text', text: data.content.header } : undefined
        );
      } else {
        result = await whatsAppApiClient.sendTextMessage(
          subscription.phoneNumber,
          data.content.body
        );
      }

      // Update message status
      if (result.success && result.messageId) {
        message.waMessageId = result.messageId;
        message.status = 'sent';
        message.sentAt = new Date();
        message.statusHistory.push({ status: 'sent', timestamp: new Date() });
      } else {
        message.status = 'failed';
        message.errorMessage = result.error;
      }

      await message.save();

      // Update subscription last message time
      subscription.lastMessageAt = new Date();
      if (result.success) {
        subscription.lastNotificationAt = new Date();
      }
      await subscription.save();

      if (result.success) {
        return { success: true, messageId };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      logger.error('Failed to send message:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Send bulk messages
   */
  async sendBulkMessages(data: {
    employeeIds: string[];
    type: 'text' | 'template';
    content: { body: string; header?: string; footer?: string };
    templateName?: string;
    notificationCategory?: string;
  }): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const employeeId of data.employeeIds) {
      const result = await this.sendMessage({
        employeeId,
        type: data.type,
        content: data.content,
        templateName: data.templateName,
        notificationCategory: data.notificationCategory,
      });

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`${employeeId}: ${result.error}`);
      }
    }

    return results;
  }

  /**
   * Send leave approval notification
   */
  async sendLeaveNotification(data: {
    employeeId: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: 'approved' | 'rejected' | 'pending';
    approvedBy?: string;
    rejectionReason?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const subscription = await WhatsAppSubscription.findOne({
        employeeId: data.employeeId,
        status: 'active',
        'notificationPreferences.leaveApproval': true,
      });

      if (!subscription) {
        return { success: false, error: 'Employee not subscribed for leave notifications' };
      }

      let body: string;
      let notificationCategory: 'leave_approval' | 'leave_rejection';

      switch (data.status) {
        case 'approved':
          body = `Hi ${data.employeeName}, your ${data.leaveType} leave from ${data.startDate} to ${data.endDate} has been *APPROVED*.\n\nApproved by: ${data.approvedBy || 'HR'}`;
          notificationCategory = 'leave_approval';
          break;
        case 'rejected':
          body = `Hi ${data.employeeName}, your ${data.leaveType} leave from ${data.startDate} to ${data.endDate} has been *REJECTED*.\n\nReason: ${data.rejectionReason || 'Not specified'}\n\nPlease contact HR for more information.`;
          notificationCategory = 'leave_rejection';
          break;
        case 'pending':
          body = `Hi ${data.employeeName}, your ${data.leaveType} leave request from ${data.startDate} to ${data.endDate} is now *PENDING APPROVAL*.\n\nWe'll notify you once it's reviewed.`;
          notificationCategory = 'leave_approval';
          break;
      }

      return await this.sendMessage({
        employeeId: data.employeeId,
        type: 'text',
        content: { body, footer: 'CorpPerks HR - Reply STOP to unsubscribe' },
        notificationCategory,
        metadata: {
          leaveType: data.leaveType,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
        },
      });
    } catch (error) {
      logger.error('Failed to send leave notification:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Send attendance notification
   */
  async sendAttendanceNotification(data: {
    employeeId: string;
    employeeName: string;
    type: 'checkin_reminder' | 'checkout_reminder' | 'late_alert' | 'absent_alert';
    date: string;
    time?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const subscription = await WhatsAppSubscription.findOne({
        employeeId: data.employeeId,
        status: 'active',
        'notificationPreferences.attendance': true,
      });

      if (!subscription) {
        return { success: false, error: 'Employee not subscribed for attendance notifications' };
      }

      let body: string;
      let notificationCategory: 'attendance_checkin' | 'attendance_reminder' = 'attendance_checkin';

      switch (data.type) {
        case 'checkin_reminder':
          body = `Good morning ${data.employeeName}! Don't forget to check in today (${data.date}).\n\nReply CHECKIN to mark your attendance.`;
          notificationCategory = 'attendance_checkin';
          break;
        case 'checkout_reminder':
          body = `Hi ${data.employeeName}, it's ${data.time || '5:00 PM'}. Don't forget to check out for today (${data.date}).\n\nReply CHECKOUT to mark your attendance.`;
          notificationCategory = 'attendance_reminder';
          break;
        case 'late_alert':
          body = `Hi ${data.employeeName}, you were marked late today (${data.date}). Your arrival time was recorded.\n\nPlease ensure timely attendance.`;
          notificationCategory = 'attendance_reminder';
          break;
        case 'absent_alert':
          body = `Hi ${data.employeeName}, you have been marked absent for today (${data.date}).\n\nIf this is an error, please contact your manager or HR immediately.`;
          notificationCategory = 'attendance_reminder';
          break;
      }

      return await this.sendMessage({
        employeeId: data.employeeId,
        type: 'text',
        content: { body, footer: 'CorpPerks HR' },
        notificationCategory,
        metadata: {
          attendanceType: data.type,
          date: data.date,
          time: data.time,
        },
      });
    } catch (error) {
      logger.error('Failed to send attendance notification:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Send payroll notification
   */
  async sendPayrollNotification(data: {
    employeeId: string;
    employeeName: string;
    amount: number;
    type: 'salary_credit' | 'bonus_credit' | 'deduction_notice' | 'payslip_available';
    transactionId?: string;
    description?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const subscription = await WhatsAppSubscription.findOne({
        employeeId: data.employeeId,
        status: 'active',
        'notificationPreferences.payroll': true,
      });

      if (!subscription) {
        return { success: false, error: 'Employee not subscribed for payroll notifications' };
      }

      let body: string;
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(data.amount);

      switch (data.type) {
        case 'salary_credit':
          body = `Hi ${data.employeeName}, your salary of *${formattedAmount}* has been credited to your account${data.transactionId ? ` (Ref: ${data.transactionId})` : ''}.\n\n${data.description || 'May Salary 2026'}`;
          break;
        case 'bonus_credit':
          body = `Hi ${data.employeeName}, a bonus of *${formattedAmount}* has been credited to your account!\n\n${data.description || 'Performance Bonus'}${data.transactionId ? `\nRef: ${data.transactionId}` : ''}`;
          break;
        case 'deduction_notice':
          body = `Hi ${data.employeeName}, a deduction of *${formattedAmount}* has been made from your salary.\n\nReason: ${data.description || 'As per policy'}`;
          break;
        case 'payslip_available':
          body = `Hi ${data.employeeName}, your payslip for ${data.description || 'May 2026'} is now available.\n\nAmount: *${formattedAmount}*\n\nLog in to the HR portal to view and download.`;
          break;
      }

      return await this.sendMessage({
        employeeId: data.employeeId,
        type: 'text',
        content: { body, footer: 'CorpPerks HR - Payroll Team' },
        notificationCategory: 'payroll_credit',
        metadata: {
          payrollType: data.type,
          amount: data.amount,
          transactionId: data.transactionId,
        },
      });
    } catch (error) {
      logger.error('Failed to send payroll notification:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Handle incoming webhook message
   */
  async handleIncomingMessage(webhookData: {
    from: string;
    messageId: string;
    type: string;
    text?: { body: string };
    timestamp: string;
  }): Promise<{ success: boolean; response?: string }> {
    try {
      // Find subscription by phone number
      const subscription = await WhatsAppSubscription.findOne({
        phoneNumber: webhookData.from,
        status: 'active',
      });

      if (!subscription) {
        return { success: false, response: 'Not subscribed' };
      }

      // Store incoming message
      const messageId = `msg_${randomBytes(8).toString('hex')}`;
      const message = new WhatsAppMessage({
        messageId,
        subscriptionId: subscription._id,
        employeeId: subscription.employeeId,
        phoneNumber: subscription.phoneNumber,
        direction: 'inbound',
        type: webhookData.type as 'text',
        content: {
          body: webhookData.text?.body || '',
        },
        status: 'read',
        notificationCategory: 'bot_command',
        retryCount: 0,
      });

      await message.save();

      // Process bot commands
      const response = await this.processBotCommand(
        subscription,
        webhookData.text?.body || ''
      );

      if (response) {
        await this.sendMessage({
          employeeId: subscription.employeeId,
          type: 'text',
          content: { body: response },
          notificationCategory: 'bot_command',
        });
      }

      return { success: true, response: response ?? undefined };
    } catch (error) {
      logger.error('Failed to handle incoming message:', error);
      return { success: false };
    }
  }

  /**
   * Process bot commands from user messages
   */
  private async processBotCommand(
    subscription: typeof WhatsAppSubscription.prototype,
    text: string
  ): Promise<string | null> {
    const command = text.toUpperCase().trim();
    const parts = command.split(' ');
    const mainCommand = parts[0];

    switch (mainCommand) {
      case 'HELP':
        return `*CorpPerks HR Bot Commands:*\n\n` +
          `*LEAVE* - Check leave balance\n` +
          `*ATTENDANCE* - Check today's attendance\n` +
          `*PAYSLIP* - Get latest payslip info\n` +
          `*HOLIDAYS* - List upcoming holidays\n` +
          `*POLICY* <topic> - Get policy info\n` +
          `*STOP* - Unsubscribe from notifications\n` +
          `*HELP* - Show this menu`;

      case 'LEAVE':
        return `Hi ${subscription.employeeName}, your leave balance:\n\n` +
          `CL: 12 days\n` +
          `SL: 8 days\n` +
          `EL: 15 days\n\n` +
          `To apply for leave, use the HR portal or reply *APPLY LEAVE*`;

      case 'ATTENDANCE':
        return `Hi ${subscription.employeeName}, today's attendance:\n\n` +
          `Status: Present\n` +
          `Check-in: 9:15 AM\n` +
          `Check-out: Pending\n` +
          `Hours worked: -`;

      case 'PAYSLIP':
        return `Hi ${subscription.employeeName}, your latest payslip:\n\n` +
          `Period: May 2026\n` +
          `Gross: ₹1,95,000\n` +
          `Deductions: ₹35,000\n` +
          `Net Pay: ₹1,60,000\n\n` +
          `Download from HR Portal.`;

      case 'HOLIDAYS':
        return `*Upcoming Holidays (2026):*\n\n` +
          `Jun 15 - Eid-ul-Adha\n` +
          `Aug 15 - Independence Day\n` +
          `Oct 2 - Gandhi Jayanti\n` +
          `Nov 4 - Diwali\n` +
          `Dec 25 - Christmas\n\n` +
          `Total: 12 holidays this year`;

      case 'STOP':
        await this.unsubscribeEmployee(subscription.employeeId);
        return `You have been unsubscribed from CorpPerks HR notifications. Reply *START* to resubscribe.`;

      case 'START':
      case 'SUBSCRIBE':
        subscription.status = 'active';
        await subscription.save();
        return `Welcome back ${subscription.employeeName}! You're now subscribed to CorpPerks HR notifications. Reply *HELP* for commands.`;

      default:
        return `I didn't understand that. Reply *HELP* for available commands.`;
    }
  }

  /**
   * Get message history for an employee
   */
  async getMessageHistory(params: {
    employeeId: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<unknown[]> {
    try {
      const query: Record<string, unknown> = { employeeId: params.employeeId };

      if (params.startDate || params.endDate) {
        query.createdAt = {};
        if (params.startDate) {
          (query.createdAt as Record<string, Date>).$gte = new Date(params.startDate);
        }
        if (params.endDate) {
          (query.createdAt as Record<string, Date>).$lte = new Date(params.endDate);
        }
      }

      return await WhatsAppMessage.find(query)
        .sort({ createdAt: -1 })
        .skip(params.offset || 0)
        .limit(params.limit || 50)
        .lean();
    } catch (error) {
      logger.error('Failed to get message history:', error);
      return [];
    }
  }

  /**
   * Send welcome message to newly subscribed employee
   */
  private async sendWelcomeMessage(subscription: typeof WhatsAppSubscription.prototype): Promise<void> {
    const welcomeMessage = `Welcome to CorpPerks HR, ${subscription.employeeName}!\n\n` +
      `You'll receive important HR notifications here:\n` +
      `• Leave approvals/rejections\n` +
      `• Attendance reminders\n` +
      `• Payroll updates\n` +
      `• HR announcements\n\n` +
      `Reply *HELP* for available commands.`;

    await this.sendMessage({
      employeeId: subscription.employeeId,
      type: 'text',
      content: {
        body: welcomeMessage,
        footer: 'CorpPerks HR',
      },
      notificationCategory: 'general',
    });
  }

  /**
   * Build template components for WhatsApp API
   */
  private buildTemplateComponents(content: {
    body: string;
    header?: string;
    footer?: string;
    buttons?: { id: string; title: string }[];
  }): TemplateComponent[] {
    const components: TemplateComponent[] = [];

    if (content.header) {
      components.push({
        type: 'header',
        parameters: [{ type: 'text', text: content.header }],
      });
    }

    components.push({
      type: 'body',
      parameters: [{ type: 'text', text: content.body }],
    });

    if (content.footer) {
      components.push({
        type: 'footer',
        parameters: [{ type: 'text', text: content.footer }],
      });
    }

    if (content.buttons && content.buttons.length > 0) {
      components.push({
        type: 'buttons',
        parameters: content.buttons.map((btn) => ({
          type: 'text',
          text: btn.title,
        })),
      });
    }

    return components;
  }
}

export const whatsAppService = new WhatsAppService();
