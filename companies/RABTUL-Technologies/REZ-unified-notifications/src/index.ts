/**
 * REZ Unified Notifications Service - Express Entry Point
 * Port: 4063
 *
 * Unified notification routing across all channels
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 4063;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ============================================
// Types
// ============================================

type Channel = 'push' | 'sms' | 'email' | 'whatsapp' | 'in_app';
type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

interface Notification {
  id: string;
  userId: string;
  channel: Channel;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: NotificationStatus;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

interface Template {
  id: string;
  name: string;
  channel: Channel;
  type: string;
  title: string;
  body: string;
  variables: string[];
  createdAt: string;
}

// ============================================
// In-Memory Store
// ============================================

const notifications = new Map<string, Notification>();
const templates = new Map<string, Template>();
const userPreferences = new Map<string, Record<Channel, boolean>>();

// Initialize sample templates
function initializeSampleData() {
  const sampleTemplates: Template[] = [
    {
      id: 'welcome_email',
      name: 'Welcome Email',
      channel: 'email',
      type: 'welcome',
      title: 'Welcome to REZ!',
      body: 'Hello {{name}}, welcome to REZ! Start exploring amazing offers.',
      variables: ['name'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'order_confirmation',
      name: 'Order Confirmation',
      channel: 'whatsapp',
      type: 'order',
      title: 'Order Confirmed!',
      body: 'Your order #{{orderId}} has been confirmed. Total: ₹{{amount}}',
      variables: ['orderId', 'amount'],
      createdAt: new Date().toISOString()
    },
    {
      id: 'promo_push',
      name: 'Promotional Push',
      channel: 'push',
      type: 'promotion',
      title: '{{title}}',
      body: '{{message}}',
      variables: ['title', 'message'],
      createdAt: new Date().toISOString()
    }
  ];

  sampleTemplates.forEach(t => templates.set(t.id, t));
}

initializeSampleData();

// ============================================
// Helper Functions
// ============================================

function interpolateTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return result;
}

function getUserPreference(userId: string, channel: Channel): boolean {
  const prefs = userPreferences.get(userId);
  if (!prefs) return true;
  return prefs[channel] !== false;
}

// ============================================
// Health Check
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'unified-notifications',
    timestamp: new Date().toISOString(),
    stats: {
      notifications: notifications.size,
      templates: templates.size,
      users: userPreferences.size
    }
  });
});

// ============================================
// Notification Routes
// ============================================

// Send notification
app.post('/notifications', async (req: Request, res: Response) => {
  try {
    const { userId, channel, type, title, body, data, scheduledAt } = req.body;

    if (!userId || !channel || !title || !body) {
      return res.status(400).json({ success: false, error: 'userId, channel, title, and body are required' });
    }

    // Check user preference
    if (!getUserPreference(userId, channel)) {
      return res.json({ success: true, message: 'Notification skipped - user opted out', skipped: true });
    }

    const id = `notif_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const notification: Notification = {
      id,
      userId,
      channel,
      type: type || 'general',
      title,
      body,
      data,
      status: 'pending',
      scheduledAt,
      createdAt: now,
      metadata: {}
    };

    notifications.set(id, notification);

    // Simulate sending (in production, this would call actual providers)
    setTimeout(() => {
      const n = notifications.get(id);
      if (n) {
        n.status = 'sent';
        n.sentAt = new Date().toISOString();
      }
    }, 100);

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

// Send from template
app.post('/notifications/template', async (req: Request, res: Response) => {
  try {
    const { userId, templateId, variables, channel, scheduledAt } = req.body;

    if (!userId || !templateId || !variables) {
      return res.status(400).json({ success: false, error: 'userId, templateId, and variables are required' });
    }

    const template = templates.get(templateId);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const targetChannel = channel || template.channel;

    if (!getUserPreference(userId, targetChannel)) {
      return res.json({ success: true, message: 'Notification skipped - user opted out', skipped: true });
    }

    const title = interpolateTemplate(template.title, variables);
    const body = interpolateTemplate(template.body, variables);

    const id = `notif_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const notification: Notification = {
      id,
      userId,
      channel: targetChannel,
      type: template.type,
      title,
      body,
      data: variables,
      status: 'pending',
      scheduledAt,
      createdAt: now,
      metadata: { templateId }
    };

    notifications.set(id, notification);

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error sending template notification:', error);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

// Get notification
app.get('/notifications/:id', async (req: Request, res: Response) => {
  try {
    const notification = notifications.get(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error getting notification:', error);
    res.status(500).json({ success: false, error: 'Failed to get notification' });
  }
});

// Get user notifications
app.get('/notifications/user/:userId', async (req: Request, res: Response) {
  try {
    const { limit = 50, status, channel } = req.query;
    let userNotifications = Array.from(notifications.values())
      .filter(n => n.userId === req.params.userId);

    if (status) {
      userNotifications = userNotifications.filter(n => n.status === status);
    }
    if (channel) {
      userNotifications = userNotifications.filter(n => n.channel === channel);
    }

    userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paginated = userNotifications.slice(0, Number(limit));
    res.json({ success: true, data: paginated, count: paginated.length });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to get notifications' });
  }
});

// Update notification status
app.patch('/notifications/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const notification = notifications.get(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    const now = new Date().toISOString();
    notification.status = status;

    if (status === 'delivered') notification.deliveredAt = now;
    if (status === 'read') notification.readAt = now;

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// Batch send
app.post('/notifications/batch', async (req: Request, res: Response) => {
  try {
    const { userIds, channel, type, title, body, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'userIds array is required' });
    }

    const results = [];
    const now = new Date().toISOString();

    for (const userId of userIds) {
      if (!getUserPreference(userId, channel)) continue;

      const id = `notif_${crypto.randomUUID().slice(0, 8)}`;
      const notification: Notification = {
        id,
        userId,
        channel,
        type: type || 'broadcast',
        title,
        body,
        data,
        status: 'pending',
        createdAt: now,
        metadata: { batch: true }
      };

      notifications.set(id, notification);
      results.push(notification);
    }

    res.status(201).json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error('Error batch sending:', error);
    res.status(500).json({ success: false, error: 'Failed to send batch notifications' });
  }
});

// ============================================
// Template Routes
// ============================================

// Create template
app.post('/templates', async (req: Request, res: Response) => {
  try {
    const { id, name, channel, type, title, body, variables } = req.body;

    if (!name || !channel || !title || !body) {
      return res.status(400).json({ success: false, error: 'name, channel, title, and body are required' });
    }

    const templateId = id || `tmpl_${crypto.randomUUID().slice(0, 8)}`;

    const template: Template = {
      id: templateId,
      name,
      channel,
      type: type || 'general',
      title,
      body,
      variables: variables || [],
      createdAt: new Date().toISOString()
    };

    templates.set(templateId, template);

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// Get template
app.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const template = templates.get(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ success: false, error: 'Failed to get template' });
  }
});

// List templates
app.get('/templates', async (req: Request, res: Response) => {
  try {
    const { channel, type } = req.query;
    let allTemplates = Array.from(templates.values());

    if (channel) {
      allTemplates = allTemplates.filter(t => t.channel === channel);
    }
    if (type) {
      allTemplates = allTemplates.filter(t => t.type === type);
    }

    res.json({ success: true, data: allTemplates, count: allTemplates.length });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ success: false, error: 'Failed to list templates' });
  }
});

// ============================================
// Preference Routes
// ============================================

// Set user preferences
app.put('/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { push, sms, email, whatsapp, in_app } = req.body;

    const prefs: Record<Channel, boolean> = {
      push: push !== false,
      sms: sms !== false,
      email: email !== false,
      whatsapp: whatsapp !== false,
      in_app: in_app !== false
    };

    userPreferences.set(req.params.userId, prefs);

    res.json({ success: true, data: prefs });
  } catch (error) {
    console.error('Error setting preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to set preferences' });
  }
});

// Get user preferences
app.get('/preferences/:userId', async (req: Request, res: Response) => {
  try {
    const prefs = userPreferences.get(req.params.userId);
    if (!prefs) {
      return res.json({
        success: true,
        data: { push: true, sms: true, email: true, whatsapp: true, in_app: true }
      });
    }
    res.json({ success: true, data: prefs });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to get preferences' });
  }
});

// ============================================
// Statistics
// ============================================

app.get('/stats', async (req: Request, res: Response) => {
  const allNotifications = Array.from(notifications.values());

  const stats = {
    total: allNotifications.length,
    byStatus: {
      pending: allNotifications.filter(n => n.status === 'pending').length,
      sent: allNotifications.filter(n => n.status === 'sent').length,
      delivered: allNotifications.filter(n => n.status === 'delivered').length,
      read: allNotifications.filter(n => n.status === 'read').length,
      failed: allNotifications.filter(n => n.status === 'failed').length
    },
    byChannel: {
      push: allNotifications.filter(n => n.channel === 'push').length,
      sms: allNotifications.filter(n => n.channel === 'sms').length,
      email: allNotifications.filter(n => n.channel === 'email').length,
      whatsapp: allNotifications.filter(n => n.channel === 'whatsapp').length,
      in_app: allNotifications.filter(n => n.channel === 'in_app').length
    }
  };

  res.json({ success: true, data: stats });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] REZ Unified Notifications Service started on port ${PORT}`);
});

export default app;
