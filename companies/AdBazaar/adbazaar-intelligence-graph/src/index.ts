/**
 * AdBazaar Intelligence Graph
 * Unified knowledge graph connecting all entities
 *
 * Port: 4967
 * Purpose: Connect Users, Merchants, Brands, Products, Locations, Campaigns, Creators, Transactions
 *
 * Features:
 * - Entity relationships
 * - Knowledge graph
 * - Graph traversal
 * - Path finding
 * - Community detection
 * - Recommendation engine
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import crypto from 'crypto';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4967;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/intelligence-graph.log' })
  ]
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: { error: 'Too many requests' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// MongoDB Schemas

// Entity (Node)
const entitySchema = new mongoose.Schema({
  entityId: String,
  type: String, // user, merchant, brand, product, location, campaign, creator, transaction
  name: String,
  attributes: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  scores: {
    influence: Number,
    relevance: Number,
    activity: Number
  },
  createdAt: Date,
  updatedAt: Date
});

const Entity = mongoose.model('Entity', entitySchema);

// Relationship (Edge)
const relationshipSchema = new mongoose.Schema({
  relationshipId: String,
  sourceId: String,
  targetId: String,
  type: String, // owns, likes, bought, follows, interacts_with, competitors, partners
  weight: Number, // relationship strength
  properties: mongoose.Schema.Types.Mixed,
  createdAt: Date,
  updatedAt: Date
});

const Relationship = mongoose.model('Relationship', relationshipSchema);

// Graph Index for fast lookups
const graphIndexSchema = new mongoose.Schema({
  entityId: String,
  neighbors: [{
    entityId: String,
    relationshipType: String,
    weight: Number
  }],
  updatedAt: Date
});

const GraphIndex = mongoose.model('GraphIndex', graphIndexSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const [entityCount, relationshipCount] = await Promise.all([
    Entity.countDocuments(),
    Relationship.countDocuments()
  ]);

  res.json({
    status: 'healthy',
    service: 'adbazaar-intelligence-graph',
    port: PORT,
    entities: entityCount,
    relationships: relationshipCount,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ENTITY MANAGEMENT
// ============================================

/**
 * Create entity
 * POST /api/entities
 */
