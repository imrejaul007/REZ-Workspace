// ReZ Schedule - Main Entry Point (World-Class Edition)
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';
import { rateLimitService } from './services/rateLimitService';

// Routes
import eventTypeRoutes from './routes/eventTypeRoutes';
import bookingRoutes from './routes/bookingRoutes';
import availabilityRoutes from './routes/availabilityRoutes';
import webhookRoutes from './routes/webhookRoutes';
import auditRoutes from './routes/auditRoutes';
import userRoutes from './routes/userRoutes';
import organizationRoutes from './routes/organizationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import cronRoutes from './routes/cronRoutes';
import { openApiSpec } from './routes/openapi';

// Sentry
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
});

const app = express();
const PORT = parseInt(process.env.PORT || '4080', 10);

process.env.SERVICE_NAME = 'rez-schedule-service';

// ─── Security Middleware ────────────────────────────────────────────────────

app.set('trust proxy', 1);

// Security headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,https://rez.money,https://admin.rez.money')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-Organization-ID', 'X-API-Key'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting middleware
const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Skip rate limiting for health checks
  if (req.path.startsWith('/health')) {
    return next();
  }

  const identifier = req.headers['x-api-key'] as string ||
                     req.headers['x-user-id'] as string ||
                     req.ip ||
                     'unknown';

  // Determine rate limit type based on endpoint
  let limitType: 'default' | 'booking' | 'availability' | 'auth' | 'search' = 'default';
  if (req.path.includes('/bookings') && req.method === 'POST') {
    limitType = 'booking';
  } else if (req.path.includes('/availability')) {
    limitType = 'availability';
  } else if (req.path.includes('/auth')) {
    limitType = 'auth';
  }

  const result = await rateLimitService.checkLimit(identifier, limitType);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil((result.retryAfterMs || 0) / 1000).toString());
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((result.retryAfterMs || 0) / 1000),
    });
  }

  next();
};

app.use(rateLimitMiddleware);

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log on response finish
  _res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${_res.statusCode} ${duration}ms`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
});

// ─── Health Endpoints ─────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-schedule-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', uptime: process.uptime() });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let isReady = true;

  // Check PostgreSQL
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = { status: 'up', latencyMs: Date.now() - start };
  } catch (err) {
    checks.postgres = { status: 'down', error: (err as Error).message };
    isReady = false;
  }

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    service: 'rez-schedule-service',
    timestamp: new Date().toISOString(),
    checks,
  });
});

app.get('/health/detailed', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let isHealthy = true;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'up', latencyMs: Date.now() - start };
  } catch (err) {
    checks.database = { status: 'down', error: (err as Error).message };
    isHealthy = false;
  }

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.SERVICE_VERSION || '1.0.0',
    uptime: process.uptime(),
    checks,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// Event Types
app.use('/api/event-types', eventTypeRoutes);

// Bookings
app.use('/api/bookings', bookingRoutes);

// Availability
app.use('/api/availability', availabilityRoutes);

// Webhooks
app.use('/api/webhooks', webhookRoutes);

// Audit
app.use('/api/audit', auditRoutes);

// Users
app.use('/api/users', userRoutes);

// Organizations
app.use('/api/organizations', organizationRoutes);

// Payments
app.use('/api/payments', paymentRoutes);

// Cron (internal)
app.use('/api/cron', cronRoutes);

// OpenAPI Docs
app.get('/api/docs', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// OpenAPI YAML
app.get('/api/docs.yaml', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(`# ReZ Schedule API
openapi: 3.0.0
info:
  title: ReZ Schedule API
  version: 2.0.0
  description: Universal Scheduling Platform
# Full spec available at /api/docs
`);
});

// ─── Public Booking Page ─────────────────────────────────────────────────────

/**
 * Public booking page
 * GET /:username/:slug
 */
app.get('/:username/:slug', async (req: Request, res: Response) => {
  const { username, slug } = req.params;

  res.json({
    success: true,
    message: 'Public booking page',
    data: {
      username,
      slug,
      bookingEndpoint: `POST /${username}/${slug}/book`,
      availabilityEndpoint: `GET /api/availability/${username}/${slug}`,
    },
  });
});

/**
 * Book a slot (public)
 * POST /:username/:slug/book
 */
app.post('/:username/:slug/book', async (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Use /api/bookings with eventTypeId',
  });
});

// ─── Error Handler ───────────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('[Error]', err.message, { stack: err.stack });

  Sentry.captureException(err);

  // CORS error
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS error: origin not allowed',
    });
  }

  // Validation error
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: (err as unknown as { errors: unknown[] }).errors,
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// ─── Server Startup ───────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/rez_schedule';

async function startServer(): Promise<void> {
  logger.info('[Startup] Starting rez-schedule-service...');
  logger.info('[Startup] Environment:', process.env.NODE_ENV || 'development');

  try {
    // Connect to PostgreSQL
    logger.info('[Startup] Connecting to PostgreSQL...');
    await prisma.$connect();
    logger.info('[Startup] PostgreSQL connected');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`[Startup] rez-schedule-service running on port ${PORT}`);
      logger.info('[Startup] Routes available:');
      logger.info('  ── Health ──');
      logger.info('  GET  /health');
      logger.info('  GET  /health/live');
      logger.info('  GET  /health/ready');
      logger.info('  GET  /health/detailed');
      logger.info('  ── Event Types ──');
      logger.info('  GET  /api/event-types');
      logger.info('  POST /api/event-types');
      logger.info('  GET  /api/event-types/:id');
      logger.info('  PUT  /api/event-types/:id');
      logger.info('  DELETE /api/event-types/:id');
      logger.info('  ── Bookings ──');
      logger.info('  GET  /api/bookings');
      logger.info('  POST /api/bookings');
      logger.info('  GET  /api/bookings/:uid');
      logger.info('  PATCH /api/bookings/:uid/cancel');
      logger.info('  PATCH /api/bookings/:uid/reschedule');
      logger.info('  PATCH /api/bookings/:uid/confirm');
      logger.info('  ── Availability ──');
      logger.info('  GET  /api/availability/:username/:slug');
      logger.info('  POST /api/availability/check');
      logger.info('  ── Webhooks ──');
      logger.info('  GET  /api/webhooks');
      logger.info('  POST /api/webhooks');
      logger.info('  GET  /api/webhooks/:id/deliveries');
      logger.info('  ── Audit ──');
      logger.info('  GET  /api/audit/:entityType/:entityId');
      logger.info('  GET  /api/audit/stats/summary');
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`[Shutdown] Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        logger.info('[Shutdown] HTTP server closed');

        try {
          await prisma.$disconnect();
          logger.info('[Shutdown] PostgreSQL disconnected');
        } catch (err) {
          logger.error('[Shutdown] PostgreSQL disconnect error:', err);
        }

        process.exit(0);
      });

      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error('[Shutdown] Forcing exit after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('[Startup] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
