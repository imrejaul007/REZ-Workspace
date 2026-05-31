/**
 * HOJAI Unified Graph
 *
 * Single API for all entity relationships.
 * Connects humans, AI employees, customers, merchants, and more.
 *
 * Port: 4810
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

const PORT = parseInt(process.env.PORT || '4810', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai-graph';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Entity types supported
const ENTITY_TYPES = [
  'human',           // Human employees
  'ai_employee',      // AI workers
  'customer',         // Customers
  'merchant',         // Merchants
  'supplier',         // Suppliers
  'organization',     // Companies
  'department',       // Departments
  'team',            // Teams
  'product',         // Products
  'service',         // Services
  'document',        // Documents
  'workflow',        // Workflows
  'task',           // Tasks
  'meeting',        // Meetings
  'project'          // Projects
] as const;

type EntityType = typeof ENTITY_TYPES[number];

// Relationship types
const RELATIONSHIP_TYPES = [
  'works_with',
  'reports_to',
  'owns',
  'created',
  'approved',
  'referred',
  'purchased',
  'sold',
  'manages',
  'member_of',
  'depends_on',
  'collaborates_with',
  'supersedes',
  'related_to'
] as const;

type RelationshipType = typeof RELATIONSHIP_TYPES[number];

// Graph Schema
const NodeSchema = new mongoose.Schema({
  entityId: { type: String, required: true, index: true },
  entityType: { type: String, enum: ENTITY_TYPES, required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for fast lookups
NodeSchema.index({ tenantId: 1, entityType: 1, entityId: 1 }, { unique: true });
NodeSchema.index({ tenantId: 1, name: 'text' });

const EdgeSchema = new mongoose.Schema({
  edgeId: { type: String, required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  sourceId: { type: String, required: true },
  sourceType: { type: String, enum: ENTITY_TYPES, required: true },
  targetId: { type: String, required: true },
  targetType: { type: String, enum: ENTITY_TYPES, required: true },
  relationship: { type: String, enum: RELATIONSHIP_TYPES, required: true, index: true },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  weight: { type: Number, default: 1.0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for relationship queries
EdgeSchema.index({ tenantId: 1, sourceId: 1, relationship: 1 });
EdgeSchema.index({ tenantId: 1, targetId: 1, relationship: 1 });
EdgeSchema.index({ tenantId: 1, sourceType: 1, targetType: 1, relationship: 1 });

const Node = mongoose.model('Node', NodeSchema);
const Edge = mongoose.model('Edge', EdgeSchema);

// Validation schemas
const CreateNodeSchema = z.object({
  entityId: z.string().min(1),
  entityType: z.enum(ENTITY_TYPES),
  name: z.string().min(1),
  properties: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

const CreateEdgeSchema = z.object({
  sourceId: z.string().min(1),
  sourceType: z.enum(ENTITY_TYPES),
  targetId: z.string().min(1),
  targetType: z.enum(ENTITY_TYPES),
  relationship: z.enum(RELATIONSHIP_TYPES),
  properties: z.record(z.any()).optional(),
  weight: z.number().min(0).max(1).optional()
});

const QuerySchema = z.object({
  entityType: z.enum(ENTITY_TYPES).optional(),
  relationship: z.enum(RELATIONSHIP_TYPES).optional(),
  depth: z.number().min(1).max(5).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(50)
});

// Auth middleware
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header', code: 'AUTH_REQUIRED' });
  }

  try {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).tenantId = decoded.tenantId || decoded.tenant_id;
    (req as any).userId = decoded.sub;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token', code: 'AUTH_INVALID' });
  }
}

// Health
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'hojai-graph',
    version: '1.0.0',
    entities: ENTITY_TYPES.length,
    relationships: RELATIONSHIP_TYPES.length
  });
});

// ============================================
// NODE OPERATIONS
// ============================================

// Create entity
app.post('/api/nodes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = CreateNodeSchema.parse(req.body);
    const tenantId = (req as any).tenantId;

    const node = new Node({
      ...data,
      tenantId
    });

    await node.save();

    res.status(201).json({ success: true, data: node });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Entity already exists', code: 'DUPLICATE' });
    }
    console.error('Create node error:', error);
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// Batch create nodes
app.post('/api/nodes/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { nodes } = req.body;
    const tenantId = (req as any).tenantId;

    if (!Array.isArray(nodes)) {
      return res.status(400).json({ error: 'nodes must be an array', code: 'VALIDATION_ERROR' });
    }

    const operations = nodes.map((node: any) => ({
      insertOne: {
        document: { ...node, tenantId }
      }
    }));

    const result = await Node.bulkWrite(operations);

    res.json({
      success: true,
      data: {
        inserted: result.insertedCount,
        existing: nodes.length - result.insertedCount
      }
    });
  } catch (error: any) {
    console.error('Batch create error:', error);
    res.status(500).json({ error: error.message, code: 'BATCH_ERROR' });
  }
});

// Get node
app.get('/api/nodes/:entityType/:entityId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const tenantId = (req as any).tenantId;

    const node = await Node.findOne({ tenantId, entityType, entityId });

    if (!node) {
      return res.status(404).json({ error: 'Entity not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: node });
  } catch (error: any) {
    console.error('Get node error:', error);
    res.status(500).json({ error: error.message, code: 'GET_ERROR' });
  }
});

// Search nodes
app.get('/api/nodes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { entityType, q, limit = 50, skip = 0 } = req.query;
    const tenantId = (req as any).tenantId;

    const filter: any = { tenantId };
    if (entityType) filter.entityType = entityType;
    if (q) filter.name = { $regex: q, $options: 'i' };

    const nodes = await Node.find(filter)
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string))
      .sort({ updatedAt: -1 });

    const total = await Node.countDocuments(filter);

    res.json({
      success: true,
      data: nodes,
      pagination: { total, limit: parseInt(limit as string), skip: parseInt(skip as string) }
    });
  } catch (error: any) {
    console.error('Search nodes error:', error);
    res.status(500).json({ error: error.message, code: 'SEARCH_ERROR' });
  }
});

// Update node
app.patch('/api/nodes/:entityType/:entityId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const tenantId = (req as any).tenantId;
    const { name, properties, metadata } = req.body;

    const node = await Node.findOneAndUpdate(
      { tenantId, entityType, entityId },
      { $set: { ...(name && { name }), ...(properties && { properties }), ...(metadata && { metadata }), updatedAt: new Date() } },
      { new: true }
    );

    if (!node) {
      return res.status(404).json({ error: 'Entity not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: node });
  } catch (error: any) {
    console.error('Update node error:', error);
    res.status(500).json({ error: error.message, code: 'UPDATE_ERROR' });
  }
});

// Delete node
app.delete('/api/nodes/:entityType/:entityId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const tenantId = (req as any).tenantId;

    // Delete node and all connected edges
    await Node.deleteOne({ tenantId, entityType, entityId });
    await Edge.deleteMany({
      tenantId,
      $or: [{ sourceId: entityId }, { targetId: entityId }]
    });

    res.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error('Delete node error:', error);
    res.status(500).json({ error: error.message, code: 'DELETE_ERROR' });
  }
});

// ============================================
// RELATIONSHIP OPERATIONS
// ============================================

// Create relationship
app.post('/api/relationships', authMiddleware, async (req: Request, res: Response) => {
  try {
    const data = CreateEdgeSchema.parse(req.body);
    const tenantId = (req as any).tenantId;

    const edgeId = uuid();

    const edge = new Edge({
      ...data,
      edgeId,
      tenantId
    });

    await edge.save();

    res.status(201).json({ success: true, data: edge });
  } catch (error: any) {
    console.error('Create relationship error:', error);
    res.status(400).json({ error: error.message, code: 'VALIDATION_ERROR' });
  }
});

// Batch create relationships
app.post('/api/relationships/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { relationships } = req.body;
    const tenantId = (req as any).tenantId;

    if (!Array.isArray(relationships)) {
      return res.status(400).json({ error: 'relationships must be an array', code: 'VALIDATION_ERROR' });
    }

    const edges = relationships.map((rel: any) => ({
      ...rel,
      edgeId: uuid(),
      tenantId
    }));

    const result = await Edge.insertMany(edges);

    res.json({
      success: true,
      data: { inserted: result.length }
    });
  } catch (error: any) {
    console.error('Batch create relationships error:', error);
    res.status(500).json({ error: error.message, code: 'BATCH_ERROR' });
  }
});

// Get relationships for entity
app.get('/api/relationships/:entityType/:entityId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { type, direction, limit = 50 } = req.query;
    const tenantId = (req as any).tenantId;

    let filter: any = { tenantId };

    if (direction === 'incoming') {
      filter.targetId = entityId;
      filter.targetType = entityType;
    } else if (direction === 'outgoing') {
      filter.sourceId = entityId;
      filter.sourceType = entityType;
    } else {
      filter.$or = [
        { sourceId: entityId, sourceType: entityType },
        { targetId: entityId, targetType: entityType }
      ];
    }

    if (type) filter.relationship = type;

    const edges = await Edge.find(filter)
      .limit(parseInt(limit as string))
      .sort({ createdAt: -1 });

    res.json({ success: true, data: edges });
  } catch (error: any) {
    console.error('Get relationships error:', error);
    res.status(500).json({ error: error.message, code: 'GET_ERROR' });
  }
});

// Delete relationship
app.delete('/api/relationships/:edgeId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { edgeId } = req.params;
    const tenantId = (req as any).tenantId;

    await Edge.deleteOne({ tenantId, edgeId });

    res.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error('Delete relationship error:', error);
    res.status(500).json({ error: error.message, code: 'DELETE_ERROR' });
  }
});

// ============================================
// GRAPH TRAVERSAL
// ============================================

// Traverse graph from entity
app.post('/api/graph/traverse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sourceId, sourceType, relationship, depth = 1, limit = 50 } = req.body;
    const tenantId = (req as any).tenantId;

    const visited = new Set<string>();
    const results: any[] = [];
    const queue: Array<{ id: string, type: string, level: number }> = [
      { id: sourceId, type: sourceType, level: 0 }
    ];

    while (queue.length > 0 && results.length < limit) {
      const current = queue.shift()!;

      if (visited.has(`${current.type}:${current.id}`)) continue;
      visited.add(`${current.type}:${current.id}`);

      // Get current node
      const node = await Node.findOne({ tenantId, entityType: current.type, entityId: current.id });
      if (node) results.push({ ...node.toObject(), level: current.level });

      if (current.level >= depth) continue;

      // Get connected edges
      const edges = await Edge.find({
        tenantId,
        $or: [
          { sourceId: current.id, sourceType: current.type },
          { targetId: current.id, targetType: current.type }
        ],
        ...(relationship && { relationship })
      }).limit(limit);

      for (const edge of edges) {
        const isSource = edge.sourceId === current.id;
        const nextId = isSource ? edge.targetId : edge.sourceId;
        const nextType = isSource ? edge.targetType : edge.sourceType;

        if (!visited.has(`${nextType}:${nextId}`)) {
          queue.push({ id: nextId, type: nextType, level: current.level + 1 });
        }
      }
    }

    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Traverse error:', error);
    res.status(500).json({ error: error.message, code: 'TRAVERSE_ERROR' });
  }
});

// Get ego network (entity + direct connections)
app.get('/api/graph/ego/:entityType/:entityId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 50 } = req.query;
    const tenantId = (req as any).tenantId;

    // Get the central node
    const center = await Node.findOne({ tenantId, entityType, entityId });
    if (!center) {
      return res.status(404).json({ error: 'Entity not found', code: 'NOT_FOUND' });
    }

    // Get all direct connections
    const edges = await Edge.find({
      tenantId,
      $or: [
        { sourceId: entityId, sourceType: entityType },
        { targetId: entityId, targetType: entityType }
      ]
    }).limit(parseInt(limit as string));

    // Get connected nodes
    const connectedIds = edges.map(e =>
      e.sourceId === entityId ? { id: e.targetId, type: e.targetType } : { id: e.sourceId, type: e.sourceType }
    );

    const connectedNodes = await Node.find({
      tenantId,
      $or: connectedIds.map(c => ({ entityId: c.id, entityType: c.type }))
    });

    res.json({
      success: true,
      data: {
        center,
        connections: connectedNodes,
        relationships: edges
      }
    });
  } catch (error: any) {
    console.error('Ego network error:', error);
    res.status(500).json({ error: error.message, code: 'EGO_ERROR' });
  }
});

// ============================================
// UNIFIED QUERY
// ============================================

// Query across entity types
app.post('/api/query', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { entityType, relationship, targetType, filters, limit = 50 } = req.body;
    const tenantId = (req as any).tenantId;

    let filter: any = { tenantId };

    if (entityType) filter.sourceType = entityType;
    if (targetType) filter.targetType = targetType;
    if (relationship) filter.relationship = relationship;

    const edges = await Edge.find(filter).limit(limit);

    // Get all related nodes
    const allIds = edges.flatMap(e => [
      { entityId: e.sourceId, entityType: e.sourceType },
      { entityId: e.targetId, entityType: e.targetType }
    ]);

    const nodes = await Node.find({
      tenantId,
      $or: allIds
    });

    const nodeMap = new Map(nodes.map(n => [`${n.entityType}:${n.entityId}`, n]));

    const results = edges.map(edge => ({
      edge,
      source: nodeMap.get(`${edge.sourceType}:${edge.sourceId}`),
      target: nodeMap.get(`${edge.targetType}:${edge.targetId}`)
    }));

    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message, code: 'QUERY_ERROR' });
  }
});

// ============================================
// AI EMPLOYEE SPECIFIC
// ============================================

// Register AI employee
app.post('/api/ai-employees', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { aiEmployeeId, name, role, department, managerId, skills } = req.body;
    const tenantId = (req as any).tenantId;

    // Create AI employee node
    const node = new Node({
      entityId: aiEmployeeId,
      entityType: 'ai_employee',
      tenantId,
      name,
      properties: { role, department, skills, level: 1, xp: 0 }
    });

    await node.save();

    // Link to manager if provided
    if (managerId) {
      const edge = new Edge({
        edgeId: uuid(),
        tenantId,
        sourceId: aiEmployeeId,
        sourceType: 'ai_employee',
        targetId: managerId,
        targetType: 'ai_employee',
        relationship: 'reports_to',
        properties: { type: 'manager' }
      });
      await edge.save();
    }

    // Add to department
    if (department) {
      const deptEdge = new Edge({
        edgeId: uuid(),
        tenantId,
        sourceId: aiEmployeeId,
        sourceType: 'ai_employee',
        targetId: department,
        targetType: 'department',
        relationship: 'member_of'
      });
      await deptEdge.save();
    }

    res.status(201).json({ success: true, data: node });
  } catch (error: any) {
    console.error('Register AI employee error:', error);
    res.status(400).json({ error: error.message, code: 'ERROR' });
  }
});

// Get AI team
app.get('/api/ai-employees/team/:department', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { department } = req.params;
    const tenantId = (req as any).tenantId;

    // Get department node
    const dept = await Node.findOne({
      tenantId,
      entityType: 'department',
      entityId: department
    });

    if (!dept) {
      return res.status(404).json({ error: 'Department not found', code: 'NOT_FOUND' });
    }

    // Get all members
    const memberEdges = await Edge.find({
      tenantId,
      targetType: 'department',
      targetId: department,
      relationship: 'member_of'
    });

    const memberIds = memberEdges.map(e => ({
      entityId: e.sourceId,
      entityType: e.sourceType
    }));

    const members = await Node.find({
      tenantId,
      $or: memberIds
    });

    // Get hierarchy
    const hierarchies = await Edge.find({
      tenantId,
      sourceId: { $in: members.map(m => m.entityId) },
      relationship: 'reports_to'
    });

    res.json({
      success: true,
      data: {
        department: dept,
        members,
        hierarchies
      }
    });
  } catch (error: any) {
    console.error('Get AI team error:', error);
    res.status(500).json({ error: error.message, code: 'ERROR' });
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Graph service error:', err);
  res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' });
});

// Start
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           HOJAI UNIFIED GRAPH v1.0.0                       ║
╠═══════════════════════════════════════════════════════════════╣
║  Port:         ${PORT}                                           ║
║  Entity Types: ${ENTITY_TYPES.length}                                          ║
║  Relationships: ${RELATIONSHIP_TYPES.length}                                        ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
