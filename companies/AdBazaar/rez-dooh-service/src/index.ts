import { logger } from ;
/**
 * DOOH Service - Unified Entry Point
 *
 * Digital Out of Home Advertising Network Service
 *
 * Combines:
 * - Screen management
 * - Ad decision engine (AdOS)
 * - Area-based targeting
 * - 1:1 personalization
 * - DOOH analytics
 * - Database persistence (MongoDB)
 * - Caching (Redis)
 * - Observability (Prometheus)
 * - Error tracking (Sentry)
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import cors from 'cors';
import helmet from 'helmet';

// Services
import { ScreenManagementService } from './services/screenManagement';
import { AdDecisionService } from './services/adDecision';
import { AreaIntelligenceService } from './services/areaIntelligence';
import { PersonalizationService } from './services/personalization';
import { AnalyticsService } from './services/analytics';

// Routes
import { createScreenRoutes } from './routes/screens';
import { createAdRoutes } from './routes/ads';
import { createAnalyticsRoutes } from './routes/analytics';

// Middleware
import {
  createAuthMiddleware,
  requestIdMiddleware,
} from './middleware/auth';

// Database
import { connectDatabase, disconnectDatabase } from './database';
import { screenRepository } from './database/repositories';

// Cache
import { connectRedis, disconnectRedis, checkRateLimit as redisRateLimit } from './cache';

// Observability
import { registry, httpRequestsTotal, httpRequestDuration } from './observability/metrics';
import { initSentry, captureException } from './observability/sentry';

// Types
import { GuardrailConfig } from './types';

// ============================================================================
// Configuration
// ============================================================================

interface DOOHServiceConfig {
  port?: number;
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  };
  guardrails?: Partial<GuardrailConfig>;
  rezMind?: {
    endpoint: string;
    apiKey: string;
  };
  database?: {
    uri?: string;
  };
  redis?: {
    url?: string;
  };
}

// ============================================================================
// DOOH Service
// ============================================================================

export class DOOHService {
  private app: Express;
  private config: DOOHServiceConfig;
  private isShuttingDown = false;

  // Services
  public screenService: ScreenManagementService;
  public adDecisionService: AdDecisionService;
  public areaService: AreaIntelligenceService;
  public personalizationService: PersonalizationService;
  public analyticsService: AnalyticsService;

  constructor(config: DOOHServiceConfig = {}) {
    this.config = config;

    // Initialize services in dependency order
    this.screenService = new ScreenManagementService();
    this.areaService = new AreaIntelligenceService();
    this.analyticsService = new AnalyticsService(this.screenService);
    this.adDecisionService = new AdDecisionService(
      this.screenService,
      this.areaService,
      config.guardrails
    );
    this.personalizationService = new PersonalizationService(
      this.screenService,
      this.areaService
    );

    // Initialize Express app
    this.app = express();

    // Setup middleware
    this.setupMiddleware();

    // Setup routes
    this.setupRoutes();

    // Setup error handling
    this.setupErrorHandling();

    // Connect to ReZ Mind if configured
    if (config.rezMind) {
      this.connectToRezMind(config.rezMind);
    }
  }

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  async initialize(): Promise<void> {
    logger.info('[DOOH Service] Initializing...');

    // Initialize Sentry
    initSentry({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
    });

    // Connect to database
    if (process.env.MONGODB_URI) {
      try {
        await connectDatabase(process.env.MONGODB_URI);
        logger.info('[DOOH Service] Database connected');
      } catch (error) {
        logger.error('[DOOH Service] Database connection failed:', { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    } else {
      logger.warn('[DOOH Service] MONGODB_URI not set, running without database');
    }

    // Connect to Redis
    if (process.env.REDIS_URL) {
      try {
        await connectRedis({ url: process.env.REDIS_URL });
        logger.info('[DOOH Service] Redis connected');
      } catch (error) {
        logger.warn('[DOOH Service] Redis connection failed, running without cache:', error);
      }
    } else {
      logger.warn('[DOOH Service] REDIS_URL not set, running without cache');
    }

    logger.info('[DOOH Service] Initialization complete');
  }

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  private setupMiddleware(): void {
    // Request ID for tracing
    this.app.use(requestIdMiddleware);

    // CORS - Use explicit allowed origins instead of wildcard
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['https://rezapp.com', 'https://www.rezapp.com', 'http://localhost:3000'];

    this.app.use(cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Internal-Token',
        'X-Api-Key',
        'X-Request-Id',
        // AdBazaar tenant headers
        'x-adbazaar-tenant-id',
        'x-adbazaar-tenant-type',
        'x-adbazaar-company-id',
      ],
      maxAge: 86400, // 24 hours
    }));

    // Helmet for security headers
    this.app.use(helmet());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Prometheus metrics middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        const path = normalizePath(req.path);

        httpRequestsTotal.inc({ method: req.method, path, status: res.statusCode });
        httpRequestDuration.observe({ method: req.method, path, status: res.statusCode }, duration / 1000);
      });

      next();
    });

    // Global rate limiting (with Redis fallback)
    this.app.use(this.rateLimitMiddleware.bind(this));

    // Request logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      const requestId = (req as unknown).requestId;
      logger.info(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path}`);
      next();
    });

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        service: 'dooh-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });

    // Ready check
    this.app.get('/ready', async (_req: Request, res: Response) => {
      const checks = {
        database: true,
        redis: true,
        screenService: true,
        adDecisionService: true,
        areaService: this.areaService.isConnectedToRezMind(),
        personalizationService: true,
        analyticsService: true,
      };

      // Check database connection
      try {
        await screenRepository.findAll();
      } catch {
        checks.database = false;
      }

      // Check Redis (best effort)
      try {
        const redis = await import('./cache');
        await redis.cacheExists('health_check');
      } catch {
        checks.redis = false;
      }

      const allHealthy = Object.values(checks).every(v => v === true);

      res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'ready' : 'degraded',
        checks,
        timestamp: new Date().toISOString(),
      });
    });

    // Prometheus metrics endpoint
    this.app.get('/metrics', async (_req: Request, res: Response) => {
      try {
        res.set('Content-Type', registry.contentType);
        res.end(await registry.metrics());
      } catch (error) {
        res.status(500).end();
      }
    });
  }

  private async rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const ip = req.ip || 'unknown';
    const key = `ratelimit:${ip}:${req.path}`;

    try {
      const result = await redisRateLimit(key, {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
      });

      res.setHeader('X-RateLimit-Limit', '100');
      res.setHeader('X-RateLimit-Remaining', String(result.remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

      if (!result.allowed) {
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: result.retryAfter,
        });
        return;
      }
    } catch {
      // Redis unavailable, allow request
    }

    next();
  }

  private setupRoutes(): void {
    // Screen routes - requires internal service auth
    this.app.use(
      '/api/screens',
      createAuthMiddleware(),
      createScreenRoutes({
        screenService: this.screenService,
        analyticsService: this.analyticsService,
      })
    );

    // Ad routes - requires internal service auth
    this.app.use(
      '/api/ads',
      createAuthMiddleware(),
      createAdRoutes({
        adDecisionService: this.adDecisionService,
        personalizationService: this.personalizationService,
        screenService: this.screenService,
        areaService: this.areaService,
      })
    );

    // Analytics routes - requires internal service auth
    this.app.use(
      '/api/analytics',
      createAuthMiddleware(),
      createAnalyticsRoutes({
        analyticsService: this.analyticsService,
        screenService: this.screenService,
      })
    );

    // API root
    this.app.get('/api', (_req: Request, res: Response) => {
      res.json({
        service: 'DOOH Service',
        version: '1.0.0',
        endpoints: {
          screens: '/api/screens',
          ads: '/api/ads',
          analytics: '/api/analytics',
          health: '/health',
          ready: '/ready',
          metrics: '/metrics',
        },
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Not found',
      });
    });

    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
      const errorId = `ERR-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 9)}`;
      const requestId = (req as unknown).requestId;

      // Log to console
      logger.error(`[${errorId}] [${requestId}] Error:`, {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });

      // Capture to Sentry
      captureException(err, {
        requestId,
        path: req.path,
        method: req.method,
      });

      // Don't leak internal details
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        errorId,
      });
    });
  }

  // -------------------------------------------------------------------------
  // ReZ Mind Integration
  // -------------------------------------------------------------------------

  private async connectToRezMind(config: { endpoint: string; apiKey: string }): Promise<void> {
    try {
      await this.areaService.connectToRezMind(config.endpoint, config.apiKey);
      logger.info('Connected to ReZ Mind');
    } catch (error) {
      logger.warn('Failed to connect to ReZ Mind:', error);
    }
  }

  // -------------------------------------------------------------------------
  // Server Control
  // -------------------------------------------------------------------------

  async start(): Promise<void> {
    // Initialize connections
    await this.initialize();

    // Setup graceful shutdown
    this.setupGracefulShutdown();

    const port = this.config.port || parseInt(process.env.PORT || '4019');

    return new Promise((resolve) => {
      this.app.listen(port, () => {
        logger.info(`\n🚀 DOOH Service started on port ${port}`);
        logger.info(`   Health:  http://localhost:${port}/health`);
        logger.info(`   Ready:   http://localhost:${port}/ready`);
        logger.info(`   Metrics: http://localhost:${port}/metrics`);
        logger.info(`   API:     http://localhost:${port}/api\n`);
        resolve();
      });
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      logger.info(`\n[DOOH Service] Received ${signal}, shutting down gracefully...`);

      try {
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('[DOOH Service] Cleanup complete');
        process.exit(0);
      } catch (error) {
        logger.error('[DOOH Service] Shutdown error:', { error: error instanceof Error ? error.message : String(error) });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  stop(): void {
    this.isShuttingDown = true;
    this.areaService.disconnectFromRezMind();
    logger.info('DOOH Service stopped');
  }

  // -------------------------------------------------------------------------
  // Express App Access
  // -------------------------------------------------------------------------

  getApp(): Express {
    return this.app;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let serviceInstance: DOOHService | null = null;

export function createDOOHService(config?: DOOHServiceConfig): DOOHService {
  if (!serviceInstance) {
    serviceInstance = new DOOHService(config);
  }
  return serviceInstance;
}

export function getDOOHService(): DOOHService | null {
  return serviceInstance;
}

// ============================================================================
// Standalone Service Runner
// ============================================================================

async function main(): Promise<void> {
  const config: DOOHServiceConfig = {
    port: parseInt(process.env.PORT || '4019'),
    guardrails: {
      min_budget_per_listing: 500,
      min_total_budget: 1000,
      max_cost_per_visit: 50,
    },
    rezMind: process.env.REZ_MIND_ENDPOINT ? {
      endpoint: process.env.REZ_MIND_ENDPOINT,
      apiKey: process.env.REZ_MIND_API_KEY || '',
    } : undefined,
  };

  const service = createDOOHService(config);
  await service.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Re-exports - DOOHServiceConfig is internal to index.ts

// Helper function for path normalization
function normalizePath(path: string): string {
  return path
    .replace(/\/screens\/[^/]+/, '/screens/:id')
    .replace(/\/campaigns\/[^/]+/, '/campaigns/:id')
    .replace(/\/[0-9a-f-]{36}/gi, '/:uuid');
}
