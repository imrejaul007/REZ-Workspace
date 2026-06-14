/**
 * ReZ Upsell - Email Sequence Service
 *
 * Automated email sequences for cart recovery and upsells.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preview: string;
  body: string;
  type: 'cart_recovery' | 'upsell' | 'welcome' | 'winback';
}

export interface EmailSequence {
  id: string;
  name: string;
  trigger: 'cart_abandoned' | 'order_placed' | 'purchase' | 'inactive';
  emails: SequenceEmail[];
  active: boolean;
}

export interface SequenceEmail {
  delay: number; // minutes after trigger
  templateId: string;
  subject: string;
  body: string;
  active: boolean;
}

export interface EmailJob {
  id: string;
  shop: string;
  customerId: string;
  customerEmail: string;
  sequenceId: string;
  emailIndex: number;
  scheduledAt: Date;
  sentAt?: Date;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
}

// Pre-built email templates
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  cart_recovery_1: {
    id: 'cart_recovery_1',
    name: 'Cart Recovery - First Reminder',
    subject: "You left something behind 🛒",
    preview: "Complete your order before it's gone!",
    body: `
Hi {{customer_name}},

We noticed you left some items in your cart:

{{cart_items}}

Total: {{cart_total}}

Don't worry - we saved your cart! Complete your purchase now:

{{checkout_link}}

Best,
{{shop_name}}
    `.trim(),
  },
  cart_recovery_2: {
    id: 'cart_recovery_2',
    name: 'Cart Recovery - Second Reminder',
    subject: "Still thinking? Here's a little something for you 🎁",
    preview: "Don't miss out on your items!",
    body: `
Hi {{customer_name}},

Just a friendly reminder - your cart is still waiting!

{{cart_items}}

Total: {{cart_total}}

As a thank you for coming back, use code {{discount_code}} for {{discount_value}} off your order!

{{checkout_link}}

This offer expires in 24 hours.

Best,
{{shop_name}}
    `.trim(),
  },
  cart_recovery_3: {
    id: 'cart_recovery_3',
    name: 'Cart Recovery - Final Notice',
    subject: "Last chance! Your cart expires tomorrow 😢",
    preview: "Final reminder - your items won't be reserved forever",
    body: `
Hi {{customer_name}},

This is your final reminder - your cart items will be released tomorrow!

{{cart_items}}

Total: {{cart_total}}

Complete your order now before your items sell out:

{{checkout_link}}

We'd hate to see you miss out!

Best,
{{shop_name}}
    `.trim(),
  },
  order_thank_you: {
    id: 'order_thank_you',
    name: 'Thank You - Order Confirmation',
    subject: "Your order is confirmed! 🎉",
    preview: "Thank you for your purchase",
    body: `
Hi {{customer_name}},

Thank you for your order! Here are the details:

Order #{{order_number}}
{{order_items}}

Total: {{order_total}}

{{shipping_info}}

We'll send you tracking info as soon as your order ships.

Best,
{{shop_name}}
    `.trim(),
  },
  upsell_followup: {
    id: 'upsell_followup',
    name: 'Upsell - Post Purchase',
    subject: "Complete your look with these picks 👇",
    preview: "You might also like...",
    body: `
Hi {{customer_name}},

Thanks for your recent purchase! Based on what you bought, we thought you'd love these:

{{upsell_products}}

Use code {{discount_code}} for {{discount_value}} off!

{{upsell_link}}

Best,
{{shop_name}}
    `.trim(),
  },
  winback_30: {
    id: 'winback_30',
    name: 'Win-back - 30 Days Inactive',
    subject: "We miss you! Here's 15% off 🥺",
    preview: "It's been a while - come back!",
    body: `
Hi {{customer_name}},

It's been a while since your last visit. We miss you!

As a special welcome back offer, use code {{discount_code}} for {{discount_value}} off your next order.

{{shop_link}}

Hope to see you soon!

Best,
{{shop_name}}
    `.trim(),
  },
};

// Pre-built sequences
export const EMAIL_SEQUENCES: Record<string, EmailSequence> = {
  cart_recovery: {
    id: 'cart_recovery',
    name: 'Cart Recovery Sequence',
    trigger: 'cart_abandoned',
    active: true,
    emails: [
      {
        delay: 60, // 1 hour
        templateId: 'cart_recovery_1',
        subject: EMAIL_TEMPLATES.cart_recovery_1.subject,
        body: EMAIL_TEMPLATES.cart_recovery_1.body,
        active: true,
      },
      {
        delay: 180, // 3 hours
        templateId: 'cart_recovery_2',
        subject: EMAIL_TEMPLATES.cart_recovery_2.subject,
        body: EMAIL_TEMPLATES.cart_recovery_2.body,
        active: true,
      },
      {
        delay: 1440, // 24 hours
        templateId: 'cart_recovery_3',
        subject: EMAIL_TEMPLATES.cart_recovery_3.subject,
        body: EMAIL_TEMPLATES.cart_recovery_3.body,
        active: true,
      },
    ],
  },
  post_purchase_upsell: {
    id: 'post_purchase_upsell',
    name: 'Post-Purchase Upsell',
    trigger: 'order_placed',
    active: true,
    emails: [
      {
        delay: 1440, // 24 hours after purchase
        templateId: 'upsell_followup',
        subject: EMAIL_TEMPLATES.upsell_followup.subject,
        body: EMAIL_TEMPLATES.upsell_followup.body,
        active: true,
      },
    ],
  },
  winback: {
    id: 'winback',
    name: 'Win-back Campaign',
    trigger: 'inactive',
    active: true,
    emails: [
      {
        delay: 43200, // 30 days
        templateId: 'winback_30',
        subject: EMAIL_TEMPLATES.winback_30.subject,
        body: EMAIL_TEMPLATES.winback_30.body,
        active: true,
      },
    ],
  },
};

export class EmailSequenceService {
  private notificationServiceUrl: string;

  constructor() {
    this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
  }

  /**
   * Start a sequence for a customer
   */
  async startSequence(
    shop: string,
    customerId: string,
    customerEmail: string,
    sequenceId: string,
    variables: Record<string, string>
  ): Promise<EmailJob[]> {
    const sequence = EMAIL_SEQUENCES[sequenceId];
    if (!sequence || !sequence.active) {
      throw new Error(`Unknown or inactive sequence: ${sequenceId}`);
    }

    const jobs: EmailJob[] = [];
    const now = new Date();

    for (const email of sequence.emails) {
      if (!email.active) continue;

      const scheduledAt = new Date(now.getTime() + email.delay * 60 * 1000);

      // Personalize subject and body
      const personalizedSubject = this.personalize(email.subject, variables);
      const personalizedBody = this.personalize(email.body, variables);

      jobs.push({
        id: uuidv4(),
        shop,
        customerId,
        customerEmail,
        sequenceId,
        emailIndex: sequence.emails.indexOf(email),
        scheduledAt,
        status: 'scheduled',
      });

      // Schedule email sending
      this.scheduleEmail(jobs[jobs.length - 1], {
        to: customerEmail,
        subject: personalizedSubject,
        body: personalizedBody,
      });
    }

    return jobs;
  }

  /**
   * Schedule an email to be sent
   */
  private scheduleEmail(job: EmailJob, email: { to: string; subject: string; body: string }) {
    const delay = job.scheduledAt.getTime() - Date.now();

    if (delay <= 0) {
      // Send immediately
      this.sendEmail(job, email);
    } else {
      // Schedule for later
      setTimeout(() => {
        this.sendEmail(job, email);
      }, delay);
    }
  }

  /**
   * Send an email
   */
  private async sendEmail(job: EmailJob, email: { to: string; subject: string; body: string }) {
    try {
      // Update job status
      job.status = 'sent';
      job.sentAt = new Date();

      // Send via notification service
      await axios.post(`${this.notificationServiceUrl}/api/notify/send`, {
        shop: job.shop,
        type: 'email',
        customerEmail: email.to,
        title: email.subject,
        message: email.body,
        data: {
          sequenceId: job.sequenceId,
          jobId: job.id,
        },
      });

      console.log(`[EmailSequence] Sent ${job.emailIndex + 1} to ${email.to}`);
    } catch (error) {
      console.error(`[EmailSequence] Failed to send email:`, error);
      job.status = 'failed';
    }
  }

  /**
   * Personalize email with variables
   */
  private personalize(text: string, variables: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Cancel a customer's sequence
   */
  cancelSequence(shop: string, customerId: string, sequenceId: string): void {
    // In production, track and cancel scheduled jobs
    console.log(`[EmailSequence] Cancelled ${sequenceId} for customer ${customerId}`);
  }

  /**
   * Get email templates
   */
  getTemplates(): EmailTemplate[] {
    return Object.values(EMAIL_TEMPLATES);
  }

  /**
   * Get sequences
   */
  getSequences(): EmailSequence[] {
    return Object.values(EMAIL_SEQUENCES).filter(s => s.active);
  }
}
