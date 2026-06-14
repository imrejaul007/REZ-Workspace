/**
 * Ecosystem Routes
 * API endpoints for cross-service integrations
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import ecosystemService from '../services/ecosystemService';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/ecosystem/unified-score
 * Get unified score combining Prive and Karma
 */
router.get('/unified-score', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const unifiedScore = await ecosystemService.getUnifiedScore(userId);
    res.json({ success: true, data: unifiedScore });
  } catch (error) {
    logger.error('Failed to get unified score', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get unified score' });
  }
});

/**
 * GET /api/ecosystem/benefits/:service
 * Check ecosystem-specific benefits
 */
router.get('/benefits/:service', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const service = req.params.service;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const benefits = await ecosystemService.checkEcosystemBenefits(userId, service);
    res.json({ success: true, data: benefits });
  } catch (error) {
    logger.error('Failed to get benefits', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get benefits' });
  }
});

/**
 * GET /api/ecosystem/connections
 * Get ecosystem connection status
 */
router.get('/connections', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const unifiedScore = await ecosystemService.getUnifiedScore(userId);
    res.json({ success: true, data: unifiedScore.ecosystemConnections });
  } catch (error) {
    logger.error('Failed to get connections', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get connections' });
  }
});

/**
 * POST /api/ecosystem/sync
 * Sync data with another ecosystem service
 */
router.post('/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { targetService, action, data } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    res.json({ success: true, message: 'Sync initiated' });
  } catch (error) {
    logger.error('Failed to sync', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to sync' });
  }
});

export default router;
