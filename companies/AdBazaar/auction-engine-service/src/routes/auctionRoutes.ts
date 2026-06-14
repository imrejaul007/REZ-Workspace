import { Router, Request, Response, NextFunction } from 'express';
import { firstPriceService, secondPriceService, vickreyService, weightedService, analyticsService } from '../services';
import { validateBody } from '../middleware';
import {
  FirstPriceAuctionRequestSchema,
  SecondPriceAuctionRequestSchema,
  VickreyAuctionRequestSchema,
  WeightedAuctionRequestSchema,
  AuctionHistoryQuerySchema,
  SimulateAuctionRequestSchema,
} from '../types';
import logger from 'utils/logger.js';

const router = Router();

/**
 * POST /api/auction/first-price
 * Execute a first-price auction
 */
router.post('/first-price',
  validateBody(FirstPriceAuctionRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await firstPriceService.execute(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('First-price auction endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' });
      next(error);
    }
  }
);

/**
 * POST /api/auction/second-price
 * Execute a second-price auction
 */
router.post('/second-price',
  validateBody(SecondPriceAuctionRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await secondPriceService.execute(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Second-price auction endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' });
      next(error);
    }
  }
);

/**
 * POST /api/auction/vickrey
 * Execute a Vickrey (sealed-bid second-price) auction
 */
router.post('/vickrey',
  validateBody(VickreyAuctionRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await vickreyService.execute(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Vickrey auction endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' });
      next(error);
    }
  }
);

/**
 * POST /api/auction/weighted
 * Execute a weighted auction (price * quality score)
 */
router.post('/weighted',
  validateBody(WeightedAuctionRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await weightedService.execute(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Weighted auction endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' });
      next(error);
    }
  }
);

/**
 * GET /api/auction/history
 * Get auction history with filtering and pagination
 */
router.get('/history',
  validateBody(AuctionHistoryQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.body;
      const result = await analyticsService.getHistory({
        startDate: query.startDate,
        endDate: query.endDate,
        auctionType: query.auctionType,
        seatId: query.seatId,
        limit: query.limit,
        offset: query.offset,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Auction history endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' });
      next(error);
    }
  }
);

/**
 * GET /api/auction/stats
 * Get auction statistics
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await analyticsService.getStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Auction stats endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' });
    next(error);
  }
});

/**
 * GET /api/auction/distribution/:type
 * Get price distribution for an auction type
 */
router.get('/distribution/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    const distribution = await analyticsService.getPriceDistribution(type as any);
    res.json({ success: true, data: distribution });
  } catch (error) {
    logger.error('Price distribution endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' });
    next(error);
  }
});

/**
 * GET /api/auction/bidder/:seatId
 * Get bidder performance metrics
 */
router.get('/bidder/:seatId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { seatId } = req.params;
    const { days } = req.query;
    const performance = await analyticsService.getBidderPerformance(
      seatId,
      days ? parseInt(days as string) : 30
    );
    res.json({ success: true, data: performance });
  } catch (error) {
    logger.error('Bidder performance endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' });
    next(error);
  }
});

/**
 * POST /api/auction/simulate
 * Simulate auction outcomes (Monte Carlo)
 */
router.post('/simulate',
  validateBody(SimulateAuctionRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bids, simulations } = req.body;
      const result = await analyticsService.simulateAuction(bids, simulations);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Auction simulate endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' });
      next(error);
    }
  }
);

/**
 * GET /api/auction/:id
 * Get a specific auction by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const auction = await analyticsService.getAuctionById(id);

    if (!auction) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AUCTION_NOT_FOUND',
          message: `Auction with ID ${id} not found`,
        },
      });
      return;
    }

    res.json({ success: true, data: auction });
  } catch (error) {
    logger.error('Get auction endpoint error', { error: error instanceof Error ? error.message : 'Unknown error' });
    next(error);
  }
});

export default router;
