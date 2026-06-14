import { Router, Request, Response, NextFunction } from 'express';
import { predictionEngine } from '../services/predictionEngine.js';
import { interventionRecommendationService } from '../services/interventionRecommendation.js';
import { outcomeTrackingService } from '../services/outcomeTracking.js';
import { learningLoopService } from '../services/learningLoop.js';
import { ecosystemConnectors } from '../services/ecosystemConnectors.js';
import { OutcomeType, OutcomeStatus, InterventionType } from '../types/index.js';
import outcomeRoutes from './outcomeRoutes.js';
import { serviceAuth } from '../middleware/index.js';
import logger from 'utils/logger.js';

const router = Router();

// ============ Health Check ============

router.get('/health', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const connectionStatus = await ecosystemConnectors.checkConnectionStatus();

    // Check MongoDB
    let mongodbStatus: 'connected' | 'disconnected' = 'disconnected';
    try {
      const mongoose = await import('mongoose');
      mongodbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch {
      mongodbStatus = 'disconnected';
    }

    const overallStatus =
      mongodbStatus === 'connected' &&
      (connectionStatus.orchestrator === 'reachable' || connectionStatus.merchantInsights === 'reachable')
        ? 'healthy'
        : connectionStatus.orchestrator === 'reachable' || connectionStatus.merchantInsights === 'reachable'
        ? 'degraded'
        : 'unhealthy';

    res.json({
      status: overallStatus,
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      dependencies: {
        mongodb: mongodbStatus,
        autonomousGrowthOrchestrator: connectionStatus.orchestrator,
        merchantInsightsOs: connectionStatus.merchantInsights,
      },
    });
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({
      status: 'unhealthy',
      version: '1.0.0',
      uptime: 0,
      dependencies: {
        mongodb: 'disconnected',
        autonomousGrowthOrchestrator: 'unreachable',
        merchantInsightsOs: 'unreachable',
      },
    });
  }
});

// ============ Prediction Routes ============

/**
 * POST /api/predict
 * Generate outcome prediction
 */
