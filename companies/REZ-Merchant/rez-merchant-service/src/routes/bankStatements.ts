/**
 * Bank Statement Routes
 *
 * Upload, parse, and reconcile bank statements
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  parseBankStatement,
  autoMatchTransactions,
  importMatchedTransactions,
  ReconciliationMatch,
} from '../services/bankStatementParser';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors } from '../utils/response';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.txt'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * POST /bank-statements/parse
 * Parse uploaded bank statement
 */
router.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const bankName = req.body.bankName;
    const accountNumber = req.body.accountNumber;

    if (!req.file) {
      errorResponse(res, errors.badRequest('No file uploaded'));
      return;
    }

    const content = req.file.buffer.toString('utf-8');
    const result = await parseBankStatement(content, bankName, accountNumber);

    if (!result.success) {
      res.status(400).json({ success: false, errors: result.errors });
      return;
    }

    res.json({
      success: true,
      data: {
        transactions: result.transactions,
        bankName: result.bankName,
        accountNumber: result.accountNumber,
        totalTransactions: result.transactions.length,
        warnings: result.warnings,
      },
    });
  } catch (err) {
    logger.error('[BankStatement] Parse failed', { error: err });
    errorResponse(res, errors.internal('Failed to parse bank statement'));
  }
});

/**
 * POST /bank-statements/reconcile
 * Parse and auto-match transactions
 */
router.post('/reconcile', async (req: Request, res: Response) => {
  try {
    const { transactions, bankName, accountNumber } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      errorResponse(res, errors.badRequest('Invalid transactions data'));
      return;
    }

    // Parse if content is provided
    let parsedTransactions = transactions;
    if (typeof transactions === 'string') {
      const result = await parseBankStatement(transactions, bankName, accountNumber);
      parsedTransactions = result.transactions;
    }

    // Auto-match
    const matches = await autoMatchTransactions(req.merchantId, parsedTransactions);

    const summary = {
      total: matches.length,
      matched: matches.filter((m) => m.matchConfidence >= 70).length,
      uncertain: matches.filter((m) => m.matchConfidence >= 50 && m.matchConfidence < 70).length,
      unmatched: matches.filter((m) => m.matchConfidence < 50).length,
    };

    res.json({
      success: true,
      data: { matches, summary },
    });
  } catch (err) {
    logger.error('[BankStatement] Reconcile failed', { error: err });
    errorResponse(res, errors.internal('Reconciliation failed'));
  }
});

/**
 * POST /bank-statements/import
 * Import matched transactions
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { matches } = req.body;

    if (!matches || !Array.isArray(matches)) {
      errorResponse(res, errors.badRequest('Invalid matches data'));
      return;
    }

    const result = await importMatchedTransactions(req.merchantId, matches);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('[BankStatement] Import failed', { error: err });
    errorResponse(res, errors.internal('Import failed'));
  }
});

/**
 * GET /bank-statements/import-history
 * Get import history
 */
router.get('/import-history', async (req: Request, res: Response) => {
  // In production, query from database
  res.json({
    success: true,
    data: {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false },
    },
  });
});

export default router;
