import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { Database } from './db/database';
import { InvoiceModel } from './models/Invoice';
import { InvoiceRoutes } from './routes/invoice.routes';
import { ReminderScheduler } from './utils/reminderScheduler';
import { Logger } from './utils/logger';
import { emailService } from './services/emailService';
import { pdfService } from './services/pdfService';

// Load environment variables
dotenv.config();

const logger = new Logger();
const app: Express = express();
const PORT = parseInt(process.env.PORT || '4028');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

    if (logLevel === 'error') {
      logger.error(message, {
        ip: req.ip,
        statusCode: res.statusCode,
        duration
      });
    } else {
      logger.info(message, {
        ip: req.ip,
        statusCode: res.statusCode,
        duration
      });
    }
  });

  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const emailConnected = await emailService.verifyConnection();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
        email: emailConnected ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Invoice Generation Service',
    version: '1.0.0',
    description: 'GST-compliant invoice generation service with PDF and email support',
    endpoints: {
      invoices: {
        'POST /api/invoices': 'Create a new invoice',
        'GET /api/invoices': 'List invoices with filters and pagination',
        'GET /api/invoices/:id': 'Get invoice by ID',
        'GET /api/invoices/number/:invoiceNumber': 'Get invoice by invoice number',
        'PATCH /api/invoices/:id': 'Update invoice',
        'DELETE /api/invoices/:id': 'Delete invoice',
        'PATCH /api/invoices/:id/status': 'Update invoice status',
        'POST /api/invoices/:id/payments': 'Record payment',
        'GET /api/invoices/:id/payments': 'Get payment history',
        'POST /api/invoices/:id/send': 'Send invoice via email',
        'GET /api/invoices/:id/pdf': 'Download invoice PDF',
        'GET /api/invoices/:id/preview': 'Preview invoice PDF',
        'POST /api/invoices/:id/reminders': 'Send reminder for invoice',
        'POST /api/invoices/reminders/batch': 'Send batch reminders'
      },
      reports: {
        'GET /api/invoices/stats/summary': 'Get invoice statistics',
        'GET /api/invoices/reports/gst': 'Get GST summary (requires fromDate & toDate)',
        'GET /api/invoices/reports/overdue': 'Get overdue invoices'
      },
      utilities: {
        'GET /health': 'Health check',
        'POST /api/emails/verify': 'Verify email connection',
        'POST /api/reminders/trigger': 'Manually trigger reminder job'
      }
    },
    examples: {
      createInvoice: {
        method: 'POST',
        url: '/api/invoices',
        body: {
          customerName: 'Acme Corp',
          customerAddress: {
            line1: '123 Business Park',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India',
            email: 'billing@acme.com',
            gstin: '27AAAAA0000A1Z5'
          },
          items: [{
            description: 'Web Development Services',
            hsnCode: '9954',
            quantity: 1,
            rate: 50000,
            discountPercent: 10
          }]
        }
      },
      recordPayment: {
        method: 'POST',
        url: '/api/invoices/:id/payments',
        body: {
          amount: 45000,
          date: '2024-01-15',
          method: 'bank_transfer',
          reference: 'NEFT123456'
        }
      }
    }
  });
});

// Initialize database and routes
const dbPath = process.env.DB_PATH || './data/invoices.db';
const db = new Database(dbPath);
const invoiceModel = new InvoiceModel(db);
const invoiceRoutes = new InvoiceRoutes(invoiceModel);
const reminderScheduler = new ReminderScheduler(invoiceModel);

// Mount routes
app.use('/api/invoices', invoiceRoutes.getRouter());

// Utility endpoints
app.post('/api/emails/verify', async (req: Request, res: Response) => {
  const connected = await emailService.verifyConnection();
  res.json({
    connected,
    message: connected ? 'Email service is connected' : 'Email service connection failed'
  });
});

app.post('/api/reminders/trigger', async (req: Request, res: Response) => {
  try {
    await reminderScheduler.triggerNow();
    res.json({
      success: true,
      message: 'Reminder job triggered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate PDF for preview (without saving)
app.post('/api/pdf/generate', async (req: Request, res: Response) => {
  try {
    const invoice = req.body;
    const pdfBuffer = await pdfService.generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="preview.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF'
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  reminderScheduler.stop();
  db.close();

  setTimeout(() => {
    logger.info('Process terminated');
    process.exit(0);
  }, 1000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Verify email connection (optional, don't block startup)
    const emailConnected = await emailService.verifyConnection();
    if (emailConnected) {
      logger.info('Email service connected');
    } else {
      logger.warn('Email service not connected - emails will fail');
    }

    // Start reminder scheduler
    reminderScheduler.start();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Invoice Service started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API docs: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
};

startServer();

export { app, db, invoiceModel };
