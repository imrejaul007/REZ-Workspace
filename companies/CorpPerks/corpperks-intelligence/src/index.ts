import { logger } from '../../shared/logger';
// CorpPerks Intelligence Service
// AI Workforce Decision Intelligence Layer
// Port: 4135

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import config from './config/index.js';
import { insightsRoutes, copilotRoutes, forecastsRoutes, ecosystemRoutes } from './routes/index.js';
import { apiLimiter, aiLimiter } from './middleware/index.js';
import { requestIdMiddleware, RequestWithId } from './middleware/requestId.js';
import { metricsService } from './services/index.js';
import openApiSpec from './docs/openapi.js';

// Types
interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: boolean;
  };
}

// Initialize express app
const app = express();
const server = app.listen(config.port);

// ==========================================
// MIDDLEWARE
// ==========================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID', 'X-API-Version'],
  exposedHeaders: ['X-Request-ID', 'X-Response-Time', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID tracking (must be first)
app.use(requestIdMiddleware);

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/v1/copilot/', aiLimiter);

// Structured request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Record metrics
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metricsService.recordHttpRequest(req.method, req.path, res.statusCode, duration);
  });

  next();
});

// ==========================================
// API VERSIONING HEADERS
// ==========================================

app.use((req: Request, res: Response, next: NextFunction) => {
  // Set API versioning headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-API-Status', 'current');
  res.setHeader('X-Service-Name', 'corpperks-intelligence');

  // Add CORS headers for preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

// ==========================================
// HEALTH ENDPOINTS (Kubernetes-style)
// ==========================================

// Liveness probe - is the service running?
app.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'corpperks-intelligence',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe - is the service ready to accept traffic?
app.get('/health/ready', async (req: Request, res: Response) => {
  const checks: HealthStatus['checks'] = {
    service: true, // Service is running
    memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024, // < 500MB heap
  };

  const isHealthy = Object.values(checks).every(Boolean);
  const status = isHealthy ? 'ok' : 'degraded';

  res.status(isHealthy ? 200 : 503).json({
    status,
    service: 'corpperks-intelligence',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// Basic health check (for backward compatibility)
app.get('/health', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    status: 'ok',
    service: 'corpperks-intelligence',
    version: '1.0.0',
    description: 'AI Workforce Decision Intelligence Layer',
    capabilities: [
      'Decision Cards',
      'AI Copilot',
      'Health Score',
      'Anomaly Detection',
      'Workforce Forecasting',
    ],
    metrics: {
      uptime: `${uptime.toFixed(0)}s`,
      memory: {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      },
    },
    documentation: {
      openApi: '/api/docs',
      swagger: '/api/docs',
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// METRICS ENDPOINT
// ==========================================

app.get('/metrics', (req: Request, res: Response) => {
  const format = req.query.format as string;

  if (format === 'json') {
    res.json(metricsService.getJsonMetrics());
  } else {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(metricsService.getPrometheusMetrics());
  }
});

// ==========================================
// API DOCUMENTATION
// ==========================================

app.get('/api/docs', (req: Request, res: Response) => {
  res.json(openApiSpec);
});

app.get('/api/docs.yaml', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(`
openapi: 3.0.3
info:
  title: CorpPerks Intelligence API
  version: "1.0.0"
  description: AI Workforce Decision Intelligence Platform
servers:
  - url: http://localhost:4135
    description: Development
  - url: https://corpperks-intelligence.onrender.com
    description: Production
`);
});

// ==========================================
// API ROUTES
// ==========================================

app.use('/api/v1/insights', insightsRoutes);
app.use('/api/v1/copilot', copilotRoutes);
app.use('/api/v1/forecasts', forecastsRoutes);
app.use('/api/v1/ecosystem', ecosystemRoutes);

// ==========================================
// ROOT ENDPOINT
// ==========================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CorpPerks Intelligence',
    tagline: 'AI Workforce Decision Intelligence Platform',
    version: '1.0.0',
    description: 'AI-powered decision intelligence for workforce management',
    documentation: {
      api: '/api/docs',
      openApi: '/api/docs',
      swagger: '/swagger',
    },
    health: {
      live: '/health/live',
      ready: '/health/ready',
      full: '/health',
    },
    metrics: {
      prometheus: '/metrics',
      json: '/metrics?format=json',
    },
    endpoints: {
      insights: {
        cards: 'GET /api/v1/insights/cards',
        health: 'GET /api/v1/insights/health',
        anomalies: 'GET /api/v1/insights/anomalies',
      },
      copilot: {
        query: 'POST /api/v1/copilot/query',
        suggestions: 'GET /api/v1/copilot/suggestions',
        explain: 'POST /api/v1/copilot/explain',
      },
      forecasts: {
        overview: 'GET /api/v1/forecasts',
        attrition: 'GET /api/v1/forecasts/attrition',
        hiring: 'GET /api/v1/forecasts/hiring',
        cost: 'GET /api/v1/forecasts/cost',
        payroll: 'GET /api/v1/forecasts/payroll',
        productivity: 'GET /api/v1/forecasts/productivity',
        headcount: 'GET /api/v1/forecasts/headcount',
        budget: 'GET /api/v1/forecasts/budget',
      },
      ecosystem: {
        services: 'GET /api/v1/ecosystem/services',
        health: 'GET /api/v1/ecosystem/health',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// ERROR HANDLERS
// ==========================================

// 404 handler
app.use((req: Request, res: Response) => {
  const requestId = (req as RequestWithId).requestId;

  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    requestId,
    suggestion: 'Check /api/docs for available endpoints',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler with structured logging
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as RequestWithId).requestId;
  const errorId = uuidv4();

  const errorLog = {
    type: 'error',
    errorId,
    requestId,
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    statusCode: err.status || 500,
    code: err.code,
    timestamp: new Date().toISOString(),
  };

  logger.error(JSON.stringify(errorLog));

  // Don't expose internal errors in production
  const isProduction = config.nodeEnv === 'production';
  const errorMessage = isProduction
    ? (err.status === 400 ? err.message : 'Internal server error')
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    error: errorMessage,
    errorId,
    requestId,
    ...(isProduction ? {} : { code: err.code, details: err.details }),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

let isShuttingDown = false;

const shutdown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(JSON.stringify({
    type: 'shutdown',
    signal,
    message: `Received ${signal}. Starting graceful shutdown...`,
    timestamp: new Date().toISOString(),
  }));

  // Stop accepting new connections
  server.close(() => {
    logger.info(JSON.stringify({
      type: 'shutdown',
      signal,
      message: 'HTTP server closed',
      timestamp: new Date().toISOString(),
    }));

    // Give time for in-flight requests to complete
    setTimeout(() => {
      logger.info(JSON.stringify({
        type: 'shutdown',
        signal,
        message: 'Graceful shutdown complete',
        timestamp: new Date().toISOString(),
      }));
      process.exit(0);
    }, 5000);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error(JSON.stringify({
      type: 'shutdown',
      signal,
      message: 'Forced shutdown after timeout',
      timestamp: new Date().toISOString(),
    }));
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(JSON.stringify({
    type: 'fatal',
    message: 'Uncaught exception',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    timestamp: new Date().toISOString(),
  }));
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(JSON.stringify({
    type: 'fatal',
    message: 'Unhandled promise rejection',
    reason: reason instanceof Error ? {
      name: reason.name,
      message: reason.message,
      stack: reason.stack,
    } : reason,
    timestamp: new Date().toISOString(),
  }));
});

// ==========================================
// STARTUP LOG
// ==========================================

logger.info(JSON.stringify({
  type: 'startup',
  service: 'corpperks-intelligence',
  version: '1.0.0',
  port: config.port,
  environment: config.nodeEnv,
  features: {
    rateLimiting: true,
    requestTracing: true,
    structuredLogging: true,
    metrics: true,
    apiDocs: true,
    gracefulShutdown: true,
  },
  timestamp: new Date().toISOString(),
}));

export default app;
