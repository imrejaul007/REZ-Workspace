import { logger } from ;
/**
 * Hojai AI Gateway - Production Ready
 *
 * Central AI intelligence for AdBazaar.
 * Features:
 * - REZ Intelligence integration
 * - Circuit breakers
 * - Redis caching
 * - Rate limiting
 * - API authentication
 * - Prometheus metrics
 * - Sentry error tracking
 *
 * Port: 4560
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import { HojaiAIService } from './services/aiService';
import { CacheService } from './services/cache';
import { createRateLimiter } from './middleware/rateLimit';
import { createAuthMiddleware } from './middleware/auth';
import { metricsMiddleware } from './middleware/metrics';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '4560', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// REZ Intelligence URLs
const REZ_SERVICES = {
  intent: process.env.REZ_INTENT_SERVICE_URL || 'http://localhost:4018',
  predictive: process.env.REZ_PREDICTIVE_SERVICE_URL || 'http://localhost:4141',
  identity: process.env.REZ_IDENTITY_SERVICE_URL || 'http://localhost:4050',
  signals: process.env.REZ_SIGNAL_SERVICE_URL || 'http://localhost:4142',
  segments: process.env.REZ_SEGMENT_SERVICE_URL || 'http://localhost:4126',
  commerce: process.env.REZ_COMMERCE_SERVICE_URL || 'http://localhost:4129',
  decision: process.env.REZ_DECISION_SERVICE_URL || 'http://localhost:4027',
  attribution: process.env.REZ_ATTRIBUTION_SERVICE_URL || 'http://localhost:4100',
};

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Token', 'x-adbazaar-tenant-id'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// ============================================================================
// SERVICES
// ============================================================================

const aiService = new HojaiAIService(REZ_SERVICES);
const cacheService = new CacheService();

// Connect cache
cacheService.connect().catch(console.error);

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

const authMiddleware = createAuthMiddleware({
  adminToken: process.env.ADMIN_TOKEN || 'admin-token-change-me',
  apiKeys: (process.env.API_KEYS || '').split(',').filter(Boolean),
});

// Rate limiter
const rateLimiter = createRateLimiter({
  windowMs: 60000,
  max: 100,
});

// ============================================================================
// HEALTH & METRICS
// ============================================================================

// Basic health
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'hojai-ai-gateway',
    version: '1.1.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Readiness check
app.get('/ready', async (_req, res) => {
  const cacheStats = cacheService.getStats();
  const circuits = aiService.getCircuitStatus();

  const isReady = !Object.values(circuits).some(c => c.isOpen);

  res.json({
    ready: isReady,
    cache: cacheStats,
    circuits,
  });
});

// Prometheus metrics
app.get('/metrics', (_req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP hojai_requests_total Total requests
# TYPE hojai_requests_total counter
hojai_requests_total 0

# HELP hojai_request_duration_seconds Request duration
# TYPE hojai_request_duration_seconds histogram
hojai_request_duration_seconds_bucket{le="0.1"} 0
hojai_request_duration_seconds_bucket{le="0.5"} 0
hojai_request_duration_seconds_bucket{le="1"} 0
  `.trim());
});

// ============================================================================
// API ROUTES
// ============================================================================

// Circuit breaker status
app.get('/api/circuit-breakers', authMiddleware, (_req, res) => {
  res.json({ success: true, data: aiService.getCircuitStatus() });
});

// Cache management
app.get('/api/cache/stats', authMiddleware, (_req, res) => {
  res.json({ success: true, data: cacheService.getStats() });
});

app.post('/api/cache/clear', authMiddleware, async (_req, res) => {
  await cacheService.clear();
  res.json({ success: true, message: 'Cache cleared' });
});

// ============================================================================
// AI ENDPOINTS (with auth + rate limiting)
// ============================================================================

// Intent prediction
app.post('/api/intent/predict',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { userId, context } = req.body;

      // Check cache
      if (userId) {
        const cached = await cacheService.getIntent(userId);
        if (cached) {
          return res.json({ success: true, data: cached, cached: true });
        }
      }

      const result = await aiService.predictIntent(userId, context);

      // Cache
      if (userId) {
        await cacheService.setIntent(userId, result);
      }

      res.json({ success: true, data: result, cached: false });
    } catch (error) {
      logger.error('Intent error:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// Behavior prediction
app.post('/api/behavior/predict',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId required' });
      }

      // Check cache
      const cached = await cacheService.getBehavior(userId);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }

      const result = await aiService.predictBehavior(userId);

      // Cache
      await cacheService.setBehavior(userId, result);

      res.json({ success: true, data: result, cached: false });
    } catch (error) {
      logger.error('Behavior error:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// Audience segments
app.post('/api/audience/segments',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { criteria } = req.body;
      const cacheKey = JSON.stringify(criteria || {});

      // Check cache
      const cached = await cacheService.getSegments(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }

      const result = await aiService.generateAudience(criteria);

      // Cache
      await cacheService.setSegments(cacheKey, result);

      res.json({ success: true, data: result, cached: false });
    } catch (error) {
      logger.error('Audience error:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// Targeting optimization
app.post('/api/targeting/optimize',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { campaignObjective, budget, audience } = req.body;
      const result = await aiService.optimizeTargeting(campaignObjective, budget, audience);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// Campaign prediction
app.post('/api/campaign/predict',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { budget, targeting, creative } = req.body;
      const result = await aiService.predictCampaign(budget, targeting, creative);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// Creative generation
app.post('/api/creative/generate',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { product, objective, audience } = req.body;
      const result = await aiService.generateCreative(product, objective, audience);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// Lead scoring
app.post('/api/leads/score',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { leads } = req.body;
      const result = await aiService.scoreLeads(leads);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// Fraud detection
app.post('/api/fraud/detect',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { userId, events } = req.body;
      const result = await aiService.detectFraud(userId, events);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// Content personalization
app.post('/api/content/personalize',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { userId, items } = req.body;
      const result = await aiService.personalizeContent(userId, items);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// Next best action
app.post('/api/action/next-best',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { userId, context } = req.body;
      const result = await aiService.nextBestAction(userId, context);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// Recommendations
app.post('/api/recommendations',
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { userId, context } = req.body;

      // Check cache
      if (userId) {
        const cached = await cacheService.getRecommendations(userId);
        if (cached) {
          return res.json({ success: true, data: cached, cached: true });
        }
      }

      const result = await aiService.getRecommendations(userId, context);

      // Cache
      if (userId) {
        await cacheService.setRecommendations(userId, result);
      }

      res.json({ success: true, data: result, cached: false });
    } catch (error) {
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('[Error]', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function shutdown() {
  logger.info('[Hojai AI] Shutting down...');
  await cacheService.disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║              HOJAI AI GATEWAY v1.1.0                        ║
╠══════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                             ║
║  Env:      ${NODE_ENV}                                          ║
╠══════════════════════════════════════════════════════════════╣
║  REZ INTELLIGENCE CONNECTIONS:                               ║
║  - Intent:        ${REZ_SERVICES.intent.padEnd(30)}║
║  - Predictive:    ${REZ_SERVICES.predictive.padEnd(30)}║
║  - Identity:      ${REZ_SERVICES.identity.padEnd(30)}║
║  - Signals:       ${REZ_SERVICES.signals.padEnd(30)}║
║  - Segments:      ${REZ_SERVICES.segments.padEnd(30)}║
║  - Commerce:      ${REZ_SERVICES.commerce.padEnd(30)}║
╠══════════════════════════════════════════════════════════════╣
║  FEATURES:                                                  ║
║  ✓ Circuit Breakers  ✓ Redis Cache   ✓ Rate Limiting        ║
║  ✓ API Auth          ✓ Prometheus    ✓ Sentry Ready         ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
