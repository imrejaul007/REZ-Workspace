import logger from './utils/logger';

import { database } from '../services/database';

export const defaultTemplates = [
  {
    name: 'welcome-email',
    description: 'Welcome email for new users',
    channel: 'email',
    category: 'onboarding',
    content: {
      subject: 'Welcome to REZ Platform, {{name}}!',
      body: `Hi {{name}},

Welcome to REZ Platform! We're excited to have you on board.

Get started by verifying your email address:
{{verifyUrl}}

If you have unknown questions, our support team is here to help.

Best regards,
The REZ Team`,
      htmlBody: `<h1>Welcome {{name}}!</h1>
<p>Welcome to REZ Platform! We're excited to have you on board.</p>
<p>Get started by <a href="{{verifyUrl}}">verifying your email address</a>.</p>
<p>If you have unknown questions, our support team is here to help.</p>
<p>Best regards,<br>The REZ Team</p>`,
    },
    variables: [
      { name: 'name', required: true, type: 'string' },
      { name: 'verifyUrl', required: true, type: 'string' },
    ],
    isActive: true,
  },
  {
    name: 'order-confirmation',
    description: 'Order confirmation email and SMS',
    channel: 'email',
    category: 'transaction',
    content: {
      subject: 'Order Confirmed - {{orderId}}',
      body: `Hi {{name}},

Your order #{{orderId}} has been confirmed!

Order Details:
- Total: {{total}}
- Estimated Delivery: {{deliveryDate}}

Track your order: {{trackingUrl}}

Thank you for shopping with us!

REZ Team`,
      htmlBody: `<h1>Order Confirmed!</h1>
<p>Hi {{name}},</p>
<p>Your order <strong>#{{orderId}}</strong> has been confirmed!</p>
<h3>Order Details</h3>
<ul>
  <li><strong>Total:</strong> {{total}}</li>
  <li><strong>Estimated Delivery:</strong> {{deliveryDate}}</li>
</ul>
<p><a href="{{trackingUrl}}">Track your order</a></p>
<p>Thank you for shopping with us!</p>
<p>REZ Team</p>`,
    },
    variables: [
      { name: 'name', required: true, type: 'string' },
      { name: 'orderId', required: true, type: 'string' },
      { name: 'total', required: true, type: 'string' },
      { name: 'deliveryDate', required: true, type: 'string' },
      { name: 'trackingUrl', required: true, type: 'string' },
    ],
    isActive: true,
  },
  {
    name: 'order-confirmation-sms',
    description: 'Order confirmation SMS',
    channel: 'sms',
    category: 'transaction',
    content: {
      body: `REZ: Your order #{{orderId}} is confirmed! Total: {{total}}. Track: {{trackingUrl}}`,
    },
    variables: [
      { name: 'orderId', required: true, type: 'string' },
      { name: 'total', required: true, type: 'string' },
      { name: 'trackingUrl', required: true, type: 'string' },
    ],
    isActive: true,
  },
  {
    name: 'password-reset',
    description: 'Password reset email',
    channel: 'email',
    category: 'security',
    content: {
      subject: 'Reset Your REZ Password',
      body: `Hi {{name}},

We received a request to reset your password.

Click the link below to create a new password:
{{resetUrl}}

This link expires in {{expiryTime}}.

If you didn't request this, please ignore this email or contact support.

REZ Security Team`,
      htmlBody: `<h1>Password Reset</h1>
<p>Hi {{name}},</p>
<p>We received a request to reset your password.</p>
<p><a href="{{resetUrl}}">Click here to reset your password</a></p>
<p>This link expires in {{expiryTime}}.</p>
<p>If you didn't request this, please ignore this email or <a href="mailto:support@rezplatform.com">contact support</a>.</p>
<p>REZ Security Team</p>`,
    },
    variables: [
      { name: 'name', required: true, type: 'string' },
      { name: 'resetUrl', required: true, type: 'string' },
      { name: 'expiryTime', required: true, type: 'string' },
    ],
    isActive: true,
  },
  {
    name: 'payment-received',
    description: 'Payment confirmation',
    channel: 'email',
    category: 'transaction',
    content: {
      subject: 'Payment Received - {{amount}}',
      body: `Hi {{name}},

We've received your payment of {{amount}}.

Transaction Details:
- Transaction ID: {{transactionId}}
- Date: {{date}}
- Description: {{description}}

{{#if receiptUrl}}
Download your receipt: {{receiptUrl}}
{{/if}}

Thank you for your payment!

REZ Finance Team`,
      htmlBody: `<h1>Payment Received</h1>
<p>Hi {{name}},</p>
<p>We've received your payment of <strong>{{amount}}</strong>.</p>
<h3>Transaction Details</h3>
<ul>
  <li><strong>Transaction ID:</strong> {{transactionId}}</li>
  <li><strong>Date:</strong> {{date}}</li>
  <li><strong>Description:</strong> {{description}}</li>
</ul>
{{#if receiptUrl}}
<p><a href="{{receiptUrl}}">Download your receipt</a></p>
{{/if}}
<p>Thank you for your payment!</p>
<p>REZ Finance Team</p>`,
    },
    variables: [
      { name: 'name', required: true, type: 'string' },
      { name: 'amount', required: true, type: 'string' },
      { name: 'transactionId', required: true, type: 'string' },
      { name: 'date', required: true, type: 'string' },
      { name: 'description', required: true, type: 'string' },
      { name: 'receiptUrl', required: false, type: 'string' },
    ],
    isActive: true,
  },
  {
    name: 'promotional-offer',
    description: 'Marketing promotional offer',
    channel: 'email',
    category: 'marketing',
    content: {
      subject: 'Exclusive Offer for You! {{discount}}% Off',
      body: `Hi {{name}},

{{headline}}

{{body}}

{{#if promoCode}}
Use code: {{promoCode}}
{{/if}}

{{ctaUrl}}

Offer expires: {{expiryDate}}

The REZ Team

Unsubscribe: {{unsubscribeUrl}}`,
      htmlBody: `<h2>{{headline}}</h2>
<p>Hi {{name}},</p>
<p>{{body}}</p>
{{#if promoCode}}
<p><strong>Use code: {{promoCode}}</strong></p>
{{/if}}
<p><a href="{{ctaUrl}}">{{ctaText}}</a></p>
<p>Offer expires: {{expiryDate}}</p>
<p>The REZ Team</p>
<hr>
<p><small><a href="{{unsubscribeUrl}}">Unsubscribe</a></small></p>`,
    },
    variables: [
      { name: 'name', required: true, type: 'string' },
      { name: 'headline', required: true, type: 'string' },
      { name: 'body', required: true, type: 'string' },
      { name: 'promoCode', required: false, type: 'string' },
      { name: 'ctaUrl', required: true, type: 'string' },
      { name: 'ctaText', required: false, type: 'string' },
      { name: 'expiryDate', required: true, type: 'string' },
      { name: 'discount', required: false, type: 'string' },
      { name: 'unsubscribeUrl', required: true, type: 'string' },
    ],
    isActive: true,
  },
  {
    name: 'push-new-message',
    description: 'New message push notification',
    channel: 'push',
    category: 'engagement',
    content: {
      body: `New message from {{senderName}}: {{messagePreview}}`,
    },
    variables: [
      { name: 'senderName', required: true, type: 'string' },
      { name: 'messagePreview', required: true, type: 'string' },
    ],
    isActive: true,
  },
];

export async function seedTemplates(): Promise<void> {
  logger.info('Seeding default templates...');

  for (const template of defaultTemplates) {
    try {
      // Check if template already exists
      const existing = await database.query(
        'SELECT id FROM templates WHERE name = $1',
        [template.name]
      );

      if (existing.rows.length === 0) {
        await database.query(
          `INSERT INTO templates (name, description, channel, category, content, variables, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            template.name,
            template.description,
            template.channel,
            template.category,
            JSON.stringify(template.content),
            JSON.stringify(template.variables),
            template.isActive,
          ]
        );
        logger.info(`  Created template: ${template.name}`);
      } else {
        logger.info(`  Template already exists: ${template.name}`);
      }
    } catch (error) {
      logger.error(`  Error creating template ${template.name}:`, error);
    }
  }

  logger.info('Template seeding complete!');
}
