/**
 * Finance Payables - Bills, payments, vendor management
 * Port: 3000 (configurable via PORT env)
 */
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './config';
import { authenticate, tenantIsolation } from './middleware/auth';
import { validateBody, validateQuery, validateParams } from './middleware/validation';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import {
  createVendorSchema,
  updateVendorSchema,
  vendorQuerySchema,
  vendorIdParamsSchema,
  createBillSchema,
  updateBillSchema,
  billQuerySchema,
  billIdParamsSchema,
  processPaymentSchema,
  scheduleQuerySchema,
  scheduleParamsSchema,
} from './validators';
import { vendorService, billService, scheduleService } from './services/payablesService';

// Initialize Express app
const app = express();

// ============ SECURITY MIDDLEWARE ============

// Helmet for security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env['CORS_ORIGIN'] ?? '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Internal-Token'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later',
  },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============ HEALTH ENDPOINTS ============

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'finance-payables',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ status: 'not ready', reason: 'MongoDB not connected' });
      return;
    }
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: 'Health check failed' });
  }
});

// ============ VENDOR ENDPOINTS ============

// Create vendor
app.post(
  '/api/vendors',
  authenticate,
  validateBody(createVendorSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await vendorService.createVendor(req.body);
      res.status(201).json({
        success: true,
        data: vendor,
        message: 'Vendor created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// List vendors
app.get(
  '/api/vendors/:tenantId',
  authenticate,
  tenantIsolation,
  validateParams(vendorIdParamsSchema),
  validateQuery(vendorQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const result = await vendorService.listVendors(tenantId, req.query as Parameters<typeof vendorService.listVendors>[1]);
      res.json({
        success: true,
        data: result.vendors,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get vendor
app.get(
  '/api/vendors/:tenantId/:vendorId',
  authenticate,
  tenantIsolation,
  validateParams(vendorIdParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, vendorId } = req.params;
      const vendor = await vendorService.getVendor(tenantId, vendorId);
      res.json({
        success: true,
        data: vendor,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update vendor
app.put(
  '/api/vendors/:tenantId/:vendorId',
  authenticate,
  tenantIsolation,
  validateParams(vendorIdParamsSchema),
  validateBody(updateVendorSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, vendorId } = req.params;
      const vendor = await vendorService.updateVendor(tenantId, vendorId, req.body);
      res.json({
        success: true,
        data: vendor,
        message: 'Vendor updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete vendor
app.delete(
  '/api/vendors/:tenantId/:vendorId',
  authenticate,
  tenantIsolation,
  validateParams(vendorIdParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, vendorId } = req.params;
      await vendorService.deleteVendor(tenantId, vendorId);
      res.json({
        success: true,
        message: 'Vendor deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============ BILL ENDPOINTS ============

// Create bill
app.post(
  '/api/bills',
  authenticate,
  validateBody(createBillSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bill = await billService.createBill(req.body);
      res.status(201).json({
        success: true,
        data: bill,
        message: 'Bill created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// List bills
app.get(
  '/api/bills/:tenantId',
  authenticate,
  tenantIsolation,
  validateParams(billIdParamsSchema),
  validateQuery(billQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const result = await billService.listBills(tenantId, req.query as Parameters<typeof billService.listBills>[1]);
      res.json({
        success: true,
        data: result.bills,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
        summary: result.summary,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get bill
app.get(
  '/api/bills/:tenantId/:billId',
  authenticate,
  tenantIsolation,
  validateParams(billIdParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, billId } = req.params;
      const bill = await billService.getBill(tenantId, billId);
      res.json({
        success: true,
        data: bill,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update bill
app.put(
  '/api/bills/:tenantId/:billId',
  authenticate,
  tenantIsolation,
  validateParams(billIdParamsSchema),
  validateBody(updateBillSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, billId } = req.params;
      const bill = await billService.updateBill(tenantId, billId, req.body);
      res.json({
        success: true,
        data: bill,
        message: 'Bill updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Process payment for bill
app.post(
  '/api/bills/:tenantId/:billId/pay',
  authenticate,
  tenantIsolation,
  validateParams(billIdParamsSchema),
  validateBody(processPaymentSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, billId } = req.params;
      const userId = req.user?.userId ?? 'unknown';
      const bill = await billService.processBillPayment(tenantId, billId, userId, req.body);
      res.json({
        success: true,
        data: bill,
        message: 'Payment processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============ SCHEDULE ENDPOINTS ============

// Get payment schedule
app.get(
  '/api/schedule/:tenantId',
  authenticate,
  tenantIsolation,
  validateParams(scheduleParamsSchema),
  validateQuery(scheduleQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const schedule = await scheduleService.getPaymentSchedule(
        tenantId,
        req.query as Parameters<typeof scheduleService.getPaymentSchedule>[1]
      );
      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============ ERROR HANDLING ============

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============ DATABASE CONNECTION & SERVER START ============

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');

    // Create indexes
    console.log('Ensuring indexes...');
    await Promise.all([
      mongoose.connection.collection('vendors').createIndex(
        { tenantId: 1, vendorId: 1 },
        { unique: true }
      ),
      mongoose.connection.collection('vendors').createIndex({ tenantId: 1, status: 1 }),
      mongoose.connection.collection('bills').createIndex(
        { tenantId: 1, billId: 1 },
        { unique: true }
      ),
      mongoose.connection.collection('bills').createIndex({ tenantId: 1, status: 1 }),
      mongoose.connection.collection('bills').createIndex({ tenantId: 1, dueDate: 1 }),
    ]);
    console.log('Indexes ensured');

    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log(`Finance Payables service running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;