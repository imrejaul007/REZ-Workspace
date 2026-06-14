import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { logger } from './utils/logger.js';
import { metrics, httpRequestDuration } from './utils/metrics.js';
import { Identity, IIdentity } from './models/identity.js';
import { MatchResult, IMatchResult } from './models/matchResult.js';
import { IdentityGraph, IIdentityGraph } from './models/identityGraph.js';
import { MatchAudit } from './models/matchAudit.js';
import { deterministicMatch } from './services/deterministicService.js';
import { probabilisticMatch } from './services/probabilisticService.js';
import { mergeIdentities } from './services/mergeService.js';
import { resolveToCanonical } from './services/resolutionService.js';
import { getIdentityGraph } from './services/graphService.js';
import { auditMatch } from './services/auditService.js';
import { authenticate } from './middleware/auth.js';
import { z } from 'zod';

// Environment variables
const PORT = process.env.PORT || 4952;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/identity-matching';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Express app
const app = express();

// Redis client
let redisClient: ReturnType<typeof createClient>;

// Connect to MongoDB
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

// Connect to Redis
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => logger.error('Redis error', { error: err }));
    await redisClient.connect();
    logger.info('Connected to Redis', { url: REDIS_URL });
  } catch (error) {
    logger.error('Redis connection failed', { error });
    throw error;
  }
}

// Request validation schemas
const deterministicMatchSchema = z.object({
  identifiers: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    deviceId: z.string().optional(),
    userId: z.string().optional(),
    cookieId: z.string().optional(),
    ipAddress: z.string().optional(),
    browserFingerprint: z.string().optional()
  }).refine(obj => Object.keys(obj).length > 0, {
    message: 'At least one identifier is required'
  }),
  source: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const probabilisticMatchSchema = z.object({
  features: z.object({
    emailHash: z.string().optional(),
    phoneHash: z.string().optional(),
    deviceHash: z.string().optional(),
    ipHash: z.string().optional(),
    userAgent: z.string().optional(),
    screenResolution: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    cookies: z.array(z.string()).optional(),
    pixelData: z.record(z.any()).optional()
  }).refine(obj => Object.keys(obj).length > 0, {
    message: 'At least one feature is required'
  }),
  threshold: z.number().min(0).max(1).default(0.7),
  source: z.string().optional()
});

const mergeSchema = z.object({
  sourceIds: z.array(z.string()).min(2),
  targetId: z.string().optional(),
  mergeStrategy: z.enum(['prefer_latest', 'prefer_highest_confidence', 'manual']).default('prefer_latest'),
  metadata: z.record(z.any()).optional()
});

const batchMatchSchema = z.object({
  matches: z.array(z.union([deterministicMatchSchema, probabilisticMatchSchema]))
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
    httpRequestDuration.observe(
      { method: req.method, route: req.path, status_code: res.statusCode.toString() },
      duration / 1000
    );
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient?.isOpen ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'identity-matching-engine',
    version: '1.0.0',
    port: PORT,
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus
    },
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', metrics.register.contentType);
  res.send(await metrics.register.metrics());
});

