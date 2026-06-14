/**
 * CorpID Assertion Service
 * Manages assertions (claims) about entities with evidence from MemoryOS
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
const PORT = parseInt(process.env.PORT || '4707', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

// Assertion Sources
const ASSERTION_SOURCES = [
  'SELF_DECLARED',
  'PEER_VERIFIED',
  'SYSTEM_OBSERVED',
  'CREDENTIAL',
  'MANUAL_REVIEW',
  'AGENT_COMPUTED',
] as const;

type AssertionSource = typeof ASSERTION_SOURCES[number];

// Predicate Categories (for filtering and computation)
const PREDICATE_CATEGORIES = {
  SKILL: 'skill',
  CAPABILITY: 'capability',
  EXPERIENCE: 'experience',
  CERTIFICATION: 'certification',
  KNOWLEDGE: 'knowledge',
  BEHAVIOR: 'behavior',
  RELATIONSHIP: 'relationship',
  TRUST: 'trust',
};

function generateId(prefix: string = 'AST'): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  next(); // For development
}

// ============================================================================
// MONGODB SCHEMAS
// ============================================================================

// Assertion Schema
const assertionSchema = new Schema({
  assertionId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true },

  // What is being asserted
  predicate: { type: String, required: true, index: true },
  predicateCategory: { type: String, enum: Object.values(PREDICATE_CATEGORIES), required: true },
  value: { type: Schema.Types.Mixed, required: true },

  // Source and confidence
  source: { type: String, enum: ASSERTION_SOURCES, required: true },
  confidence: { type: Number, min: 0, max: 1, default: 0.5 },
  computedConfidence: { type: Number, min: 0, max: 1 }, // Updated by SADA

  // Evidence chain (references to MemoryOS events)
  evidence: [{
    memoryEventId: String,
    weight: { type: Number, default: 1.0 },
    source: String,
    addedAt: { type: Date, default: Date.now },
  }],

  // Validity
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date },
  isActive: { type: Boolean, default: true },

  // Audit
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound indexes
assertionSchema.index({ corpId: 1, predicate: 1 });
assertionSchema.index({ corpId: 1, predicateCategory: 1 });
assertionSchema.index({ source: 1, isActive: 1 });

const Assertion = model('Assertion', assertionSchema);

// Evidence Reference Schema (links to MemoryOS)
const evidenceRefSchema = new Schema({
  evidenceId: { type: String, required: true, unique: true, index: true },
  assertionId: { type: String, required: true, index: true },
  memoryEventId: { type: String, required: true, index: true },
  corpId: { type: String, required: true, index: true },

  // Evidence details
  eventType: String,
  weight: { type: Number, default: 1.0 },
  description: String,

  // Source system
  sourceSystem: String,

  // Computed values
  supportsClaim: { type: Boolean, default: true },
  computedWeight: Number,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
});

evidenceRefSchema.index({ assertionId: 1, memoryEventId: 1 });
evidenceRefSchema.index({ memoryEventId: 1 });

const EvidenceRef = model('EvidenceRef', evidenceRefSchema);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'corpid-assertion-service',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// ASSERTION ENDPOINTS
// ============================================================================

/**
 * Create a new assertion
 * POST /assertions
 */
