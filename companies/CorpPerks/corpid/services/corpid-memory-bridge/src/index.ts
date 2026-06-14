/**
 * CorpID Memory Bridge Service
 *
 * Bridges CorpID to HOJAI Core Memory (port 4520)
 * Provides evidence chain for assertions
 *
 * Flow:
 * MemoryOS Event → CorpID Evidence → Assertion Confidence
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
}));

// Config
const PORT = parseInt(process.env.PORT || '4709', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

// MemoryOS (HOJAI Core) URL
const MEMORYOS_URL = process.env.MEMORYOS_URL || 'http://localhost:4520';

// CorpID services
const CORPID_URL = process.env.CORPID_SERVICE_URL || 'http://localhost:4702';
const ASSERTION_URL = process.env.ASSERTION_SERVICE_URL || 'http://localhost:4707';

function generateId(prefix: string = 'MB'): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  next(); // For development
}

// ============================================================================
// MONGODB SCHEMAS
// ============================================================================

// Event Mapping Schema (maps MemoryOS events to CorpID entities)
const eventMappingSchema = new Schema({
  mappingId: { type: String, required: true, unique: true, index: true },
  memoryEventId: { type: String, required: true, index: true },
  corpId: { type: String, required: true, index: true },
  predicate: { type: String, required: true },
  weight: { type: Number, default: 0.5 },
  source: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
  assertionId: String,
});

eventMappingSchema.index({ corpId: 1, processedAt: -1 });
eventMappingSchema.index({ memoryEventId: 1 });

const EventMapping = model('EventMapping', eventMappingSchema);

// Evidence Chain Schema
const evidenceChainSchema = new Schema({
  chainId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  predicate: { type: String, required: true },
  events: [{
    memoryEventId: String,
    weight: Number,
    processedAt: Date,
  }],
  totalWeight: Number,
  confidenceBoost: Number,
  lastUpdated: { type: Date, default: Date.now },
});

evidenceChainSchema.index({ corpId: 1, predicate: 1 });

const EvidenceChain = model('EvidenceChain', evidenceChainSchema);

// Event Source Configuration
const EVENT_SOURCE_CONFIG: Record<string, {
  predicateMap: Record<string, string>;
  defaultWeight: number;
}> = {
  github: {
    predicateMap: {
      'pr.merged': 'skill:{language}',
      'pr.reviewed': 'skill:code-review',
      'issue.closed': 'capability:{type}',
      'commit': 'skill:{language}',
    },
    defaultWeight: 0.7,
  },
  jira: {
    predicateMap: {
      'task.completed': 'capability:{project_type}',
      'story.completed': 'capability:story_delivery',
      'bug.fixed': 'skill:debugging',
    },
    defaultWeight: 0.8,
  },
  lms: {
    predicateMap: {
      'course.completed': 'cert:{course_name}',
      'certification.earned': 'cert:{cert_name}',
      'quiz.passed': 'skill:{topic}',
    },
    defaultWeight: 0.9,
  },
  calendar: {
    predicateMap: {
      'meeting.attended': 'experience:{meeting_type}',
      'presentation.given': 'capability:presentation',
    },
    defaultWeight: 0.6,
  },
  sutar: {
    predicateMap: {
      'task.completed': 'execution:task_completion',
      'task.approved': 'execution:quality',
      'goal.achieved': 'capability:goal_achievement',
    },
    defaultWeight: 0.8,
  },
  corpperks: {
    predicateMap: {
      'review.completed': 'performance:review',
      'promotion.given': 'capability:leadership',
      'training.completed': 'skill:{topic}',
    },
    defaultWeight: 0.85,
  },
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'corpid-memory-bridge',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// EVENT INGESTION
// ============================================================================

/**
 * Receive event from MemoryOS or other sources
 * POST /events
 */
