/**
 * Template Renderer Service
 *
 * Renders dunning message templates with dynamic data.
 * Supports {{variable}} syntax for template interpolation.
 */

import { logger } from '../config/logger';
import { ReminderTemplate, DEFAULT_TEMPLATE_VARIABLES, REQUIRED_VARIABLES_BY_TYPE, TemplateType } from '../models/ReminderTemplate';

// ── Template Data Interfaces ──────────────────────────────────────────────────

export interface ITemplateData {
  supplier_name?: string;
  supplier_contact_name?: string;
  supplier_email?: string;
  supplier_phone?: string;
  po_number?: string;
  po_numbers?: string[];
  amount?: number;
  outstanding_amount?: number;
  total_amount?: number;
  due_date?: string | Date;
  days_until_due?: number;
  days_overdue?: number;
  merchant_name?: string;
  payment_link?: string;
  merchant_email?: string;
  merchant_phone?: string;
  oldest_po_number?: string;
  oldest_po_amount?: number;
  oldest_po_days_overdue?: number;
  current_date?: string;
  payment_methods?: string;
  account_details?: string;
  legal_notice_text?: string;
  [key: string]: string | number | string[] | Date | undefined;
}

// ── Template Renderer Class ────────────────────────────────────────────────────

export class TemplateRenderer {
  /**
   * Render a template string with data
   * Supports {{variable}} and {{variable|default}} syntax
   */
  static render(template: string, data: ITemplateData): string {
    if (!template) return '';

    let rendered = template;

    // Replace {{variable}} with values
    rendered = rendered.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (match, key, defaultValue) => {
      const value = this.getValue(data, key);
      if (value !== undefined && value !== null) {
        return this.formatValue(value, key);
      }
      return defaultValue || '';
    });

