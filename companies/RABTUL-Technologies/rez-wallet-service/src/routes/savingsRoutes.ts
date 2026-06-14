/**
 * Savings Routes
 *
 * API endpoints for the savings module.
 * Provides insights, projections, recommendations, and savings tracking.
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { transactionLimiter, generalLimiter } from '../middleware/rateLimiter';
import {
  getSavingsSummary,
  getSavingsDashboard,
  getSavingsHistory,
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoalProgress,
  deleteSavingsGoal,
  getSavingsStreak,
  getSavingsProjection,
  getSavingsInsights,
  getSavingsRecommendations,
} from '../services/savingsService';
import { logger } from '../config/logger';

const router = Router();

// Apply rate limiting
router.use(generalLimiter);

// ─── Helper: Extract userId from request ─────────────────────────────────────

interface AuthenticatedRequest extends Request {
  userId?: string;
  decoded?: { userId?: string; role?: string };
}

/**
 * Middleware to authenticate user via Bearer token.
 * Extracts userId from JWT for consumer-facing endpoints.
 */
async function authenticateUser(req: AuthenticatedRequest, res: Response, next: Function) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authorization header required' });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error('JWT_SECRET not configured');
    res.status(500).json({ success: false, message: 'Service configuration error' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string; role?: string };
    req.userId = decoded.userId;
    req.decoded = decoded;
    next();
  } catch (err) {
    logger.warn('Token verification failed', { error: err.message });
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/**
 * Get userId from request (supports both authenticated consumer and internal service calls)
 */
function getUserId(req: AuthenticatedRequest): string | null {
  // Try authenticated user first
  if (req.userId) return req.userId;

  // Try internal token payload
  const internalToken = req.headers['x-internal-token'] as string;
  if (internalToken) {
    try {
      // Decode without verification for logging
      const decoded = jwt.decode(internalToken) as { userId?: string };
      return decoded?.userId || null;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Internal auth middleware for service-to-service calls
 */
async function authenticateInternal(req: Request, res: Response, next: Function) {
  const internalToken = req.headers['x-internal-token'] as string;

  // Check scoped tokens
  const scopedTokensJson = process.env.INTERNAL_SERVICE_TOKENS_JSON;
  if (scopedTokensJson) {
    try {
      const tokens = JSON.parse(scopedTokensJson);
      for (const t of tokens) {
        if (t.token === internalToken) {
          (req as AuthenticatedRequest).userId = t.userId || '';
          next();
          return;
        }
      }
    } catch {
      // Invalid JSON
    }
  }

  // Check legacy token
  if (internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
    next();
    return;
  }

  res.status(401).json({ success: false, message: 'Internal authorization required' });
}

// ─── Dashboard ──────────────────────────────────────────────────────────────────

/**
 * GET /api/savings/dashboard
 * Get comprehensive savings dashboard
 */
router.get('/dashboard', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    const dashboard = await getSavingsDashboard(userId);

    res.json({ success: true, data: dashboard });
  } catch (error) {
    logger.error('Get savings dashboard error', { error, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to get savings dashboard' });
  }
});

// ─── Summary ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/savings/summary
 * Get savings summary (totals, by type, by category)
 */
router.get('/summary', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    const summary = await getSavingsSummary(userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Get savings summary error', { error, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to get savings summary' });
  }
});

// ─── History ────────────────────────────────────────────────────────────────────

/**
 * GET /api/savings/history
 * Get savings history with pagination and filters
 */
router.get('/history', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const type = req.query.type as 'cashback' | 'reward' | 'referral' | 'loyalty' | 'promo' | 'cashback_bonus' | undefined;
    const category = req.query.category as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const history = await getSavingsHistory(userId, page, limit, {
      type,
      category,
      startDate,
      endDate,
    });

    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Get savings history error', { error, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to get savings history' });
  }
});

// ─── Streak ────────────────────────────────────────────────────────────────────

/**
 * GET /api/savings/streak
 * Get savings streak information
 */
router.get('/streak', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    const streak = await getSavingsStreak(userId);
    res.json({ success: true, data: streak });
  } catch (error) {
    logger.error('Get savings streak error', { error, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to get savings streak' });
  }
});

// ─── Projection ────────────────────────────────────────────────────────────────

/**
 * GET /api/savings/projection
 * Get savings projections (30/90/365 days)
 */
router.get('/projection', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    const projection = await getSavingsProjection(userId);
    res.json({ success: true, data: projection });
  } catch (error) {
    logger.error('Get savings projection error', { error, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to get savings projection' });
  }
});

// ─── Insights ──────────────────────────────────────────────────────────────────

/**
 * GET /api/savings/insights
 * Get personalized savings insights
 */
router.get('/insights', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    const insights = await getSavingsInsights(userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    logger.error('Get savings insights error', { error, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to get savings insights' });
  }
});

// ─── Recommendations ───────────────────────────────────────────────────────────

/**
 * GET /api/savings/recommendations
 * Get personalized savings recommendations
 */
router.get('/recommendations', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    const recommendations = await getSavingsRecommendations(userId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    logger.error('Get savings recommendations error', { error, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to get recommendations' });
  }
});

// ─── Savings Goals ──────────────────────────────────────────────────────────────

/**
 * GET /api/savings/goals
 * Get all savings goals
 */
router.get('/goals', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    const goals = await getSavingsGoals(userId);
    res.json({ success: true, data: goals });
  } catch (error) {
    logger.error('Get savings goals error', { error, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to get goals' });
  }
});

/**
 * POST /api/savings/goals
 * Create a new savings goal
 */
router.post('/goals', transactionLimiter, authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    const { name, targetAmount, targetDate, category, icon, color } = req.body;

    if (!name || !targetAmount) {
      res.status(400).json({ success: false, message: 'Name and target amount required' });
      return;
    }

    if (targetAmount <= 0) {
      res.status(400).json({ success: false, message: 'Target amount must be positive' });
      return;
    }

    const goal = await createSavingsGoal({
      userId,
      name,
      targetAmount,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      category,
      icon,
      color,
    });

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    logger.error('Create savings goal error', { error, userId: req.userId });
    res.status(500).json({ success: false, message: 'Failed to create goal' });
  }
});

/**
 * PATCH /api/savings/goals/:goalId
 * Update savings goal progress
 */
router.patch('/goals/:goalId', transactionLimiter, authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;
    const { amount } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    if (amount === undefined || amount <= 0) {
      res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      return;
    }

    const goal = await updateSavingsGoalProgress(userId, goalId, amount);

    if (!goal) {
      res.status(404).json({ success: false, message: 'Goal not found' });
      return;
    }

    res.json({ success: true, data: goal });
  } catch (error) {
    logger.error('Update savings goal error', { error, userId: req.userId, goalId: req.params.goalId });
    res.status(500).json({ success: false, message: 'Failed to update goal' });
  }
});

/**
 * DELETE /api/savings/goals/:goalId
 * Delete a savings goal
 */
router.delete('/goals/:goalId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User ID required' });
      return;
    }

    const deleted = await deleteSavingsGoal(userId, goalId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Goal not found' });
      return;
    }

    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    logger.error('Delete savings goal error', { error, userId: req.userId, goalId: req.params.goalId });
    res.status(500).json({ success: false, message: 'Failed to delete goal' });
  }
});

export default router;
