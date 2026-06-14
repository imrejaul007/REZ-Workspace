import { logger } from '../../shared/logger';
/**
 * MyRisa Genie Health Routes
 */

import { Router, Request, Response } from 'express';
import { genieHealthService } from '../services/genieHealthService.js';

const router = Router();

/**
 * POST /chat
 * Chat with Genie Health AI
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { userId, message, conversationHistory } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message required'
      });
    }

    const response = await genieHealthService.chat(userId, message, conversationHistory);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Chat failed'
    });
  }
});

/**
 * GET /briefing/:userId
 * Get daily health briefing
 */
router.get('/briefing/:userId', async (req: Request, res: Response) => {
  try {
    const briefing = await genieHealthService.generateDailyBriefing(req.params.userId);

    res.json({
      success: true,
      data: briefing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate briefing'
    });
  }
});

/**
 * GET /predictions/:userId
 * Get health predictions
 */
router.get('/predictions/:userId', async (req: Request, res: Response) => {
  try {
    const predictions = await genieHealthService.predictPatterns(req.params.userId);

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get predictions'
    });
  }
});

/**
 * GET /context/:userId
 * Get user health context
 */
router.get('/context/:userId', async (req: Request, res: Response) => {
  try {
    const context = await genieHealthService.gatherContext(req.params.userId);

    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to gather context'
    });
  }
});

export default router;