app.post('/assertions',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId, predicate, value, source, createdBy, metadata } = req.body;

      if (!corpId || !predicate || value === undefined || !source || !createdBy) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
        });
      }

      // Determine predicate category
      let predicateCategory = 'CAPABILITY';
      const predicateLower = predicate.toLowerCase();
      if (predicateLower.startsWith('skill:')) predicateCategory = 'SKILL';
      else if (predicateLower.startsWith('cert:')) predicateCategory = 'CERTIFICATION';
      else if (predicateLower.startsWith('exp:')) predicateCategory = 'EXPERIENCE';
      else if (predicateLower.startsWith('know:')) predicateCategory = 'KNOWLEDGE';
      else if (predicateLower.startsWith('trust:')) predicateCategory = 'TRUST';

      // Calculate initial confidence based on source
      const sourceConfidence: Record<AssertionSource, number> = {
        'CREDENTIAL': 0.95,
        'MANUAL_REVIEW': 0.85,
        'PEER_VERIFIED': 0.75,
        'SYSTEM_OBSERVED': 0.70,
        'AGENT_COMPUTED': 0.60,
        'SELF_DECLARED': 0.40,
      };

      const assertion = new Assertion({
        assertionId: generateId('AST'),
        corpId,
        predicate,
        predicateCategory,
        value,
        source,
        confidence: sourceConfidence[source as AssertionSource] || 0.5,
        createdBy,
        validFrom: new Date(),
        validUntil: metadata?.expiresAt ? new Date(metadata.expiresAt) : undefined,
      });

      await assertion.save();

      res.status(201).json({
        success: true,
        data: {
          assertionId: assertion.assertionId,
          corpId: assertion.corpId,
          predicate: assertion.predicate,
          predicateCategory: assertion.predicateCategory,
          value: assertion.value,
          source: assertion.source,
          confidence: assertion.confidence,
          createdAt: assertion.createdAt,
        },
      });
    } catch (error: any) {
      logger.error('Error creating assertion:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create assertion' },
      });
    }
  }
);

/**
 * Get all assertions for an entity
 * GET /assertions/:corpId
 */
app.get('/assertions/:corpId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;
      const { category, predicate, source, activeOnly } = req.query;

      const filter: any = { corpId };

      if (category) filter.predicateCategory = category;
      if (predicate) filter.predicate = { $regex: predicate, $options: 'i' };
      if (source) filter.source = source;
      if (activeOnly !== 'false') filter.isActive = true;

      const assertions = await Assertion.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: {
          items: assertions.map(a => ({
            assertionId: a.assertionId,
            corpId: a.corpId,
            predicate: a.predicate,
            predicateCategory: a.predicateCategory,
            value: a.value,
            source: a.source,
            confidence: a.confidence,
            computedConfidence: a.computedConfidence,
            evidenceCount: a.evidence.length,
            validUntil: a.validUntil,
            isActive: a.isActive,
            createdAt: a.createdAt,
          })),
          total: assertions.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching assertions:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assertions' },
      });
    }
  }
);

/**
 * Get assertion by ID
 * GET /assertions/detail/:assertionId
 */
app.get('/assertions/detail/:assertionId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { assertionId } = req.params;

      const assertion = await Assertion.findOne({ assertionId }).lean();

      if (!assertion) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Assertion not found' },
        });
      }

      res.json({
        success: true,
        data: assertion,
      });
    } catch (error) {
      logger.error('Error fetching assertion:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assertion' },
      });
    }
  }
);

/**
 * Update assertion
 * PATCH /assertions/:assertionId
 */
app.patch('/assertions/:assertionId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { assertionId } = req.params;
      const updates = req.body;

      const assertion = await Assertion.findOneAndUpdate(
        { assertionId },
        { $set: { ...updates, updatedAt: new Date() } },
        { new: true }
      );

      if (!assertion) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Assertion not found' },
        });
      }

      res.json({
        success: true,
        data: {
          assertionId: assertion.assertionId,
          confidence: assertion.confidence,
          computedConfidence: assertion.computedConfidence,
          updatedAt: assertion.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Error updating assertion:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update assertion' },
      });
    }
  }
);

/**
 * Add evidence to an assertion
 * POST /assertions/:assertionId/evidence
 */
