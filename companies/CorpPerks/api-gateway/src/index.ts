import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { routes } from './routes';
import { authMiddleware, refreshToken } from './middleware/auth';
import { createDynamicRateLimiter, closeRateLimiter } from './middleware/rateLimit';
import { setupProxies } from './middleware/proxy';
import logger, { logRequest, logResponse, logError, logServiceHealth } from './utils/logger';
import { GatewayHealth, ServiceHealth, RequestContext } from './types';
import { ZodError } from 'zod';

// Load environment variables
dotenv.config();

// Validate environment
function validateEnv(): void {
  const required = ['JWT_SECRET', 'INTERNAL_SERVICE_TOKEN'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.warn('Missing required environment variables', { missing });
    // Set defaults for development
    if (process.env.NODE_ENV !== 'production') {
      process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
      process.env.INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token-change-in-production';
    } else {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

// Initialize Express app
const app = express();

// Request tracking
interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalLatency: number;
  activeConnections: number;
}

const metrics: RequestMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalLatency: 0,
  activeConnections: 0,
};

// Start time for uptime calculation
const startTime = Date.now();

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  const startTimestamp = new Date();

  // Create request context
  const context: RequestContext = {
    requestId,
    timestamp: startTimestamp,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
  };

  req.context = context;
  res.setHeader('X-Request-Id', requestId);

  // Track active connections
  metrics.activeConnections++;
  metrics.totalRequests++;

  // Log request
  logRequest(context);

  // Calculate latency on response finish
  res.on('finish', () => {
    const latency = Date.now() - startTimestamp.getTime();
    context.latency = latency;

    metrics.totalLatency += latency;
    metrics.activeConnections--;

    if (res.statusCode < 400) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    logResponse(context, res.statusCode);
  });

  next();
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || ['*'];

app.use(cors({
  origin: corsOrigins.includes('*') ? '*' : corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-Id',
    'X-Internal-Token',
    'X-API-Key',
    'X-Company-Id',
    'X-User-Id',
  ],
  exposedHeaders: [
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - per-route rate limiting
const dynamicRateLimiter = createDynamicRateLimiter();
app.use('/api/', dynamicRateLimiter);

// Health check endpoints (public)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

app.get('/api/health', async (_req: Request, res: Response) => {
  const health = await getGatewayHealth();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Detailed health check with service status
app.get('/api/health/detailed', async (_req: Request, res: Response) => {
  const health = await getGatewayHealth();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Readiness check
app.get('/ready', (_req: Request, res: Response) => {
  const isReady = metrics.totalRequests > 0;
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint
app.get('/metrics', (_req: Request, res: Response) => {
  const successRate = metrics.totalRequests > 0
    ? (metrics.successfulRequests / metrics.totalRequests) * 100
    : 100;

  res.json({
    totalRequests: metrics.totalRequests,
    successfulRequests: metrics.successfulRequests,
    failedRequests: metrics.failedRequests,
    successRate: successRate.toFixed(2) + '%',
    avgLatency: metrics.totalRequests > 0
      ? Math.round(metrics.totalLatency / metrics.totalRequests)
      : 0,
    activeConnections: metrics.activeConnections,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

// Token refresh endpoint
app.post('/api/auth/refresh', refreshToken);

// Authentication middleware for API routes
app.use('/api/', authMiddleware);

// Setup proxies for all routes
setupProxies(app);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.context?.requestId || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logError(err, {
    requestId: req.context?.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.auth?.userId,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors,
        requestId: req.context?.requestId || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        requestId: req.context?.requestId || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      requestId: req.context?.requestId || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
});

// Service health check function
async function checkServiceHealth(url: string, name: string): Promise<ServiceHealth> {
  const health: ServiceHealth = {
    name,
    url,
    status: 'unknown',
    lastCheck: new Date(),
  };

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    health.latency = Date.now() - startTime;

    if (response.ok) {
      health.status = 'healthy';
    } else {
      health.status = 'unhealthy';
      health.error = `HTTP ${response.status}`;
    }
  } catch (error) {
    health.status = 'unhealthy';
    health.latency = Date.now() - startTime;
    health.error = error instanceof Error ? error.message : 'Connection failed';
  }

  return health;
}

// Get gateway health status
async function getGatewayHealth(): Promise<GatewayHealth> {
  const serviceChecks = await Promise.all(
    routes.map(async (route) => {
      const health = await checkServiceHealth(route.target, route.path);
      logServiceHealth(health.name, health.status, health.latency, health.error);
      return health;
    })
  );

  const unhealthyCount = serviceChecks.filter((s) => s.status === 'unhealthy').length;

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (unhealthyCount > serviceChecks.length / 2) {
    status = 'unhealthy';
  } else if (unhealthyCount > 0) {
    status = 'degraded';
  }

  const successRate = metrics.totalRequests > 0
    ? (metrics.successfulRequests / metrics.totalRequests) * 100
    : 100;

  return {
    status,
    timestamp: new Date(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
    services: serviceChecks,
    stats: {
      totalRequests: metrics.totalRequests,
      successRate,
      avgLatency: metrics.totalRequests > 0
        ? Math.round(metrics.totalLatency / metrics.totalRequests)
        : 0,
      activeConnections: metrics.activeConnections,
    },
  };
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down API Gateway...');

  try {
    await closeRateLimiter();
    logger.info('Rate limiter closed');
  } catch (error) {
    logger.error('Error closing rate limiter', { error });
  }

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
function startServer(): void {
  validateEnv();

  const port = parseInt(process.env.PORT || '4700', 10);
  const host = process.env.HOST || '0.0.0.0';

  app.listen(port, host, () => {
    logger.info(`CorpPerks API Gateway started`, {
      port,
      host,
      env: process.env.NODE_ENV || 'development',
      routes: routes.length,
    });

    logger.info('Configured routes:', {
      routes: routes.map((r) => ({
        path: r.path,
        target: r.target,
        timeout: r.timeout,
        rateLimit: r.rateLimit ? `${r.rateLimit.max}/${r.rateLimit.windowMs / 1000}s` : 'default',
      })),
    });
  });
}

// Run
startServer();

export { app, getGatewayHealth };
