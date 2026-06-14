/**
 * REZ Inbox - Smart Inbox Service
 * Email receipt import for travel, food, invoices, subscriptions
 * Integrations: RABTUL (Auth, Notification)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { messagesRouter } from './routes/messages';
import { threadsRouter } from './routes/threads';
import { importRouter } from './routes/import';
import { emailParser } from './services/emailParser';

const app = express();
const PORT = parseInt(process.env.PORT || '3003', 10);

// RABTUL Service Connections
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// RABTUL Headers
const authHeaders = {
  'Content-Type': 'application/json',
  'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
};

// Security
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-inbox',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// RABTUL Auth: Validate user email
async function validateUserEmail(userId: string, email: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/api/auth/internal/user/${userId}/email`,
      {
        headers: authHeaders,
        params: { email },
        timeout: 5000,
      }
    );
    return response.data?.valid === true || response.status === 200;
  } catch (e) {
    logger.error('[REZ-inbox] RABTUL Auth email validation failed:', e instanceof Error ? e.message : e);
    return false;
  }
}

// RABTUL Notification: Send email notification
async function sendEmailNotification(userId: string, message: {
  id: string;
  subject: string;
  from: string;
  category: string;
  date: string;
}): Promise<void> {
  try {
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/send`,
      {
        user_id: userId,
        type: 'email_arrived',
        title: `New email: ${message.subject}`,
        body: `From: ${message.from}\nCategory: ${message.category}`,
        data: {
          messageId: message.id,
          subject: message.subject,
          from: message.from,
          category: message.category,
        },
        channels: ['push', 'email'],
      },
      { headers: authHeaders }
    );
    logger.info('[REZ-inbox] Notification sent via RABTUL', { userId, messageId: message.id });
  } catch (e) {
    logger.error('[REZ-inbox] RABTUL Notification failed:', e instanceof Error ? e.message : e);
    // Don't fail the main flow if notification fails
  }
}

// Webhook for email receiving (from email service)
app.post('/webhook/email', async (req, res) => {
  try {
    const { emailId, from, subject, body, attachments, timestamp, user_id } = req.body;

    logger.info('Email webhook received', { emailId, from, subject, user_id });

    // Parse email
    const parsed = await emailParser.parse({
      emailId,
      from,
      subject,
      body,
      attachments,
      timestamp,
    });

    // RABTUL Auth: Validate user email if user_id provided
    if (user_id && parsed.from) {
      const isValidEmail = await validateUserEmail(user_id, parsed.from);
      if (!isValidEmail) {
        logger.warn(`[REZ-inbox] Email from ${parsed.from} does not match user ${user_id}`);
        // Continue anyway - email might be from third party
      }
    }

    // Store message
    const { messagesService } = await import('./services/messages');
    await messagesService.addMessage(parsed);

    // RABTUL Notification: Send notification to user
    if (user_id) {
      await sendEmailNotification(user_id, {
        id: parsed.id,
        subject: parsed.subject,
        from: parsed.from,
        category: parsed.category,
        date: parsed.date,
      });
    }

    res.json({ success: true, messageId: parsed.id });
  } catch (error) {
    logger.error('Webhook error', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Processing failed' });
  }
});

// RABTUL Auth middleware for protected routes
app.use('/api/messages', async (req, res, next) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'x-user-id header required' });
  }

  try {
    // Validate user with RABTUL Auth
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/internal/user/${userId}`, {
      headers: authHeaders,
      timeout: 5000,
    });
    if (response.data?.valid !== true && response.status !== 200) {
      return res.status(401).json({ success: false, error: 'Invalid user' });
    }
    // Attach user to request
    (req as any).userId = userId;
    next();
  } catch (e) {
    logger.error('[REZ-inbox] Auth middleware failed:', e instanceof Error ? e.message : e);
    // In dev mode, allow request through
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, error: 'Auth failed' });
    }
    (req as any).userId = userId;
    next();
  }
});

app.use('/api/messages', messagesRouter);
app.use('/api/threads', threadsRouter);
app.use('/api/import', importRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`REZ Inbox started on port ${PORT}`);
});

export default app;
