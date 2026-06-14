import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import dotenv from 'dotenv';

import { logger, httpLogger } from 'utils/logger.js';
import {
  registry,
  httpRequestsTotal,
  httpRequestDuration,
  metricsHandler
} from './utils/metrics';
import { internalServiceAuth, AuthenticatedRequest } from './middleware/auth';

import { bidService } from './services/bidService';
import { auctionService } from './services/auctionService';
import { dealService } from './services/dealService';
import { seatService } from './services/seatService';
import { statsService } from './services/statsService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4960;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode.toString()
    });

    httpRequestDuration.observe(
      { method: req.method, route },
      duration
    );

    httpLogger.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
      ip: req.ip
    });
  });

  next();
});

// Health check (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'openrtb-exchange-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      mongodb: mongoStatus,
      redis: 'unknown'
    }
  });
});

// Metrics endpoint (no auth required)
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', await registry.contentType);
    res.end(await metricsHandler());
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

// ============ BID ROUTES ============

// POST /api/bid - Accept bid request (OpenRTB 2.6)
app.post('/api/bid', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = bidService.validateBidRequest(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid bid request',
        details: validation.errors,
        warnings: validation.warnings
      });
    }

    if (validation.warnings.length > 0) {
      logger.warn('Bid request warnings', { warnings: validation.warnings });
    }

    const bidRequest = await bidService.createBidRequest(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        requestId: bidRequest.requestId,
        status: bidRequest.status,
        impCount: bidRequest.imp.length
      }
    });
  } catch (error) {
    logger.error('Failed to create bid request', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to create bid request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/bid/:id - Get bid request
app.get('/api/bid/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bidRequest = await bidService.getBidRequest(req.params.id);

    if (!bidRequest) {
      return res.status(404).json({
        error: 'Bid request not found',
        requestId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: bidRequest
    });
  } catch (error) {
    logger.error('Failed to get bid request', {
      requestId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to get bid request'
    });
  }
});

// POST /api/bid/:id/response - Create bid response
app.post('/api/bid/:id/response', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bidResponse = await bidService.createBidResponse({
      bidRequestId: req.params.id,
      ...req.body
    });

    res.status(201).json({
      status: 'success',
      data: {
        id: bidResponse.id,
        bidRequestId: bidResponse.bidRequestId,
        status: bidResponse.status,
        seatCount: bidResponse.seatbid.length
      }
    });
  } catch (error) {
    logger.error('Failed to create bid response', {
      requestId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to create bid response',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/bid/:id/responses - Get bid responses for request
app.get('/api/bid/:id/responses', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const responses = await bidService.getBidResponsesForRequest(req.params.id);

    res.json({
      status: 'success',
      data: {
        requestId: req.params.id,
        responseCount: responses.length,
        responses
      }
    });
  } catch (error) {
    logger.error('Failed to get bid responses', {
      requestId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to get bid responses'
    });
  }
});

// ============ AUCTION ROUTES ============

// POST /api/auction - Run auction
app.post('/api/auction', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bidRequestId, impId, auctionType, floorPrice, reservePrice, eligibleDeals } = req.body;

    if (!bidRequestId || !impId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['bidRequestId', 'impId']
      });
    }

    const result = await auctionService.runAuction({
      bidRequestId,
      impId,
      auctionType: auctionType || 'second_price',
      floorPrice,
      reservePrice,
      eligibleDeals
    });

    // Update bid request status
    await bidService.updateBidRequestStatus(bidRequestId, 'completed');

    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error('Failed to run auction', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to run auction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/auction/:id - Get auction result
app.get('/api/auction/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auction = await auctionService.getAuction(req.params.id);

    if (!auction) {
      return res.status(404).json({
        error: 'Auction not found',
        auctionId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: auction
    });
  } catch (error) {
    logger.error('Failed to get auction', {
      auctionId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to get auction'
    });
  }
});