router.post('/api/predict', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, outcomeType, horizonDays, features } = req.body;

    if (!businessId || !outcomeType) {
      res.status(400).json({ error: 'businessId and outcomeType are required' });
      return;
    }

    if (!Object.values(OutcomeType).includes(outcomeType)) {
      res.status(400).json({
        error: 'Invalid outcomeType',
        validTypes: Object.values(OutcomeType),
      });
      return;
    }

    const prediction = await predictionEngine.predict({
      businessId,
      outcomeType,
      horizonDays,
      features,
      historicalDataPoints: 90,
    });

    // Also get recommendations based on prediction
    const goals = await outcomeTrackingService.getActiveGoals(businessId);
    const relevantGoal = goals.find(g => g.type === outcomeType);

    let recommendations = null;
    if (relevantGoal) {
      recommendations = await interventionRecommendationService.getRecommendations(relevantGoal.goalId, 3);
    }

    res.json({
      prediction,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/predictions/:businessId
 * Get recent predictions for a business
 */
router.get('/api/predictions/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params;
    const { outcomeType, limit = '10' } = req.query;

    const predictions = await predictionEngine.getRecentPredictions(
      businessId,
      outcomeType as OutcomeType | undefined,
      parseInt(limit as string, 10)
    );

    res.json({ predictions });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/accuracy/:outcomeType?
 * Get prediction accuracy metrics
 */
router.get('/api/accuracy/:outcomeType?', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { outcomeType } = req.params;
    const metrics = await predictionEngine.getAccuracyMetrics(
      outcomeType as OutcomeType | undefined
    );

    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// ============ Intervention Routes ============

/**
 * POST /api/interventions/recommend
 * Get intervention recommendations for a goal
 */
router.post('/api/interventions/recommend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goalId, maxRecommendations = 5 } = req.body;

    if (!goalId) {
      res.status(400).json({ error: 'goalId is required' });
      return;
    }

    const recommendations = await interventionRecommendationService.getRecommendations(
      goalId,
      maxRecommendations
    );

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/interventions/apply
 * Apply an intervention
 */
router.post('/api/interventions/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goalId, interventionType, description, expectedImpact, priority, cost, estimatedROI } = req.body;

    if (!goalId || !interventionType || !description || expectedImpact === undefined) {
      res.status(400).json({
        error: 'goalId, interventionType, description, and expectedImpact are required',
      });
      return;
    }

    if (!Object.values(InterventionType).includes(interventionType)) {
      res.status(400).json({
        error: 'Invalid interventionType',
        validTypes: Object.values(InterventionType),
      });
      return;
    }

    const interventionId = await interventionRecommendationService.applyIntervention(
      goalId,
      interventionType,
      description,
      expectedImpact,
      priority || 5,
      { cost, estimatedROI }
    );

    res.status(201).json({ interventionId, status: 'applied' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/interventions/:interventionId/result
 * Update intervention result
 */
router.put('/api/interventions/:interventionId/result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { interventionId } = req.params;
    const { actualImpact, achieved, notes } = req.body;

    if (actualImpact === undefined || achieved === undefined) {
      res.status(400).json({ error: 'actualImpact and achieved are required' });
      return;
    }

    await interventionRecommendationService.updateInterventionResult(
      interventionId,
      actualImpact,
      achieved,
      notes
    );

    res.json({ interventionId, status: 'completed' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interventions/goal/:goalId
 * Get interventions for a goal
 */
router.get('/api/interventions/goal/:goalId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params;
    const interventions = await interventionRecommendationService.getInterventions(goalId);

    res.json({ interventions });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interventions/best
 * Get best performing interventions
 */
router.get('/api/interventions/best', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '10' } = req.query;
    const bestInterventions = await learningLoopService.getBestInterventions(parseInt(limit as string, 10));

    res.json({ bestInterventions });
  } catch (error) {
    next(error);
  }
});

// ============ Outcome Tracking Routes ============

/**
 * POST /api/track
 * Track an outcome event
 */
router.post('/api/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, goalId, outcomeType, value, source, timestamp, metadata } = req.body;

    if (!businessId || !outcomeType || value === undefined) {
      res.status(400).json({ error: 'businessId, outcomeType, and value are required' });
      return;
    }

    if (!Object.values(OutcomeType).includes(outcomeType)) {
      res.status(400).json({
        error: 'Invalid outcomeType',
        validTypes: Object.values(OutcomeType),
      });
      return;
    }

    const event = await outcomeTrackingService.trackEvent(
      businessId,
      outcomeType,
      value,
      source || 'api',
      { goalId, timestamp: timestamp ? new Date(timestamp) : undefined, metadata }
    );

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/events/:businessId
 * Get outcome events for a business
 */
router.get('/api/events/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params;
    const { outcomeType, goalId, startDate, endDate, limit = '100', sortOrder } = req.query;

    const events = await outcomeTrackingService.getEvents(businessId, {
      outcomeType: outcomeType as OutcomeType | undefined,
      goalId: goalId as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string, 10),
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    res.json({ events });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/status/:businessId/:outcomeType
 * Get current outcome status
 */
router.get('/api/status/:businessId/:outcomeType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, outcomeType } = req.params;

    if (!Object.values(OutcomeType).includes(outcomeType as OutcomeType)) {
      res.status(400).json({
        error: 'Invalid outcomeType',
        validTypes: Object.values(OutcomeType),
      });
      return;
    }

    const status = await outcomeTrackingService.getStatus(businessId, outcomeType as OutcomeType);

    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/metrics/:businessId/:outcomeType
 * Get aggregated metrics
 */
router.get('/api/metrics/:businessId/:outcomeType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, outcomeType } = req.params;
    const { period = 'day', count = '12' } = req.query;

    const metrics = await outcomeTrackingService.getAggregatedMetrics(
      businessId,
      outcomeType as OutcomeType,
      period as 'day' | 'week' | 'month',
      parseInt(count as string, 10)
    );

    res.json({ metrics });
  } catch (error) {
    next(error);
  }
});

// ============ Goal Routes ============

/**
 * POST /api/goals
 * Create or update a business goal
 */
router.post('/api/goals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, type, targetValue, targetDate, startValue, startDate, metadata } = req.body;

    if (!businessId || !type || !targetValue || !targetDate) {
      res.status(400).json({ error: 'businessId, type, targetValue, and targetDate are required' });
      return;
    }

    if (!Object.values(OutcomeType).includes(type)) {
      res.status(400).json({
        error: 'Invalid type',
        validTypes: Object.values(OutcomeType),
      });
      return;
    }

    const goalId = await outcomeTrackingService.upsertGoal(
      businessId,
      type,
      targetValue,
      new Date(targetDate),
      {
        startValue,
        startDate: startDate ? new Date(startDate) : undefined,
        metadata,
      }
    );

    res.status(201).json({ goalId });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/goals/:businessId
 * Get active goals for a business
 */
router.get('/api/goals/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params;
    const goals = await outcomeTrackingService.getActiveGoals(businessId);

    res.json({ goals });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/goals/:goalId/pause
 * Pause a goal
 */
router.put('/api/goals/:goalId/pause', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params;
    await outcomeTrackingService.pauseGoal(goalId);
    res.json({ goalId, status: 'paused' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/goals/:goalId/resume
 * Resume a paused goal
 */
router.put('/api/goals/:goalId/resume', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goalId } = req.params;
    await outcomeTrackingService.resumeGoal(goalId);
    res.json({ goalId, status: 'active' });
  } catch (error) {
    next(error);
  }
});

// ============ Learning Routes ============

/**
 * POST /api/learning/record
 * Record an outcome for learning
 */
router.post('/api/learning/record', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, predictionId, interventionId } = req.body;

    if (!businessId || !predictionId) {
      res.status(400).json({ error: 'businessId and predictionId are required' });
      return;
    }

    const outcome = await learningLoopService.recordOutcome(businessId, predictionId, interventionId);

    if (!outcome) {
      res.status(404).json({ error: 'No actual outcome found yet for this prediction' });
      return;
    }

    res.status(201).json(outcome);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/learning/stats
 * Get learning statistics
 */
router.get('/api/learning/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { outcomeType } = req.query;
    const stats = await learningLoopService.getStats(outcomeType as OutcomeType | undefined);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/learning/recommendations
 * Get model improvement recommendations
 */
router.get('/api/learning/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendations = await learningLoopService.getModelImprovementRecommendations();
    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/learning/curve/:outcomeType
 * Get learning curve data
 */
router.get('/api/learning/curve/:outcomeType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { outcomeType } = req.params;
    const { bins = '20' } = req.query;

    if (!Object.values(OutcomeType).includes(outcomeType as OutcomeType)) {
      res.status(400).json({
        error: 'Invalid outcomeType',
        validTypes: Object.values(OutcomeType),
      });
      return;
    }

    const curve = await learningLoopService.getLearningCurve(
      outcomeType as OutcomeType,
      parseInt(bins as string, 10)
    );

    res.json({ curve });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/learning/backfill
 * Backfill learning outcomes
 */
router.post('/api/learning/backfill', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.body;
    const result = await learningLoopService.backfillLearningOutcomes(businessId);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============ Ecosystem Integration Routes ============

/**
 * GET /api/ecosystem/insights/:businessId
 * Get merchant insights from ecosystem
 */
router.get('/api/ecosystem/insights/:businessId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId } = req.params;
    const insights = await ecosystemConnectors.getMerchantInsights(businessId);
    res.json(insights || { error: 'Unable to fetch insights' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ecosystem/analyze
 * Analyze with HOJAI AI
 */
router.post('/api/ecosystem/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessId, outcomeType, currentMetrics } = req.body;

    if (!businessId || !outcomeType) {
      res.status(400).json({ error: 'businessId and outcomeType are required' });
      return;
    }

    const analysis = await ecosystemConnectors.analyzeWithHojai(businessId, outcomeType, currentMetrics || {});
    res.json(analysis || { error: 'Unable to analyze' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ecosystem/status
 * Check ecosystem connection status
 */
router.get('/api/ecosystem/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await ecosystemConnectors.checkConnectionStatus();
    res.json(status);
  } catch (error) {
    next(error);
  }
});

export default router;