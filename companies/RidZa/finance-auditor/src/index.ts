/**
 * AI Finance Auditor - Main Entry Point
 * Fraud detection, audit support, and risk assessment
 */
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Services
import { detectFraud, hashTransaction } from './services/fraudDetection.js';
import { checkDuplicate, hashInvoice, hashInvoiceNormalized } from './services/duplicateDetection.js';
import { assessRisk } from './services/riskAssessment.js';

// Models
import {
  AuditAlert,
  AuditReport,
  Transaction,
  Invoice,
  RiskAssessmentModel,
  IAuditAlert,
  IAuditReport,
  ITransaction,
  IInvoice,
} from './models/index.js';

// Middleware
import { authenticate, generateToken } from './middleware/auth.js';

// Types
import {
  Transaction as TransactionType,
  FraudDetectionResult,
  DuplicateCheckResult,
  RiskAssessment as RiskAssessmentType,
  Invoice as InvoiceType,
} from './types/index.js';

// Environment variables
const PORT = parseInt(process.env.PORT || '3000', 10);
const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as Request & { requestId: string }).requestId = uuidv4();
  res.setHeader('X-Request-ID', (req as Request & { requestId: string }).requestId);
  next();
});

// Health check endpoints (no auth required)
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'finance-auditor',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoStatus,
    environment: NODE_ENV,
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ status: 'not ready', reason: 'MongoDB disconnected' });
      return;
    }
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: 'Health check failed' });
  }
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Finance Auditor',
    version: '1.0.0',
    description: 'AI Finance Auditor - Fraud detection, audit support, and risk assessment',
    endpoints: {
      'POST /api/fraud/detect': 'Detect fraud in a transaction',
      'POST /api/fraud/batch': 'Batch fraud detection',
      'POST /api/duplicate/check': 'Check for duplicate invoices',
      'POST /api/duplicate/batch-check': 'Batch duplicate check',
      'GET /api/risk/:tenantId': 'Get risk assessment for tenant',
      'POST /api/risk/:tenantId/assess': 'Trigger risk assessment',
      'GET /api/alerts/:tenantId': 'Get alerts for tenant',
      'PUT /api/alerts/:alertId/acknowledge': 'Acknowledge an alert',
      'GET /api/reports/:tenantId': 'Get audit reports for tenant',
      'POST /api/reports/:tenantId/generate': 'Generate audit report',
      'GET /api/transactions/:tenantId': 'Get transactions for tenant',
      'POST /api/transactions/:tenantId': 'Record a transaction',
      'POST /api/invoices/:tenantId': 'Record an invoice',
      'POST /api/auth/token': 'Generate test token (dev only)',
    },
  });
});

// ============================================
// FRAUD DETECTION ENDPOINTS
// ============================================

/**
 * POST /api/fraud/detect
 * Detect fraud in a single transaction
 */
app.post('/api/fraud/detect', authenticate, async (req: Request, res: Response) => {
  try {
    const { transaction } = req.body as { transaction: TransactionType };

    if (!transaction) {
      res.status(400).json({ error: 'Transaction data is required' });
      return;
    }

    // Validate required fields
    if (!transaction.tenantId || !transaction.amount || !transaction.senderId || !transaction.receiverId) {
      res.status(400).json({
        error: 'Missing required fields: tenantId, amount, senderId, receiverId',
      });
      return;
    }

    // Get recent transactions for pattern analysis
    const recentTransactions = await Transaction.find({
      tenantId: transaction.tenantId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    const recentTxTyped: TransactionType[] = recentTransactions.map(t => ({
      id: t.transactionId,
      tenantId: t.tenantId,
      amount: t.amount,
      currency: t.currency,
      senderId: t.senderId,
      receiverId: t.receiverId,
      timestamp: t.timestamp,
      type: t.type,
      metadata: t.metadata,
    }));

    // Run fraud detection
    const result: FraudDetectionResult = await detectFraud(transaction, recentTxTyped);

    // Store transaction
    const txHash = hashTransaction(transaction);
    await Transaction.create({
      transactionId: transaction.id || uuidv4(),
      tenantId: transaction.tenantId,
      amount: transaction.amount,
      currency: transaction.currency || 'USD',
      senderId: transaction.senderId,
      receiverId: transaction.receiverId,
      timestamp: transaction.timestamp || new Date(),
      type: transaction.type || 'payment',
      hash: txHash,
      metadata: transaction.metadata,
      analyzed: true,
      fraudScore: result.score,
    });

    // Create alert if risk is high or critical
    if (result.risk === 'high' || result.risk === 'critical') {
      const alert = await AuditAlert.create({
        alertId: result.alertId,
        tenantId: transaction.tenantId,
        type: 'fraud',
        severity: result.risk,
        description: `Fraud risk detected: ${result.factors.join('; ')}`,
        amount: transaction.amount,
        transactionId: transaction.id,
        createdAt: result.timestamp,
        acknowledged: false,
      });

      res.json({
        ...result,
        alertId: alert.alertId,
        alertCreated: true,
      });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Fraud detection error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Fraud detection failed' });
  }
});

/**
 * POST /api/fraud/batch
 * Batch fraud detection
 */
app.post('/api/fraud/batch', authenticate, async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body as { transactions: TransactionType[] };

    if (!transactions || !Array.isArray(transactions)) {
      res.status(400).json({ error: 'Transactions array is required' });
      return;
    }

    if (transactions.length > 100) {
      res.status(400).json({ error: 'Maximum 100 transactions per batch' });
      return;
    }

    const results = await Promise.all(
      transactions.map(t => detectFraud(t, transactions))
    );

    const highRiskCount = results.filter(r => r.risk === 'high' || r.risk === 'critical').length;

    res.json({
      total: transactions.length,
      results,
      summary: {
        low: results.filter(r => r.risk === 'low').length,
        medium: results.filter(r => r.risk === 'medium').length,
        high: results.filter(r => r.risk === 'high').length,
        critical: results.filter(r => r.risk === 'critical').length,
      },
      highRiskCount,
    });
  } catch (error) {
    console.error('Batch fraud detection error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Batch fraud detection failed' });
  }
});

