/**
 * RTMN Finance OS
 *
 * Financial operations across all industries.
 * Handles ledgers, budgets, expenses, and financial reporting across 24 industries.
 *
 * Port: 3023
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

import ledgerRoutes from './routes/ledger.js';
import budgetsRoutes from './routes/budgets.js';
import expensesRoutes from './routes/expenses.js';
import reportsRoutes from './routes/reports.js';

const app = express();
const PORT = process.env.PORT || 3023;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Account Types
export const ACCOUNT_TYPES = {
  ASSET: 'asset',
  LIABILITY: 'liability',
  EQUITY: 'equity',
  REVENUE: 'revenue',
  EXPENSE: 'expense'
};

// Transaction Types
export const TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment'
};

// Budget Status
export const BUDGET_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  EXCEEDED: 'exceeded',
  CLOSED: 'closed'
};

// Industry Coverage
export const INDUSTRIES = [
  'fitness', 'gaming', 'government', 'homeServices', 'manufacturing',
  'nonprofit', 'professional', 'sports', 'travel', 'construction',
  'entertainment', 'financial', 'healthcare', 'education', 'retail',
  'technology', 'food', 'automotive', 'realestate', 'media',
  'legal', 'agriculture', 'energy', 'logistics'
];

// Account Registry
export const accountRegistry = new Map();

// Budget Registry
export const budgetRegistry = new Map();

export { logger };

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      duration: Date.now() - start,
      status: res.statusCode
    });
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'finance-os',
    version: '1.0.0',
    port: PORT,
    accounts: accountRegistry.size,
    budgets: budgetRegistry.size,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Finance OS',
    version: '1.0.0',
    description: 'Financial operations across all industries',
    port: PORT,
    capabilities: [
      'Multi-industry ledger management',
      'Budget tracking and control',
      'Expense management',
      'Financial reporting'
    ],
    endpoints: [
      'GET /api/ledger',
      'POST /api/ledger/entry',
      'GET /api/budgets',
      'POST /api/budgets',
      'GET /api/expenses',
      'GET /api/reports'
    ]
  });
});

// Routes
app.use('/api/ledger', ledgerRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reports', reportsRoutes);

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  logger.info(`Finance OS running on port ${PORT}`);
  logger.info(`Industry coverage: ${INDUSTRIES.length} industries`);
});

export { app };
