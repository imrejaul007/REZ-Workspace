import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ruleService, CreateRuleInput, UpdateRuleInput } from '../services/rule.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  priority: z.number().int().optional(),
  conditions: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in', 'between', 'exists', 'not_exists']),
    value: z.unknown()
  })).min(1),
  conditionLogic: z.enum(['and', 'or']).optional(),
  actions: z.array(z.object({
    type: z.enum(['show_content', 'hide_content', 'personalize', 'recommend', 'redirect', 'modify_price', 'apply_banner', 'send_notification']),
    config: z.record(z.unknown())
  })).min(1),
  targetChannels: z.array(z.string()).optional(),
  targetSegments: z.array(z.string()).optional(),
  schedule: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    timeRanges: z.array(z.object({ start: z.string(), end: z.string() })).optional()
  }).optional(),
  limit: z.object({
    maxUses: z.number().int().positive().optional(),
    perUser: z.number().int().positive().optional()
  }).optional()
});

const updateRuleSchema = createRuleSchema.partial();

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

// POST /api/rules - Create rule
router.post('/', authMiddleware, validateBody(createRuleSchema), async (req: Request, res: Response) => {
  try {
    const rule = await ruleService.create(req.body as CreateRuleInput, req.user!.userId);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    logger.error('Create rule error:', error);
    res.status(500).json({ success: false, error: 'Failed to create rule' });
  }
});

// GET /api/rules - List rules
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await ruleService.list(filters);
    res.json({
      success: true,
      data: result.rules,
      pagination: { page: filters.page, limit: filters.limit, total: result.total, pages: Math.ceil(result.total / filters.limit) }
    });
  } catch (error) {
    logger.error('List rules error:', error);
    res.status(500).json({ success: false, error: 'Failed to list rules' });
  }
});

// GET /api/rules/:id - Get rule
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const rule = await ruleService.findById(req.params.id);
    if (!rule) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error('Get rule error:', error);
    res.status(500).json({ success: false, error: 'Failed to get rule' });
  }
});

// PUT /api/rules/:id - Update rule
router.put('/:id', authMiddleware, validateBody(updateRuleSchema), async (req: Request, res: Response) => {
  try {
    const rule = await ruleService.update(req.params.id, req.body as UpdateRuleInput);
    if (!rule) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error('Update rule error:', error);
    res.status(500).json({ success: false, error: 'Failed to update rule' });
  }
});

// POST /api/rules/:id/test - Test rule
router.post('/:id/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await ruleService.testRule(req.params.id, req.body.context || {});
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Test rule error:', error);
    res.status(500).json({ success: false, error: 'Failed to test rule' });
  }
});

// POST /api/rules/evaluate - Evaluate rules
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const result = await ruleService.evaluate(req.body.context || {});
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Evaluate rules error:', error);
    res.status(500).json({ success: false, error: 'Failed to evaluate rules' });
  }
});

// DELETE /api/rules/:id - Delete rule
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await ruleService.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Rule not found' });
      return;
    }
    res.json({ success: true, data: { archived: true } });
  } catch (error) {
    logger.error('Delete rule error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete rule' });
  }
});

export default router;