// ============================================
// DUPLICATE DETECTION ENDPOINTS
// ============================================

/**
 * POST /api/duplicate/check
 * Check for duplicate invoices
 */
app.post('/api/duplicate/check', authenticate, async (req: Request, res: Response) => {
  try {
    const { invoice, strictMode } = req.body as { invoice: InvoiceType; strictMode?: boolean };

    if (!invoice) {
      res.status(400).json({ error: 'Invoice data is required' });
      return;
    }

    // Get reference invoices for the tenant
    const referenceInvoices = await Invoice.find({
      tenantId: invoice.tenantId,
      vendorId: invoice.vendorId,
    })
      .sort({ date: -1 })
      .limit(1000)
      .lean();

    const result: DuplicateCheckResult = checkDuplicate(invoice, referenceInvoices, strictMode);

    // Store the invoice
    const invoiceHash = hashInvoice(invoice);
    const normalizedHash = hashInvoiceNormalized(invoice);

    await Invoice.create({
      invoiceId: invoice.invoiceId || uuidv4(),
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      currency: invoice.currency || 'USD',
      vendorId: invoice.vendorId,
      date: invoice.date,
      lineItems: invoice.lineItems || [],
      hash: invoiceHash,
      normalizedHash,
      createdAt: new Date(),
    });

    // Create alert if duplicate found
    if (result.isDuplicate) {
      await AuditAlert.create({
        alertId: `DUP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        tenantId: invoice.tenantId,
        type: 'duplicate',
        severity: result.confidence > 0.9 ? 'high' : 'medium',
        description: `Potential duplicate invoice detected: ${result.matchReasons.join('; ')}`,
        amount: invoice.amount,
        createdAt: new Date(),
        acknowledged: false,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Duplicate check failed' });
  }
});

/**
 * POST /api/duplicate/batch-check
 * Batch duplicate check
 */
app.post('/api/duplicate/batch-check', authenticate, async (req: Request, res: Response) => {
  try {
    const { invoices } = req.body as { invoices: InvoiceType[] };

    if (!invoices || !Array.isArray(invoices)) {
      res.status(400).json({ error: 'Invoices array is required' });
      return;
    }

    const results = invoices.map(invoice => checkDuplicate(invoice, invoices));
    const duplicateCount = results.filter(r => r.isDuplicate).length;

    res.json({
      total: invoices.length,
      results,
      duplicateCount,
      duplicateRate: invoices.length > 0 ? duplicateCount / invoices.length : 0,
    });
  } catch (error) {
    console.error('Batch duplicate check error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Batch duplicate check failed' });
  }
});

// ============================================
// RISK ASSESSMENT ENDPOINTS
// ============================================

/**
 * GET /api/risk/:tenantId
 * Get cached risk assessment for tenant
 */
app.get('/api/risk/:tenantId', authenticate, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const assessment = await RiskAssessmentModel.findOne({
      tenantId,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!assessment) {
      res.status(404).json({
        error: 'No recent assessment found',
        message: 'Trigger a new assessment using POST /api/risk/:tenantId/assess',
      });
      return;
    }

    res.json(assessment);
  } catch (error) {
    console.error('Risk assessment retrieval error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Risk assessment retrieval failed' });
  }
});

/**
 * POST /api/risk/:tenantId/assess
 * Trigger new risk assessment
 */
app.post('/api/risk/:tenantId/assess', authenticate, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { lookbackDays = 30 } = req.body as { lookbackDays?: number };

    // Get transactions for the period
    const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    const transactions = await Transaction.find({
      tenantId,
      timestamp: { $gte: lookbackDate },
    }).lean();

    // Get alerts for the period
    const alerts = await AuditAlert.find({
      tenantId,
      createdAt: { $gte: lookbackDate },
    }).lean();

    // Perform risk assessment
    const assessment: RiskAssessmentType = assessRisk(
      tenantId,
      transactions.map(t => ({
        id: t.transactionId,
        tenantId: t.tenantId,
        amount: t.amount,
        currency: t.currency,
        senderId: t.senderId,
        receiverId: t.receiverId,
        timestamp: t.timestamp,
        type: t.type,
      })),
      alerts.map(a => ({
        alertId: a.alertId,
        tenantId: a.tenantId,
        type: a.type,
        severity: a.severity,
        description: a.description,
        amount: a.amount,
        transactionId: a.transactionId,
        createdAt: a.createdAt,
        acknowledged: a.acknowledged,
      }))
    );

    // Cache the assessment (expires in 1 hour)
    await RiskAssessmentModel.findOneAndUpdate(
      { tenantId },
      {
        tenantId,
        overallRisk: assessment.overallRisk,
        riskScore: assessment.riskScore,
        factors: assessment.factors,
        recommendations: assessment.recommendations,
        lastAssessment: assessment.lastAssessment,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
      { upsert: true }
    );

    res.json(assessment);
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Risk assessment failed' });
  }
});

// ============================================
// ALERTS ENDPOINTS
// ============================================

/**
 * GET /api/alerts/:tenantId
 * Get alerts for tenant
 */
app.get('/api/alerts/:tenantId', authenticate, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { acknowledged, type, severity, limit = 50, offset = 0 } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { tenantId };
    if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';
    if (type) filter.type = type;
    if (severity) filter.severity = severity;

    const alerts = await AuditAlert.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset, 10))
      .limit(parseInt(limit, 10))
      .lean();

    const total = await AuditAlert.countDocuments(filter);

    res.json({
      alerts,
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (error) {
    console.error('Alerts retrieval error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Alerts retrieval failed' });
  }
});

/**
 * PUT /api/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
app.put('/api/alerts/:alertId/acknowledge', authenticate, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body as { userId?: string };

    const alert = await AuditAlert.findOneAndUpdate(
      { alertId },
      {
        acknowledged: true,
        acknowledgedBy: userId || 'system',
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.json(alert);
  } catch (error) {
    console.error('Alert acknowledgment error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Alert acknowledgment failed' });
  }
});

// ============================================
// REPORTS ENDPOINTS
// ============================================

/**
 * GET /api/reports/:tenantId
 * Get audit reports for tenant
 */
app.get('/api/reports/:tenantId', authenticate, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { type, limit = 20, offset = 0 } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { tenantId };
    if (type) filter.type = type;

    const reports = await AuditReport.find(filter)
      .sort({ date: -1 })
      .skip(parseInt(offset, 10))
      .limit(parseInt(limit, 10))
      .lean();

    const total = await AuditReport.countDocuments(filter);

    res.json({
      reports,
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (error) {
    console.error('Reports retrieval error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Reports retrieval failed' });
  }
});

/**
 * POST /api/reports/:tenantId/generate
 * Generate audit report
 */
app.post('/api/reports/:tenantId/generate', authenticate, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { type = 'internal', lookbackDays = 30 } = req.body as { type?: string; lookbackDays?: number };

    const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    // Gather data
    const transactions = await Transaction.find({
      tenantId,
      timestamp: { $gte: lookbackDate },
    }).lean();

    const alerts = await AuditAlert.find({
      tenantId,
      createdAt: { $gte: lookbackDate },
    }).lean();

    // Perform risk assessment
    const assessment = assessRisk(
      tenantId,
      transactions.map(t => ({
        id: t.transactionId,
        tenantId: t.tenantId,
        amount: t.amount,
        currency: t.currency,
        senderId: t.senderId,
        receiverId: t.receiverId,
        timestamp: t.timestamp,
        type: t.type,
      })),
      alerts.map(a => ({
        alertId: a.alertId,
        tenantId: a.tenantId,
        type: a.type,
        severity: a.severity,
        description: a.description,
        amount: a.amount,
        transactionId: a.transactionId,
        createdAt: a.createdAt,
        acknowledged: a.acknowledged,
      }))
    );

    // Generate findings
    const findings: string[] = [];

    if (assessment.riskScore > 50) {
      findings.push(`High risk score detected: ${assessment.riskScore}/100`);
    }

    const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
    if (unacknowledgedAlerts.length > 0) {
      findings.push(`${unacknowledgedAlerts.length} unacknowledged alerts require review`);
    }

    const fraudAlerts = alerts.filter(a => a.type === 'fraud');
    if (fraudAlerts.length > 0) {
      findings.push(`${fraudAlerts.length} fraud-related alerts generated`);
    }

    const duplicateAlerts = alerts.filter(a => a.type === 'duplicate');
    if (duplicateAlerts.length > 0) {
      findings.push(`${duplicateAlerts.length} potential duplicate transactions detected`);
    }

    if (transactions.length > 0) {
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      findings.push(`Total transaction volume: ${transactions.length} transactions totaling ${totalAmount.toFixed(2)}`);
    }

    // Create report
    const report = await AuditReport.create({
      reportId: `AUDIT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      tenantId,
      type: type as 'internal' | 'external' | 'compliance' | 'fraud-investigation',
      findings,
      risk: assessment.overallRisk,
      riskScore: assessment.riskScore,
      date: new Date(),
      transactionsAnalyzed: transactions.length,
      alertsGenerated: alerts.length,
      generatedBy: 'system',
    });

    res.json(report);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Report generation failed' });
  }
});

// ============================================
// TRANSACTIONS ENDPOINTS
// ============================================

/**
 * GET /api/transactions/:tenantId
 * Get transactions for tenant
 */
app.get('/api/transactions/:tenantId', authenticate, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { limit = 50, offset = 0, startDate, endDate } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { tenantId };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) (filter.timestamp as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) (filter.timestamp as Record<string, Date>).$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .sort({ timestamp: -1 })
      .skip(parseInt(offset, 10))
      .limit(parseInt(limit, 10))
      .lean();

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (error) {
    console.error('Transactions retrieval error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Transactions retrieval failed' });
  }
});

