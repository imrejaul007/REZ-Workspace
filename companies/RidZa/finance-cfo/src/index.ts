/**
 * HOJAI Finance CFO AI
 * Cashflow forecasting, burn rate, runway analysis
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

import config from './config';
import cfoAnalysis from './services/cfoAnalysis';
import { authenticate, validateTenantAccess, AuthenticatedRequest } from './middleware/auth';
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateParams,
} from './middleware/errorHandler';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    statusCode: 429,
    timestamp: new Date().toISOString(),
  },
});
app.use(limiter);

// Request logging
app.use((req: Request, _res: Response, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Health check endpoints (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'finance-cfo',
    version: config.service.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'ready',
      mongodb: mongoStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: 'Database connection check failed',
    });
  }
});

// Protected routes - require authentication
app.use('/api', authenticate);

// ============ CFO Analysis Endpoints ============

/**
 * GET /api/cashflow/:tenantId
 * Get cashflow analysis for a tenant
 */
app.get(
  '/api/cashflow/:tenantId',
  validateParams(['tenantId']),
  validateTenantAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId } = req.params;
    const months = parseInt(req.query.months as string, 10) || 3;

    const analysis = await cfoAnalysis.analyzeCashflow(tenantId, months);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/runway/:tenantId
 * Calculate runway (months until cash depletes)
 */
app.get(
  '/api/runway/:tenantId',
  validateParams(['tenantId']),
  validateTenantAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId } = req.params;

    const analysis = await cfoAnalysis.calculateRunway(tenantId);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/burnrate/:tenantId
 * Get burn rate analysis
 */
app.get(
  '/api/burnrate/:tenantId',
  validateParams(['tenantId']),
  validateTenantAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId } = req.params;
    const lookbackMonths = parseInt(req.query.lookback as string, 10) || 6;

    const analysis = await cfoAnalysis.calculateBurnRate(tenantId, lookbackMonths);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/alerts/:tenantId
 * Get financial alerts for a tenant
 */
app.get(
  '/api/alerts/:tenantId',
  validateParams(['tenantId']),
  validateTenantAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId } = req.params;

    const analysis = await cfoAnalysis.generateAlerts(tenantId);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/dashboard/:tenantId
 * Get complete CFO dashboard data
 */
app.get(
  '/api/dashboard/:tenantId',
  validateParams(['tenantId']),
  validateTenantAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId } = req.params;

    const [cashflow, burnRate, runway, alerts] = await Promise.all([
      cfoAnalysis.analyzeCashflow(tenantId, 3),
      cfoAnalysis.calculateBurnRate(tenantId, 6),
      cfoAnalysis.calculateRunway(tenantId),
      cfoAnalysis.generateAlerts(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        cashflow,
        burnRate,
        runway,
        alerts,
        summary: {
          overallStatus: runway.runwayStatus,
          criticalAlerts: alerts.summary.critical,
          monthlyBurn: burnRate.averageMonthlyBurn,
          monthsOfRunway: runway.monthsRemaining,
        },
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/transactions/:tenantId
 * Add a transaction to tenant's financial data
 */
app.post(
  '/api/transactions/:tenantId',
  validateParams(['tenantId']),
  validateTenantAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId } = req.params;
    const { date, type, category, amount, description, reference, status } = req.body;

    if (!date || !type || !category || amount === undefined || !description) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Missing required fields: date, type, category, amount, description',
      });
      return;
    }

    const transaction = {
      date: new Date(date),
      type: type as 'revenue' | 'expense' | 'investment' | 'financing',
      category,
      amount: parseFloat(amount),
      description,
      reference,
      status: status || 'completed',
    };

    const result = await cfoAnalysis.addTransaction(tenantId, transaction);

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: {
        transactionCount: result.transactions.length,
        lastUpdated: result.lastUpdated,
      },
    });
  })
);

/**
 * PUT /api/financials/:tenantId
 * Update tenant's financial data
 */
app.put(
  '/api/financials/:tenantId',
  validateParams(['tenantId']),
  validateTenantAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { tenantId } = req.params;
    const { currentCash, monthlyRevenue, monthlyExpenses, metadata } = req.body;

    const updateData: Record<string, unknown> = {};
    if (currentCash !== undefined) updateData.currentCash = parseFloat(currentCash);
    if (monthlyRevenue !== undefined) updateData.monthlyRevenue = parseFloat(monthlyRevenue);
    if (monthlyExpenses !== undefined) updateData.monthlyExpenses = parseFloat(monthlyExpenses);
    if (metadata) updateData.metadata = metadata;

    const result = await cfoAnalysis.upsertFinancialData(tenantId, updateData as Parameters<typeof cfoAnalysis.upsertFinancialData>[1]);

    res.json({
      success: true,
      message: 'Financial data updated successfully',
      data: {
        tenantId: result.tenantId,
        currentCash: result.currentCash,
        monthlyRevenue: result.monthlyRevenue,
        monthlyExpenses: result.monthlyExpenses,
        lastUpdated: result.lastUpdated,
      },
    });
  })
);

// ============ Error Handling ============

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============ Database Connection ============

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    throw error;
  }
}

// ============ Server Start ============

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      logger.info(`Finance CFO service running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