app.post('/assertions/:assertionId/evidence',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { assertionId } = req.params;
      const { memoryEventId, weight, source, description } = req.body;

      if (!memoryEventId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'memoryEventId is required' },
        });
      }

      const assertion = await Assertion.findOne({ assertionId });

      if (!assertion) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Assertion not found' },
        });
      }

      // Check if evidence already exists
      const existingEvidence = assertion.evidence.find(
        e => e.memoryEventId === memoryEventId
      );

      if (existingEvidence) {
        return res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE', message: 'Evidence already exists for this assertion' },
        });
      }

      // Add evidence
      assertion.evidence.push({
        memoryEventId,
        weight: weight || 1.0,
        source: source || 'SYSTEM_OBSERVED',
        addedAt: new Date(),
      });

      // Recalculate confidence
      await updateAssertionConfidence(assertion);

      await assertion.save();

      // Create evidence reference record
      const evidenceRef = new EvidenceRef({
        evidenceId: generateId('EVR'),
        assertionId,
        memoryEventId,
        corpId: assertion.corpId,
        weight: weight || 1.0,
        description,
        sourceSystem: source,
      });
      await evidenceRef.save();

      res.json({
        success: true,
        data: {
          assertionId: assertion.assertionId,
          evidenceCount: assertion.evidence.length,
          confidence: assertion.confidence,
          computedConfidence: assertion.computedConfidence,
        },
      });
    } catch (error) {
      logger.error('Error adding evidence:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to add evidence' },
      });
    }
  }
);

/**
 * Get evidence for an assertion
 * GET /assertions/:assertionId/evidence
 */
app.get('/assertions/:assertionId/evidence',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { assertionId } = req.params;

      const assertion = await Assertion.findOne({ assertionId })
        .select('assertionId corpId predicate evidence')
        .lean();

      if (!assertion) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Assertion not found' },
        });
      }

      res.json({
        success: true,
        data: {
          assertionId: assertion.assertionId,
          corpId: assertion.corpId,
          predicate: assertion.predicate,
          evidence: assertion.evidence,
          totalEvidence: assertion.evidence.length,
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
 * Delete/deactivate assertion
 * DELETE /assertions/:assertionId
 */
app.delete('/assertions/:assertionId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { assertionId } = req.params;
      const { hard } = req.query; // hard = true to actually delete

      if (hard === 'true') {
        await Assertion.deleteOne({ assertionId });
        await EvidenceRef.deleteMany({ assertionId });
      } else {
        await Assertion.updateOne(
          { assertionId },
          { $set: { isActive: false, updatedAt: new Date() } }
        );
      }

      res.json({
        success: true,
        data: { deleted: true, hardDelete: hard === 'true' },
      });
    } catch (error) {
      logger.error('Error deleting assertion:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete assertion' },
      });
    }
  }
);

// ============================================================================
// SKILL-SPECIFIC ENDPOINTS
// ============================================================================

/**
 * Get all skill assertions for an entity
 * GET /skills/:corpId
 */
app.get('/skills/:corpId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;

      const skills = await Assertion.find({
        corpId,
        predicateCategory: 'SKILL',
        isActive: true,
      }).lean();

      res.json({
        success: true,
        data: {
          items: skills.map(s => ({
            skill: s.predicate.replace('skill:', ''),
            level: s.value,
            confidence: s.confidence,
            computedConfidence: s.computedConfidence,
            evidenceCount: s.evidence.length,
            source: s.source,
            verified: s.evidence.length > 0,
          })),
          total: skills.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching skills:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch skills' },
      });
    }
  }
);

/**
 * Declare a skill
 * POST /skills
 */
