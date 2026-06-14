/**
 * Notification Service
 *
 * Handles email and SMS notifications for B2B events:
 * - Purchase order alerts
 * - Payment reminders
 * - Approval requests
 * - Overdue notifications
 */

import axios from 'axios';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';
export type NotificationType =
  | 'po_created'
  | 'po_approved'
  | 'po_rejected'
  | 'po_overdue'
  | 'payment_reminder'
  | 'credit_limit_exceeded'
  | 'approval_required'
  | 'supplier_onboarded';

export interface NotificationPayload {
  merchantId: string;
  userId?: string;
  channel: NotificationChannel;
  type: NotificationType;
  data: Record<string, unknown>;
  recipient: string; // email or phone
}

// ── Email Templates ────────────────────────────────────────────────────────────

const EMAIL_TEMPLATES = {
  po_created: {
    subject: 'Purchase Order {{poNumber}} Created',
    body: `
      <h2>Purchase Order Created</h2>
      <p>Dear {{recipientName}},</p>
      <p>A new purchase order <strong>{{poNumber}}</strong> has been created for {{supplierName}}.</p>
      <table>
        <tr><td><strong>Amount:</strong></td><td>₹{{amount}}</td></tr>
        <tr><td><strong>Due Date:</strong></td><td>{{dueDate}}</td></tr>
        <tr><td><strong>Status:</strong></td><td>{{status}}</td></tr>
      </table>
      <p><a href="{{portalUrl}}">View in Portal</a></p>
    `,
  },
  po_approved: {
    subject: 'Purchase Order {{poNumber}} Approved',
    body: `
      <h2>Purchase Order Approved</h2>
      <p>Dear {{recipientName}},</p>
      <p>Purchase order <strong>{{poNumber}}</strong> has been approved.</p>
      <table>
        <tr><td><strong>Amount:</strong></td><td>₹{{amount}}</td></tr>
        <tr><td><strong>Approved By:</strong></td><td>{{approvedBy}}</td></tr>
      </table>
    `,
  },
  po_overdue: {
    subject: '⚠️ Payment Overdue - PO {{poNumber}}',
    body: `
      <h2 style="color: #dc2626;">Payment Overdue Notice</h2>
      <p>Dear {{recipientName}},</p>
      <p>Payment for purchase order <strong>{{poNumber}}</strong> is overdue.</p>
      <table>
        <tr><td><strong>Amount Due:</strong></td><td>₹{{amountDue}}</td></tr>
        <tr><td><strong>Due Date:</strong></td><td>{{dueDate}}</td></tr>
        <tr><td><strong>Days Overdue:</strong></td><td>{{daysOverdue}}</td></tr>
      </table>
      <p>Please process payment at the earliest to maintain supplier relations.</p>
      <p><a href="{{portalUrl}}">Pay Now</a></p>
    `,
  },
  payment_reminder: {
    subject: 'Payment Reminder - PO {{poNumber}} due {{dueDate}}',
    body: `
      <h2>Payment Reminder</h2>
      <p>Dear {{recipientName}},</p>
      <p>This is a reminder that payment for <strong>{{poNumber}}</strong> is due on {{dueDate}}.</p>
      <table>
        <tr><td><strong>Amount:</strong></td><td>₹{{amount}}</td></tr>
        <tr><td><strong>Supplier:</strong></td><td>{{supplierName}}</td></tr>
      </table>
    `,
  },
  approval_required: {
    subject: 'Action Required: Approve PO {{poNumber}}',
    body: `
      <h2>Approval Required</h2>
      <p>Dear {{recipientName}},</p>
      <p>Purchase order <strong>{{poNumber}}</strong> requires your approval.</p>
      <table>
        <tr><td><strong>Amount:</strong></td><td>₹{{amount}}</td></tr>
        <tr><td><strong>Supplier:</strong></td><td>{{supplierName}}</td></tr>
        <tr><td><strong>Created By:</strong></td><td>{{createdBy}}</td></tr>
      </table>
      <p><a href="{{portalUrl}}/approve/{{poId}}">Review & Approve</a></p>
    `,
  },
  credit_limit_exceeded: {
    subject: '⚠️ Credit Limit Exceeded',
    body: `
      <h2 style="color: #dc2626;">Credit Limit Alert</h2>
      <p>Dear {{recipientName}},</p>
      <p>Credit limit has been exceeded for supplier <strong>{{supplierName}}</strong>.</p>
      <table>
        <tr><td><strong>Credit Limit:</strong></td><td>₹{{creditLimit}}</td></tr>
        <tr><td><strong>Current Usage:</strong></td><td>₹{{creditUsed}}</td></tr>
        <tr><td><strong>Over by:</strong></td><td>₹{{overAmount}}</td></tr>
      </table>
    `,
  },
};

// ── SMS Templates ─────────────────────────────────────────────────────────────

const SMS_TEMPLATES = {
  po_overdue: 'ReZ: Payment overdue for PO {{poNumber}}. Amount: ₹{{amountDue}}. Days overdue: {{daysOverdue}}. Pay now: {{portalUrl}}',
  payment_reminder: 'ReZ: Payment reminder - PO {{poNumber}} due {{dueDate}}. Amount: ₹{{amount}}. From: {{supplierName}}',
  po_approved: 'ReZ: PO {{poNumber}} approved. Amount: ₹{{amount}}. Thank you!',
  approval_required: 'ReZ: Approval needed for PO {{poNumber}} - ₹{{amount}}. {{portalUrl}}',
};

// ── Configuration ─────────────────────────────────────────────────────────────

