/**
 * BIZORA Notification Service
 * Unified Notifications: Email, SMS, Push, WhatsApp
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import { z } from 'zod';

// ============================================================================
// Configuration
// ============================================================================

const PORT = parseInt(process.env.PORT || '4037', 10);

// Email (SendGrid)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@bizora.com';

// SMS (Msg91)
const MSG91_API_KEY = process.env.MSG91_API_KEY || '';
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'BIZORA';

// Push (Firebase)
const FIREBASE_KEY = process.env.FIREBASE_KEY || '';

// WhatsApp (already integrated)
const WHATSAPP_SERVICE = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:4035';

// ============================================================================
// Types
// ============================================================================

interface Notification {
  id: string;
  type: 'email' | 'sms' | 'push' | 'whatsapp';
  to: string;
  subject?: string;
  message: string;
  data?: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface SMSOptions {
  to: string;
  message: string;
  template?: string;
}

interface PushOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
}

// ============================================================================
// Validation
// ============================================================================

const SendNotificationSchema = z.object({
  type: z.enum(['email', 'sms', 'push', 'whatsapp', 'all']),
  to: z.string(),
  subject: z.string().optional(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'whatsapp'])).optional(),
});

const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  from: z.string().optional(),
  replyTo: z.string().optional(),
});

const SendSMSSchema = z.object({
  to: z.string().regex(/^\d{10,15}$/),
  message: z.string().max(1600),
  template: z.string().optional(),
});

const SendPushSchema = z.object({
  token: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.any()).optional(),
  badge: z.number().optional(),
});

// ============================================================================
// Store
// ============================================================================

const notifications: Notification[] = [];

// ============================================================================
// Email Functions
// ============================================================================

async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!SENDGRID_API_KEY) {
    logger.info('[Email] Mock send:', options);
    return { success: true, messageId: `email_${Date.now()}` };
  }

  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: options.from || SENDGRID_FROM_EMAIL },
        replyTo: options.replyTo ? { email: options.replyTo } : undefined,
        subject: options.subject,
        content: [{ type: 'text/html', value: options.html }],
      },
      {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };
  } catch (error) {
    const err = error as { response?: { data?: { errors?: { message?: string }[] } } };
    return {
      success: false,
      error: err.response?.data?.errors?.[0]?.message || 'Failed to send email',
    };
  }
}

// ============================================================================
// SMS Functions
// ============================================================================

async function sendSMS(options: SMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!MSG91_API_KEY) {
    logger.info('[SMS] Mock send to', options.to, ':', options.message.slice(0, 50));
    return { success: true, messageId: `sms_${Date.now()}` };
  }

  try {
    const response = await axios.post(
      'https://api.msg91.com/api/v5/flow',
      {
        sender: MSG91_SENDER_ID,
        mobiles: options.to,
        message: options.message,
        ...(options.template && { template_id: options.template }),
      },
      {
        headers: {
          authkey: MSG91_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data as { type?: string; message?: string[] };
    if (data.type === 'success') {
      return { success: true, messageId: data.message?.[0] };
    }
    return { success: false, error: data.type || 'Failed to send SMS' };
  } catch (error) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to send SMS' };
  }
}

// ============================================================================
// Push Notification Functions
// ============================================================================

async function sendPush(options: PushOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!FIREBASE_KEY) {
    logger.info('[Push] Mock send to', options.token.slice(0, 20) + ':', options.title);
    return { success: true, messageId: `push_${Date.now()}` };
  }

  try {
    const response = await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      {
        to: options.token,
        notification: {
          title: options.title,
          body: options.body,
          badge: options.badge || 0,
        },
        data: options.data,
      },
      {
        headers: {
          Authorization: `key=${FIREBASE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data as { success?: number };
    if (data.success === 1) {
      return { success: true, messageId: `push_${Date.now()}` };
    }
    return { success: false, error: 'Failed to send push' };
  } catch (error) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to send push' };
  }
}

// ============================================================================
// WhatsApp Functions
// ============================================================================

async function sendWhatsApp(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    await axios.post(
      `${WHATSAPP_SERVICE}/api/send`,
      {
        to,
        type: 'text',
        content: message,
      }
    );
    return { success: true };
  } catch (error) {
    const err = error as { message?: string };
    return { success: false, error: err.message || 'Failed to send WhatsApp' };
  }
}

// ============================================================================
// Express App
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    channels: {
      email: !!SENDGRID_API_KEY,
      sms: !!MSG91_API_KEY,
      push: !!FIREBASE_KEY,
      whatsapp: true,
    },
  });
});

// ============================================================================
// Notification Routes
// ============================================================================

// Send notification (unified)
app.post('/api/notifications', async (req: Request, res: Response) => {
  try {
    const data = SendNotificationSchema.parse(req.body);

    const results: Record<string, { success: boolean; error?: string }> = {};
    const channels = data.channels || [data.type];

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          if (data.subject) {
            results.email = await sendEmail({
              to: data.to,
              subject: data.subject,
              html: `<p>${data.message}</p>`,
            });
          }
          break;

        case 'sms':
          results.sms = await sendSMS({
            to: data.to,
            message: data.message.slice(0, 160),
          });
          break;

        case 'whatsapp':
          results.whatsapp = await sendWhatsApp(data.to, data.message);
          break;
      }
    }

    // Log notification
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      type: data.type as Notification['type'],
      to: data.to,
      subject: data.subject,
      message: data.message,
      data: data.data,
      status: Object.values(results).some(r => r.success) ? 'sent' : 'failed',
      attempts: 1,
      sentAt: new Date(),
      error: Object.values(results).find(r => !r.success)?.error,
      createdAt: new Date(),
    };
    notifications.push(notification);

    res.json({
      success: true,
      notificationId: notification.id,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    logger.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send Email
app.post('/api/email', async (req: Request, res: Response) => {
  try {
    const data = SendEmailSchema.parse(req.body);

    const result = await sendEmail(data);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send SMS
app.post('/api/sms', async (req: Request, res: Response) => {
  try {
    const data = SendSMSSchema.parse(req.body);

    const result = await sendSMS(data);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// Send Push
app.post('/api/push', async (req: Request, res: Response) => {
  try {
    const data = SendPushSchema.parse(req.body);

    const result = await sendPush(data);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to send push' });
  }
});

// ============================================================================
// Templates
// ============================================================================

const TEMPLATES = {
  'welcome-email': {
    subject: 'Welcome to BIZORA!',
    html: `
      <h1>Welcome to BIZORA! 🎉</h1>
      <p>Hi {{name}},</p>
      <p>Thank you for joining BIZORA - your AI-powered business platform.</p>
      <p>You now have access to:</p>
      <ul>
        <li>📜 Tax & Compliance Filing</li>
        <li>📄 Invoice Generation</li>
        <li>💰 Payment Processing</li>
        <li>📢 Marketing Services</li>
      </ul>
      <p>Get started by exploring our services.</p>
      <a href="https://bizora.com/dashboard">Go to Dashboard</a>
    `,
  },

  'invoice-paid': {
    subject: 'Payment Received - Invoice #{{invoiceNumber}}',
    html: `
      <h1>Payment Received! 💰</h1>
      <p>Hi {{customerName}},</p>
      <p>We received your payment of ₹{{amount}} for invoice #{{invoiceNumber}}.</p>
      <p>Thank you for your business!</p>
    `,
  },

  'gst-reminder': {
    subject: 'GST Filing Reminder - Due {{dueDate}}',
    sms: '📜 Reminder: Your GST filing for {{period}} is due on {{dueDate}}. File now on BIZORA to avoid penalties.',
  },

  'appointment-reminder': {
    subject: 'Appointment Reminder - {{date}} at {{time}}',
    sms: '📅 Reminder: Your appointment at {{businessName}} is scheduled for {{date}} at {{time}}. See you soon!',
  },

  'order-confirmation': {
    subject: 'Order Confirmed - #{{orderNumber}}',
    html: `
      <h1>Order Confirmed! 🎉</h1>
      <p>Hi {{customerName}},</p>
      <p>Your order #{{orderNumber}} has been confirmed.</p>
      <p>Service: {{serviceName}}</p>
      <p>We'll keep you updated on progress.</p>
    `,
  },

  'payment-reminder': {
    subject: 'Payment Reminder - Invoice #{{invoiceNumber}}',
    sms: '💳 Reminder: Invoice #{{invoiceNumber}} for ₹{{amount}} is {{status}}. Pay now: {{paymentLink}}',
  },
};

// Send template
app.post('/api/templates/:name/send', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { to, data, channel = 'email' } = req.body;

    const template = TEMPLATES[name as keyof typeof TEMPLATES];
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Replace placeholders
    let subject = template.subject || '';
    let html = template.html || '';
    let sms = template.sms || '';

    for (const [key, value] of Object.entries(data || {})) {
      const placeholder = `{{${key}}}`;
      subject = subject.replaceAll(placeholder, String(value));
      html = html.replaceAll(placeholder, String(value));
      sms = sms.replaceAll(placeholder, String(value));
    }

    const results: Record<string, unknown> = {};

    if (channel === 'email' || channel === 'all') {
      results.email = await sendEmail({ to, subject, html });
    }

    if (channel === 'sms' || channel === 'all') {
      results.sms = await sendSMS({ to: to.replace(/[^0-9]/g, ''), message: sms });
    }

    res.json({ success: true, results });
  } catch (error) {
    logger.error('Template send error:', error);
    res.status(500).json({ error: 'Failed to send template' });
  }
});

// Get templates
app.get('/api/templates', (_req: Request, res: Response) => {
  const templates = Object.entries(TEMPLATES).map(([name, template]) => ({
    name,
    subject: template.subject,
    hasSms: !!template.sms,
  }));
  res.json({ templates });
});

// ============================================================================
// Notifications History
// ============================================================================

app.get('/api/notifications', (req: Request, res: Response) => {
  const { to, type, status, limit = 50 } = req.query;

  let result = [...notifications];

  if (to) result = result.filter(n => n.to.includes(to as string));
  if (type) result = result.filter(n => n.type === type);
  if (status) result = result.filter(n => n.status === status);

  result = result
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, Number(limit));

  res.json({ notifications: result, total: result.length });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                                                           ║
║   🔔 BIZORA Notification Service                          ║
║   Email + SMS + Push + WhatsApp                         ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Status: Running                                        ║
║                                                           ║
║   Channels:                                              ║
║   • Email: ${SENDGRID_API_KEY ? '✅ Configured' : '⚠️ Mock'}
║   • SMS: ${MSG91_API_KEY ? '✅ Configured' : '⚠️ Mock'}
║   • Push: ${FIREBASE_KEY ? '✅ Configured' : '⚠️ Mock'}
║   • WhatsApp: ✅ Integrated                             ║
║                                                           ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