app.post('/events',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        eventId,
        eventType,
        source,
        entityCorpIds,
        predicate,
        value,
        weight,
        metadata,
        timestamp
      } = req.body;

      if (!eventId || !source || !entityCorpIds || !Array.isArray(entityCorpIds)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'eventId, source, and entityCorpIds are required' },
        });
      }

      // Check if already processed
      const existing = await EventMapping.findOne({ memoryEventId: eventId });
      if (existing) {
        return res.status(200).json({
          success: true,
          data: { alreadyProcessed: true, mappingId: existing.mappingId },
        });
      }

      const processedEvents = [];

      for (const corpId of entityCorpIds) {
        // Determine predicate
        let finalPredicate = predicate;
        if (!finalPredicate && eventType) {
          const config = EVENT_SOURCE_CONFIG[source];
          if (config) {
            const pattern = config.predicateMap[eventType];
            if (pattern) {
              // Replace placeholders with metadata values
              finalPredicate = pattern;
              if (metadata) {
                for (const [key, val] of Object.entries(metadata)) {
                  finalPredicate = finalPredicate.replace(`{${key}}`, String(val));
                }
              }
            }
          }
        }

        if (!finalPredicate) {
          finalPredicate = `event:${eventType || 'unknown'}`;
        }

        // Determine weight
        const finalWeight = weight || EVENT_SOURCE_CONFIG[source]?.defaultWeight || 0.5;

        // Create mapping
        const mapping = new EventMapping({
          mappingId: generateId('MAP'),
          memoryEventId: eventId,
          corpId,
          predicate: finalPredicate,
          weight: finalWeight,
          source,
        });
        await mapping.save();

        // Update evidence chain
        await updateEvidenceChain(corpId, finalPredicate, {
          memoryEventId: eventId,
          weight: finalWeight,
          processedAt: new Date(),
        });

        // Push to CorpID Assertion Service
        try {
          const assertionResult = await pushToAssertion(corpId, finalPredicate, eventId, finalWeight, source);
          mapping.assertionId = assertionResult.assertionId;
          await mapping.save();
        } catch (err) {
          logger.error('Failed to push to assertion service:', err);
        }

        processedEvents.push({
          corpId,
          predicate: finalPredicate,
          weight: finalWeight,
          mappingId: mapping.mappingId,
        });
      }

      res.status(201).json({
        success: true,
        data: {
          eventId,
          source,
          processed: processedEvents.length,
          events: processedEvents,
        },
      });
    } catch (error) {
      logger.error('Error processing event:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to process event' },
      });
    }
  }
);

/**
 * Bulk event ingestion from MemoryOS
 * POST /events/bulk
 */
app.post('/events/bulk',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { events } = req.body;

      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'events array is required' },
        });
      }

      const results = [];
      const errors = [];

      for (const event of events) {
        try {
          const result = await processEvent(event);
          results.push(result);
        } catch (err: any) {
          errors.push({ eventId: event.eventId, error: err.message });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          processed: results.length,
          failed: errors.length,
          results,
          errors: errors.slice(0, 10),
        },
      });
    } catch (error) {
      logger.error('Error bulk processing events:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to bulk process events' },
      });
    }
  }
);

// ============================================================================
// EVIDENCE QUERIES
// ============================================================================

/**
 * Get evidence chain for a CorpID
 * GET /evidence/:corpId
 */
app.get('/evidence/:corpId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;
      const { predicate } = req.query;

      const filter: any = { corpId };
      if (predicate) filter.predicate = predicate;

      const chains = await EvidenceChain.find(filter).lean();

      res.json({
        success: true,
        data: {
          corpId,
          chains,
          totalPredicates: chains.length,
          totalEvents: chains.reduce((sum, c) => sum + (c.events?.length || 0), 0),
        },
      });
    } catch (error) {
      logger.error('Error fetching evidence:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch evidence' },
      });
    }
  }
);

/**
 * Get events for a CorpID
 * GET /events/:corpId
 */
app.get('/events/:corpId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;
      const { source, fromDate, toDate, limit = 50 } = req.query;

      const filter: any = { corpId };
      if (source) filter.source = source;
      if (fromDate || toDate) {
        filter.processedAt = {};
        if (fromDate) filter.processedAt.$gte = new Date(fromDate as string);
        if (toDate) filter.processedAt.$lte = new Date(toDate as string);
      }

      const events = await EventMapping.find(filter)
        .sort({ processedAt: -1 })
        .limit(parseInt(limit as string))
        .lean();

      res.json({
        success: true,
        data: {
          corpId,
          events,
          total: events.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching events:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch events' },
      });
    }
  }
);

/**
 * Search evidence by predicate pattern
 * GET /evidence/search
 */
app.get('/evidence/search',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { predicate, corpId, minWeight, limit = 50 } = req.query;

      const filter: any = {};
      if (predicate) {
        filter.predicate = { $regex: predicate as string, $options: 'i' };
      }
      if (corpId) filter.corpId = corpId;
      if (minWeight) filter.weight = { $gte: parseFloat(minWeight as string) };

      const results = await EventMapping.find(filter)
        .sort({ weight: -1, processedAt: -1 })
        .limit(parseInt(limit as string))
        .lean();

      res.json({
        success: true,
        data: {
          results,
          total: results.length,
        },
      });
    } catch (error) {
      logger.error('Error searching evidence:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to search evidence' },
      });
    }
  }
);

// ============================================================================
// MEMORYOS INTEGRATION
// ============================================================================

/**
 * Pull events from MemoryOS
 * POST /sync/memoryos
 */