/**
 * POST /api/transactions/:tenantId
 * Record a transaction
 */
app.post('/api/transactions/:tenantId', authenticate, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { transaction } = req.body as { transaction: TransactionType };

    if (!transaction) {
      res.status(400).json({ error: 'Transaction data is required' });
      return;
    }

    const txHash = hashTransaction(transaction);

    const newTransaction = await Transaction.create({
      transactionId: transaction.id || uuidv4(),
      tenantId,
      amount: transaction.amount,
      currency: transaction.currency || 'USD',
      senderId: transaction.senderId,
      receiverId: transaction.receiverId,
      timestamp: transaction.timestamp || new Date(),
      type: transaction.type || 'payment',
      hash: txHash,
      metadata: transaction.metadata,
      analyzed: false,
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Transaction recording error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Transaction recording failed' });
  }
});

// ============================================
// INVOICES ENDPOINTS
// ============================================

/**
 * POST /api/invoices/:tenantId
 * Record an invoice
 */
app.post('/api/invoices/:tenantId', authenticate, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { invoice } = req.body as { invoice: InvoiceType };

    if (!invoice) {
      res.status(400).json({ error: 'Invoice data is required' });
      return;
    }

    const invoiceHash = hashInvoice(invoice);
    const normalizedHash = hashInvoiceNormalized(invoice);

    const newInvoice = await Invoice.create({
      invoiceId: invoice.invoiceId || uuidv4(),
      tenantId,
      amount: invoice.amount,
      currency: invoice.currency || 'USD',
      vendorId: invoice.vendorId,
      date: invoice.date,
      lineItems: invoice.lineItems || [],
      hash: invoiceHash,
      normalizedHash,
      createdAt: new Date(),
    });

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Invoice recording error:', error);
    res.status(500).json({ error: 'Internal server error', message: 'Invoice recording failed' });
  }
});

// ============================================
// AUTH ENDPOINT (Development only)
// ============================================

/**
 * POST /api/auth/token
 * Generate test token (dev only)
 */
app.post('/api/auth/token', (req: Request, res: Response) => {
  if (NODE_ENV === 'production') {
    res.status(403).json({ error: 'Not available in production' });
    return;
  }

  const { tenantId, userId, roles = ['user'] } = req.body as {
    tenantId?: string;
    userId?: string;
    roles?: string[];
  };

  if (!tenantId || !userId) {
    res.status(400).json({ error: 'tenantId and userId are required' });
    return;
  }

  const token = generateToken({ tenantId, userId, roles });

  res.json({ token, expiresIn: '24h' });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: (req as Request & { requestId: string }).requestId,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    requestId: (req as Request & { requestId: string }).requestId,
  });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

async function connectToDatabase(): Promise<void> {
  if (!MONGODB_URI) {
    console.error('FATAL: MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function startServer(): Promise<void> {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`AI Finance Auditor running on port ${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;