app.post('/api/entities', async (req: Request, res: Response) => {
  try {
    const { type, name, attributes, metadata } = req.body;

    const entityId = `${type}_${crypto.randomBytes(8).toString('hex')}`;

    const entity = new Entity({
      entityId,
      type,
      name,
      attributes,
      metadata,
      scores: { influence: 0, relevance: 0, activity: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await entity.save();

    // Initialize graph index
    await updateGraphIndex(entityId, []);

    res.json({
      success: true,
      entity: {
        id: entityId,
        type,
        name
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get entity
 * GET /api/entities/:entityId
 */
app.get('/api/entities/:entityId', async (req: Request, res: Response) => {
  try {
    const entity = await Entity.findOne({ entityId: req.params.entityId });

    if (!entity) {
      res.status(404).json({ success: false, error: 'Entity not found' });
      return;
    }

    // Get relationships
    const [outgoing, incoming] = await Promise.all([
      Relationship.find({ sourceId: req.params.entityId }),
      Relationship.find({ targetId: req.params.entityId })
    ]);

    res.json({
      success: true,
      entity: {
        id: entity.entityId,
        type: entity.type,
        name: entity.name,
        attributes: entity.attributes,
        scores: entity.scores,
        relationships: {
          outgoing: outgoing.length,
          incoming: incoming.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Update entity
 * PATCH /api/entities/:entityId
 */
app.patch('/api/entities/:entityId', async (req: Request, res: Response) => {
  try {
    const { attributes, metadata, scores } = req.body;

    const update: any = { updatedAt: new Date() };

    if (attributes) update.attributes = attributes;
    if (metadata) update.metadata = metadata;
    if (scores) update.scores = scores;

    const entity = await Entity.findOneAndUpdate(
      { entityId: req.params.entityId },
      { $set: update },
      { new: true }
    );

    if (!entity) {
      res.status(404).json({ success: false, error: 'Entity not found' });
      return;
    }

    res.json({ success: true, entity });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Search entities
 * POST /api/entities/search
 */
app.post('/api/entities/search', async (req: Request, res: Response) => {
  try {
    const { type, query, attributes, limit = 100 } = req.body;

    const searchQuery: any = {};

    if (type) searchQuery.type = type;

    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { 'attributes.tags': { $regex: query, $options: 'i' } }
      ];
    }

    if (attributes) {
      Object.assign(searchQuery, attributes);
    }

    const entities = await Entity.find(searchQuery).limit(limit);

    res.json({
      success: true,
      entities: entities.map(e => ({
        id: e.entityId,
        type: e.type,
        name: e.name,
        attributes: e.attributes,
        scores: e.scores
      })),
      count: entities.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// RELATIONSHIP MANAGEMENT
// ============================================

/**
 * Create relationship
 * POST /api/relationships
 */
app.post('/api/relationships', async (req: Request, res: Response) => {
  try {
    const { sourceId, targetId, type, weight = 1, properties } = req.body;

    const relationshipId = `rel_${crypto.randomBytes(8).toString('hex')}`;

    const relationship = new Relationship({
      relationshipId,
      sourceId,
      targetId,
      type,
      weight,
      properties,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await relationship.save();

    // Update graph index for both entities
    await Promise.all([
      addToGraphIndex(sourceId, targetId, type, weight),
      addToGraphIndex(targetId, sourceId, type, weight)
    ]);

    res.json({
      success: true,
      relationship: {
        id: relationshipId,
        source: sourceId,
        target: targetId,
        type
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get entity relationships
 * GET /api/entities/:entityId/relationships
 */
app.get('/api/entities/:entityId/relationships', async (req: Request, res: Response) => {
  try {
    const { type, direction } = req.query;

    const query: any = {};

    if (direction === 'outgoing') {
      query.sourceId = req.params.entityId;
    } else if (direction === 'incoming') {
      query.targetId = req.params.entityId;
    } else {
      query.$or = [
        { sourceId: req.params.entityId },
        { targetId: req.params.entityId }
      ];
    }

    if (type) query.type = type;

    const relationships = await Relationship.find(query);

    res.json({
      success: true,
      relationships: relationships.map(r => ({
        id: r.relationshipId,
        source: r.sourceId,
        target: r.targetId,
        type: r.type,
        weight: r.weight
      })),
      count: relationships.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Delete relationship
 * DELETE /api/relationships/:relationshipId
 */
app.delete('/api/relationships/:relationshipId', async (req: Request, res: Response) => {
  try {
    const relationship = await Relationship.findOne({ relationshipId: req.params.relationshipId });

    if (relationship) {
      // Update graph indexes
      await Promise.all([
        removeFromGraphIndex(relationship.sourceId, relationship.targetId),
        removeFromGraphIndex(relationship.targetId, relationship.sourceId)
      ]);

      await Relationship.deleteOne({ relationshipId: req.params.relationshipId });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// GRAPH TRAVERSAL
// ============================================

/**
 * Get neighbors (1-hop)
 * GET /api/entities/:entityId/neighbors
 */
app.get('/api/entities/:entityId/neighbors', async (req: Request, res: Response) => {
  try {
    const { type, limit = 100 } = req.query;

    // Use graph index for fast lookup
    const index = await GraphIndex.findOne({ entityId: req.params.entityId });

    if (!index) {
      res.json({ success: true, neighbors: [], count: 0 });
      return;
    }

    let neighbors = index.neighbors;

    if (type) {
      neighbors = neighbors.filter(n => n.relationshipType === type);
    }

    const limited = neighbors.slice(0, Number(limit));

    // Get entity details
    const entityIds = limited.map(n => n.entityId);
    const entities = await Entity.find({ entityId: { $in: entityIds } });

    const entityMap = new Map(entities.map(e => [e.entityId, e]));

    res.json({
      success: true,
      neighbors: limited.map(n => {
        const entity = entityMap.get(n.entityId);
        return {
          id: n.entityId,
          relationship: n.relationshipType,
          weight: n.weight,
          entity: entity ? {
            type: entity.type,
            name: entity.name,
            scores: entity.scores
          } : null
        };
      }),
      count: limited.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Traverse graph (multi-hop)
 * POST /api/graph/traverse
 */
app.post('/api/graph/traverse', async (req: Request, res: Response) => {
  try {
    const { startId, relationshipTypes, maxDepth = 3, limit = 100 } = req.body;

    const visited = new Set<string>();
    const results: any[] = [];
    const queue: { id: string; depth: number; path: string[] }[] = [{ id: startId, depth: 0, path: [] }];

    while (queue.length > 0 && results.length < limit) {
      const current = queue.shift()!;

      if (visited.has(current.id)) continue;
      visited.add(current.id);

      // Get entity
      const entity = await Entity.findOne({ entityId: current.id });
      if (entity) {
        results.push({
          entity: {
            id: entity.entityId,
            type: entity.type,
            name: entity.name
          },
          depth: current.depth,
          path: current.path
        });
      }

      if (current.depth >= maxDepth) continue;

      // Get neighbors
      const index = await GraphIndex.findOne({ entityId: current.id });
      if (index) {
        for (const neighbor of index.neighbors) {
          if (!visited.has(neighbor.entityId)) {
            if (!relationshipTypes || relationshipTypes.includes(neighbor.relationshipType)) {
              queue.push({
                id: neighbor.entityId,
                depth: current.depth + 1,
                path: [...current.path, neighbor.relationshipType]
              });
            }
          }
        }
      }
    }

    res.json({
      success: true,
      results,
      totalVisited: visited.size
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Find paths between entities
 * POST /api/graph/paths
 */
app.post('/api/graph/paths', async (req: Request, res: Response) => {
  try {
    const { sourceId, targetId, maxDepth = 5 } = req.body;

    const visited = new Set<string>();
    const paths: string[][] = [];

    async function dfs(current: string, target: string, path: string[], depth: number) {
      if (depth > maxDepth) return;

      if (current === target) {
        paths.push(path);
        return;
      }

      if (visited.has(current)) return;
      visited.add(current);

      const index = await GraphIndex.findOne({ entityId: current });
      if (index) {
        for (const neighbor of index.neighbors) {
          await dfs(neighbor.entityId, target, [...path, neighbor.relationshipType], depth + 1);
        }
      }

      visited.delete(current);
    }

    await dfs(sourceId, targetId, [sourceId], 0);

    res.json({
      success: true,
      paths: paths.slice(0, 10), // Limit results
      count: paths.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// GRAPH ANALYSIS
// ============================================

/**
 * Get influence scores
 * GET /api/graph/influence/:entityId
 */
app.get('/api/graph/influence/:entityId', async (req: Request, res: Response) => {
  try {
    const entityId = req.params.entityId;

    // Calculate influence based on connections
    const index = await GraphIndex.findOne({ entityId });

    if (!index) {
      res.json({ success: true, influence: 0 });
      return;
    }

    // Simple influence calculation
    const directConnections = index.neighbors.length;
    const weightedSum = index.neighbors.reduce((sum, n) => sum + n.weight, 0);

    const influence = Math.sqrt(directConnections * weightedSum);

    res.json({
      success: true,
      influence: Math.round(influence * 100) / 100,
      directConnections,
      weightedSum
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Detect communities
 * POST /api/graph/communities
 */
app.post('/api/graph/communities', async (req: Request, res: Response) => {
  try {
    const { type, minSize = 5 } = req.query;

    // Simple community detection using connected components
    const entities = await Entity.find(type ? { type: type as string } : {}).select('entityId');
    const entityIds = entities.map(e => e.entityId);

    const visited = new Set<string>();
    const communities: string[][] = [];

    async function bfs(startId: string): Promise<string[]> {
      const community: string[] = [];
      const queue = [startId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        community.push(current);

        const index = await GraphIndex.findOne({ entityId: current });
        if (index) {
          for (const neighbor of index.neighbors) {
            if (!visited.has(neighbor.entityId)) {
              queue.push(neighbor.entityId);
            }
          }
        }
      }

      return community;
    }

    for (const entityId of entityIds) {
      if (!visited.has(entityId)) {
        const community = await bfs(entityId);
        if (community.length >= (minSize as number)) {
          communities.push(community);
        }
      }
    }

    res.json({
      success: true,
      communities: communities.slice(0, 20),
      count: communities.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get recommendations
 * GET /api/graph/recommendations/:entityId
 */
app.get('/api/graph/recommendations/:entityId', async (req: Request, res: Response) => {
  try {
    const { type, limit = 20 } = req.query;

    const entityId = req.params.entityId;

    // Get entity's neighbors
    const index = await GraphIndex.findOne({ entityId });

    if (!index) {
      res.json({ success: true, recommendations: [] });
      return;
    }

    // Get second-degree connections (friends of friends)
    const recommendations: Map<string, { entityId: string; score: number; path: string }> = new Map();

    for (const neighbor of index.neighbors) {
      const neighborIndex = await GraphIndex.findOne({ entityId: neighbor.entityId });
      if (neighborIndex) {
        for (const second of neighborIndex.neighbors) {
          if (second.entityId !== entityId && !index.neighbors.some(n => n.entityId === second.entityId)) {
            const score = neighbor.weight * second.weight * 0.5;
            const existing = recommendations.get(second.entityId);
            if (!existing || score > existing.score) {
              recommendations.set(second.entityId, {
                entityId: second.entityId,
                score,
                path: `(${entityId})-${neighbor.relationshipType}->(${neighbor.entityId})-${second.relationshipType}->(${second.entityId})`
              });
            }
          }
        }
      }
    }

    const sorted = Array.from(recommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(limit));

    // Get entity details
    const entityIds = sorted.map(r => r.entityId);
    const entities = await Entity.find({ entityId: { $in: entityIds } });
    const entityMap = new Map(entities.map(e => [e.entityId, e]));

    res.json({
      success: true,
      recommendations: sorted.map(r => ({
        id: r.entityId,
        score: Math.round(r.score * 100) / 100,
        path: r.path,
        entity: entityMap.get(r.entityId) ? {
          type: entityMap.get(r.entityId)!.type,
          name: entityMap.get(r.entityId)!.name
        } : null
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function updateGraphIndex(entityId: string, neighbors: any[]): Promise<void> {
  await GraphIndex.findOneAndUpdate(
    { entityId },
    { entityId, neighbors, updatedAt: new Date() },
    { upsert: true }
  );
}

async function addToGraphIndex(entityId: string, neighborId: string, relationshipType: string, weight: number): Promise<void> {
  await GraphIndex.findOneAndUpdate(
    { entityId },
    {
      $push: {
        neighbors: {
          $each: [{ entityId: neighborId, relationshipType, weight }],
          $slice: -500 // Limit neighbors
        }
      },
      $set: { updatedAt: new Date() }
    },
    { upsert: true }
  );
}

async function removeFromGraphIndex(entityId: string, neighborId: string): Promise<void> {
  await GraphIndex.findOneAndUpdate(
    { entityId },
    { $pull: { neighbors: { entityId: neighborId } } }
  );
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AdBazaar Intelligence Graph started on port ${PORT}`);
  logger.info('🧠 Unified knowledge graph for all entities');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_intelligence_graph')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;