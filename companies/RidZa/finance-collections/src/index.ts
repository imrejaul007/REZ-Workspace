/**
 * Finance Collections - AI Collections Manager
 * Receivables, follow-ups, payment reminders
 *
 * Port: 3000 (configurable via PORT env)
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import appConfig from './config';
import { Receivable, FollowUp, PaymentChannel, IReceivable } from './models/Receivable';
import { authMiddleware, apiKeyMiddleware, AuthenticatedRequest } from './middleware/auth';
import {
  validateRequest,
  createReceivableSchema,
  updateReceivableSchema,
  createFollowUpSchema,
  recordPaymentSchema,
} from './middleware/validation';
import {
  calculateAgingReport,
  getDueForFollowUp,
  generateReminderMessage,
  scheduleFollowUp,
  getFollowUpHistory,
  generateBatchReminders,
  recordPayment as recordPaymentService,
} from './services/collections';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging in development
if (appConfig.isDevelopment) {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoints (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'finance-collections',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      res.json({ status: 'ready', database: 'connected' });
    } else {
      res.status(503).json({ status: 'not ready', database: 'disconnected' });
    }
  } catch (error) {
    res.status(503).json({ status: 'error', message: 'Health check failed' });
  }
});

// API routes - protected by auth middleware
const apiRouter = express.Router();

// Apply authentication to all API routes
apiRouter.use(authMiddleware);

// === Receivables CRUD ===

// Create a new receivable
apiRouter.post(
  '/receivables',
  validateRequest(createReceivableSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { customerId, customerName, customerEmail, customerPhone, invoiceNumber, amount, currency, dueDate, issueDate, notes, metadata } = req.body;

      const receivable = new Receivable({
        receivableId: `RCV-${uuidv4()}`,
        tenantId: req.tenantId,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        invoiceNumber,
        amount,
        currency,
        dueDate: new Date(dueDate),
        issueDate: new Date(issueDate),
        notes,
        metadata,
        status: 'pending',
        paidAmount: 0,
        followUpCount: 0,
      });

      await receivable.save();

      res.status(201).json({
        success: true,
        data: receivable,
      });
    } catch (error) {
      console.error('Error creating receivable:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create receivable',
      });
    }
  }
);

// Get all receivables for tenant
apiRouter.get(
  '/receivables',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { status, limit = 100, offset = 0 } = req.query;

      const filter: Record<string, unknown> = { tenantId: req.tenantId };
      if (status) {
        filter.status = status;
      }

      const receivables = await Receivable.find(filter)
        .sort({ dueDate: 1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .lean();

      const total = await Receivable.countDocuments(filter);

      res.json({
        success: true,
        data: receivables,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error) {
      console.error('Error fetching receivables:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch receivables',
      });
    }
  }
);

// Get single receivable
apiRouter.get(
  '/receivables/:receivableId',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const receivable = await Receivable.findOne({
        receivableId: req.params.receivableId,
        tenantId: req.tenantId,
      }).lean();

      if (!receivable) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Receivable not found',
        });
        return;
      }

      res.json({
        success: true,
        data: receivable,
      });
    } catch (error) {
      console.error('Error fetching receivable:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch receivable',
      });
    }
  }
);

// Update receivable
apiRouter.patch(
  '/receivables/:receivableId',
  validateRequest(updateReceivableSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { customerName, customerEmail, customerPhone, amount, dueDate, status, notes } = req.body;

      const updateData: Record<string, unknown> = {};
      if (customerName !== undefined) updateData.customerName = customerName;
      if (customerEmail !== undefined) updateData.customerEmail = customerEmail === '' ? undefined : customerEmail;
      if (customerPhone !== undefined) updateData.customerPhone = customerPhone === '' ? undefined : customerPhone;
      if (amount !== undefined) updateData.amount = amount;
      if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const receivable = await Receivable.findOneAndUpdate(
        { receivableId: req.params.receivableId, tenantId: req.tenantId },
        { $set: updateData },
        { new: true }
      ).lean();

      if (!receivable) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Receivable not found',
        });
        return;
      }

      res.json({
        success: true,
        data: receivable,
      });
    } catch (error) {
      console.error('Error updating receivable:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update receivable',
      });
    }
  }
);

// Delete receivable
apiRouter.delete(
  '/receivables/:receivableId',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await Receivable.deleteOne({
        receivableId: req.params.receivableId,
        tenantId: req.tenantId,
      });

      if (result.deletedCount === 0) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Receivable not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Receivable deleted',
      });
    } catch (error) {
      console.error('Error deleting receivable:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete receivable',
      });
    }
  }
);

// === AR Aging Analysis ===

// Get aging report for tenant
apiRouter.get(
  '/aging/:tenantId',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate tenant access (can only view own tenant)
      if (req.params.tenantId !== req.tenantId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot access other tenant data',
        });
        return;
      }

      const agingReport = await calculateAgingReport(req.params.tenantId);

      res.json({
        success: true,
        data: agingReport,
      });
    } catch (error) {
      console.error('Error calculating aging report:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to calculate aging report',
      });
    }
  }
);

// === Follow-up Management ===

// Schedule a follow-up
apiRouter.post(
  '/follow-up',
  validateRequest(createFollowUpSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { receivableId, channel, message, scheduledDate } = req.body;

      // Verify receivable belongs to tenant
      const receivable = await Receivable.findOne({
        receivableId,
        tenantId: req.tenantId,
      });

      if (!receivable) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Receivable not found',
        });
        return;
      }

      const followUp = await scheduleFollowUp(
        req.tenantId!,
        receivableId,
        channel,
        message,
        scheduledDate ? new Date(scheduledDate) : undefined
      );

      res.status(201).json({
        success: true,
        data: {
          followUpId: followUp.followUpId,
          receivableId: followUp.receivableId,
          channel: followUp.channel,
          scheduledDate: followUp.scheduledDate,
          status: followUp.status,
        },
      });
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      const message = error instanceof Error ? error.message : 'Failed to schedule follow-up';
      res.status(500).json({
        error: 'Internal Server Error',
        message,
      });
    }
  }
);

// Get follow-up history for a receivable
apiRouter.get(
  '/follow-up/:receivableId',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const followUps = await getFollowUpHistory(req.params.receivableId);

      res.json({
        success: true,
        data: followUps,
      });
    } catch (error) {
      console.error('Error fetching follow-up history:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch follow-up history',
      });
    }
  }
);

// Get receivables due for follow-up
apiRouter.get(
  '/follow-up/due',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const dueReceivables = await getDueForFollowUp(req.tenantId!);

      const reminders = dueReceivables.map((r) => {
        const daysOverdue = Math.floor((Date.now() - r.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          receivableId: r.receivableId,
          customerName: r.customerName,
          customerContact: r.customerEmail || r.customerPhone,
          message: generateReminderMessage(r as IReceivable, daysOverdue <= 0 ? 'current' as const : daysOverdue <= 30 ? 'overdue_1_30' as const : daysOverdue <= 60 ? 'overdue_31_60' as const : daysOverdue <= 90 ? 'overdue_61_90' as const : 'overdue_91_plus' as const),
          daysOverdue: Math.max(0, daysOverdue),
        };
      });

      res.json({
        success: true,
        data: {
          count: reminders.length,
          reminders,
        },
      });
    } catch (error) {
      console.error('Error fetching due follow-ups:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch due follow-ups',
      });
    }
  }
);

// === Payment Recording ===

// Record payment received
apiRouter.post(
  '/payments',
  validateRequest(recordPaymentSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { receivableId, amount, paymentDate } = req.body;

      // Verify receivable belongs to tenant
      const receivable = await Receivable.findOne({
        receivableId,
        tenantId: req.tenantId,
      });

      if (!receivable) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Receivable not found',
        });
        return;
      }

      const updated = await recordPaymentService(
        receivableId,
        amount,
        paymentDate ? new Date(paymentDate) : new Date()
      );

      res.json({
        success: true,
        data: {
          receivableId: updated.receivableId,
          amount: updated.amount,
          paidAmount: updated.paidAmount,
          outstandingAmount: updated.amount - updated.paidAmount,
          status: updated.status,
        },
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      const message = error instanceof Error ? error.message : 'Failed to record payment';
      res.status(500).json({
        error: 'Internal Server Error',
        message,
      });
    }
  }
);

// === Batch Reminders ===

// Generate batch reminders
apiRouter.post(
  '/reminders/batch',
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { channel = PaymentChannel.EMAIL, priorityOnly = false } = req.body;

      const result = await generateBatchReminders(req.tenantId!, channel);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error generating batch reminders:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate batch reminders',
      });
    }
  }
);

// Mount API router
app.use('/api', apiRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: appConfig.isDevelopment ? err.message : 'An unexpected error occurred',
  });
});

// Database connection and server start
async function startServer(): Promise<void> {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(appConfig.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully');

    app.listen(appConfig.port, () => {
      console.log(`Finance Collections running on port ${appConfig.port}`);
      console.log(`Environment: ${appConfig.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;