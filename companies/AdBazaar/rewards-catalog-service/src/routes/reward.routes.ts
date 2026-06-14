import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { rewardService, CreateRewardInput, UpdateRewardInput } from '../services/reward.service';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const createRewardSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['discount', 'gift_card', 'product', 'voucher', 'experience', 'charity']),
  category: z.string().min(1),
  imageUrl: z.string().optional(),
  pointsCost: z.number().min(0),
  actualValue: z.number().optional(),
  currency: z.string().optional(),
  inventory: z.number().int().min(0).optional(),
  minTier: z.string().optional(),
  maxRedemptionsPerUser: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  terms: z.string().optional(),
  redemptionInstructions: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const updateRewardSchema = createRewardSchema.partial().omit({ type: true, category: true });

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

// POST /api/rewards - Create reward
router.post('/', authMiddleware, validateBody(createRewardSchema), async (req: Request, res: Response) => {
  try {
    const reward = await rewardService.create(req.body as CreateRewardInput, req.user!.userId);
    res.status(201).json({ success: true, data: reward });
  } catch (error) {
    logger.error('Create reward error:', error);
    res.status(500).json({ success: false, error: 'Failed to create reward' });
  }
});

// GET /api/rewards - List rewards
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      type: req.query.type as string,
      category: req.query.category as string,
      minPoints: req.query.minPoints ? parseInt(req.query.minPoints as string) : undefined,
      maxPoints: req.query.maxPoints ? parseInt(req.query.maxPoints as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await rewardService.list(filters);
    res.json({
      success: true,
      data: result.rewards,
      pagination: { page: filters.page, limit: filters.limit, total: result.total, pages: Math.ceil(result.total / filters.limit) }
    });
  } catch (error) {
    logger.error('List rewards error:', error);
    res.status(500).json({ success: false, error: 'Failed to list rewards' });
  }
});

// GET /api/rewards/:id - Get reward
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const reward = await rewardService.findById(req.params.id);
    if (!reward) {
      res.status(404).json({ success: false, error: 'Reward not found' });
      return;
    }
    res.json({ success: true, data: reward });
  } catch (error) {
    logger.error('Get reward error:', error);
    res.status(500).json({ success: false, error: 'Failed to get reward' });
  }
});

// PUT /api/rewards/:id - Update reward
router.put('/:id', authMiddleware, validateBody(updateRewardSchema), async (req: Request, res: Response) => {
  try {
    const reward = await rewardService.update(req.params.id, req.body as UpdateRewardInput);
    if (!reward) {
      res.status(404).json({ success: false, error: 'Reward not found' });
      return;
    }
    res.json({ success: true, data: reward });
  } catch (error) {
    logger.error('Update reward error:', error);
    res.status(500).json({ success: false, error: 'Failed to update reward' });
  }
});

// POST /api/rewards/:id/redeem - Redeem reward
router.post('/:id/redeem', async (req: Request, res: Response) => {
  try {
    const { userId, programId, deliveryDetails } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    const result = await rewardService.redeem(req.params.id, userId, programId, deliveryDetails);

    if (!result.success) {
      res.status(400).json({ success: false, error: result.errorMessage });
      return;
    }

    res.status(201).json({ success: true, data: result.redemption });
  } catch (error) {
    logger.error('Redeem reward error:', error);
    res.status(500).json({ success: false, error: 'Failed to redeem reward' });
  }
});

// GET /api/rewards/:id/inventory - Get inventory
router.get('/:id/inventory', authMiddleware, async (req: Request, res: Response) => {
  try {
    const inventory = await rewardService.getInventory(req.params.id);
    if (!inventory) {
      res.status(404).json({ success: false, error: 'Reward not found' });
      return;
    }
    res.json({ success: true, data: inventory });
  } catch (error) {
    logger.error('Get inventory error:', error);
    res.status(500).json({ success: false, error: 'Failed to get inventory' });
  }
});

// GET /api/redemptions/:id - Get redemption
router.get('/redemptions/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const redemption = await rewardService.getRedemption(req.params.id);
    if (!redemption) {
      res.status(404).json({ success: false, error: 'Redemption not found' });
      return;
    }
    res.json({ success: true, data: redemption });
  } catch (error) {
    logger.error('Get redemption error:', error);
    res.status(500).json({ success: false, error: 'Failed to get redemption' });
  }
});

// GET /api/rewards/user/:userId/redemptions - Get user redemptions
router.get('/user/:userId/redemptions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await rewardService.getUserRedemptions(req.params.userId, page, limit);
    res.json({
      success: true,
      data: result.redemptions,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) }
    });
  } catch (error) {
    logger.error('Get user redemptions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get redemptions' });
  }
});

// DELETE /api/rewards/:id - Delete reward
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await rewardService.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Reward not found' });
      return;
    }
    res.json({ success: true, data: { archived: true } });
  } catch (error) {
    logger.error('Delete reward error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete reward' });
  }
});

export default router;