app.post('/skills',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId, skill, level, createdBy } = req.body;

      if (!corpId || !skill || !createdBy) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
        });
      }

      // Check if skill already exists
      const existing = await Assertion.findOne({
        corpId,
        predicate: `skill:${skill.toLowerCase()}`,
        isActive: true,
      });

      if (existing) {
        // Update level
        existing.value = level || existing.value;
        existing.updatedAt = new Date();
        await existing.save();

        return res.json({
          success: true,
          data: {
            assertionId: existing.assertionId,
            skill,
            level: existing.value,
            updated: true,
          },
        });
      }

      // Create new skill assertion
      const assertion = new Assertion({
        assertionId: generateId('SKL'),
        corpId,
        predicate: `skill:${skill.toLowerCase()}`,
        predicateCategory: 'SKILL',
        value: level || 'INTERMEDIATE',
        source: 'SELF_DECLARED',
        confidence: 0.4, // Self-declared starts low
        createdBy,
      });

      await assertion.save();

      res.status(201).json({
        success: true,
        data: {
          assertionId: assertion.assertionId,
          corpId,
          skill,
          level: assertion.value,
          confidence: assertion.confidence,
        },
      });
    } catch (error) {
      logger.error('Error declaring skill:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to declare skill' },
      });
    }
  }
);

/**
 * Verify a skill (peer verification)
 * POST /skills/:assertionId/verify
 */
app.post('/skills/:assertionId/verify',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { assertionId } = req.params;
      const { verifierCorpId, memoryEventId, comment } = req.body;

      const assertion = await Assertion.findOne({ assertionId, predicateCategory: 'SKILL' });

      if (!assertion) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Skill assertion not found' },
        });
      }

      // Add peer verification as evidence
      if (memoryEventId) {
        assertion.evidence.push({
          memoryEventId,
          weight: 0.8,
          source: 'PEER_VERIFIED',
          addedAt: new Date(),
        });
      }

      // Update source if not already peer verified or higher
      const sourcePriority = {
        'CREDENTIAL': 5,
        'MANUAL_REVIEW': 4,
        'PEER_VERIFIED': 3,
        'SYSTEM_OBSERVED': 2,
        'AGENT_COMPUTED': 1,
        'SELF_DECLARED': 0,
      };

      if ((sourcePriority['PEER_VERIFIED'] as number) > (sourcePriority[assertion.source as AssertionSource] as number)) {
        assertion.source = 'PEER_VERIFIED';
      }

      await updateAssertionConfidence(assertion);
      await assertion.save();

      res.json({
        success: true,
        data: {
          assertionId: assertion.assertionId,
          confidence: assertion.confidence,
          computedConfidence: assertion.computedConfidence,
          evidenceCount: assertion.evidence.length,
        },
      });
    } catch (error) {
      logger.error('Error verifying skill:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to verify skill' },
      });
    }
  }
);

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk create assertions
 * POST /assertions/bulk
 */
app.post('/assertions/bulk',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { assertions } = req.body;

      if (!Array.isArray(assertions) || assertions.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'assertions array is required' },
        });
      }

      const created = [];
      const errors = [];

      for (const item of assertions) {
        try {
          const assertion = new Assertion({
            assertionId: generateId('AST'),
            corpId: item.corpId,
            predicate: item.predicate,
            predicateCategory: item.category || 'CAPABILITY',
            value: item.value,
            source: item.source || 'SYSTEM_OBSERVED',
            confidence: item.confidence || 0.5,
            createdBy: item.createdBy,
            evidence: item.evidence || [],
          });
          await assertion.save();
          created.push(assertion.assertionId);
        } catch (err: any) {
          errors.push({ corpId: item.corpId, predicate: item.predicate, error: err.message });
        }
      }

      res.status(201).json({
        success: true,
        data: {
          created: created.length,
          failed: errors.length,
          assertionIds: created,
          errors: errors.slice(0, 10), // Limit error details
        },
      });
    } catch (error) {
      logger.error('Error bulk creating assertions:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to bulk create assertions' },
      });
    }
  }
);

/**
 * Get skill gap analysis for an entity
 * GET /skills/:corpId/gap
 */
