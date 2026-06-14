/**
 * CorpID Trust Graph Service
 * Manages relationships between entities
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED' } },
}));

const PORT = parseInt(process.env.PORT || '4706', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

// CorpID v2.0: Extended relationship types
const RELATIONSHIP_TYPES = [
  // Human → Human
  'REPORTS_TO', 'MANAGES', 'WORKS_WITH', 'COLLABORATES_WITH',
  'MENTORS', 'MENTORED_BY', 'PEER_OF',
  // Human → Organization
  'EMPLOYED_BY', 'CONTRACTED_BY', 'OWNED_BY',
  // Human → Agent
  'CREATED_BY', 'SUPERVISES', 'USES',
  // Agent → Agent
  'CALLS', 'DELEGATES_TO', 'COORDINATES_WITH',
  // Agent → Organization
  'DEPLOYED_IN',
  // Organization → Organization
  'SUBSIDIARY_OF', 'PARTNERED_WITH', 'SUPPLIES_TO', 'CLIENT_OF',
  // Legacy (backward compatibility)
  'WORKED_AT', 'MANAGED_BY', 'SUPPLIED_TO', 'VERIFIED_BY',
  'REFERENCED_BY', 'LICENSED_TO'
] as const;

type RelationshipType = typeof RELATIONSHIP_TYPES[number];

const trustRelationshipSchema = new Schema({
  relationshipId: { type: String, required: true, unique: true, index: true },
  fromCorpId: { type: String, required: true, index: true },
  toCorpId: { type: String, required: true, index: true },
  type: { type: String, enum: RELATIONSHIP_TYPES, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  verified: { type: Boolean, default: false },
  verifiedBy: String,
  verifiedAt: Date,
  expiresAt: Date,
}, { timestamps: true });

trustRelationshipSchema.index({ fromCorpId: 1, type: 1 });
trustRelationshipSchema.index({ toCorpId: 1, type: 1 });

const TrustRelationship = model('TrustRelationship', trustRelationshipSchema);

function generateId(): string {
  return `REL-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  next();
}

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'corpid-trust-graph-service', timestamp: new Date().toISOString() });
});

// Create relationship
app.post('/relationships', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { fromCorpId, toCorpId, type, metadata, verified, expiresAt } = req.body;

    if (!RELATIONSHIP_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'Invalid relationship type' },
      });
    }

    const relationship = new TrustRelationship({
      relationshipId: generateId(),
      fromCorpId,
      toCorpId,
      type,
      metadata: metadata || {},
      verified: verified || false,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await relationship.save();

    res.status(201).json({
      success: true,
      data: {
        relationshipId: relationship.relationshipId,
        fromCorpId,
        toCorpId,
        type,
        verified: relationship.verified,
        createdAt: relationship.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creating relationship:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create relationship' },
    });
  }
});

// Get relationships for entity
app.get('/relationships/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const type = req.query.type as RelationshipType | undefined;
    const direction = req.query.direction as string || 'BOTH';

    let filter: Record<string, unknown> = {};

    if (direction === 'OUTGOING') {
      filter = { fromCorpId: corpId };
    } else if (direction === 'INCOMING') {
      filter = { toCorpId: corpId };
    } else {
      filter = { $or: [{ fromCorpId: corpId }, { toCorpId: corpId }] };
    }

    if (type && RELATIONSHIP_TYPES.includes(type)) {
      filter.type = type;
    }

    const relationships = await TrustRelationship.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        items: relationships.map(r => ({
          relationshipId: r.relationshipId,
          fromCorpId: r.fromCorpId,
          toCorpId: r.toCorpId,
          type: r.type,
          verified: r.verified,
          verifiedAt: r.verifiedAt,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt,
          direction: r.fromCorpId === corpId ? 'OUTGOING' : 'INCOMING',
        })),
        total: relationships.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching relationships:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch relationships' },
    });
  }
});

// Get graph for entity
app.get('/graph/:corpId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { corpId } = req.params;
    const depth = Math.min(parseInt(req.query.depth as string) || 1, 3);

    const nodes = new Map<string, { corpId: string; type: string }>();
    const edges: Array<{ from: string; to: string; type: string; verified: boolean }> = [];

    // Get direct relationships
    const direct = await TrustRelationship.find({
      $or: [{ fromCorpId: corpId }, { toCorpId: corpId }],
    }).lean();

    direct.forEach(r => {
      if (r.fromCorpId === corpId) {
        nodes.set(r.toCorpId, { corpId: r.toCorpId, type: 'entity' });
        edges.push({ from: corpId, to: r.toCorpId, type: r.type, verified: r.verified });
      } else {
        nodes.set(r.fromCorpId, { corpId: r.fromCorpId, type: 'entity' });
        edges.push({ from: r.fromCorpId, to: corpId, type: r.type, verified: r.verified });
      }
    });

    // Get second-degree relationships
    if (depth >= 2 && nodes.size > 0) {
      const firstDegreeIds = Array.from(nodes.keys());
      const secondDegree = await TrustRelationship.find({
        $or: [
          { fromCorpId: { $in: firstDegreeIds } },
          { toCorpId: { $in: firstDegreeIds } },
        ],
      }).lean();

      secondDegree.forEach(r => {
        if (!nodes.has(r.fromCorpId)) {
          nodes.set(r.fromCorpId, { corpId: r.fromCorpId, type: 'entity' });
        }
        if (!nodes.has(r.toCorpId)) {
          nodes.set(r.toCorpId, { corpId: r.toCorpId, type: 'entity' });
        }
        edges.push({ from: r.fromCorpId, to: r.toCorpId, type: r.type, verified: r.verified });
      });
    }

    res.json({
      success: true,
      data: {
        nodes: [{ corpId, type: 'self' }, ...Array.from(nodes.values())],
        edges,
        stats: {
          totalNodes: nodes.size + 1,
          totalEdges: edges.length,
          verifiedEdges: edges.filter(e => e.verified).length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching graph:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch graph' },
    });
  }
});

// Verify relationship
app.patch('/relationships/:relationshipId/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { relationshipId } = req.params;
    const { verified, verifiedBy } = req.body;

    const relationship = await TrustRelationship.findOneAndUpdate(
      { relationshipId },
      {
        $set: {
          verified: true,
          verifiedBy: verifiedBy || 'system',
          verifiedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!relationship) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Relationship not found' },
      });
    }

    res.json({
      success: true,
      data: {
        relationshipId: relationship.relationshipId,
        verified: relationship.verified,
        verifiedBy: relationship.verifiedBy,
        verifiedAt: relationship.verifiedAt,
      },
    });
  } catch (error) {
    logger.error('Error verifying relationship:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to verify relationship' },
    });
  }
});

// Delete relationship
app.delete('/relationships/:relationshipId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { relationshipId } = req.params;

    const result = await TrustRelationship.deleteOne({ relationshipId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Relationship not found' },
      });
    }

    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    logger.error('Error deleting relationship:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete relationship' },
    });
  }
});

// Get relationship stats
app.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await TrustRelationship.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const total = await TrustRelationship.countDocuments();
    const verified = await TrustRelationship.countDocuments({ verified: true });

    res.json({
      success: true,
      data: {
        byType: Object.fromEntries(stats.map(s => [s._id, s.count])),
        total,
        verified,
        verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' },
    });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Trust graph service error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message },
  });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    await TrustRelationship.createIndexes();
    logger.info('Indexes created');

    app.listen(PORT, () => {
      logger.info(`CorpID Trust Graph Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
