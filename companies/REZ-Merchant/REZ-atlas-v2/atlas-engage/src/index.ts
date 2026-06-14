/**
 * Atlas Engage - Customer Engagement Hub
 * Central orchestration for engagement services
 *
 * Nested Services:
 * - atlas-email-service (5161) - Email Sequences & Campaigns
 * - atlas-call-service (5164) - Call Task Management
 * - atlas-sms-service (5162) - SMS Campaigns
 * - atlas-whatsapp-service (5163) - WhatsApp Messaging
 * - atlas-deliverability (5166) - Email Deliverability
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import { Router } from 'express';

// ================================================
// Configuration
// ================================================
const PORT = parseInt(process.env.PORT || '5165', 10);
const SERVICE_NAME = 'atlas-engage';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atlas-engage';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ================================================
// Nested Service Configuration
// ================================================
const NESTED_SERVICES = {
  email: { name: 'atlas-email-service', port: 5161, baseUrl: 'http://localhost:5161' },
  call: { name: 'atlas-call-service', port: 5164, baseUrl: 'http://localhost:5164' },
  sms: { name: 'atlas-sms-service', port: 5162, baseUrl: 'http://localhost:5162' },
  whatsapp: { name: 'atlas-whatsapp-service', port: 5163, baseUrl: 'http://localhost:5163' },
  deliverability: { name: 'atlas-deliverability', port: 5166, baseUrl: 'http://localhost:5166' },
};

// ================================================
// Express App Setup
// ================================================
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ================================================
// Redis Client
// ================================================
let redisClient: RedisClientType;

async function initRedis() {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection failed:', error);
  }
}

// ================================================
// MongoDB Connection
// ================================================
async function initMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
  }
}

// ================================================
// Health Check Routes
// ================================================
const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    nestedServices: Object.keys(NESTED_SERVICES)
  });
});

healthRouter.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

healthRouter.get('/health/ready', async (req: Request, res: Response) => {
  const checks = {
    mongodb: { status: 'unknown' as string },
    redis: { status: 'unknown' as string },
    nestedServices: {} as Record<string, { status: string }>
  };

  try {
    const mongoState = mongoose.connection.readyState;
    checks.mongodb.status = mongoState === 1 ? 'connected' : 'disconnected';
  } catch (error) {
    checks.mongodb.status = 'error';
  }

  try {
    if (redisClient?.isOpen) {
      await redisClient.ping();
      checks.redis.status = 'connected';
    } else {
      checks.redis.status = 'disconnected';
    }
  } catch (error) {
    checks.redis.status = 'error';
  }

  for (const [key, service] of Object.entries(NESTED_SERVICES)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${service.baseUrl}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      checks.nestedServices[key] = { status: response.ok ? 'healthy' : 'unhealthy' };
    } catch (error) {
      checks.nestedServices[key] = { status: 'unreachable' };
    }
  }

  const allHealthy = checks.mongodb.status === 'connected' && checks.redis.status === 'connected';
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  });
});

app.use('/', healthRouter);

// ================================================
// API Routes - Hub API
// ================================================

// Get all services status
app.get('/api/services', async (req: Request, res: Response) => {
  try {
    const services = await Promise.all(
      Object.entries(NESTED_SERVICES).map(async ([key, service]) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2000);
          const response = await fetch(`${service.baseUrl}/health`, { signal: controller.signal });
          clearTimeout(timeout);

          if (response.ok) {
            const data = await response.json();
            return { id: key, name: service.name, port: service.port, status: 'active', details: data };
          }
        } catch (error) {
          // Service unreachable
        }
        return { id: key, name: service.name, port: service.port, status: 'unreachable' };
      })
    );

    res.json({ services, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// ================================================
// Email Service Proxy Routes
// ================================================
const emailRouter = Router();

// Get templates
emailRouter.get('/api/email/templates', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const url = new URL(`${NESTED_SERVICES.email.baseUrl}/api/templates`);
    if (category) url.searchParams.set('category', category as string);

    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Email service unavailable' });
  }
});

// Create template
emailRouter.post('/api/email/templates', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.email.baseUrl}/api/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Email service unavailable' });
  }
});

// Get sequences
emailRouter.get('/api/email/sequences', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const url = new URL(`${NESTED_SERVICES.email.baseUrl}/api/sequences`);
    if (status) url.searchParams.set('status', status as string);

    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Email service unavailable' });
  }
});

// Create sequence
emailRouter.post('/api/email/sequences', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.email.baseUrl}/api/sequences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Email service unavailable' });
  }
});

// Send email
emailRouter.post('/api/email/send', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.email.baseUrl}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Email service unavailable' });
  }
});

// Get email by ID
emailRouter.get('/api/email/emails/:id', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.email.baseUrl}/api/emails/${req.params.id}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Email service unavailable' });
  }
});

// Track email action
emailRouter.post('/api/email/emails/:id/track', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.email.baseUrl}/api/emails/${req.params.id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Email service unavailable' });
  }
});

// Email analytics
emailRouter.get('/api/email/analytics', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.email.baseUrl}/api/analytics/campaigns`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Email service unavailable' });
  }
});

app.use('/', emailRouter);

// ================================================
// Call Service Proxy Routes
// ================================================
const callRouter = Router();

// Create call task
callRouter.post('/api/call/tasks', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.call.baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Call service unavailable' });
  }
});

// Get call tasks
callRouter.get('/api/call/tasks', async (req: Request, res: Response) => {
  try {
    const { status, date } = req.query;
    const url = new URL(`${NESTED_SERVICES.call.baseUrl}/api/tasks`);
    if (status) url.searchParams.set('status', status as string);
    if (date) url.searchParams.set('date', date as string);

    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Call service unavailable' });
  }
});

// Update task
callRouter.patch('/api/call/tasks/:id', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.call.baseUrl}/api/tasks/${req.params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Call service unavailable' });
  }
});

// Complete call
callRouter.post('/api/call/tasks/:id/complete', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.call.baseUrl}/api/tasks/${req.params.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Call service unavailable' });
  }
});

// Log call
callRouter.post('/api/call/logs', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.call.baseUrl}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Call service unavailable' });
  }
});

// Call analytics
callRouter.get('/api/call/analytics', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.call.baseUrl}/api/analytics`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Call service unavailable' });
  }
});

app.use('/', callRouter);

// ================================================
// Unified Engagement Analytics
// ================================================
app.get('/api/analytics/unified', async (req: Request, res: Response) => {
  try {
    const [emailRes, callRes] = await Promise.allSettled([
      fetch(`${NESTED_SERVICES.email.baseUrl}/api/analytics/campaigns`),
      fetch(`${NESTED_SERVICES.call.baseUrl}/api/analytics`)
    ]);

    const analytics = {
      email: emailRes.status === 'fulfilled' && emailRes.value.ok ? await emailRes.value.json() : null,
      call: callRes.status === 'fulfilled' && callRes.value.ok ? await callRes.value.json() : null,
      timestamp: new Date().toISOString()
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unified analytics' });
  }
});

// ================================================
// Error Handler
// ================================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ================================================
// Graceful Shutdown
// ================================================
async function shutdown() {
  console.log('Shutting down...');
  try {
    await mongoose.disconnect();
    if (redisClient?.isOpen) await redisClient.quit();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ================================================
// Start Server
// ================================================
async function start() {
  await initMongoDB();
  await initRedis();

  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`Atlas Engage Hub`);
    console.log(`Port: ${PORT}`);
    console.log(`Nested Services:`);
    Object.entries(NESTED_SERVICES).forEach(([key, svc]) => {
      console.log(`  - ${key}: ${svc.name} (${svc.port})`);
    });
    console.log(`========================================\n`);
  });
}

start().catch(console.error);

export default app;