    return rendered;
  }

  /**
   * Get value from data object, supporting nested keys
   */
  private static getValue(data: ITemplateData, key: string): unknown {
    const value = data[key];
    if (value !== undefined) return value;

    // Try camelCase variant
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    return data[camelKey];
  }

  /**
   * Format value based on its type
   */
  private static formatValue(value: unknown, key: string): string {
    if (value === null || value === undefined) return '';

    // Format dates
    if (value instanceof Date) {
      return value.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }

    // Format numbers as currency
    if (['amount', 'outstanding_amount', 'total_amount', 'oldest_po_amount'].includes(key)) {
      return this.formatCurrency(Number(value));
    }

    // Format arrays (like po_numbers)
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return String(value);
  }

  /**
   * Format number as INR currency
   */
  static formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Render template for specific channel
   */
  static renderForChannel(
    template: ReminderTemplate | string,
    data: ITemplateData,
    channel: 'whatsapp' | 'sms' | 'email'
  ): string {
    let content = '';

    if (typeof template === 'string') {
      content = template;
    } else {
      switch (channel) {
        case 'whatsapp':
          content = template.whatsappTemplate || '';
          break;
        case 'sms':
          content = template.smsTemplate || '';
          break;
        case 'email':
          content = template.emailHtml || template.emailText || '';
          break;
      }
    }

    return this.render(content, data);
  }

  /**
   * Get available variables for a template type
   */
  static getAvailableVariables(type: TemplateType): string[] {
    const typeVars = REQUIRED_VARIABLES_BY_TYPE[type] || [];
    const optionalVars = DEFAULT_TEMPLATE_VARIABLES.filter((v) => !typeVars.includes(v));
    return [...typeVars, ...optionalVars];
  }

  /**
   * Validate that a template contains all required variables
   */
  static validateTemplate(
    template: ReminderTemplate | string,
    type: TemplateType
  ): { valid: boolean; missingVariables: string[] } {
    const required = REQUIRED_VARIABLES_BY_TYPE[type] || [];
    const content = typeof template === 'string' ? template : (template.whatsappTemplate || template.smsTemplate || template.emailHtml || '');

    const missingVariables: string[] = [];

    for (const variable of required) {
      const pattern = new RegExp(`\\{\\{${variable}(?:\\|[^}]*)?\\}\\}`, 'i');
      if (!pattern.test(content)) {
        missingVariables.push(variable);
      }
    }

    return {
      valid: missingVariables.length === 0,
      missingVariables,
    };
  }

  /**
   * Get template preview with sample data
   */
  static getPreview(
    template: ReminderTemplate,
    sampleData?: Partial<ITemplateData>
  ): ITemplatePreview {
    const defaultData: ITemplateData = {
      supplier_name: 'Acme Supplies Pvt Ltd',
      supplier_contact_name: 'Rajesh Kumar',
      supplier_email: 'rajesh@acme.in',
      supplier_phone: '+91 98765 43210',
      po_number: 'PO-20240515-0001',
      po_numbers: ['PO-20240515-0001', 'PO-20240515-0002', 'PO-20240515-0003'],
      amount: 125000,
      outstanding_amount: 125000,
      total_amount: 125000,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      days_until_due: 7,
      days_overdue: 3,
      merchant_name: 'ReZ Corporation',
      payment_link: 'https://pay.rez.money/invoice/abc123',
      merchant_email: 'payments@rez.money',
      merchant_phone: '+91 98765 00000',
      oldest_po_number: 'PO-20240501-0001',
      oldest_po_amount: 75000,
      oldest_po_days_overdue: 14,
      current_date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      payment_methods: 'UPI: @rez.money | Bank: HDFC Acc: 1234567890 | QR: scan QR code',
      account_details: 'Bank Name: HDFC Bank\nAccount Number: 1234567890\nIFSC: HDFC0001234\nAccount Name: ReZ Corporation',
      legal_notice_text: 'This is a final notice. If payment is not received within 7 days, legal action may be initiated.',
      ...sampleData,
    };

    const preview: ITemplatePreview = {
      whatsapp: '',
      sms: '',
      email: {
        subject: '',
        body: '',
      },
    };

    // Render WhatsApp preview
    if (template.whatsappTemplate) {
      preview.whatsapp = this.render(template.whatsappTemplate, defaultData);
    }

    // Render SMS preview
    if (template.smsTemplate) {
      preview.sms = this.render(template.smsTemplate, defaultData);
    }

    // Render Email preview
    if (template.subject) {
      preview.email.subject = this.render(template.subject, defaultData);
    }
    if (template.emailHtml) {
      preview.email.body = this.render(template.emailHtml, defaultData);
    } else if (template.emailText) {
      preview.email.body = this.render(template.emailText, defaultData);
    }

    return preview;
  }

  /**
   * Extract variables from a template string
   */
  static extractVariables(template: string): string[] {
    const pattern = /\{\{(\w+)(?:\|[^}]*)?\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = pattern.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * Build template data from PO and supplier information
   */
  static buildTemplateData(params: {
    supplierName?: string;
    supplierContactName?: string;
    supplierEmail?: string;
    supplierPhone?: string;
    poNumber?: string;
    poNumbers?: string[];
    totalAmount?: number;
    outstandingAmount?: number;
    dueDate?: Date;
    daysOverdue?: number;
    merchantName?: string;
    paymentLink?: string;
    merchantEmail?: string;
    merchantPhone?: string;
    oldestPoNumber?: string;
    oldestPoAmount?: number;
    oldestPoDaysOverdue?: number;
  }): ITemplateData {
    const data: ITemplateData = {};

    if (params.supplierName) data.supplier_name = params.supplierName;
    if (params.supplierContactName) data.supplier_contact_name = params.supplierContactName;
    if (params.supplierEmail) data.supplier_email = params.supplierEmail;
    if (params.supplierPhone) data.supplier_phone = params.supplierPhone;
    if (params.poNumber) data.po_number = params.poNumber;
    if (params.poNumbers) data.po_numbers = params.poNumbers;
    if (params.totalAmount) data.total_amount = params.totalAmount;
    if (params.outstandingAmount) data.outstanding_amount = params.outstandingAmount;
    if (params.dueDate) {
      data.due_date = params.dueDate;
      data.days_until_due = this.calculateDaysUntilDue(params.dueDate);
    }
    if (params.daysOverdue !== undefined) data.days_overdue = params.daysOverdue;
    if (params.merchantName) data.merchant_name = params.merchantName;
    if (params.paymentLink) data.payment_link = params.paymentLink;
    if (params.merchantEmail) data.merchant_email = params.merchantEmail;
    if (params.merchantPhone) data.merchant_phone = params.merchantPhone;
    if (params.oldestPoNumber) data.oldest_po_number = params.oldestPoNumber;
    if (params.oldestPoAmount) data.oldest_po_amount = params.oldestPoAmount;
    if (params.oldestPoDaysOverdue) data.oldest_po_days_overdue = params.oldestPoDaysOverdue;

    data.current_date = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return data;
  }

  /**
   * Calculate days until due date
   */
  private static calculateDaysUntilDue(dueDate: Date): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// ── Preview Interface ────────────────────────────────────────────────────────

export interface ITemplatePreview {
  whatsapp: string;
  sms: string;
  email: {
    subject: string;
    body: string;
  };
}

// ── Default Message Templates ─────────────────────────────────────────────────

export const DEFAULT_TEMPLATES = {
  friendly_reminder: {
    whatsapp: `Hello {{supplier_contact_name}},

This is a friendly reminder that payment for {{po_number}} is due in {{days_until_due}} days.

Amount Due: {{outstanding_amount}}
Due Date: {{due_date}}

You can make payment here: {{payment_link}}

Best regards,
{{merchant_name}}`,
    sms: `Hi {{supplier_name}}, payment of Rs. {{outstanding_amount}} for {{po_number}} is due on {{due_date}}. Pay now: {{payment_link}} - {{merchant_name}}`,
    subject: 'Payment Reminder - Due in {{days_until_due}} days',
    email: `<h2>Payment Reminder</h2>
<p>Dear {{supplier_contact_name}},</p>
<p>This is a friendly reminder that the following payment is due:</p>
<ul>
<li><strong>Invoice:</strong> {{po_number}}</li>
<li><strong>Amount:</strong> {{outstanding_amount}}</li>
<li><strong>Due Date:</strong> {{due_date}}</li>
</ul>
<p><a href="{{payment_link}}">Click here to pay now</a></p>
<p>Best regards,<br>{{merchant_name}}</p>`,
  },

  urgent_overdue: {
    whatsapp: `Urgent: {{supplier_name}},

Your payment of {{outstanding_amount}} for {{po_numbers}} is {{days_overdue}} days overdue.

Please make immediate payment to avoid further action.

Pay now: {{payment_link}}

{{merchant_name}}`,
    sms: `URGENT: {{outstanding_amount}} overdue for {{days_overdue}} days. PO: {{po_numbers}}. Pay: {{payment_link}} - {{merchant_name}}`,
    subject: 'URGENT: Payment {{days_overdue}} Days Overdue',
    email: `<h2 style="color: #dc3545;">URGENT: Payment Overdue</h2>
<p>Dear {{supplier_name}},</p>
<p>Your account has an overdue payment:</p>
<ul>
<li><strong>Outstanding:</strong> {{outstanding_amount}}</li>
<li><strong>PO Numbers:</strong> {{po_numbers}}</li>
<li><strong>Days Overdue:</strong> {{days_overdue}}</li>
</ul>
<p>Please arrange immediate payment to avoid service interruption.</p>
<p><a href="{{payment_link}}">Pay Now</a></p>`,
  },

  final_notice: {
    whatsapp: `FINAL NOTICE

{{supplier_name}},

Your outstanding balance of {{outstanding_amount}} (PO: {{po_numbers}}) is {{days_overdue}} days overdue.

This is your FINAL notice before legal action.

Payment Link: {{payment_link}}

{{merchant_name}} Legal Team`,
    sms: `FINAL NOTICE: {{outstanding_amount}} overdue for {{days_overdue}} days. Legal action pending. Pay immediately: {{payment_link}}`,
    subject: 'FINAL NOTICE - Immediate Legal Action Pending',
    email: `<h2 style="color: #721c24; background: #f8d7da; padding: 20px; text-align: center;">FINAL NOTICE</h2>
<p>Dear {{supplier_name}},</p>
<p>{{legal_notice_text}}</p>
<p><strong>Outstanding Amount:</strong> {{outstanding_amount}}</p>
<p><strong>Overdue Since:</strong> {{days_overdue}} days</p>
<p>If payment is not received within 7 days, we will initiate legal proceedings without further notice.</p>
<p><strong>Make Payment:</strong> <a href="{{payment_link}}">{{payment_link}}</a></p>`,
  },

  payment_confirmation: {
    whatsapp: `Thank you, {{supplier_name}}!

We have received your payment of {{amount}} for {{po_number}}.

Transaction Date: {{current_date}}

For unknown queries, contact us at {{merchant_email}}

- {{merchant_name}}`,
    sms: `Payment received: {{amount}} for {{po_number}}. Date: {{current_date}}. Thank you! - {{merchant_name}}`,
    subject: 'Payment Received - Thank You',
    email: `<h2>Payment Confirmation</h2>
<p>Dear {{supplier_name}},</p>
<p>Thank you for your payment. We have received:</p>
<ul>
<li><strong>Amount:</strong> {{amount}}</li>
<li><strong>Invoice:</strong> {{po_number}}</li>
<li><strong>Date:</strong> {{current_date}}</li>
</ul>
<p>We appreciate your business!</p>
<p>Best regards,<br>{{merchant_name}}</p>`,
  },
};

export default TemplateRenderer;
