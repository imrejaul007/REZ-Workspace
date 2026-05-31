/**
 * Memory Routes
 * Proxy to hojai-memory service
 */

import { Router, Request, Response } from 'express';
import { tenantMiddleware } from '../middleware/tenant.js';
import { createResponse, createErrorResponse, Memory } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory memory store (for demo - replace with actual service call)
const memoryStore: Map<string, Memory[]> = new Map();

/**
 * POST /api/memory
 * Store a memory
 */
router.post('/', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { userId, type, content, importance = 0.5, metadata } = req.body;

  if (!type || !content) {
    return res.status(400).json(
      createErrorResponse('INVALID_REQUEST', 'type and content are required')
    );
  }

  const memory: Memory = {
    id: uuidv4(),
    tenantId: ctx.tenant_id,
    userId,
    type,
    content,
    importance,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata
  };

  // Store memory
  const tenantMemories = memoryStore.get(ctx.tenant_id) || [];
  tenantMemories.push(memory);
  memoryStore.set(ctx.tenant_id, tenantMemories);

  res.status(201).json(createResponse({ memory }, { tenantId: ctx.tenant_id }));
});

/**
 * GET /api/memory
 * Get memories for tenant/user
 */
router.get('/', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { userId, type, limit = 50 } = req.query;

  let tenantMemories = memoryStore.get(ctx.tenant_id) || [];

  if (userId) {
    tenantMemories = tenantMemories.filter(m => m.userId === userId);
  }

  if (type) {
    tenantMemories = tenantMemories.filter(m => m.type === type);
  }

  // Sort by importance and timestamp
  tenantMemories.sort((a, b) => {
    if (b.importance !== a.importance) {
      return b.importance - a.importance;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.json(createResponse({
    memories: tenantMemories.slice(0, Number(limit)),
    total: tenantMemories.length
  }, { tenantId: ctx.tenant_id }));
});

/**
 * GET /api/memory/:id
 * Get memory by ID
 */
router.get('/:id', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { id } = req.params;

  const tenantMemories = memoryStore.get(ctx.tenant_id) || [];
  const memory = tenantMemories.find(m => m.id === id);

  if (!memory) {
    return res.status(404).json(
      createErrorResponse('NOT_FOUND', `Memory ${id} not found`)
    );
  }

  res.json(createResponse({ memory }, { tenantId: ctx.tenant_id }));
});

/**
 * POST /api/memory/search
 * Search memories (semantic search placeholder)
 */
router.post('/search', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { query, userId, limit = 10 } = req.body;

  if (!query) {
    return res.status(400).json(
      createErrorResponse('INVALID_REQUEST', 'query is required')
    );
  }

  const tenantMemories = memoryStore.get(ctx.tenant_id) || [];
  let filtered = tenantMemories;

  if (userId) {
    filtered = tenantMemories.filter(m => m.userId === userId);
  }

  // Simple keyword matching (in production, use vector similarity)
  const queryWords = query.toLowerCase().split(/\s+/);
  filtered = filtered.filter(m => {
    const content = m.content.toLowerCase();
    return queryWords.some(word => content.includes(word));
  });

  res.json(createResponse({
    results: filtered.slice(0, Number(limit)).map(m => ({
      memory: m,
      score: 0.85 // Placeholder - real implementation would use embeddings
    })),
    total: filtered.length
  }, { tenantId: ctx.tenant_id }));
});

/**
 * DELETE /api/memory/:id
 * Delete a memory
 */
router.delete('/:id', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { id } = req.params;

  const tenantMemories = memoryStore.get(ctx.tenant_id) || [];
  const index = tenantMemories.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json(
      createErrorResponse('NOT_FOUND', `Memory ${id} not found`)
    );
  }

  tenantMemories.splice(index, 1);
  memoryStore.set(ctx.tenant_id, tenantMemories);

  res.json(createResponse({ deleted: true }));
});

/**
 * PUT /api/memory/:id
 * Update a memory
 */
router.put('/:id', tenantMiddleware(), (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { id } = req.params;
  const { content, importance, metadata } = req.body;

  const tenantMemories = memoryStore.get(ctx.tenant_id) || [];
  const memory = tenantMemories.find(m => m.id === id);

  if (!memory) {
    return res.status(404).json(
      createErrorResponse('NOT_FOUND', `Memory ${id} not found`)
    );
  }

  if (content) memory.content = content;
  if (importance !== undefined) memory.importance = importance;
  if (metadata) memory.metadata = { ...memory.metadata, ...metadata };
  memory.updatedAt = new Date().toISOString();

  res.json(createResponse({ memory }, { tenantId: ctx.tenant_id }));
});

export { router as memoryRoutes };