app.post('/sync/memoryos',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { tenantId, eventTypes, since } = req.body;

      // Query MemoryOS for events
      const response = await fetch(`${MEMORYOS_URL}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId || 'default',
        },
        body: JSON.stringify({
          type: eventTypes,
          from: since,
          limit: 100,
        }),
      }).catch(() => null);

      if (!response?.ok) {
        return res.status(502).json({
          success: false,
          error: { code: 'MEMORYOS_ERROR', message: 'Failed to connect to MemoryOS' },
        });
      }

      const data = await response.json();
      const events = data.data?.timeline || [];

      // Process each event
      const results = [];
      for (const event of events) {
        try {
          const result = await processEvent({
            eventId: event.id,
            eventType: event.type,
            source: 'memoryos',
            entityCorpIds: event.metadata?.corpIds || [],
            predicate: event.metadata?.predicate,
            value: true,
            weight: event.metadata?.weight || 0.5,
            metadata: event.metadata,
          });
          results.push(result);
        } catch (err) {
          logger.error('Failed to process event:', event.id, err);
        }
      }

      res.json({
        success: true,
        data: {
          pulled: events.length,
          processed: results.length,
        },
      });
    } catch (error) {
      logger.error('Error syncing from MemoryOS:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to sync from MemoryOS' },
      });
    }
  }
);

/**
 * Store memory in MemoryOS (bidirectional sync)
 * POST /memoryos
 */
app.post('/memoryos',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { tenantId, userId, type, content, importance, tags, metadata } = req.body;

      const response = await fetch(`${MEMORYOS_URL}/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId || 'default',
        },
        body: JSON.stringify({
          userId,
          type: type || 'learning',
          content,
          importance: importance || 0.6,
          tags,
          metadata,
        }),
      });

      const data = await response.json();

      res.json({
        success: true,
        data: {
          memoryId: data.data?.memory?.id,
          stored: response.ok,
        },
      });
    } catch (error) {
      logger.error('Error storing to MemoryOS:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to store to MemoryOS' },
      });
    }
  }
);

/**
 * Search MemoryOS
 * POST /memoryos/search
 */
app.post('/memoryos/search',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { tenantId, query, userId, limit } = req.body;

      const response = await fetch(`${MEMORYOS_URL}/memory/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId || 'default',
        },
        body: JSON.stringify({
          query,
          userId,
          limit: limit || 10,
        }),
      });

      const data = await response.json();

      res.json({
        success: true,
        data: data.data,
      });
    } catch (error) {
      logger.error('Error searching MemoryOS:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to search MemoryOS' },
      });
    }
  }
);

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get evidence statistics
 * GET /stats
 */
app.get('/stats',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.query;

      const filter: any = {};
      if (corpId) filter.corpId = corpId;

      const [totalMappings, bySource, byWeight] = await Promise.all([
        EventMapping.countDocuments(filter),
        EventMapping.aggregate([
          { $match: filter },
          { $group: { _id: '$source', count: { $sum: 1 } } },
        ]),
        EventMapping.aggregate([
          { $match: filter },
          { $bucket: { groupBy: '$weight', boundaries: [0, 0.3, 0.6, 0.8, 1.0], default: 'other', count: { $sum: 1 } } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          totalEvents: totalMappings,
          bySource: Object.fromEntries(bySource.map(s => [s._id, s.count])),
          byWeightRange: byWeight,
        },
      });
    } catch (error) {
      logger.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' },
      });
    }
  }
);

// ============================================================================
// WEBHOOK REGISTRATION
// ============================================================================

/**
 * Register webhook with MemoryOS for event notifications
 * POST /webhooks
 */
app.post('/webhooks',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { memoryosUrl } = req.body;

      // Register this service as a webhook receiver with MemoryOS
      const webhookUrl = `${process.env.SERVICE_URL || `http://localhost:${PORT}`}/events`;

      const response = await fetch(`${memoryosUrl || MEMORYOS_URL}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          events: ['memory.created', 'timeline.entry'],
          secret: randomBytes(16).toString('hex'),
        }),
      });

      const data = await response.json();

      res.json({
        success: true,
        data: {
          registered: response.ok,
          webhookId: data.id,
        },
      });
    } catch (error) {
      logger.error('Error registering webhook:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to register webhook' },
      });
    }
  }
);

// ============================================================================
// HELPERS
// ============================================================================

