import { Router, Request, Response } from 'express';
import { impactService } from '../services/index.js';
import { asyncHandler } from '../middleware/validation.js';
import { AppError } from '../middleware/error.js';
import { impactAnalysisDuration } from '../middleware/metrics.js';
import logger from '../config/logger.js';

const router = Router();
const impactLogger = logger.child({ component: 'ImpactRouter' });

/**
 * GET /api/events/:id/impact
 * Get impact analysis for an event
 */
router.get(
  '/:id/impact',
  asyncHandler(async (req: Request, res: Response) => {
    const start = process.hrtime();

    const impact = await impactService.analyzeImpact(req.params.id);

    if (!impact) {
      throw AppError.notFound('Event');
    }

    // Record analysis duration
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds + nanoseconds / 1e9;
    impactAnalysisDuration.observe({ event_type: impact.eventType }, duration);

    impactLogger.info('Impact analysis requested', {
      eventId: req.params.id,
      score: impact.impactMetrics.adOpportunityScore
    });

    res.json({
      success: true,
      data: impact
    });
  })
);

/**
 * GET /api/events/:id/suggestions
 * Get campaign suggestions for nearby merchants
 */
router.get(
  '/:id/suggestions',
  asyncHandler(async (req: Request, res: Response) => {
    const suggestions = await impactService.generateCampaignSuggestions(req.params.id);

    if (!suggestions) {
      throw AppError.notFound('Event');
    }

    impactLogger.info('Campaign suggestions generated', {
      eventId: req.params.id,
      merchantCount: suggestions.nearbyMerchants.length,
      totalBudget: suggestions.totalRecommendedBudget
    });

    res.json({
      success: true,
      data: suggestions
    });
  })
);

/**
 * GET /api/impact/compare
 * Compare impact of multiple events
 */
router.get(
  '/compare',
  asyncHandler(async (req: Request, res: Response) => {
    const { eventIds } = req.query;

    if (!eventIds || typeof eventIds !== 'string') {
      throw AppError.validation('eventIds is required');
    }

    const ids = eventIds.split(',').filter(Boolean);

    if (ids.length < 2) {
      throw AppError.validation('At least 2 event IDs required for comparison');
    }

    if (ids.length > 10) {
      throw AppError.validation('Maximum 10 events can be compared');
    }

    const comparisons = await Promise.all(
      ids.map(async (id) => {
        const impact = await impactService.analyzeImpact(id);
        return impact ? { eventId: id, impact } : null;
      })
    );

    const validComparisons = comparisons.filter(Boolean);

    if (validComparisons.length === 0) {
      throw AppError.notFound('Events');
    }

    // Sort by ad opportunity score
    validComparisons.sort((a, b) =>
      (b?.impact.impactMetrics.adOpportunityScore || 0) -
      (a?.impact.impactMetrics.adOpportunityScore || 0)
    );

    res.json({
      success: true,
      data: {
        comparisons: validComparisons,
        summary: {
          totalEvents: validComparisons.length,
          highestOpportunity: validComparisons[0]?.eventId,
          averageFootfall: Math.round(
            validComparisons.reduce((sum, c) => sum + (c?.impact.expectedFootfall || 0), 0) /
            validComparisons.length
          )
        }
      }
    });
  })
);

/**
 * GET /api/impact/predict
 * Predict impact for a hypothetical event
 */
router.post(
  '/predict',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, date, location, expectedFootfall } = req.body;

    if (!type || !date || !location) {
      throw AppError.validation('type, date, and location are required');
    }

    // Create a temporary event object for prediction
    const mockEvent = {
      _id: { toString: () => 'prediction' },
      type,
      name: 'Predicted Event',
      date: new Date(date),
      expectedFootfall,
      location
    };

    const impact = await impactService.analyzeImpact('prediction');

    // Override with mock data
    if (impact) {
      impact.eventId = 'prediction';
      impact.eventName = `Predicted ${type} event`;
      impact.expectedFootfall = expectedFootfall || impact.expectedFootfall;
    }

    impactLogger.info('Impact prediction generated', { type, date });

    res.json({
      success: true,
      data: impact
    });
  })
);

export default router;