app.get('/skills/:corpId/gap',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;
      const { targetSkills } = req.query; // Comma-separated list of target skills

      if (!targetSkills) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'targetSkills query parameter is required' },
        });
      }

      const targets = targetSkills.split(',').map(s => s.trim().toLowerCase());

      const currentSkills = await Assertion.find({
        corpId,
        predicateCategory: 'SKILL',
        isActive: true,
      }).lean();

      const currentSkillMap = new Map(
        currentSkills.map(s => [s.predicate.replace('skill:', ''), s])
      );

      const gapAnalysis = targets.map(target => {
        const current = currentSkillMap.get(target);
        return {
          skill: target,
          present: !!current,
          level: current?.value || null,
          confidence: current?.confidence || 0,
          evidenceCount: current?.evidence?.length || 0,
          gap: current ? 'MET' : 'MISSING',
        };
      });

      const summary = {
        totalTargetSkills: targets.length,
        skillsMet: gapAnalysis.filter(s => s.gap === 'MET').length,
        skillsMissing: gapAnalysis.filter(s => s.gap === 'MISSING').length,
        coveragePercent: Math.round((gapAnalysis.filter(s => s.gap === 'MET').length / targets.length) * 100),
      };

      res.json({
        success: true,
        data: {
          summary,
          skills: gapAnalysis,
        },
      });
    } catch (error) {
      logger.error('Error analyzing skill gap:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to analyze skill gap' },
      });
    }
  }
);

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get assertion statistics
 * GET /stats
 */
app.get('/stats',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.query;

      const filter: any = {};
      if (corpId) filter.corpId = corpId;

      const [bySource, byCategory, total, withEvidence] = await Promise.all([
        Assertion.aggregate([
          { $match: filter },
          { $group: { _id: '$source', count: { $sum: 1 } } },
        ]),
        Assertion.aggregate([
          { $match: { ...filter, isActive: true } },
          { $group: { _id: '$predicateCategory', count: { $sum: 1 } } },
        ]),
        Assertion.countDocuments(filter),
        Assertion.countDocuments({ ...filter, $expr: { $gt: [{ $size: '$evidence' }, 0] } }),
      ]);

      res.json({
        success: true,
        data: {
          total,
          withEvidence,
          evidenceRate: total > 0 ? Math.round((withEvidence / total) * 100) : 0,
          bySource: Object.fromEntries(bySource.map(s => [s._id, s.count])),
          byCategory: Object.fromEntries(byCategory.map(c => [c._id, c.count])),
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
// HELPERS
// ============================================================================

/**
 * Update assertion confidence based on evidence
 */
async function updateAssertionConfidence(assertion: any): Promise<void> {
  if (assertion.evidence.length === 0) {
    // No evidence, keep base confidence from source
    return;
  }

  // Calculate weighted confidence boost from evidence
  const evidenceBoost = assertion.evidence.reduce((sum: number, e: any) => {
    const sourceMultiplier: Record<string, number> = {
      'CREDENTIAL': 0.15,
      'MANUAL_REVIEW': 0.12,
      'PEER_VERIFIED': 0.10,
      'SYSTEM_OBSERVED': 0.08,
      'AGENT_COMPUTED': 0.06,
    };
    return sum + (e.weight * (sourceMultiplier[e.source] || 0.05));
  }, 0);

  // Calculate diversity bonus (different types of evidence)
  const evidenceTypes = new Set(assertion.evidence.map((e: any) => e.source));
  const diversityBonus = Math.min(evidenceTypes.size * 0.02, 0.10);

  // Calculate volume bonus (more evidence = more confidence, up to a point)
  const volumeBonus = Math.min(assertion.evidence.length * 0.01, 0.05);

  // Final confidence
  const newConfidence = Math.min(
    assertion.confidence + evidenceBoost + diversityBonus + volumeBonus,
    0.99 // Cap at 99%
  );

  assertion.confidence = Math.round(newConfidence * 100) / 100;
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

    await Assertion.createIndexes();
    await EvidenceRef.createIndexes();
    logger.info('Indexes created');

    app.listen(PORT, () => {
      logger.info(`CorpID Assertion Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
