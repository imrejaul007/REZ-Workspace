import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  yieldDecisionService,
  floorPriceService,
  bidLandscapeService,
  revenueAttributionService,
  predictiveYieldService,
  abTestingService,
} from '../services/index.js';
import {
  validate,
  yieldDecisionSchema,
  floorPriceRequestSchema,
  bidLandscapeRequestSchema,
  revenueAttributionRequestSchema,
  yieldPredictionRequestSchema,
  requestId,
  requestTiming,
} from '../middleware/validation.js';
import { recordDecisionMetrics, recordFloorPrice } from '../middleware/metrics.js';
import {
  YieldDecisionRequest,
  FloorPriceRequest,
  BidLandscapeRequest,
  RevenueAttributionRequest,
  YieldPredictionRequest,
  YieldDecision,
  FloorPriceResponse,
  BidLandscapeResponse,
  RevenueAttributionResponse,
  YieldPrediction,
  YieldStrategy,
  ABTestResult,
} from '../types/index.js';
import logger from '../config/logger.js';

const router = Router();

// Apply request middleware
router.use(requestId);
router.use(requestTiming);

/**
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  const uptime = process.uptime();

  res.json({
    status: 'ok',
    service: 'yield-optimization-brain',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
  });
});

/**
 * Yield Decision Endpoint
 * POST /api/yield/decide
 */
router.post(
  '/api/yield/decide',
  validate(yieldDecisionSchema),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    const requestId = req.requestId || uuidv4();

    try {
      logger.info('Yield decision request', {
        requestId,
        inventoryId: req.body.inventorySlot.id,
        eligibleAdsCount: req.body.eligibleAds.length,
      });

      const decision = await yieldDecisionService.makeDecision(req.body as YieldDecisionRequest);

      // Record metrics
      recordDecisionMetrics(
        decision.metadata.optimizationGoal,
        decision.selectedAd ? 'success' : 'no_ad',
        decision.expectedRevenue,
        decision.confidence
      );

      const processingTimeMs = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: decision,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTimeMs,
        },
      });
    } catch (error) {
      logger.error('Yield decision error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'DECISION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to make yield decision',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTimeMs: Date.now() - startTime,
        },
      });
    }
  }
);

/**
 * Get Floor Price
 * GET /api/yield/floor/:inventoryId
 */
router.get(
  '/api/yield/floor/:inventoryId',
  async (req: Request, res: Response) => {
    const { inventoryId } = req.params;
    const requestId = req.requestId || uuidv4();

    try {
      logger.info('Floor price request', { requestId, inventoryId });

      const floorPriceRequest: FloorPriceRequest = {
        inventoryId,
        context: req.query.context ? JSON.parse(req.query.context as string) : undefined,
        eligibleBidderCount: req.query.eligibleBidderCount
          ? parseInt(req.query.eligibleBidderCount as string, 10)
          : undefined,
      };

      const result = await floorPriceService.calculateFloorPrice(floorPriceRequest);

      // Record metrics
      recordFloorPrice('all', result.floorPrice);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Floor price error', {
        requestId,
        inventoryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'FLOOR_PRICE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate floor price',
        },
      });
    }
  }
);

/**
 * Get Bid Landscape
 * GET /api/yield/landscape
 */
router.get(
  '/api/yield/landscape',
  async (req: Request, res: Response) => {
    const requestId = req.requestId || uuidv4();

    try {
      logger.info('Bid landscape request', { requestId });

      const bidLandscapeRequest: BidLandscapeRequest = {
        inventoryType: req.query.inventoryType as string,
        context: req.query.context as string,
        timeRange: (req.query.timeRange as '1h' | '24h' | '7d' | '30d') || '24h',
      };

      const result = await bidLandscapeService.analyzeBidLandscape(bidLandscapeRequest);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Bid landscape error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'LANDSCAPE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze bid landscape',
        },
      });
    }
  }
);

/**
 * Get Revenue Attribution
 * GET /api/yield/attribution
 */
router.get(
  '/api/yield/attribution',
  async (req: Request, res: Response) => {
    const requestId = req.requestId || uuidv4();

    try {
      logger.info('Revenue attribution request', { requestId });

      const attributionRequest: RevenueAttributionRequest = {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string),
        granularity: (req.query.granularity as 'hour' | 'day' | 'week' | 'month') || 'day',
        groupBy: (req.query.groupBy as 'ad' | 'advertiser' | 'placement' | 'format' | 'segment') || 'advertiser',
        filters: req.query.filters ? JSON.parse(req.query.filters as string) : undefined,
      };

      const result = await revenueAttributionService.attributeRevenue(attributionRequest);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Revenue attribution error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'ATTRIBUTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to attribute revenue',
        },
      });
    }
  }
);

/**
 * Get Yield Prediction
 * GET /api/yield/predict
 */
router.get(
  '/api/yield/predict',
  async (req: Request, res: Response) => {
    const requestId = req.requestId || uuidv4();

    try {
      logger.info('Yield prediction request', { requestId });

      const predictionRequest: YieldPredictionRequest = {
        horizon: (req.query.horizon as '1h' | '6h' | '24h' | '7d') || '24h',
        inventoryType: req.query.inventoryType as string,
        context: req.query.context as string,
      };

      const result = await predictiveYieldService.predictYield(predictionRequest);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Yield prediction error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'PREDICTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to predict yield',
        },
      });
    }
  }
);

/**
 * Get Decision History
 * GET /api/yield/history
 */
router.get('/api/yield/history', async (req: Request, res: Response) => {
  const requestId = req.requestId || uuidv4();

  try {
    const inventoryId = req.query.inventoryId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const limit = parseInt(req.query.limit as string, 10) || 100;

    const history = await yieldDecisionService.getDecisionHistory(inventoryId, startDate, endDate, limit);

    res.status(200).json({
      success: true,
      data: history,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        count: history.length,
      },
    });
  } catch (error) {
    logger.error('Decision history error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'HISTORY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get decision history',
      },
    });
  }
});

/**
 * Get Floor Price History
 * GET /api/yield/floor/:inventoryId/history
 */
router.get('/api/yield/floor/:inventoryId/history', async (req: Request, res: Response) => {
  const { inventoryId } = req.params;
  const requestId = req.requestId || uuidv4();

  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const limit = parseInt(req.query.limit as string, 10) || 100;

    const history = await floorPriceService.getFloorPriceHistory(inventoryId, startDate, endDate, limit);

    res.status(200).json({
      success: true,
      data: history,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        count: history.length,
      },
    });
  } catch (error) {
    logger.error('Floor price history error', {
      requestId,
      inventoryId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FLOOR_HISTORY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get floor price history',
      },
    });
  }
});

export default router;