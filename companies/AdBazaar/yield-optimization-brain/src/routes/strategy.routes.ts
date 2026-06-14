import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { abTestingService } from '../services/index.js';
import {
  validate,
  abTestRequestSchema,
  yieldStrategySchema,
  requestId,
} from '../middleware/validation.js';
import { recordABTests, recordStrategies } from '../middleware/metrics.js';
import { YieldStrategy, ABTestResult } from '../types/index.js';
import logger from '../config/logger.js';

const router = Router();

// Apply request middleware
router.use(requestId);

/**
 * Create Strategy
 * POST /api/strategies
 */
router.post(
  '/api/strategies',
  validate(yieldStrategySchema),
  async (req: Request, res: Response) => {
    const requestId = req.requestId || uuidv4();

    try {
      logger.info('Create strategy request', { requestId, name: req.body.name });

      const strategy = await abTestingService.createStrategy({
        name: req.body.name,
        type: req.body.type,
        config: req.body.config || {},
        weights: req.body.weights || {
          revenue: 0.4,
          conversions: 0.3,
          ltv: 0.2,
          ctr: 0.05,
          brandSafety: 0.05,
        },
        status: req.body.status || 'active',
      });

      // Update metrics
      const strategies = await abTestingService.getStrategies('active');
      recordStrategies(strategies.length);

      res.status(201).json({
        success: true,
        data: strategy,
        meta: { timestamp: new Date().toISOString(), requestId },
      });
    } catch (error) {
      logger.error('Create strategy error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_STRATEGY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create strategy',
        },
      });
    }
  }
);

/**
 * Get All Strategies
 * GET /api/strategies
 */
router.get('/api/strategies', async (req: Request, res: Response) => {
  const requestId = req.requestId || uuidv4();
  const status = req.query.status as 'active' | 'paused' | 'archived' | undefined;

  try {
    const strategies = await abTestingService.getStrategies(status);

    res.status(200).json({
      success: true,
      data: strategies,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        count: strategies.length,
      },
    });
  } catch (error) {
    logger.error('Get strategies error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STRATEGIES_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get strategies',
      },
    });
  }
});

/**
 * Get Strategy by ID
 * GET /api/strategies/:id
 */
router.get('/api/strategies/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestId = req.requestId || uuidv4();

  try {
    const strategy = await abTestingService.getStrategy(id);

    if (!strategy) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Strategy not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: strategy,
      meta: { timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    logger.error('Get strategy error', {
      requestId,
      strategyId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STRATEGY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get strategy',
      },
    });
  }
});

/**
 * Update Strategy
 * PUT /api/strategies/:id
 */
router.put('/api/strategies/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestId = req.requestId || uuidv4();

  try {
    logger.info('Update strategy request', { requestId, strategyId: id });

    const strategy = await abTestingService.updateStrategy(id, req.body);

    if (!strategy) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Strategy not found',
        },
      });
      return;
    }

    // Update metrics
    const strategies = await abTestingService.getStrategies('active');
    recordStrategies(strategies.length);

    res.status(200).json({
      success: true,
      data: strategy,
      meta: { timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    logger.error('Update strategy error', {
      requestId,
      strategyId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_STRATEGY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update strategy',
      },
    });
  }
});

/**
 * Archive Strategy
 * DELETE /api/strategies/:id
 */
router.delete('/api/strategies/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestId = req.requestId || uuidv4();

  try {
    logger.info('Archive strategy request', { requestId, strategyId: id });

    const success = await abTestingService.archiveStrategy(id);

    if (!success) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Strategy not found',
        },
      });
      return;
    }

    // Update metrics
    const strategies = await abTestingService.getStrategies('active');
    recordStrategies(strategies.length);

    res.status(200).json({
      success: true,
      data: { archived: true },
      meta: { timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    logger.error('Archive strategy error', {
      requestId,
      strategyId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'ARCHIVE_STRATEGY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to archive strategy',
      },
    });
  }
});

/**
 * Create A/B Test
 * POST /api/tests
 */
router.post(
  '/api/tests',
  validate(abTestRequestSchema),
  async (req: Request, res: Response) => {
    const requestId = req.requestId || uuidv4();

    try {
      logger.info('Create A/B test request', { requestId, name: req.body.name });

      const test = await abTestingService.createTest({
        name: req.body.name,
        description: req.body.description,
        strategies: req.body.strategies,
        trafficAllocation: req.body.trafficAllocation,
        duration: req.body.duration,
        successMetrics: req.body.successMetrics || ['rpm', 'ctr', 'conversions'],
      });

      // Update metrics
      const tests = await abTestingService.getTests('running');
      recordABTests(tests.length);

      res.status(201).json({
        success: true,
        data: test,
        meta: { timestamp: new Date().toISOString(), requestId },
      });
    } catch (error) {
      logger.error('Create A/B test error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_TEST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create A/B test',
        },
      });
    }
  }
);

/**
 * Get All A/B Tests
 * GET /api/tests
 */
router.get('/api/tests', async (req: Request, res: Response) => {
  const requestId = req.requestId || uuidv4();
  const status = req.query.status as 'running' | 'completed' | 'paused' | undefined;

  try {
    const tests = await abTestingService.getTests(status);

    res.status(200).json({
      success: true,
      data: tests,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        count: tests.length,
      },
    });
  } catch (error) {
    logger.error('Get tests error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_TESTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get A/B tests',
      },
    });
  }
});

/**
 * Get A/B Test by ID
 * GET /api/tests/:id
 */
router.get('/api/tests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestId = req.requestId || uuidv4();

  try {
    const test = await abTestingService.getTest(id);

    if (!test) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'A/B test not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: test,
      meta: { timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    logger.error('Get test error', {
      requestId,
      testId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_TEST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get A/B test',
      },
    });
  }
});

/**
 * Update A/B Test Results
 * PUT /api/tests/:id/results
 */
router.put('/api/tests/:id/results', async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestId = req.requestId || uuidv4();

  try {
    logger.info('Update A/B test results', { requestId, testId: id });

    const test = await abTestingService.updateTestResults(id, req.body.strategies);

    if (!test) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'A/B test not found',
        },
      });
      return;
    }

    // Update metrics
    const tests = await abTestingService.getTests('running');
    recordABTests(tests.length);

    res.status(200).json({
      success: true,
      data: test,
      meta: { timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    logger.error('Update test results error', {
      requestId,
      testId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_TEST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update test results',
      },
    });
  }
});

/**
 * Pause A/B Test
 * POST /api/tests/:id/pause
 */
router.post('/api/tests/:id/pause', async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestId = req.requestId || uuidv4();

  try {
    logger.info('Pause A/B test', { requestId, testId: id });

    const test = await abTestingService.pauseTest(id);

    if (!test) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'A/B test not found',
        },
      });
      return;
    }

    // Update metrics
    const tests = await abTestingService.getTests('running');
    recordABTests(tests.length);

    res.status(200).json({
      success: true,
      data: test,
      meta: { timestamp: new Date().toISOString(), requestId },
    });
  } catch (error) {
    logger.error('Pause test error', {
      requestId,
      testId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'PAUSE_TEST_ERROR',
        message: error instanceof Error ? error.message : 'Failed to pause A/B test',
      },
    });
  }
});

export default router;