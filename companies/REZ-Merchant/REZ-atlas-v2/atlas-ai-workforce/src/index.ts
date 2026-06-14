/**
 * Atlas AI Workforce - AI Employee Hub
 * Central orchestration for AI workforce agents
 *
 * Nested Services:
 * - atlas-sdr-agent (5174) - Sales Development Rep
 * - atlas-qualification-agent (5175) - Lead Qualification
 * - atlas-meeting-agent (5176) - Meeting Scheduler
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
const PORT = parseInt(process.env.PORT || '5190', 10);
const SERVICE_NAME = 'atlas-ai-workforce';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atlas-ai-workforce';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ================================================
// Nested Service Configuration
// ================================================
const NESTED_SERVICES = {
  sdr: { name: 'atlas-sdr-agent', port: 5174, baseUrl: 'http://localhost:5174' },
  qualification: { name: 'atlas-qualification-agent', port: 5175, baseUrl: 'http://localhost:5175' },
  meeting: { name: 'atlas-meeting-agent', port: 5176, baseUrl: 'http://localhost:5176' },
};

// ================================================
// Express App Setup
// ================================================
const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Request logging
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

  // Check MongoDB
  try {
    const mongoState = mongoose.connection.readyState;
    checks.mongodb.status = mongoState === 1 ? 'connected' : 'disconnected';
  } catch (error) {
    checks.mongodb.status = 'error';
  }

  // Check Redis
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

  // Check nested services
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

// Get all agents
app.get('/api/agents', async (req: Request, res: Response) => {
  try {
    const agents = await Promise.all(
      Object.entries(NESTED_SERVICES).map(async ([key, service]) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2000);
          const response = await fetch(`${service.baseUrl}/api/analytics`, { signal: controller.signal });
          clearTimeout(timeout);

          if (response.ok) {
            const data = await response.json();
            return {
              id: key,
              name: service.name,
              port: service.port,
              status: 'active',
              metrics: data
            };
          }
        } catch (error) {
          // Service unreachable
        }
        return {
          id: key,
          name: service.name,
          port: service.port,
          status: 'unreachable'
        };
      })
    );

    res.json({ agents, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get service status
app.get('/api/services/:serviceId', async (req: Request, res: Response) => {
  const { serviceId } = req.params;
  const service = NESTED_SERVICES[serviceId as keyof typeof NESTED_SERVICES];

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${service.baseUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      res.json({ service: service.name, status: 'healthy', details: data });
    } else {
      res.json({ service: service.name, status: 'unhealthy' });
    }
  } catch (error) {
    res.status(503).json({ service: service.name, status: 'unreachable', error: 'Connection failed' });
  }
});

// ================================================
// SDR Agent Proxy Routes
// ================================================
const sdrRouter = Router();

// Create SDR job
sdrRouter.post('/api/sdr/jobs', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.sdr.baseUrl}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'SDR service unavailable' });
  }
});

// Get SDR jobs
sdrRouter.get('/api/sdr/jobs', async (req: Request, res: Response) => {
  try {
    const { status, limit } = req.query;
    const url = new URL(`${NESTED_SERVICES.sdr.baseUrl}/api/jobs`);
    if (status) url.searchParams.set('status', status as string);
    if (limit) url.searchParams.set('limit', limit as string);

    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'SDR service unavailable' });
  }
});

// Get SDR job by ID
sdrRouter.get('/api/sdr/jobs/:id', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.sdr.baseUrl}/api/jobs/${req.params.id}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'SDR service unavailable' });
  }
});

// Trigger SDR for leads
sdrRouter.post('/api/sdr/trigger', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.sdr.baseUrl}/api/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'SDR service unavailable' });
  }
});

// SDR Analytics
sdrRouter.get('/api/sdr/analytics', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.sdr.baseUrl}/api/analytics`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'SDR service unavailable' });
  }
});

app.use('/', sdrRouter);

// ================================================
// Qualification Agent Proxy Routes
// ================================================
const qualRouter = Router();

// Get qualification questions
qualRouter.get('/api/qualification/questions', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const url = new URL(`${NESTED_SERVICES.qualification.baseUrl}/api/questions`);
    if (category) url.searchParams.set('category', category as string);

    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Qualification service unavailable' });
  }
});

// Start qualification
qualRouter.post('/api/qualification/qualify', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.qualification.baseUrl}/api/qualify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Qualification service unavailable' });
  }
});

// Get qualification
qualRouter.get('/api/qualification/qualify/:id', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.qualification.baseUrl}/api/qualify/${req.params.id}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Qualification service unavailable' });
  }
});

// Submit answer
qualRouter.post('/api/qualification/qualify/:id/answer', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.qualification.baseUrl}/api/qualify/${req.params.id}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Qualification service unavailable' });
  }
});

// Get leads by grade
qualRouter.get('/api/qualification/leads', async (req: Request, res: Response) => {
  try {
    const { grade, recommendation } = req.query;
    const url = new URL(`${NESTED_SERVICES.qualification.baseUrl}/api/leads`);
    if (grade) url.searchParams.set('grade', grade as string);
    if (recommendation) url.searchParams.set('recommendation', recommendation as string);

    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Qualification service unavailable' });
  }
});

// Qualification Analytics
qualRouter.get('/api/qualification/analytics', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.qualification.baseUrl}/api/analytics`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Qualification service unavailable' });
  }
});

app.use('/', qualRouter);

// ================================================
// Meeting Agent Proxy Routes
// ================================================
const meetingRouter = Router();

// Get available time slots
meetingRouter.get('/api/meeting/slots', async (req: Request, res: Response) => {
  try {
    const { date, timezone } = req.query;
    const url = new URL(`${NESTED_SERVICES.meeting.baseUrl}/api/slots`);
    if (date) url.searchParams.set('date', date as string);
    if (timezone) url.searchParams.set('timezone', timezone as string);

    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Meeting service unavailable' });
  }
});

// Propose meeting
meetingRouter.post('/api/meeting/meetings/propose', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.meeting.baseUrl}/api/meetings/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Meeting service unavailable' });
  }
});

// Confirm meeting
meetingRouter.post('/api/meeting/meetings/:id/confirm', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.meeting.baseUrl}/api/meetings/${req.params.id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Meeting service unavailable' });
  }
});

// Complete meeting
meetingRouter.post('/api/meeting/meetings/:id/complete', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.meeting.baseUrl}/api/meetings/${req.params.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ error: 'Meeting service unavailable' });
  }
});

// Get meetings
meetingRouter.get('/api/meeting/meetings', async (req: Request, res: Response) => {
  try {
    const { status, date, limit } = req.query;
    const url = new URL(`${NESTED_SERVICES.meeting.baseUrl}/api/meetings`);
    if (status) url.searchParams.set('status', status as string);
    if (date) url.searchParams.set('date', date as string);
    if (limit) url.searchParams.set('limit', limit as string);

    const response = await fetch(url.toString());
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Meeting service unavailable' });
  }
});

// Meeting Analytics
meetingRouter.get('/api/meeting/analytics', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${NESTED_SERVICES.meeting.baseUrl}/api/analytics`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Meeting service unavailable' });
  }
});

app.use('/', meetingRouter);

// ================================================
// Unified Analytics
// ================================================
app.get('/api/analytics/unified', async (req: Request, res: Response) => {
  try {
    const [sdrRes, qualRes, meetingRes] = await Promise.allSettled([
      fetch(`${NESTED_SERVICES.sdr.baseUrl}/api/analytics`),
      fetch(`${NESTED_SERVICES.qualification.baseUrl}/api/analytics`),
      fetch(`${NESTED_SERVICES.meeting.baseUrl}/api/analytics`)
    ]);

    const analytics = {
      sdr: sdrRes.status === 'fulfilled' && sdrRes.value.ok ? await sdrRes.value.json() : null,
      qualification: qualRes.status === 'fulfilled' && qualRes.value.ok ? await qualRes.value.json() : null,
      meeting: meetingRes.status === 'fulfilled' && meetingRes.value.ok ? await meetingRes.value.json() : null,
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
    console.log(`Atlas AI Workforce Hub`);
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
