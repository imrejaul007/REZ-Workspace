import { logger } from '../../shared/logger';
/**
 * SkillNet ↔ Professional Twin Bridge
 *
 * This service connects SkillNet with the Professional Twin system:
 * - SkillNet learns from employee work
 * - This bridge updates Professional Twins based on SkillNet data
 * - Twins become smarter as SkillNet captures more skills
 *
 * Flow:
 *   Employee does work
 *       ↓
 *   SkillNet captures skill event
 *       ↓
 *   This Bridge processes event
 *       ↓
 *   Updates Professional Twin
 *       ↓
 *   Twin becomes smarter
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import http from 'http';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED' } }
}));

// Config
const PORT = parseInt(process.env.PORT || '4761', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillnet-twin-bridge';

// Service URLs
const TWIN_MARKETPLACE_URL = process.env.TWIN_MARKETPLACE_URL || 'http://localhost:4760';
const SKILLNET_INTELLIGENCE_URL = process.env.SKILLNET_INTELLIGENCE_URL || 'http://localhost:5130';
const SALAR_URL = process.env.SALAR_URL || 'http://localhost:4710';
const CORPID_URL = process.env.CORPID_URL || 'http://localhost:4702';
const MEMORY_URL = process.env.MEMORY_URL || 'http://localhost:4520';

const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'skillnet-twin-bridge-secret';

// =============================================================================
// MODELS - Local cache of twin state
// =============================================================================

const skillEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },
  twinId: String,

  // Event type
  eventType: {
    type: String,
    enum: ['SKILL_USED', 'SKILL_LEARNED', 'TASK_COMPLETED', 'FEEDBACK_RECEIVED', 'KNOWLEDGE_GAINED'],
    required: true
  },

  // Event data
  skill: String,
  task: String,
  outcome: { type: String, enum: ['SUCCESS', 'PARTIAL', 'FAILURE'] },
  duration: Number, // ms

  // Context
  context: {
    source: String, // 'SKILLNET', 'CORPPERKS', 'MEMORY', 'MANUAL'
    confidence: { type: Number, default: 0.8 },
    evidence: [String]
  },

  // Impact on twin
  impact: {
    knowledgeScore: Number,
    executionScore: Number,
    reliabilityScore: Number,
    productivityMultiplier: Number
  },

  processed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const SkillEvent = mongoose.model('SkillEvent', skillEventSchema);

// =============================================================================
// HELPERS
// =============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function httpRequest(url: string, options: http.RequestOptions = {}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode!, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode!, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

/**
 * Calculate twin impact from skill event
 */
function calculateImpact(event: any): any {
  const baseImpact = {
    knowledgeScore: 0,
    executionScore: 0,
    reliabilityScore: 0,
    productivityMultiplier: 0
  };

  switch (event.eventType) {
    case 'SKILL_USED':
      if (event.outcome === 'SUCCESS') {
        baseImpact.executionScore = 2;
        baseImpact.reliabilityScore = 1;
        baseImpact.productivityMultiplier = 0.01;
      } else if (event.outcome === 'PARTIAL') {
        baseImpact.executionScore = 1;
        baseImpact.productivityMultiplier = 0.005;
      }
      break;

    case 'SKILL_LEARNED':
      baseImpact.knowledgeScore = 5;
      baseImpact.productivityMultiplier = 0.02;
      break;

    case 'TASK_COMPLETED':
      if (event.outcome === 'SUCCESS') {
        baseImpact.executionScore = 3;
        baseImpact.reliabilityScore = 2;
        baseImpact.productivityMultiplier = 0.03;
      }
      break;

    case 'FEEDBACK_RECEIVED':
      baseImpact.knowledgeScore = event.context.confidence * 3;
      baseImpact.executionScore = event.context.confidence * 2;
      break;

    case 'KNOWLEDGE_GAINED':
      baseImpact.knowledgeScore = 4;
      baseImpact.productivityMultiplier = 0.01;
      break;
  }

  return baseImpact;
}

/**
 * Determine twin type based on skill category
 */
function getTwinTypeForSkill(skill: string): string {
  const skillLower = skill.toLowerCase();

  // Knowledge-based skills
  if (['analysis', 'research', 'understanding', 'knowledge'].some(k => skillLower.includes(k))) {
    return 'KNOWLEDGE';
  }

  // Execution-based skills
  if (['coding', 'writing', 'design', 'building', 'creating', 'executing'].some(k => skillLower.includes(k))) {
    return 'EXECUTION';
  }

  // Career/professional skills
  if (['leadership', 'management', 'communication', 'strategy'].some(k => skillLower.includes(k))) {
    return 'CAREER';
  }

  // Productivity skills
  if (['time', 'productivity', 'efficiency', 'optimization', 'planning'].some(k => skillLower.includes(k))) {
    return 'PRODUCTIVITY';
  }

  // Default to SKILL
  return 'SKILL';
}