// POST /api/match/deterministic - Deterministic matching
app.post('/api/match/deterministic', authenticate, async (req: Request, res: Response) => {
  try {
    const validation = deterministicMatchSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { identifiers, source, metadata } = validation.data;
    logger.info('Deterministic match request', { identifiers, source });

    const result = await deterministicMatch(identifiers, source, metadata);

    // Create match result
    const matchResult = new MatchResult({
      sourceIds: Object.values(identifiers).filter(Boolean) as string[],
      targetId: result.canonicalId,
      method: 'deterministic',
      confidence: result.confidence,
      features: { identifiers, ...metadata },
      createdAt: new Date()
    });
    await matchResult.save();

    // Audit log
    await auditMatch({
      matchId: matchResult._id.toString(),
      action: 'deterministic_match',
      data: { identifiers, result },
      userId: req.headers['x-user-id'] as string
    });

    metrics.matchesTotal.inc({ method: 'deterministic', status: 'success' });

    res.status(200).json({
      success: true,
      canonicalId: result.canonicalId,
      confidence: result.confidence,
      matchedIdentifiers: result.matchedIdentifiers,
      matchId: matchResult._id.toString()
    });
  } catch (error) {
    logger.error('Deterministic match failed', { error });
    metrics.matchesTotal.inc({ method: 'deterministic', status: 'error' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/match/probabilistic - Probabilistic matching
app.post('/api/match/probabilistic', authenticate, async (req: Request, res: Response) => {
  try {
    const validation = probabilisticMatchSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { features, threshold, source } = validation.data;
    logger.info('Probabilistic match request', { features, threshold });

    const result = await probabilisticMatch(features, threshold, source);

    if (!result.matchFound) {
      metrics.matchesTotal.inc({ method: 'probabilistic', status: 'no_match' });
      res.status(200).json({
        success: false,
        matchFound: false,
        message: 'No match found above threshold'
      });
      return;
    }

    // Create match result
    const matchResult = new MatchResult({
      sourceIds: Object.values(features).filter(Boolean) as string[],
      targetId: result.canonicalId,
      method: 'probabilistic',
      confidence: result.confidence,
      features,
      createdAt: new Date()
    });
    await matchResult.save();

    await auditMatch({
      matchId: matchResult._id.toString(),
      action: 'probabilistic_match',
      data: { features, result },
      userId: req.headers['x-user-id'] as string
    });

    metrics.matchesTotal.inc({ method: 'probabilistic', status: 'success' });

    res.status(200).json({
      success: true,
      matchFound: true,
      canonicalId: result.canonicalId,
      confidence: result.confidence,
      matchedFeatures: result.matchedFeatures,
      matchId: matchResult._id.toString()
    });
  } catch (error) {
    logger.error('Probabilistic match failed', { error });
    metrics.matchesTotal.inc({ method: 'probabilistic', status: 'error' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/match/merge - Merge identities
app.post('/api/match/merge', authenticate, async (req: Request, res: Response) => {
  try {
    const validation = mergeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { sourceIds, targetId, mergeStrategy, metadata } = validation.data;
    logger.info('Merge identities request', { sourceIds, targetId, mergeStrategy });

    const result = await mergeIdentities(sourceIds, targetId, mergeStrategy, metadata);

    await auditMatch({
      matchId: result.mergeId,
      action: 'identity_merge',
      data: { sourceIds, targetId: result.canonicalId },
      userId: req.headers['x-user-id'] as string
    });

    metrics.matchesTotal.inc({ method: 'merge', status: 'success' });

    res.status(200).json({
      success: true,
      mergeId: result.mergeId,
      canonicalId: result.canonicalId,
      mergedIds: result.mergedIds,
      strategy: mergeStrategy
    });
  } catch (error) {
    logger.error('Merge failed', { error });
    metrics.matchesTotal.inc({ method: 'merge', status: 'error' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/match/:id - Get match result
app.get('/api/match/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const matchResult = await MatchResult.findById(id);
    if (!matchResult) {
      res.status(404).json({ error: 'Match result not found' });
      return;
    }

    res.status(200).json({
      success: true,
      match: {
        id: matchResult._id,
        sourceIds: matchResult.sourceIds,
        targetId: matchResult.targetId,
        method: matchResult.method,
        confidence: matchResult.confidence,
        features: matchResult.features,
        createdAt: matchResult.createdAt
      }
    });
  } catch (error) {
    logger.error('Get match failed', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/match/batch - Batch matching
app.post('/api/match/batch', authenticate, async (req: Request, res: Response) => {
  try {
    const validation = batchMatchSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { matches } = validation.data;
    logger.info('Batch match request', { count: matches.length });

    const results = await Promise.all(
      matches.map(async (match) => {
        try {
          if ('identifiers' in match) {
            const result = await deterministicMatch(match.identifiers, match.source, match.metadata);

            const matchResult = new MatchResult({
              sourceIds: Object.values(match.identifiers).filter(Boolean) as string[],
              targetId: result.canonicalId,
              method: 'deterministic',
              confidence: result.confidence,
              features: { identifiers: match.identifiers, ...match.metadata },
              createdAt: new Date()
            });
            await matchResult.save();

            return {
              success: true,
              method: 'deterministic',
              canonicalId: result.canonicalId,
              confidence: result.confidence,
              matchId: matchResult._id.toString()
            };
          } else {
            const result = await probabilisticMatch(match.features, match.threshold || 0.7, match.source);

            if (!result.matchFound) {
              return {
                success: false,
                method: 'probabilistic',
                message: 'No match found'
              };
            }

            const matchResult = new MatchResult({
              sourceIds: Object.values(match.features).filter(Boolean) as string[],
              targetId: result.canonicalId,
              method: 'probabilistic',
              confidence: result.confidence,
              features: match.features,
              createdAt: new Date()
            });
            await matchResult.save();

            return {
              success: true,
              method: 'probabilistic',
              canonicalId: result.canonicalId,
              confidence: result.confidence,
              matchId: matchResult._id.toString()
            };
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    metrics.matchesTotal.inc({ method: 'batch', status: 'completed' });

    res.status(200).json({
      success: true,
      total: matches.length,
      successful: successCount,
      failed: matches.length - successCount,
      results
    });
  } catch (error) {
    logger.error('Batch match failed', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/match/graph/:entityId - Identity graph
app.get('/api/match/graph/:entityId', authenticate, async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const depth = parseInt(req.query.depth as string) || 3;

    logger.info('Get identity graph request', { entityId, depth });

    const graph = await getIdentityGraph(entityId, depth);

    res.status(200).json({
      success: true,
      graph: {
        entityId: graph.entityId,
        nodes: graph.nodes,
        edges: graph.edges,
        relationships: graph.relationships
      }
    });
  } catch (error) {
    logger.error('Get identity graph failed', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/match/resolve - Resolve to canonical ID
app.post('/api/match/resolve', authenticate, async (req: Request, res: Response) => {
  try {
    const { identifiers, preferExisting } = req.body;

    if (!identifiers || typeof identifiers !== 'object') {
      res.status(400).json({ error: 'identifiers object is required' });
      return;
    }

    logger.info('Resolve to canonical request', { identifiers });

    const result = await resolveToCanonical(identifiers, preferExisting !== false);

    res.status(200).json({
      success: true,
      canonicalId: result.canonicalId,
      isNew: result.isNew,
      confidence: result.confidence,
      resolutionMethod: result.resolutionMethod
    });
  } catch (error) {
    logger.error('Resolve to canonical failed', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/match/confidence/:id - Match confidence
app.get('/api/match/confidence/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const matchResult = await MatchResult.findById(id);
    if (!matchResult) {
      res.status(404).json({ error: 'Match result not found' });
      return;
    }

    // Calculate detailed confidence breakdown
    const confidenceBreakdown = {
      overall: matchResult.confidence,
      method: matchResult.method,
      features: matchResult.features,
      breakdown: calculateConfidenceBreakdown(matchResult.features, matchResult.method)
    };

    res.status(200).json({
      success: true,
      matchId: id,
      confidence: matchResult.confidence,
      breakdown: confidenceBreakdown
    });
  } catch (error) {
    logger.error('Get confidence failed', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate confidence breakdown
function calculateConfidenceBreakdown(features: Record<string, any>, method: string): Record<string, number> {
  const breakdown: Record<string, number> = {};

  if (features.identifiers) {
    if (features.identifiers.email) breakdown.email = 1.0;
    if (features.identifiers.phone) breakdown.phone = 0.95;
    if (features.identifiers.deviceId) breakdown.deviceId = 0.9;
    if (features.identifiers.userId) breakdown.userId = 1.0;
  }

  if (features.emailHash) breakdown.emailHash = 0.85;
  if (features.phoneHash) breakdown.phoneHash = 0.8;
  if (features.deviceHash) breakdown.deviceHash = 0.75;
  if (features.ipHash) breakdown.ipHash = 0.6;
  if (features.userAgent) breakdown.userAgent = 0.5;

  return breakdown;
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');
  await mongoose.connection.close();
  await redisClient?.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`Identity Matching Engine started on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export { app };