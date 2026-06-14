import { Router, Request, Response } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply auth to all routes
router.use(requireAuth());

/**
 * @route GET /api/subscription/plans
 * @desc Get available subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = subscriptionService.getPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

/**
 * @route POST /api/subscription/subscribe
 * @desc Subscribe to a plan
 * SECURITY: Users can only subscribe themselves
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { tier, paymentMethod } = req.body;

    // Use authenticated user's ID
    const userId = req.user!.id;

    if (!userId || !tier) {
      return res.status(400).json({ error: 'userId and tier required' });
    }

    // Ownership verification (should always pass since we use req.user!.id)
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    const result = await subscriptionService.subscribe(userId, tier, paymentMethod);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, data: result.subscription });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/subscription/:userId
 * @desc Get user's subscription
 * SECURITY: Ownership verification
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Ownership verification
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    const plan = await subscriptionService.hasActiveSubscription(userId);

    res.json({
      success: true,
      data: {
        hasSubscription: !!plan,
        plan: plan || null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route DELETE /api/subscription/:userId
 * @desc Cancel subscription
 * SECURITY: Ownership verification
 */
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Ownership verification
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    const result = await subscriptionService.cancel(userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/subscription/:userId/benefits
 * @desc Get subscription benefits
 * SECURITY: Ownership verification
 */
router.get('/:userId/benefits', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Ownership verification
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'FORBIDDEN'
      });
    }

    const benefits = await subscriptionService.getBenefits(userId);

    res.json({ success: true, data: benefits });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * @route GET /api/subscription/stats
 * @desc Get subscription stats (admin)
 */
router.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const stats = await subscriptionService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
