import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';

import { logger } from './utils/logger';
import { trackRequest, getMetrics, getContentType, setServiceHealth, recordTransaction } from './utils/metrics';
import { internalServiceAuth, errorHandler, notFoundHandler, AuthenticatedRequest } from './middleware';
import {
  poolService,
  allocationService,
  transactionService,
  spendService,
  transferService,
  Contribution,
} from './services';
import {
  createPoolSchema,
  updatePoolSchema,
  createAllocationSchema,
  updateAllocationSchema,
  contributeSchema,
  spendSchema,
  transferSchema,
  transactionQuerySchema,
  poolQuerySchema,
  allocationQuerySchema,
} from './utils/validation';

const app = express();
const PORT = process.env.PORT || 5013;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shared-budget-pool';

async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('MongoDB connected successfully', { uri: MONGO_URI });
    setServiceHealth('mongodb', true);
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    setServiceHealth('mongodb', false);
    throw error;
  }
}

// Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient: ReturnType<typeof createClient>;

async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => logger.error('Redis error', { error: err }));
    await redisClient.connect();
    logger.info('Redis connected successfully', { url: REDIS_URL });
    setServiceHealth('redis', true);
  } catch (error) {
    logger.error('Redis connection failed', { error });
    setServiceHealth('redis', false);
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request tracking
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    trackRequest(req.method, req.path, res.statusCode, duration / 1000);
  });

  next();
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient?.isOpen ? 'connected' : 'disconnected';

  res.json({
    success: true,
    service: 'shared-budget-pool',
    version: '1.0.0',
    port: PORT,
    health: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', getContentType());
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// ============ POOL ROUTES ============

// Create budget pool
app.post('/api/pools', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createPoolSchema.parse(req.body);
    const pool = await poolService.createPool(validated);

    res.status(201).json({
      success: true,
      data: pool,
      message: 'Budget pool created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get pool by ID
app.get('/api/pools/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pool = await poolService.getPoolById(req.params.id);

    if (!pool) {
      res.status(404).json({
        success: false,
        error: 'Budget pool not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: pool,
    });
  } catch (error) {
    next(error);
  }
});

// List pools
app.get('/api/pools', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = poolQuerySchema.parse(req.query);
    const result = await poolService.listPools({
      organizationId: validated.organizationId,
      status: validated.status,
      limit: validated.limit,
      skip: validated.skip,
    });

    res.json({
      success: true,
      data: result.pools,
      pagination: {
        total: result.total,
        limit: validated.limit,
        skip: validated.skip,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update pool
app.put('/api/pools/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = updatePoolSchema.parse(req.body);
    const pool = await poolService.updatePool(req.params.id, validated);

    res.json({
      success: true,
      data: pool,
      message: 'Budget pool updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Delete pool
app.delete('/api/pools/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await poolService.deletePool(req.params.id);

    res.json({
      success: true,
      message: 'Budget pool deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============ ALLOCATION ROUTES ============

// Allocate budget to campaign
app.post('/api/pools/:id/allocate', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createAllocationSchema.parse(req.body);
    const allocation = await allocationService.createAllocation({
      poolId: req.params.id,
      ...validated,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    });

    const pool = await poolService.getPoolById(req.params.id);
    if (pool) {
      recordTransaction(pool._id.toString(), 'allocation', validated.amount, pool.currency);
    }

    res.status(201).json({
      success: true,
      data: allocation,
      message: 'Budget allocated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get allocations for pool
app.get('/api/pools/:id/allocations', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = allocationQuerySchema.parse(req.query);
    const result = await allocationService.getPoolAllocations(req.params.id, {
      status: validated.status,
      limit: validated.limit,
      skip: validated.skip,
    });

    res.json({
      success: true,
      data: result.allocations,
      pagination: {
        total: result.total,
        limit: validated.limit,
        skip: validated.skip,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update allocation
app.put('/api/allocations/:id', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = updateAllocationSchema.parse(req.body);
    const allocation = await allocationService.updateAllocation(req.params.id, {
      ...validated,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
    });

    res.json({
      success: true,
      data: allocation,
      message: 'Allocation updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============ CONTRIBUTION ROUTES ============

// Contribute to pool
app.post('/api/pools/:id/contribute', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = contributeSchema.parse(req.body);

    const contribution = new Contribution({
      poolId: req.params.id,
      source: validated.source,
      sourceType: validated.sourceType,
      amount: validated.amount,
      currency: validated.currency || 'INR',
      status: 'completed',
      reference: validated.reference,
      description: validated.description,
      metadata: validated.metadata,
      processedAt: new Date(),
      timestamp: new Date(),
    });

    await contribution.save();

    await poolService.updateBalance(req.params.id, validated.amount, 'add');

    await transactionService.recordTransaction({
      poolId: req.params.id,
      type: 'contribution',
      amount: validated.amount,
      reference: `CONTRIB-${contribution._id}`,
      referenceType: 'manual',
      description: validated.description || `Contribution from ${validated.source}`,
      metadata: { contributionId: contribution._id.toString() },
    });

    const pool = await poolService.getPoolById(req.params.id);
    if (pool) {
      recordTransaction(pool._id.toString(), 'contribution', validated.amount, pool.currency);
    }

    res.status(201).json({
      success: true,
      data: contribution,
      message: 'Contribution recorded successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============ BALANCE ROUTES ============

// Get current balance
app.get('/api/pools/:id/balance', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const pool = await poolService.getPoolByIdOrThrow(req.params.id);

    res.json({
      success: true,
      data: {
        poolId: pool._id,
        totalBudget: pool.totalBudget,
        currentBalance: pool.currentBalance,
        reservedAmount: pool.reservedAmount,
        availableBalance: pool.currentBalance - pool.reservedAmount,
        currency: pool.currency,
        utilizationPercent: pool.totalBudget > 0 ? ((pool.totalBudget - pool.currentBalance) / pool.totalBudget) * 100 : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============ TRANSACTION ROUTES ============

// Get transactions
app.get('/api/pools/:id/transactions', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = transactionQuerySchema.parse(req.query);
    const result = await transactionService.getPoolTransactions(req.params.id, {
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
      endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      type: validated.type,
      limit: validated.limit,
      skip: validated.skip,
    });

    res.json({
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        limit: validated.limit,
        skip: validated.skip,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction summary
app.get('/api/pools/:id/transactions/summary', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await transactionService.getTransactionSummary(
      req.params.id,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

// ============ SPEND ROUTES ============

// Record spend
app.post('/api/pools/:id/spend', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = spendSchema.parse(req.body);
    const result = await spendService.recordSpend({
      poolId: req.params.id,
      ...validated,
    });

    const pool = await poolService.getPoolById(req.params.id);
    if (pool) {
      recordTransaction(pool._id.toString(), 'spend', validated.amount, pool.currency);
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'Spend recorded successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get spend analytics
app.get('/api/pools/:id/analytics', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const poolAnalytics = await poolService.getPoolAnalytics(req.params.id);
    const { startDate, endDate } = req.query;
    const spendAnalytics = await spendService.getSpendAnalytics(
      req.params.id,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    const healthCheck = await spendService.checkAllocationHealth(req.params.id);

    res.json({
      success: true,
      data: {
        pool: poolAnalytics,
        spend: spendAnalytics,
        health: healthCheck,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Refund spend
app.post('/api/pools/:id/refund', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { transactionId, amount } = req.body;
    const result = await spendService.refundSpend(transactionId, amount);

    res.json({
      success: true,
      data: result,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============ TRANSFER ROUTES ============

// Transfer between pools
app.post('/api/pools/:id/transfer', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = transferSchema.parse(req.body);
    const result = await transferService.transferBetweenPools({
      fromPoolId: req.params.id,
      toPoolId: validated.toPoolId,
      amount: validated.amount,
      reference: validated.reference,
      description: validated.description,
      metadata: validated.metadata,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Transfer completed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get transfer history
app.get('/api/pools/:id/transfers', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { limit, skip } = req.query;
    const result = await transferService.getTransferHistory(req.params.id, {
      limit: limit ? parseInt(limit as string) : 50,
      skip: skip ? parseInt(skip as string) : 0,
    });

    res.json({
      success: true,
      data: result.transfers,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 50,
        skip: skip ? parseInt(skip as string) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Validate transfer
app.post('/api/pools/:id/transfer/validate', internalServiceAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { toPoolId, amount } = req.body;
    const result = await transferService.validateTransfer({
      fromPoolId: req.params.id,
      toPoolId,
      amount,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
  try {
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
      logger.info(`Shared Budget Pool service started`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
      });
      setServiceHealth('service', true);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  setServiceHealth('service', false);

  if (redisClient) {
    await redisClient.quit();
  }

  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  setServiceHealth('service', false);

  if (redisClient) {
    await redisClient.quit();
  }

  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;