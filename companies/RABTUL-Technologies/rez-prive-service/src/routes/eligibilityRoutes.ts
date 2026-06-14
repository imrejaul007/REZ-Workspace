/**
 * Eligibility Routes
 * API endpoints for Prive eligibility
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import eligibilityService from '../services/eligibilityService';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/eligibility
 * Get user's Prive eligibility
 */
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const eligibility = await eligibilityService.getEligibility(userId);
    res.json({ success: true, data: eligibility });
  } catch (error) {
    logger.error('Failed to get eligibility', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get eligibility' });
  }
});

/**
 * POST /api/eligibility/recalculate
 * Recalculate eligibility with new metrics
 */
router.post('/recalculate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { metrics } = req.body;
    const eligibility = await eligibilityService.recalculateEligibility(userId, metrics || {});
    res.json({ success: true, data: eligibility });
  } catch (error) {
    logger.error('Failed to recalculate eligibility', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to recalculate eligibility' });
  }
});

/**
 * GET /api/eligibility/pillars
 * Get pillar breakdown
 */
router.get('/pillars', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const eligibility = await eligibilityService.getEligibility(userId);
    res.json({ success: true, data: eligibility.pillars });
  } catch (error) {
    logger.error('Failed to get pillars', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get pillars' });
  }
});

/**
 * GET /api/eligibility/tiers
 * Get all tier configurations
 */
router.get('/tiers', async (req: AuthRequest, res: Response) => {
  const { TIER_CONFIG } = require('../types');
  res.json({ success: true, data: TIER_CONFIG });
});

export default router;
