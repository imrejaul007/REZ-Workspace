import * as nodemailer from 'nodemailer';
import { Invoice, SendInvoiceEmailInput } from '../types';
import { PDFService } from './pdfService';

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
  cid?: string;
}

interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;
  private pdfService: PDFService;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    this.fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || '';
    this.fromName = process.env.COMPANY_NAME || 'Invoice Service';
    this.pdfService = new PDFService();
  }

  async sendInvoice(invoice: Invoice, options: SendInvoiceEmailInput): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const toEmails = Array.isArray(options.to) ? options.to : [options.to];

      const emailOptions: EmailOptions = {
        to: toEmails,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject || `Invoice ${invoice.invoiceNumber} from ${invoice.businessName}`,
        html: this.generateInvoiceEmailHTML(invoice, options.message),
        attachments: []
      };

      if (options.attachPdf !== false) {
        const pdfBuffer = await this.pdfService.generateInvoicePDF(invoice);
        emailOptions.attachments!.push({
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
          cid: 'invoice-pdf'
        });
      }

      const result = await this.sendEmail(emailOptions);

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendReminder(
    invoice: Invoice,
    reminderType: 'first' | 'second' | 'final' | 'custom',
    recipientEmail: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const reminderMessages = {
      first: {
        subject: `Reminder: Invoice ${invoice.invoiceNumber} Payment Due`,
        message: `This is a friendly reminder that your invoice ${invoice.invoiceNumber} for ${this.formatCurrency(invoice.amountDue)} is now due. Please process the payment at your earliest convenience.`
      },
      second: {
        subject: `Second Reminder: Invoice ${invoice.invoiceNumber} Overdue`,
        message: `Your payment for invoice ${invoice.invoiceNumber} of ${this.formatCurrency(invoice.amountDue)} is overdue. Please make the payment immediately to avoid any late fees.`
      },
      final: {
        subject: `FINAL NOTICE: Invoice ${invoice.invoiceNumber} Payment Required`,
        message: `This is a final notice for invoice ${invoice.invoiceNumber} with an outstanding amount of ${this.formatCurrency(invoice.amountDue)}. Please make immediate payment to maintain your business relationship.`
      },
      custom: {
        subject: `Regarding Invoice ${invoice.invoiceNumber}`,
        message: `We would like to follow up on invoice ${invoice.invoiceNumber} with an outstanding amount of ${this.formatCurrency(invoice.amountDue)}.`
      }
    };

    const template = reminderMessages[reminderType];

    try {
      const emailOptions: EmailOptions = {
        to: recipientEmail,
        subject: template.subject,
        html: this.generateReminderEmailHTML(invoice, template.message, reminderType),
        attachments: []
      };

      // Always attach PDF for reminders
      const pdfBuffer = await this.pdfService.generateInvoicePDF(invoice);
      emailOptions.attachments!.push({
        filename: `Invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });

      const result = await this.sendEmail(emailOptions);

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendBulkReminders(
    invoices: Invoice[],
    reminderType: 'first' | 'second' | 'final'
  ): Promise<Array<{ invoiceId: string; success: boolean; error?: string }>> {
    const results: Array<{ invoiceId: string; success: boolean; error?: string }> = [];

    for (const invoice of invoices) {
      if (invoice.customerAddress.email) {
        const result = await this.sendReminder(invoice, reminderType, invoice.customerAddress.email);
        results.push({
          invoiceId: invoice.id,
          success: result.success,
          error: result.error
        });
      } else {
        results.push({
          invoiceId: invoice.id,
          success: false,
          error: 'No customer email address'
        });
      }
    }

    return results;
  }

  private async sendEmail(options: EmailOptions): Promise<{ messageId: string }> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'Invoice Service v1.0'
      }
    };

    return await this.transporter.sendMail(mailOptions) as { messageId: string };
  }

  private generateInvoiceEmailHTML(invoice: Invoice, customMessage?: string): string {
    const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const amountDue = this.formatCurrency(invoice.amountDue);
    const totalAmount = this.formatCurrency(invoice.totalAmount);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${invoice.color || '#2563eb'}; padding: 30px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${invoice.businessName}</h1>
              <p style="margin: 5px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">GST Tax Invoice</p>
            </td>
          </tr>

          <!-- Invoice Details -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 5px; color: #1f2937; font-size: 20px;">Invoice ${invoice.invoiceNumber}</h2>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                    </p>
                    <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
                      Due Date: ${dueDateFormatted}
                    </p>
                  </td>
                  <td align="right">
                    <table cellpadding="5" cellspacing="0" style="background-color: #f3f4f6; border-radius: 4px;">
                      <tr>
                        <td style="padding: 10px 15px; text-align: center;">
                          <p style="margin: 0; color: #6b7280; font-size: 12px;">AMOUNT DUE</p>
                          <p style="margin: 5px 0 0; color: #1f2937; font-size: 18px; font-weight: 600;">${amountDue}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bill To -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <h3 style="margin: 0 0 10px; color: #1f2937; font-size: 14px; font-weight: 600;">BILL TO</h3>
              <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 500;">${invoice.customerName}</p>
              <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
                ${invoice.customerAddress.line1}<br>
                ${invoice.customerAddress.line2 ? invoice.customerAddress.line2 + '<br>' : ''}
                ${invoice.customerAddress.city}, ${invoice.customerAddress.state} ${invoice.customerAddress.postalCode}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Invoice Summary -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="10" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 4px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="text-align: left; color: #374151; font-size: 12px; font-weight: 600; padding: 10px;">Description</th>
                    <th style="text-align: right; color: #374151; font-size: 12px; font-weight: 600; padding: 10px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="color: #1f2937; font-size: 14px; padding: 10px;">
                      Invoice Total (${invoice.items.length} item${invoice.items.length > 1 ? 's' : ''})
                    </td>
                    <td style="text-align: right; color: #1f2937; font-size: 14px; padding: 10px;">${totalAmount}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="color: #374151; font-size: 12px; padding: 10px;">Amount Paid</td>
                    <td style="text-align: right; color: #059669; font-size: 12px; padding: 10px;">-${this.formatCurrency(invoice.amountPaid)}</td>
                  </tr>
                  <tr style="background-color: ${invoice.color || '#2563eb'};">
                    <td style="color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px;">Balance Due</td>
                    <td style="text-align: right; color: #ffffff; font-size: 16px; font-weight: 600; padding: 12px;">${amountDue}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Message -->
          ${customMessage ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="background-color: #f9fafb; border-radius: 4px; padding: 15px;">
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${customMessage}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Payment Button -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="#" style="display: inline-block; background-color: ${invoice.color || '#2563eb'}; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 14px; font-weight: 600;">Pay Now</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Thank you for your business!</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                ${invoice.businessName}<br>
                ${invoice.businessAddress.line1}, ${invoice.businessAddress.city}<br>
                ${invoice.businessGstin ? `GSTIN: ${invoice.businessGstin}<br>` : ''}
                Questions? Reply to this email or contact us at ${invoice.businessAddress.email || 'support@company.com'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private generateReminderEmailHTML(invoice: Invoice, message: string, reminderType: string): string {
    const urgencyColors: Record<string, string> = {
      first: '#059669',
      second: '#d97706',
      final: '#dc2626'
    };

    const urgencyLabels: Record<string, string> = {
      first: 'Payment Reminder',
      second: 'Second Reminder',
      final: 'Final Notice'
    };

    const color = urgencyColors[reminderType] || invoice.color || '#2563eb';
    const label = urgencyLabels[reminderType] || 'Reminder';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment ${label}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${color}; padding: 30px; text-align: center;">
              <h1 style="margin: 0 0 5px; color: #ffffff; font-size: 24px; font-weight: 600;">${label}</h1>
              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Invoice ${invoice.invoiceNumber}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Dear ${invoice.customerName},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 14px; line-height: 1.6;">
                ${message}
              </p>

              <!-- Amount Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 5px; color: #991b1b; font-size: 14px; font-weight: 500;">OUTSTANDING AMOUNT</p>
                    <p style="margin: 0; color: #dc2626; font-size: 28px; font-weight: 700;">${this.formatCurrency(invoice.amountDue)}</p>
                    <p style="margin: 10px 0 0; color: #6b7280; font-size: 12px;">
                      Original Amount: ${this.formatCurrency(invoice.totalAmount)} |
                      Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 14px; font-weight: 600;">Make Payment Now</a>
              </div>

              <p style="margin: 20px 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                If you have already made the payment, please disregard this notice or reply to this email with your payment details.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                ${invoice.businessName}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Questions? Contact us at ${invoice.businessAddress.email || 'support@company.com'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private formatCurrency(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

export const emailService = new EmailService();
