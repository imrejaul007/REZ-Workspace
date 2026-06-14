import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { segmentService, CreateSegmentInput, UpdateSegmentInput } from '../services/segment.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createSegmentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['dynamic', 'static', 'hybrid']).optional(),
  criteria: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'between', 'exists', 'not_exists', 'starts_with', 'ends_with']),
    value: z.unknown()
  })).min(1),
  criteriaLogic: z.enum(['and', 'or']).optional(),
  refreshInterval: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional()
});

const updateSegmentSchema = createSegmentSchema.partial();

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: result.error.issues });
      return;
    }
    req.body = result.data;
    next();
  };
}

// POST /api/segments - Create segment
router.post('/', authMiddleware, validateBody(createSegmentSchema), async (req: Request, res: Response) => {
  try {
    const segment = await segmentService.create(req.body as CreateSegmentInput, req.user!.userId);
    res.status(201).json({ success: true, data: segment });
  } catch (error) {
    logger.error('Create segment error:', error);
    res.status(500).json({ success: false, error: 'Failed to create segment' });
  }
});

// GET /api/segments - List segments
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      type: req.query.type as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await segmentService.list(filters);
    res.json({
      success: true,
      data: result.segments,
      pagination: { page: filters.page, limit: filters.limit, total: result.total, pages: Math.ceil(result.total / filters.limit) }
    });
  } catch (error) {
    logger.error('List segments error:', error);
    res.status(500).json({ success: false, error: 'Failed to list segments' });
  }
});

// GET /api/segments/:id - Get segment
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const segment = await segmentService.findById(req.params.id);
    if (!segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }
    res.json({ success: true, data: segment });
  } catch (error) {
    logger.error('Get segment error:', error);
    res.status(500).json({ success: false, error: 'Failed to get segment' });
  }
});

// PUT /api/segments/:id - Update segment
router.put('/:id', authMiddleware, validateBody(updateSegmentSchema), async (req: Request, res: Response) => {
  try {
    const segment = await segmentService.update(req.params.id, req.body as UpdateSegmentInput);
    if (!segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }
    res.json({ success: true, data: segment });
  } catch (error) {
    logger.error('Update segment error:', error);
    res.status(500).json({ success: false, error: 'Failed to update segment' });
  }
});

// GET /api/segments/:id/members - Get segment members
router.get('/:id/members', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await segmentService.getMembers(req.params.id, page, limit);
    res.json({
      success: true,
      data: result.members,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) }
    });
  } catch (error) {
    logger.error('Get members error:', error);
    res.status(500).json({ success: false, error: 'Failed to get members' });
  }
});

// POST /api/segments/:id/members - Add member
router.post('/:id/members', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, profile } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    const member = await segmentService.addMember(req.params.id, userId, profile);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    logger.error('Add member error:', error);
    res.status(500).json({ success: false, error: 'Failed to add member' });
  }
});

// DELETE /api/segments/:id/members/:userId - Remove member
router.delete('/:id/members/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const removed = await segmentService.removeMember(req.params.id, req.params.userId);
    if (!removed) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.json({ success: true, data: { removed: true } });
  } catch (error) {
    logger.error('Remove member error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove member' });
  }
});

// POST /api/segments/evaluate - Evaluate user segments
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const { userId, profile } = req.body;
    if (!userId || !profile) {
      res.status(400).json({ success: false, error: 'userId and profile are required' });
      return;
    }

    const result = await segmentService.evaluateUser({ userId, profile });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Evaluate user error:', error);
    res.status(500).json({ success: false, error: 'Failed to evaluate user' });
  }
});

// DELETE /api/segments/:id - Delete segment
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await segmentService.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }
    res.json({ success: true, data: { archived: true } });
  } catch (error) {
    logger.error('Delete segment error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete segment' });
  }
});

export default router;