// GET /api/auction/request/:bidRequestId - Get auctions for bid request
app.get('/api/auction/request/:bidRequestId', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const auctions = await auctionService.getAuctionsForRequest(req.params.bidRequestId);

    res.json({
      status: 'success',
      data: {
        bidRequestId: req.params.bidRequestId,
        auctionCount: auctions.length,
        auctions
      }
    });
  } catch (error) {
    logger.error('Failed to get auctions', {
      bidRequestId: req.params.bidRequestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to get auctions'
    });
  }
});

// ============ DEAL ROUTES ============

// POST /api/deals - Create deal
app.post('/api/deals', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deal = await dealService.createDeal(req.body);

    res.status(201).json({
      status: 'success',
      data: deal
    });
  } catch (error) {
    logger.error('Failed to create deal', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to create deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/deals - List deals
app.get('/api/deals', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      buyerId,
      sellerId,
      buyerSeatId,
      sellerSeatId,
      type,
      status,
      startTime,
      endTime,
      page,
      limit
    } = req.query;

    const result = await dealService.listDeals({
      buyerId: buyerId as string,
      sellerId: sellerId as string,
      buyerSeatId: buyerSeatId as string,
      sellerSeatId: sellerSeatId as string,
      type: type as 'private_auction' | 'preferred_deal' | 'fixed_price' | 'open_auction',
      status: status as 'active' | 'paused' | 'completed' | 'expired' | 'pending',
      startTime: startTime ? new Date(startTime as string) : undefined,
      endTime: endTime ? new Date(endTime as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error('Failed to list deals', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to list deals'
    });
  }
});

// GET /api/deals/:id - Get deal
app.get('/api/deals/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deal = await dealService.getDeal(req.params.id);

    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found',
        dealId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: deal
    });
  } catch (error) {
    logger.error('Failed to get deal', {
      dealId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to get deal'
    });
  }
});

// PATCH /api/deals/:id - Update deal
app.patch('/api/deals/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deal = await dealService.updateDeal(req.params.id, req.body);

    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found',
        dealId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: deal
    });
  } catch (error) {
    logger.error('Failed to update deal', {
      dealId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to update deal'
    });
  }
});

// POST /api/deals/:id/approve - Approve deal
app.post('/api/deals/:id/approve', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const approvedBy = req.serviceAuth?.serviceId || 'system';
    const deal = await dealService.approveDeal(req.params.id, approvedBy);

    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found or not pending',
        dealId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: deal
    });
  } catch (error) {
    logger.error('Failed to approve deal', {
      dealId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to approve deal'
    });
  }
});

// POST /api/deals/:id/pause - Pause deal
app.post('/api/deals/:id/pause', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deal = await dealService.pauseDeal(req.params.id);

    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found or not active',
        dealId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: deal
    });
  } catch (error) {
    logger.error('Failed to pause deal', {
      dealId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to pause deal'
    });
  }
});

// POST /api/deals/:id/resume - Resume deal
app.post('/api/deals/:id/resume', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deal = await dealService.resumeDeal(req.params.id);

    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found or not paused',
        dealId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: deal
    });
  } catch (error) {
    logger.error('Failed to resume deal', {
      dealId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to resume deal'
    });
  }
});

// ============ SEAT ROUTES ============

// POST /api/seats - Create seat
app.post('/api/seats', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const seat = await seatService.createSeat(req.body);

    res.status(201).json({
      status: 'success',
      data: seat
    });
  } catch (error) {
    logger.error('Failed to create seat', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to create seat',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/seats - List seats
app.get('/api/seats', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, status, company, page, limit } = req.query;

    const result = await seatService.listSeats({
      type: type as 'buyer' | 'seller' | 'both',
      status: status as 'active' | 'inactive' | 'suspended' | 'pending',
      company: company as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error('Failed to list seats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to list seats'
    });
  }
});

// GET /api/seats/:id - Get seat
app.get('/api/seats/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const seat = await seatService.getSeat(req.params.id);

    if (!seat) {
      return res.status(404).json({
        error: 'Seat not found',
        seatId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: seat
    });
  } catch (error) {
    logger.error('Failed to get seat', {
      seatId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to get seat'
    });
  }
});

