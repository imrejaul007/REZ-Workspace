/**
 * Concierge Routes - AI-powered concierge endpoints
 * Now with HOJAI Staybot integration
 */

import { Router, Request, Response } from 'express';
import { conciergeService } from '../services/ConciergeService';
import { validateConciergeQuery } from '../validators';
import { standardLimiter } from '../middleware/rateLimiter';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/concierge/query
 * Process a guest query and return AI response
 * Now integrates with HOJAI Staybot for advanced queries
 */
router.post('/query', standardLimiter, validateConciergeQuery, async (req: Request, res: Response) => {
  try {
    const { guestId, query, hotelId, roomId } = req.body;

    // Use async method for HOJAI Staybot integration
    const result = await conciergeService.processQuery(query, guestId, hotelId, roomId);

    logger.info('Concierge query processed', {
      guestId,
      hotelId,
      query: query.substring(0, 50),
      confidence: result.confidence,
      source: result.source
    });

    res.json({
      success: true,
      data: {
        response: result.response,
        suggestions: result.suggestions,
        confidence: result.confidence,
        source: result.source,
        guestId,
        hotelId,
        roomId,
      },
    });
  } catch (error) {
    logger.error('Error processing concierge query', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to process query' });
  }
});

/**
 * GET /api/concierge/welcome
 * Get welcome message
 */
router.get('/welcome', async (_req: Request, res: Response) => {
  try {
    const result = conciergeService.getWelcomeMessage();
    res.json({
      success: true,
      data: {
        response: result.response,
        suggestions: result.suggestions,
      },
    });
  } catch (error) {
    logger.error('Error getting welcome message', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get welcome message' });
  }
});

/**
 * GET /api/concierge/greeting
 * Get time-based greeting
 */
router.get('/greeting', async (_req: Request, res: Response) => {
  try {
    const greeting = conciergeService.getGreeting();
    res.json({ success: true, data: { greeting } });
  } catch (error) {
    logger.error('Error getting greeting', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get greeting' });
  }
});

export default router;