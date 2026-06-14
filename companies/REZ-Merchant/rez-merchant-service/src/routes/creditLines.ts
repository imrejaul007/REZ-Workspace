/**
 * Credit Lines / BNPL routes.
 * Handles credit line CRUD, payments, and status management.
 */

import { Router, Request, Response } from 'express';
import { creditLineService } from '../services/creditLineService';
import { SupplierLedger } from '../models/SupplierLedger';
import { merchantAuth } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cacheMiddleware';
import { CacheKeys, CacheTTL, cacheService } from '../services/cacheService';
import { errorResponse, errors } from '../utils/response';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// Cache key builder
const creditLineListCacheKey = (req: Request): string => {
  const { status, page, limit } = req.query;
  return `cl:list:${req.merchantId}:${JSON.stringify({ status, page, limit })}`;
};

/**
 * GET /credit-lines
 * List all credit lines for the merchant.
 */
router.get('/', cacheMiddleware({
  ttl: CacheTTL.SHORT,
  keyFn: creditLineListCacheKey,
  condition: (req) => !req.query.status // Only cache unfiltered requests
}), async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = req.query;

    const result = await creditLineService.listCreditLines(req.merchantId!, {
      status: status as 'active' | 'suspended' | 'closed' | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /credit-lines/:id
 * Get credit line detail with payment history.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const creditLine = await creditLineService.getCreditLineById(req.merchantId!, req.params.id);

    if (!creditLine) {
      res.status(404).json({ success: false, message: 'Credit line not found' });
      return;
    }

    // Get ledger balance
    const balance = await SupplierLedger.getCurrentBalance(
      req.merchantId!,
      creditLine.supplierId.toString()
    );

    // Get aging report
    const aging = await SupplierLedger.getAgingReport(
      req.merchantId!,
      creditLine.supplierId.toString()
    );

    res.json({
      success: true,
      data: {
        ...creditLine.toObject(),
        ledgerBalance: balance,
        aging,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /credit-lines
 * Create a new credit line for a supplier.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const ALLOWED_FIELDS = [
      'supplierId',
      'creditLimit',
      'creditPeriodDays',
      'interestRate',
      'interestGraceDays',
      'minPaymentPercent',
    ];

    const safeBody: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if ((req.body as unknown)[field] !== undefined) {
        safeBody[field] = (req.body as unknown)[field];
      }
    }

    // Validate required fields
    if (!safeBody.supplierId) {
      res.status(400).json({ success: false, message: 'supplierId is required' });
      return;
    }
    if (safeBody.creditLimit === undefined || safeBody.creditLimit < 0) {
      res.status(400).json({ success: false, message: 'creditLimit must be a non-negative number' });
      return;
    }

    // Validate supplierId format
    if (!mongoose.Types.ObjectId.isValid(safeBody.supplierId as string)) {
      res.status(400).json({ success: false, message: 'Invalid supplierId format' });
      return;
    }

    const creditLine = await creditLineService.createCreditLine({
      merchantId: req.merchantId!,
      supplierId: safeBody.supplierId as string,
      creditLimit: safeBody.creditLimit as number,
      creditPeriodDays: safeBody.creditPeriodDays as number | undefined,
      interestRate: safeBody.interestRate as number | undefined,
      interestGraceDays: safeBody.interestGraceDays as number | undefined,
      minPaymentPercent: safeBody.minPaymentPercent as number | undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Credit line created',
      data: creditLine,
    });
  } catch (err: unknown) {
    if (err.message.includes('already exists')) {
      res.status(409).json({ success: false, message: err.message });
      return;
    }
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * PUT /credit-lines/:id
 * Update credit line settings.
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const ALLOWED_FIELDS = [
      'creditLimit',
      'creditPeriodDays',
      'interestRate',
      'interestGraceDays',
      'minPaymentPercent',
    ];

    const safeBody: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if ((req.body as unknown)[field] !== undefined) {
        safeBody[field] = (req.body as unknown)[field];
      }
    }

    if (Object.keys(safeBody).length === 0) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    const creditLine = await creditLineService.updateCreditLine(
      req.merchantId!,
      req.params.id,
      {
        ...safeBody,
        merchantUserId: req.merchantUserId,
      } as unknown
    );

    res.json({
      success: true,
      message: 'Credit line updated',
      data: creditLine,
    });
  } catch (err: unknown) {
    if (err.message.includes('not found')) {
      res.status(404).json({ success: false, message: err.message });
      return;
    }
    if (err.message.includes('exceed') || err.message.includes('cannot')) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /credit-lines/:id/suspend
 * Suspend a credit line.
 */
router.post('/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      res.status(400).json({ success: false, message: 'Reason is required' });
      return;
    }

    const creditLine = await creditLineService.suspendCreditLine(
      req.merchantId!,
      req.params.id,
      reason,
      req.merchantUserId
    );

    res.json({
      success: true,
      message: 'Credit line suspended',
      data: creditLine,
    });
  } catch (err: unknown) {
    if (err.message.includes('not found')) {
      res.status(404).json({ success: false, message: err.message });
      return;
    }
    if (err.message.includes('closed')) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /credit-lines/:id/reactivate
 * Reactivate a suspended credit line.
 */
router.post('/:id/reactivate', async (req: Request, res: Response) => {
  try {
    const creditLine = await creditLineService.reactivateCreditLine(
      req.merchantId!,
      req.params.id,
      req.merchantUserId
    );

    res.json({
      success: true,
      message: 'Credit line reactivated',
      data: creditLine,
    });
  } catch (err: unknown) {
    if (err.message.includes('not found')) {
      res.status(404).json({ success: false, message: err.message });
      return;
    }
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /credit-lines/:id/payment
 * Record a payment and auto-allocate to oldest due entries (FIFO).
 */
router.post('/:id/payment', async (req: Request, res: Response) => {
  try {
    const { amount, reference, method, notes } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'amount must be a positive number' });
      return;
    }
    if (!reference || typeof reference !== 'string') {
      res.status(400).json({ success: false, message: 'reference is required' });
      return;
    }
    if (!method || !['bank_transfer', 'upi', 'neft', 'rtgs', 'cash', 'adjustment', 'credit_note'].includes(method)) {
      res.status(400).json({
        success: false,
        message: 'method must be one of: bank_transfer, upi, neft, rtgs, cash, adjustment, credit_note',
      });
      return;
    }

    // Get credit line to find supplierId
    const creditLine = await creditLineService.getCreditLineById(req.merchantId!, req.params.id);
    if (!creditLine) {
      res.status(404).json({ success: false, message: 'Credit line not found' });
      return;
    }

    const result = await creditLineService.recordPayment(
      req.merchantId!,
      creditLine.supplierId.toString(),
      amount,
      reference,
      method,
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded',
      data: result,
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /credit-lines/:id/transactions
 * Get ledger entries for a credit line.
 */
router.get('/:id/transactions', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, page, limit, type, overdue } = req.query;

    // Get credit line to find supplierId
    const creditLine = await creditLineService.getCreditLineById(req.merchantId!, req.params.id);
    if (!creditLine) {
      res.status(404).json({ success: false, message: 'Credit line not found' });
      return;
    }

    const supplierId = creditLine.supplierId.toString();
    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = Math.min(100, limit ? parseInt(limit as string) : 20);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: unknown = {
      merchantId: new mongoose.Types.ObjectId(req.merchantId),
      supplierId: new mongoose.Types.ObjectId(supplierId),
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    if (type && ['debit', 'credit'].includes(type as string)) {
      query.entryType = type;
    }
    if (overdue === 'true') {
      query.isOverdue = true;
    }

    const [items, total] = await Promise.all([
      SupplierLedger.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SupplierLedger.countDocuments(query),
    ]);

    // Get current balance
    const balance = await SupplierLedger.getCurrentBalance(req.merchantId!, supplierId);

    res.json({
      success: true,
      data: {
        items,
        currentBalance: balance,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /credit-lines/supplier/:supplierId
 * Get credit line for a specific supplier.
 */
router.get('/supplier/:supplierId', async (req: Request, res: Response) => {
  try {
    const supplierId = req.params.supplierId;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid supplierId format' });
      return;
    }

    const creditLine = await creditLineService.getCreditLineBySupplier(req.merchantId!, supplierId);

    if (!creditLine) {
      res.status(404).json({ success: false, message: 'No credit line found for this supplier' });
      return;
    }

    // Get ledger balance and aging
    const [balance, aging] = await Promise.all([
      SupplierLedger.getCurrentBalance(req.merchantId!, supplierId),
      SupplierLedger.getAgingReport(req.merchantId!, supplierId),
    ]);

    res.json({
      success: true,
      data: {
        ...creditLine.toObject(),
        ledgerBalance: balance,
        aging,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /credit-lines/:id/interest/calculate
 * Calculate interest for a credit line (preview, no application).
 */
router.post('/:id/interest/calculate', async (req: Request, res: Response) => {
  try {
    const creditLine = await creditLineService.getCreditLineById(req.merchantId!, req.params.id);
    if (!creditLine) {
      res.status(404).json({ success: false, message: 'Credit line not found' });
      return;
    }

    const calculations = await creditLineService.calculateInterest(
      req.merchantId!,
      creditLine.supplierId.toString()
    );

    const totalInterest = calculations.reduce((sum, c) => sum + c.interestAmount, 0);

    res.json({
      success: true,
      data: {
        calculations,
        totalInterest,
        entryCount: calculations.length,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /credit-lines/:id/interest/apply
 * Apply calculated interest to a credit line.
 */
router.post('/:id/interest/apply', async (req: Request, res: Response) => {
  try {
    const creditLine = await creditLineService.getCreditLineById(req.merchantId!, req.params.id);
    if (!creditLine) {
      res.status(404).json({ success: false, message: 'Credit line not found' });
      return;
    }

    const entries = await creditLineService.applyInterest(
      req.merchantId!,
      creditLine.supplierId.toString()
    );

    res.status(201).json({
      success: true,
      message: `Interest applied to ${entries.length} entries`,
      data: {
        entries,
        count: entries.length,
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /credit-lines/:id/aging
 * Get aging report for a credit line.
 */
router.get('/:id/aging', async (req: Request, res: Response) => {
  try {
    const creditLine = await creditLineService.getCreditLineById(req.merchantId!, req.params.id);
    if (!creditLine) {
      res.status(404).json({ success: false, message: 'Credit line not found' });
      return;
    }

    const aging = await SupplierLedger.getAgingReport(
      req.merchantId!,
      creditLine.supplierId.toString()
    );

    res.json({
      success: true,
      data: aging,
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * POST /credit-lines/:id/close
 * Close a credit line.
 */
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      res.status(400).json({ success: false, message: 'Reason is required' });
      return;
    }

    const creditLine = await creditLineService.closeCreditLine(
      req.merchantId!,
      req.params.id,
      reason,
      req.merchantUserId
    );

    res.json({
      success: true,
      message: 'Credit line closed',
      data: creditLine,
    });
  } catch (err: unknown) {
    if (err.message.includes('not found')) {
      res.status(404).json({ success: false, message: err.message });
      return;
    }
    if (err.message.includes('outstanding')) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /credit-lines/:id/statement
 * Get supplier statement for a period.
 */
router.get('/:id/statement', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'startDate and endDate are required' });
      return;
    }

    const creditLine = await creditLineService.getCreditLineById(req.merchantId!, req.params.id);
    if (!creditLine) {
      res.status(404).json({ success: false, message: 'Credit line not found' });
      return;
    }

    const statement = await creditLineService.getSupplierStatement(
      req.merchantId!,
      creditLine.supplierId.toString(),
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: statement,
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg =
      process.env.NODE_ENV === 'production'
        ? `An error occurred. Reference: ${requestId || 'unknown'}`
        : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
