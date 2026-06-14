/**
 * Engagement Routes
 * API endpoints for engagement signals
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import ecosystemService from '../services/ecosystemService';
import { logger } from '../config/logger';
import { EngagementAction } from '../types';

const router = Router();

/**
 * POST /api/engagement/signal
 * Record an engagement signal
 */
router.post('/signal', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { action, source, metadata } = req.body;

    // Validate action
    const validActions: EngagementAction[] = ['booking', 'review', 'campaign', 'referral', 'dooh_scan', 'social_share', 'checkin'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action type' });
    }

    // Default source
    const engagementSource = source || 'creator_qr';

    await ecosystemService.recordEngagementSignal(userId, action, engagementSource, metadata);

    res.json({ success: true, message: 'Signal recorded' });
  } catch (error) {
    logger.error('Failed to record signal', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to record signal' });
  }
});

/**
 * GET /api/engagement/history
 * Get engagement history
 */
router.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { PriveEngagement } = require('../models/PriveEngagement');
    const mongoose = require('mongoose');

    const history = await PriveEngagement.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Failed to get history', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

export default router;
