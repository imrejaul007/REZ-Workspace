import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loyaltyService, CreateProgramInput, UpdateProgramInput } from '../services/loyalty.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createProgramSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['points', 'tiered', 'cashback', 'hybrid']),
  earningRules: z.array(z.object({
    action: z.string().min(1),
    pointsPerUnit: z.number().min(0),
    multiplier: z.number().optional(),
    conditions: z.record(z.unknown()).optional()
  })),
  redemptionRules: z.object({
    pointsPerUnit: z.number().min(0),
    minRedemption: z.number().min(0),
    maxRedemption: z.number().optional(),
    expiryDays: z.number().optional()
  }),
  tiers: z.array(z.object({
    name: z.string().min(1),
    level: z.number().int().min(1),
    minPoints: z.number().min(0),
    maxPoints: z.number().optional(),
    benefits: z.array(z.string()),
    multiplier: z.number().min(1),
    requirements: z.object({
      minPurchases: z.number().optional(),
      minOrders: z.number().optional(),
      tenureDays: z.number().optional()
    }).optional(),
    perks: z.array(z.object({
      type: z.string(),
      value: z.number().optional(),
      description: z.string()
    })).optional()
  })).optional(),
  currency: z.string().optional()
});

const updateProgramSchema = createProgramSchema.partial().omit({ type: true, earningRules: true, redemptionRules: true });

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

// POST /api/programs - Create program
router.post('/', authMiddleware, validateBody(createProgramSchema), async (req: Request, res: Response) => {
  try {
    const program = await loyaltyService.createProgram(req.body as CreateProgramInput, req.user!.userId);
    res.status(201).json({ success: true, data: program });
  } catch (error) {
    logger.error('Create program error:', error);
    res.status(500).json({ success: false, error: 'Failed to create program' });
  }
});

// GET /api/programs - List programs
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      type: req.query.type as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await loyaltyService.listPrograms(filters);
    res.json({
      success: true,
      data: result.programs,
      pagination: { page: filters.page, limit: filters.limit, total: result.total, pages: Math.ceil(result.total / filters.limit) }
    });
  } catch (error) {
    logger.error('List programs error:', error);
    res.status(500).json({ success: false, error: 'Failed to list programs' });
  }
});

// GET /api/programs/:id - Get program
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const program = await loyaltyService.findProgramById(req.params.id);
    if (!program) {
      res.status(404).json({ success: false, error: 'Program not found' });
      return;
    }
    res.json({ success: true, data: program });
  } catch (error) {
    logger.error('Get program error:', error);
    res.status(500).json({ success: false, error: 'Failed to get program' });
  }
});

// PUT /api/programs/:id - Update program
router.put('/:id', authMiddleware, validateBody(updateProgramSchema), async (req: Request, res: Response) => {
  try {
    const program = await loyaltyService.updateProgram(req.params.id, req.body as UpdateProgramInput);
    if (!program) {
      res.status(404).json({ success: false, error: 'Program not found' });
      return;
    }
    res.json({ success: true, data: program });
  } catch (error) {
    logger.error('Update program error:', error);
    res.status(500).json({ success: false, error: 'Failed to update program' });
  }
});

// POST /api/programs/:id/enroll - Enroll user
router.post('/:id/enroll', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    const enrollment = await loyaltyService.enrollUser(req.params.id, userId);
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    logger.error('Enroll user error:', error);
    const message = error instanceof Error ? error.message : 'Failed to enroll user';
    res.status(400).json({ success: false, error: message });
  }
});

// POST /api/programs/:id/earn - Earn points
router.post('/:id/earn', async (req: Request, res: Response) => {
  try {
    const { userId, points, action } = req.body;
    if (!userId || points === undefined) {
      res.status(400).json({ success: false, error: 'userId and points are required' });
      return;
    }

    const enrollment = await loyaltyService.earnPoints(req.params.id, userId, points, action);
    res.json({ success: true, data: enrollment });
  } catch (error) {
    logger.error('Earn points error:', error);
    res.status(500).json({ success: false, error: 'Failed to earn points' });
  }
});

// POST /api/programs/:id/redeem - Redeem points
router.post('/:id/redeem', async (req: Request, res: Response) => {
  try {
    const { userId, points } = req.body;
    if (!userId || points === undefined) {
      res.status(400).json({ success: false, error: 'userId and points are required' });
      return;
    }

    const result = await loyaltyService.redeemPoints(req.params.id, userId, points);
    res.json({ success: result.success, data: result });
  } catch (error) {
    logger.error('Redeem points error:', error);
    res.status(500).json({ success: false, error: 'Failed to redeem points' });
  }
});

// GET /api/programs/:id/enrollment/:userId - Get enrollment
router.get('/:id/enrollment/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const enrollment = await loyaltyService.getEnrollment(req.params.id, req.params.userId);
    if (!enrollment) {
      res.status(404).json({ success: false, error: 'Enrollment not found' });
      return;
    }
    res.json({ success: true, data: enrollment });
  } catch (error) {
    logger.error('Get enrollment error:', error);
    res.status(500).json({ success: false, error: 'Failed to get enrollment' });
  }
});

// GET /api/programs/user/:userId - Get user enrollments
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const enrollments = await loyaltyService.getUserEnrollments(req.params.userId);
    res.json({ success: true, data: enrollments });
  } catch (error) {
    logger.error('Get user enrollments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get enrollments' });
  }
});

// DELETE /api/programs/:id - Delete program
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await loyaltyService.deleteProgram(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Program not found' });
      return;
    }
    res.json({ success: true, data: { archived: true } });
  } catch (error) {
    logger.error('Delete program error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete program' });
  }
});

export default router;