/**
 * REZ Outbound Service - Timing Routes
 *
 * AI-powered optimal send time recommendations
 */

import { Router, Request, Response } from 'express';
import { timingEngine, TimingPattern } from '../services/timingEngine.js';
import logger from '../utils/logger.js';

const router = Router();

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/v1/timing/optimal
 * Get optimal send windows
 */
router.get('/optimal', async (req: Request, res: Response) => {
  try {
    const windows = timingEngine.getOptimalWindow();

    res.json({
      success: true,
      data: {
        windows,
        best: windows[0],
      },
    });
  } catch (error) {
    logger.error('Failed to get optimal windows', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get optimal windows' });
  }
});

/**
 * GET /api/v1/timing/next
 * Get next optimal send time
 */
router.get('/next', async (req: Request, res: Response) => {
  try {
    const { from, maxWait } = req.query;

    const fromTime = from ? new Date(from as string) : undefined;
    const maxWaitHours = maxWait ? parseInt(maxWait as string) : undefined;

    const recommendation = timingEngine.getNextOptimalTime(fromTime, maxWaitHours);

    res.json({
      success: true,
      data: {
        recommendation,
      },
    });
  } catch (error) {
    logger.error('Failed to get next optimal time', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get next optimal time' });
  }
});

/**
 * POST /api/v1/timing/followup
 * Get optimal follow-up time
 */
router.post('/followup', async (req: Request, res: Response) => {
  try {
    const { lastActionAt, followUpNumber, contactTimezone } = req.body as {
      lastActionAt: string;
      followUpNumber: number;
      contactTimezone?: string;
    };

    if (!lastActionAt || !followUpNumber) {
      res.status(400).json({
        success: false,
        error: 'lastActionAt and followUpNumber are required',
      });
      return;
    }

    const recommendation = timingEngine.getFollowUpTime(
      new Date(lastActionAt),
      followUpNumber,
      contactTimezone
    );

    res.json({
      success: true,
      data: {
        recommendation,
      },
    });
  } catch (error) {
    logger.error('Failed to get follow-up time', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get follow-up time' });
  }
});

/**
 * GET /api/v1/timing/weekly
 * Get weekly optimal times summary
 */
router.get('/weekly', async (req: Request, res: Response) => {
  try {
    const summary = timingEngine.getWeeklySummary();

    // Find best day
    const bestDay = summary.reduce((max, day) =>
      day.avgScore > max.avgScore ? day : max
    );

    res.json({
      success: true,
      data: {
        summary,
        bestDay,
      },
    });
  } catch (error) {
    logger.error('Failed to get weekly summary', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get weekly summary' });
  }
});

/**
 * POST /api/v1/timing/patterns
 * Update timing patterns with new data
 */
router.post('/patterns', async (req: Request, res: Response) => {
  try {
    const { patterns } = req.body as { patterns: TimingPattern[] };

    if (!Array.isArray(patterns)) {
      res.status(400).json({
        success: false,
        error: 'patterns must be an array',
      });
      return;
    }

    timingEngine.updatePatterns(patterns);

    logger.info('Timing patterns updated via API', { count: patterns.length });

    res.json({
      success: true,
      data: {
        message: `${patterns.length} patterns updated`,
        totalPatterns: timingEngine.getWeeklySummary().length,
      },
    });
  } catch (error) {
    logger.error('Failed to update patterns', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update patterns' });
  }
});

export default router;