// PATCH /api/seats/:id - Update seat
app.patch('/api/seats/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const seat = await seatService.updateSeat(req.params.id, req.body);

    if (!seat) {
      return res.status(404).json({
        error: 'Seat not found',
        seatId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: seat
    });
  } catch (error) {
    logger.error('Failed to update seat', {
      seatId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to update seat'
    });
  }
});

// POST /api/seats/:id/activate - Activate seat
app.post('/api/seats/:id/activate', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const approvedBy = req.serviceAuth?.serviceId || 'system';
    const seat = await seatService.activateSeat(req.params.id, approvedBy);

    if (!seat) {
      return res.status(404).json({
        error: 'Seat not found or not pending',
        seatId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: seat
    });
  } catch (error) {
    logger.error('Failed to activate seat', {
      seatId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to activate seat'
    });
  }
});

// POST /api/seats/:id/suspend - Suspend seat
app.post('/api/seats/:id/suspend', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const suspendedBy = req.serviceAuth?.serviceId || 'system';

    if (!reason) {
      return res.status(400).json({
        error: 'Suspension reason is required'
      });
    }

    const seat = await seatService.suspendSeat(req.params.id, suspendedBy, reason);

    if (!seat) {
      return res.status(404).json({
        error: 'Seat not found or not active',
        seatId: req.params.id
      });
    }

    res.json({
      status: 'success',
      data: seat
    });
  } catch (error) {
    logger.error('Failed to suspend seat', {
      seatId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to suspend seat'
    });
  }
});

// ============ STATS ROUTES ============

// GET /api/exchange/stats - Exchange statistics
app.get('/api/exchange/stats', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await statsService.getExchangeStats();

    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get exchange stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to get exchange statistics'
    });
  }
});

// GET /api/exchange/stats/bidders - Top bidders
app.get('/api/exchange/stats/bidders', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const topBidders = await statsService.getTopBidders(limit);

    res.json({
      status: 'success',
      data: topBidders
    });
  } catch (error) {
    logger.error('Failed to get top bidders', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to get top bidders'
    });
  }
});

// GET /api/exchange/stats/deals - Top deals
app.get('/api/exchange/stats/deals', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const topDeals = await statsService.getTopDeals(limit);

    res.json({
      status: 'success',
      data: topDeals
    });
  } catch (error) {
    logger.error('Failed to get top deals', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to get top deals'
    });
  }
});

// GET /api/exchange/stats/timeseries - Time series data
app.get('/api/exchange/stats/timeseries', internalServiceAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startTime, endTime, interval } = req.query;

    const start = startTime ? new Date(startTime as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endTime ? new Date(endTime as string) : new Date();
    const intervalType = (interval as 'hour' | 'day') || 'hour';

    const timeSeries = await statsService.getTimeSeriesData(start, end, intervalType);

    res.json({
      status: 'success',
      data: {
        startTime: start,
        endTime: end,
        interval: intervalType,
        dataPoints: timeSeries.length,
        data: timeSeries
      }
    });
  } catch (error) {
    logger.error('Failed to get time series data', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      error: 'Failed to get time series data'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/openrtb_exchange';

async function connectToMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Redis connection (optional)
let redisClient: ReturnType<typeof createClient> | null = null;

async function connectToRedis(): Promise<void> {
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });
    await redisClient.connect();
    logger.info('Connected to Redis', { url: REDIS_URL });
  } catch (error) {
    logger.warn('Redis connection failed - continuing without Redis', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    redisClient = null;
  }
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');

  try {
    if (redisClient) {
      await redisClient.quit();
    }
    await mongoose.connection.close();
    logger.info('Connections closed');
 process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function startServer(): Promise<void> {
  try {
    await connectToMongoDB();
    await connectToRedis();

    app.listen(PORT, () => {
      logger.info(`OpenRTB Exchange Service started`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        exchangeName: process.env.EXCHANGE_NAME || 'OpenRTB Exchange'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

startServer();

export default app;