const EMAIL_API_URL = process.env.EMAIL_API_URL || 'https://api.rezapp.com/notifications/email';
const SMS_API_URL = process.env.SMS_API_URL || 'https://api.rezapp.com/notifications/sms';
const PORTAL_BASE_URL = process.env.PORTAL_BASE_URL || 'https://app.rezapp.com';

// ── Helper Functions ───────────────────────────────────────────────────────────

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] || ''));
}

function getEmailTemplate(type: NotificationType) {
  return EMAIL_TEMPLATES[type] || EMAIL_TEMPLATES.po_created;
}

function getSmsTemplate(type: NotificationType) {
  return SMS_TEMPLATES[type as keyof typeof SMS_TEMPLATES] || SMS_TEMPLATES.payment_reminder;
}

// ── Email Service ──────────────────────────────────────────────────────────────

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await axios.post(
      EMAIL_API_URL,
      {
        to: [to],
        subject,
        html: body,
        from: 'ReZ Merchant <noreply@rezapp.com>',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
        },
        timeout: 10000,
      }
    );

    logger.info(`[Notification] Email sent to ${to}`, { messageId: response.data?.id });
    return { success: true, messageId: response.data?.id };
  } catch (err) {
    const error = err as Error;
    logger.error(`[Notification] Email failed to ${to}`, { error: error.message });
    return { success: false, error: error.message };
  }
}

// ── SMS Service ───────────────────────────────────────────────────────────────

export async function sendSms(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Format phone number
    const phone = to.startsWith('+') ? to : `+91${to}`;

    const response = await axios.post(
      SMS_API_URL,
      {
        to: phone,
        message,
        sender: 'REZAPP',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
        },
        timeout: 10000,
      }
    );

    logger.info(`[Notification] SMS sent to ${phone}`, { messageId: response.data?.id });
    return { success: true, messageId: response.data?.id };
  } catch (err) {
    const error = err as Error;
    logger.error(`[Notification] SMS failed to ${to}`, { error: error.message });
    return { success: false, error: error.message };
  }
}

// ── Notification Builder ───────────────────────────────────────────────────────

export class NotificationBuilder {
  private payload: Partial<NotificationPayload>;

  constructor() {
    this.payload = {};
  }

  merchant(merchantId: string): this {
    this.payload.merchantId = merchantId;
    return this;
  }

  user(userId: string): this {
    this.payload.userId = userId;
    return this;
  }

  channel(channel: NotificationChannel): this {
    this.payload.channel = channel;
    return this;
  }

  recipient(recipient: string): this {
    this.payload.recipient = recipient;
    return this;
  }

  data(data: Record<string, unknown>): this {
    this.payload.data = data;
    return this;
  }

  async send(type: NotificationType): Promise<void> {
    if (!this.payload.recipient || !this.payload.channel) {
      logger.warn('[Notification] Missing recipient or channel');
      return;
    }

    this.payload.type = type;
    this.payload.data = { ...this.payload.data, portalUrl: PORTAL_BASE_URL };

    if (this.payload.channel === 'email') {
      const template = getEmailTemplate(type);
      const subject = interpolate(template.subject, this.payload.data);
      const body = interpolate(template.body, this.payload.data);
      await sendEmail(this.payload.recipient, subject, body);
    } else if (this.payload.channel === 'sms') {
      const template = getSmsTemplate(type);
      const message = interpolate(template, this.payload.data);
      await sendSms(this.payload.recipient, message);
    }
  }
}

// ── Pre-built Notification Functions ───────────────────────────────────────────

export async function notifyPOOverdue(
  recipient: string,
  data: {
    poNumber: string;
    amountDue: number;
    dueDate: string;
    daysOverdue: number;
    recipientName: string;
  }
): Promise<void> {
  const builder = new NotificationBuilder()
    .channel('email')
    .recipient(recipient)
    .data(data);
  await builder.send('po_overdue');

  // Also send SMS for urgent alerts
  const smsBuilder = new NotificationBuilder()
    .channel('sms')
    .recipient(recipient)
    .data(data);
  await smsBuilder.send('po_overdue');
}

export async function notifyPaymentReminder(
  recipient: string,
  data: {
    poNumber: string;
    amount: number;
    dueDate: string;
    supplierName: string;
    recipientName: string;
  }
): Promise<void> {
  const builder = new NotificationBuilder()
    .channel('email')
    .recipient(recipient)
    .data(data);
  await builder.send('payment_reminder');
}

export async function notifyPOApproved(
  recipient: string,
  data: {
    poNumber: string;
    amount: number;
    approvedBy: string;
    recipientName: string;
  }
): Promise<void> {
  const builder = new NotificationBuilder()
    .channel('email')
    .recipient(recipient)
    .data(data);
  await builder.send('po_approved');
}

export async function notifyApprovalRequired(
  recipient: string,
  data: {
    poNumber: string;
    amount: number;
    supplierName: string;
    createdBy: string;
    poId: string;
    recipientName: string;
  }
): Promise<void> {
  const builder = new NotificationBuilder()
    .channel('email')
    .recipient(recipient)
    .data(data);
  await builder.send('approval_required');
}

export async function notifyCreditLimitExceeded(
  recipient: string,
  data: {
    supplierName: string;
    creditLimit: number;
    creditUsed: number;
    overAmount: number;
    recipientName: string;
  }
): Promise<void> {
  const builder = new NotificationBuilder()
    .channel('email')
    .recipient(recipient)
    .data(data);
  await builder.send('credit_limit_exceeded');
}

export async function notifyPOCreated(
  recipient: string,
  data: {
    poNumber: string;
    supplierName: string;
    amount: number;
    dueDate: string;
    status: string;
    recipientName: string;
  }
): Promise<void> {
  const builder = new NotificationBuilder()
    .channel('email')
    .recipient(recipient)
    .data(data);
  await builder.send('po_created');
}
