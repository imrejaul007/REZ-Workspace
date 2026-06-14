/**
 * REZ Memory Cloud - Memory Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { memoryService } from '../services/memoryService.js';
import { searchService } from '../services/searchService.js';
import { CreateMemorySchema, RecallMemorySchema, UpdateMemorySchema } from '../models/Memory.js';
import { memoryWriteLimiter, searchLimiter } from '../middleware/rateLimit.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

/**
 * POST /api/memory - Create a new memory
 */
router.post('/', memoryWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateMemorySchema.parse(req.body);
    const memory = await memoryService.create(input);

    res.status(201).json({
      success: true,
      data: {
        memoryId: memory.memoryId,
        userId: memory.userId,
        content: memory.content,
        summary: memory.summary,
        category: memory.category,
        tags: memory.tags,
        importance: memory.importance,
        source: memory.source,
        expiresAt: memory.expiresAt,
        createdAt: memory.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/memory - Get memories for a user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      throw new AppError('userId is required', 400, 'MISSING_PARAMETER');
    }

    const memories = await memoryService.getByUser(userId, {
      limit: parseInt(req.query.limit as string) || 50,
      skip: parseInt(req.query.skip as string) || 0,
      category: req.query.category as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    });

    res.json({
      success: true,
      data: memories.map((m) => ({
        memoryId: m.memoryId,
        userId: m.userId,
        content: m.content,
        summary: m.summary,
        category: m.category,
        tags: m.tags,
        importance: m.importance,
        recallCount: m.recallCount,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/memory/recall - Search memories
 */
router.post('/recall', searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = RecallMemorySchema.parse(req.body);
    const results = await searchService.search(input);

    res.json({
      success: true,
      data: {
        query: input.query,
        count: results.length,
        results: results.map((r) => ({
          memoryId: r.memory.memoryId,
          content: r.memory.content,
          summary: r.memory.summary,
          category: r.memory.category,
          tags: r.memory.tags,
          importance: r.memory.importance,
          score: r.score,
          matchType: r.matchType,
          createdAt: r.memory.createdAt,
        })),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/memory/:memoryId - Get a single memory
 */
router.get('/:memoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memory = await memoryService.get(req.params.memoryId);

    if (!memory) {
      throw new AppError('Memory not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        memoryId: memory.memoryId,
        userId: memory.userId,
        content: memory.content,
        summary: memory.summary,
        category: memory.category,
        tags: memory.tags,
        entities: memory.entities,
        importance: memory.importance,
        source: memory.source,
        context: memory.context,
        metadata: memory.metadata,
        relatedMemoryIds: memory.relatedMemoryIds,
        recallCount: memory.recallCount,
        lastRecalled: memory.lastRecalled,
        expiresAt: memory.expiresAt,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/memory/:memoryId - Update a memory
 */
router.patch('/:memoryId', memoryWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = UpdateMemorySchema.parse(req.body);
    const memory = await memoryService.update(req.params.memoryId, input);

    if (!memory) {
      throw new AppError('Memory not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        memoryId: memory.memoryId,
        content: memory.content,
        summary: memory.summary,
        category: memory.category,
        tags: memory.tags,
        importance: memory.importance,
        expiresAt: memory.expiresAt,
        updatedAt: memory.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/memory/:memoryId - Delete a memory
 */
router.delete('/:memoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await memoryService.delete(req.params.memoryId);

    if (!deleted) {
      throw new AppError('Memory not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Memory deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/memory/:memoryId/recall - Increment recall count
 */
router.post('/:memoryId/recall', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await memoryService.recall([req.params.memoryId]);

    res.json({
      success: true,
      message: 'Memory recalled',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/memory/:memoryId/tags - Add tags
 */
router.post('/:memoryId/tags', memoryWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      throw new AppError('tags must be an array', 400, 'VALIDATION_ERROR');
    }

    await memoryService.addTags(req.params.memoryId, tags);

    res.json({
      success: true,
      message: 'Tags added',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/memory/:memoryId/link - Link memories
 */
router.post('/:memoryId/link', memoryWriteLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { relatedMemoryIds } = req.body;

    if (!Array.isArray(relatedMemoryIds)) {
      throw new AppError('relatedMemoryIds must be an array', 400, 'VALIDATION_ERROR');
    }

    await memoryService.linkMemories(req.params.memoryId, relatedMemoryIds);

    res.json({
      success: true,
      message: 'Memories linked',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/memory/stats/:userId - Get memory statistics
 */
router.get('/stats/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await memoryService.getStats(req.params.userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