async function processEvent(event: any): Promise<any> {
  const {
    eventId,
    eventType,
    source,
    entityCorpIds,
    predicate,
    value,
    weight,
    metadata,
  } = event;

  // Check if already processed
  const existing = await EventMapping.findOne({ memoryEventId: eventId });
  if (existing) {
    return { alreadyProcessed: true, mappingId: existing.mappingId };
  }

  const results = [];

  for (const corpId of entityCorpIds) {
    // Determine predicate
    let finalPredicate = predicate;
    if (!finalPredicate && eventType) {
      const config = EVENT_SOURCE_CONFIG[source];
      if (config) {
        const pattern = config.predicateMap[eventType];
        if (pattern) {
          finalPredicate = pattern;
          if (metadata) {
            for (const [key, val] of Object.entries(metadata)) {
              finalPredicate = finalPredicate.replace(`{${key}}`, String(val));
            }
          }
        }
      }
    }

    if (!finalPredicate) {
      finalPredicate = `event:${eventType || 'unknown'}`;
    }

    const finalWeight = weight || EVENT_SOURCE_CONFIG[source]?.defaultWeight || 0.5;

    const mapping = new EventMapping({
      mappingId: generateId('MAP'),
      memoryEventId: eventId,
      corpId,
      predicate: finalPredicate,
      weight: finalWeight,
      source,
    });
    await mapping.save();

    await updateEvidenceChain(corpId, finalPredicate, {
      memoryEventId: eventId,
      weight: finalWeight,
      processedAt: new Date(),
    });

    // Push to assertion service
    try {
      const assertionResult = await pushToAssertion(corpId, finalPredicate, eventId, finalWeight, source);
      mapping.assertionId = assertionResult.assertionId;
      await mapping.save();
    } catch (err) {
      logger.error('Failed to push to assertion:', err);
    }

    results.push({
      corpId,
      predicate: finalPredicate,
      weight: finalWeight,
      mappingId: mapping.mappingId,
    });
  }

  return results;
}

async function updateEvidenceChain(
  corpId: string,
  predicate: string,
  event: { memoryEventId: string; weight: number; processedAt: Date }
): Promise<void> {
  let chain = await EvidenceChain.findOne({ corpId, predicate });

  if (!chain) {
    chain = new EvidenceChain({
      chainId: generateId('CHAIN'),
      corpId,
      predicate,
      events: [],
      totalWeight: 0,
      confidenceBoost: 0,
    });
  }

  // Add event to chain
  chain.events.push(event);

  // Recalculate weights
  chain.totalWeight = chain.events.reduce((sum, e) => sum + e.weight, 0);
  chain.confidenceBoost = calculateConfidenceBoost(chain.events);
  chain.lastUpdated = new Date();

  await chain.save();
}

function calculateConfidenceBoost(events: Array<{ weight: number }>): number {
  if (events.length === 0) return 0;

  // Weighted average boost
  const totalWeight = events.reduce((sum, e) => sum + e.weight, 0);
  const avgWeight = totalWeight / events.length;

  // Volume bonus (up to +0.1 for 10+ events)
  const volumeBonus = Math.min(events.length * 0.01, 0.1);

  // Diversity bonus (up to +0.05 for 3+ unique sources)
  const sources = new Set(events.map(() => 'source'));
  const diversityBonus = Math.min(sources.size * 0.02, 0.05);

  return avgWeight * 0.5 + volumeBonus + diversityBonus;
}

async function pushToAssertion(
  corpId: string,
  predicate: string,
  memoryEventId: string,
  weight: number,
  source: string
): Promise<{ assertionId: string }> {
  // Check if assertion exists
  const checkRes = await fetch(`${ASSERTION_URL}/assertions/${encodeURIComponent(corpId)}`, {
    headers: { 'x-internal-token': INTERNAL_TOKEN },
  });

  // Find or create skill assertion
  const skillName = predicate.replace(/^(skill:|capability:|cert:)/, '');

  const createRes = await fetch(`${ASSERTION_URL}/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': INTERNAL_TOKEN,
    },
    body: JSON.stringify({
      corpId,
      skill: skillName,
      level: 'INTERMEDIATE',
      createdBy: 'memory-bridge',
    }),
  });

  const createData = await createRes.json();

  if (createData.data?.assertionId) {
    // Add evidence to the skill assertion
    try {
      await fetch(`${ASSERTION_URL}/assertions/${createData.data.assertionId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({
          memoryEventId,
          weight,
          source: 'SYSTEM_OBSERVED',
          description: `Event from ${source}`,
        }),
      });
    } catch (err) {
      logger.error('Failed to add evidence:', err);
    }

    return { assertionId: createData.data.assertionId };
  }

  return { assertionId: createData.data?.assertionId || '' };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message },
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    await EventMapping.createIndexes();
    await EvidenceChain.createIndexes();
    logger.info('Indexes created');

    app.listen(PORT, () => {
      logger.info(`CorpID Memory Bridge running on port ${PORT}`);
      logger.info(`Connected to MemoryOS at ${MEMORYOS_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