// =============================================================================
// ROUTES
// =============================================================================

// Health
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'skillnet-twin-bridge',
    tagline: 'Connecting SkillNet to Professional Twins',
    timestamp: new Date().toISOString()
  });
});

// Info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'SkillNet ↔ Professional Twin Bridge',
    tagline: 'Making twins smarter through SkillNet',
    flow: {
      '1': 'SkillNet captures skill event',
      '2': 'This bridge receives event',
      '3': 'Calculates twin impact',
      '4': 'Updates Professional Twin',
      '5': 'Twin becomes smarter'
    },
    endpoints: {
      'POST /events': 'Receive skill event from SkillNet',
      'POST /events/bulk': 'Bulk import skill events',
      'GET /events/:corpId': 'Get events for an employee',
      'POST /sync/:corpId': 'Sync all events for an employee',
      'GET /twin/:corpId/learning': 'Get twin learning status'
    }
  });
});

// =============================================================================
// RECEIVE SKILL EVENT FROM SKILLNET
// =============================================================================

app.post('/events', async (req: Request, res: Response) => {
  try {
    const { corpId, skill, task, outcome, duration, context } = req.body;

    if (!corpId || !skill) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'corpId and skill are required' }
      });
    }

    // Determine twin type
    const twinType = getTwinTypeForSkill(skill);

    // Calculate impact
    const impact = calculateImpact({ eventType: 'SKILL_USED', outcome, context: { confidence: 0.8 } });

    // Create event
    const event = new SkillEvent({
      eventId: generateId('SEV'),
      corpId,
      twinId: `TWIN-${corpId}-${twinType}`,
      eventType: 'SKILL_USED',
      skill,
      task,
      outcome: outcome || 'SUCCESS',
      duration,
      context: {
        source: 'SKILLNET',
        confidence: context?.confidence || 0.8,
        evidence: context?.evidence || []
      },
      impact,
      processed: false
    });

    await event.save();

    // Update twin in marketplace
    try {
      await httpRequest(`${TWIN_MARKETPLACE_URL}/twins/${event.twinId}/learn`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': INTERNAL_TOKEN
        },
        body: JSON.stringify({
          source: 'SKILLNET',
          dataPoints: 1,
          metrics: {
            knowledgeScore: impact.knowledgeScore > 0 ? undefined : undefined,
            executionScore: impact.executionScore,
            reliabilityScore: impact.reliabilityScore
          },
          knowledge: {
            expertise: [skill]
          }
        })
      });
      event.processed = true;
      await event.save();
    } catch (error) {
      logger.info('Failed to update twin:', error);
    }

    res.status(201).json({
      success: true,
      data: {
        eventId: event.eventId,
        twinId: event.twinId,
        twinType,
        impact,
        processed: event.processed
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// BULK IMPORT SKILL EVENTS
// =============================================================================

app.post('/events/bulk', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'events array is required' }
      });
    }

    const results = [];
    for (const eventData of events) {
      const twinType = getTwinTypeForSkill(eventData.skill);
      const impact = calculateImpact({ eventType: eventData.eventType || 'SKILL_USED', outcome: eventData.outcome });

      const event = new SkillEvent({
        eventId: generateId('SEV'),
        corpId: eventData.corpId,
        twinId: `TWIN-${eventData.corpId}-${twinType}`,
        eventType: eventData.eventType || 'SKILL_USED',
        skill: eventData.skill,
        task: eventData.task,
        outcome: eventData.outcome || 'SUCCESS',
        duration: eventData.duration,
        context: {
          source: eventData.context?.source || 'SKILLNET',
          confidence: eventData.context?.confidence || 0.8,
          evidence: eventData.context?.evidence || []
        },
        impact,
        processed: false
      });

      await event.save();
      results.push({ eventId: event.eventId, twinId: event.twinId, skill: event.skill });
    }

    res.status(201).json({
      success: true,
      data: {
        imported: results.length,
        events: results
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// GET EVENTS FOR EMPLOYEE
// =============================================================================

app.get('/events/:corpId', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [events, total] = await Promise.all([
      SkillEvent.find({ corpId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      SkillEvent.countDocuments({ corpId })
    ]);

    res.json({
      success: true,
      data: {
        events: events.map(e => ({
          eventId: e.eventId,
          skill: e.skill,
          eventType: e.eventType,
          outcome: e.outcome,
          impact: e.impact,
          processed: e.processed,
          createdAt: e.createdAt
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// SYNC ALL EVENTS FOR EMPLOYEE
// =============================================================================

app.post('/sync/:corpId', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    // Get all unprocessed events
    const events = await SkillEvent.find({
      corpId,
      processed: false
    }).lean();

    if (events.length === 0) {
      return res.json({
        success: true,
        data: { synced: 0, message: 'No unprocessed events' }
      });
    }

    // Aggregate impacts by twin type
    const impactsByTwin: Record<string, any> = {};

    for (const event of events) {
      if (!impactsByTwin[event.twinId]) {
        impactsByTwin[event.twinId] = {
          knowledgeScore: 0,
          executionScore: 0,
          reliabilityScore: 0,
          productivityMultiplier: 0,
          skills: [] as string[]
        };
      }

      const impact = impactsByTwin[event.twinId];
      impact.knowledgeScore += event.impact?.knowledgeScore || 0;
      impact.executionScore += event.impact?.executionScore || 0;
      impact.reliabilityScore += event.impact?.reliabilityScore || 0;
      impact.productivityMultiplier += event.impact?.productivityMultiplier || 0;
      impact.skills.push(event.skill);
    }

    // Update each twin
    const updates = [];
    for (const [twinId, impact] of Object.entries(impactsByTwin)) {
      try {
        await httpRequest(`${TWIN_MARKETPLACE_URL}/twins/${twinId}/learn`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': INTERNAL_TOKEN
          },
          body: JSON.stringify({
            source: 'SKILLNET_SYNC',
            dataPoints: events.length,
            metrics: impact,
            knowledge: {
              expertise: [...new Set((impact as any).skills)]
            }
          })
        });

        // Mark events as processed
        await SkillEvent.updateMany(
          { twinId, processed: false },
          { $set: { processed: true } }
        );

        updates.push({ twinId, status: 'updated' });
      } catch (error) {
        updates.push({ twinId, status: 'failed' });
      }
    }

    res.json({
      success: true,
      data: {
        eventsProcessed: events.length,
        twinsUpdated: updates.filter(u => u.status === 'updated').length,
        twinsFailed: updates.filter(u => u.status === 'failed').length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// GET TWIN LEARNING STATUS
// =============================================================================

app.get('/twin/:corpId/learning', async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;

    // Get all twins for this employee
    const twins = ['KNOWLEDGE', 'SKILL', 'CAREER', 'PRODUCTIVITY', 'EXECUTION'];

    const learning = [];

    for (const twinType of twins) {
      const twinId = `TWIN-${corpId}-${twinType}`;

      const [events, twin] = await Promise.all([
        SkillEvent.find({ twinId }).sort({ createdAt: -1 }).limit(10).lean(),
        httpRequest(`${TWIN_MARKETPLACE_URL}/twins/${twinId}`)
      ]);

      learning.push({
        twinId,
        twinType,
        eventCount: events.length,
        recentSkills: events.slice(0, 5).map(e => e.skill),
        metrics: twin.data?.data?.metrics || null,
        status: twin.status === 200 ? 'active' : 'not_found'
      });
    }

    res.json({
      success: true,
      data: {
        ownerCorpId: corpId,
        twins: learning
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// GET PLATFORM STATS
// =============================================================================

app.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [totalEvents, processedEvents, byType, bySkill] = await Promise.all([
      SkillEvent.countDocuments(),
      SkillEvent.countDocuments({ processed: true }),
      SkillEvent.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } }
      ]),
      SkillEvent.aggregate([
        { $group: { _id: '$skill', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalEvents,
        processedEvents,
        pendingEvents: totalEvents - processedEvents,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        topSkills: bySkill.map(s => ({ skill: s._id, count: s.count }))
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('SkillNet-Twin Bridge Error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message }
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  });
});

// =============================================================================
// START SERVER
// =============================================================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    await SkillEvent.createIndexes();

    app.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   SKILLNET ↔ PROFESSIONAL TWIN BRIDGE                              ║
║   Making Twins Smarter Through SkillNet                             ║
║                                                                      ║
║   Port: ${PORT}                                                      ║
║                                                                      ║
║   Flow:                                                              ║
║   Employee Work → SkillNet → Bridge → Twin Update                   ║
║                                                                      ║
║   Integration:                                                       ║
║   • SkillNet Intelligence: ${SKILLNET_INTELLIGENCE_URL}              ║
║   • Twin Marketplace: ${TWIN_MARKETPLACE_URL}                        ║
║   • Salar OS: ${SALAR_URL}                                          ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app };
