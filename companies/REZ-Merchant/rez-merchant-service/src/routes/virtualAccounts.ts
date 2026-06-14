/**
 * Virtual Account Routes
 *
 * Manage virtual accounts for suppliers/customers:
 * - Create VA for supplier or customer
 * - List, get, update VA
 * - Activate, suspend, close
 * - Transaction history
 * - Payment webhook handler (for bank callbacks)
 */

import { Router, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { VirtualAccount, VirtualAccountStatus, BankCode } from '../models/VirtualAccount';
import { Supplier } from '../models/Supplier';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors } from '../utils/response';
import { logger } from '../config/logger';
import crypto from 'crypto';

const router = Router();

// ── Validation Schemas ─────────────────────────────────────────────────────────

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId' }
);

const createVASchema = z.object({
  linkedEntityType: z.enum(['supplier', 'customer', 'partner', 'internal']),
  linkedEntityId: objectIdSchema,
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  bankCode: z.enum(['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'YES', 'OTHER']).default('HDFC'),
  upiId: z.string().optional(),
  reference: z.string().optional(),
  maxTransactionAmount: z.number().positive().optional(),
  minTransactionAmount: z.number().min(1).optional(),
  dailyLimit: z.number().positive().optional(),
  monthlyLimit: z.number().positive().optional(),
  validUntil: z.string().datetime().optional(),
  notifyEmail: z.string().email().optional(),
  notifyPhone: z.string().optional(),
});

const updateVASchema = z.object({
  accountHolderName: z.string().min(1).optional(),
  upiId: z.string().optional(),
  maxTransactionAmount: z.number().positive().optional().nullable(),
  minTransactionAmount: z.number().min(1).optional().nullable(),
  dailyLimit: z.number().positive().optional().nullable(),
  monthlyLimit: z.number().positive().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
  notifyOnCredit: z.boolean().optional(),
  notifyEmail: z.string().email().optional().nullable(),
  notifyPhone: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

const listQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended', 'closed']).optional(),
  linkedEntityType: z.enum(['supplier', 'customer', 'partner', 'internal']).optional(),
  linkedEntityId: objectIdSchema.optional(),
  bankCode: z.enum(['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'YES', 'OTHER']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'totalCredits', 'totalTransactions']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Helper ─────────────────────────────────────────────────────────────────────

function handleError(res: Response, err: unknown, endpoint: string) {
  logger.error(`[VA] ${endpoint}`, { error: err });
  if (err instanceof z.ZodError) {
    errorResponse(res, errors.badRequest(err.errors[0].message));
  } else if (err instanceof Error) {
    errorResponse(res, errors.internal(err.message));
  } else {
    errorResponse(res, errors.internal('Unknown error'));
  }
}

// ── Webhook Routes (no auth) ──────────────────────────────────────────────────

/**
 * POST /virtual-accounts/webhook
 * Receive payment notifications from bank/aggregator
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { virtual_account_number, amount, transaction_id, transaction_type, timestamp } = req.body;

    if (!virtual_account_number) {
      errorResponse(res, errors.badRequest('Missing virtual_account_number'));
      return;
    }

    const va = await VirtualAccount.findByVANumber(virtual_account_number);
    if (!va) {
      errorResponse(res, errors.notFound('Virtual account'));
      return;
    }

    // Record transaction
    if (transaction_type === 'credit') {
      va.recordCredit(amount || 0);
      await va.save();

      // Emit event for real-time updates
      const { getIO } = await import('../config/socket');
      const io = getIO();
      if (io) {
        io.to(`merchant:${va.merchantId}`).emit('va:credit', {
          virtualAccountNumber: va.virtualAccountNumber,
          amount,
          transactionId: transaction_id,
        });
      }

      logger.info('[VA Webhook] Credit recorded', {
        van: virtual_account_number,
        amount,
        transactionId: transaction_id,
      });
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    logger.error('[VA Webhook] Error', { error: err });
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// ── Authenticated Routes ───────────────────────────────────────────────────────

router.use(merchantAuth);

/**
 * GET /virtual-accounts
 * List virtual accounts
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const queryResult = listQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      errorResponse(res, errors.badRequest(queryResult.error.errors[0].message));
      return;
    }

    const { status, linkedEntityType, linkedEntityId, bankCode, page, limit, sortBy, sortOrder } = queryResult.data;

    const query: Record<string, unknown> = {
      merchantId: new Types.ObjectId(req.merchantId),
      isDeleted: false,
    };

    if (status) query.status = status;
    if (linkedEntityType) query.linkedEntityType = linkedEntityType;
    if (linkedEntityId) query.linkedEntityId = new Types.ObjectId(linkedEntityId);
    if (bankCode) query.bankCode = bankCode;

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      VirtualAccount.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('linkedEntityId', 'name email phone')
        .lean(),
      VirtualAccount.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
      },
    });
  } catch (err) {
    handleError(res, err, 'GET /');
  }
});

/**
 * GET /virtual-accounts/stats
 * Dashboard stats for virtual accounts
 */
router.get('/stats', async (req: Response, res: Response) => {
  try {
    const merchantId = new Types.ObjectId(req.merchantId);

    const stats = await VirtualAccount.aggregate([
      { $match: { merchantId, isDeleted: false } },
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byBank: [{ $group: { _id: '$bankCode', count: { $sum: 1 } } }],
          totals: [{
            $group: {
              _id: null,
              totalAccounts: { $sum: 1 },
              totalCredits: { $sum: '$totalCredits' },
              totalDebits: { $sum: '$totalDebits' },
              totalTransactions: { $sum: '$totalTransactions' },
            },
          }],
        },
      },
    ]);

    const result = stats[0] || {};
    const statusCounts = Object.fromEntries((result.byStatus || []).map((s) => [s._id, s.count]));
    const bankCounts = Object.fromEntries((result.byBank || []).map((s) => [s._id, s.count]));
    const totals = result.totals?.[0] || {};

    res.json({
      success: true,
      data: {
        totalAccounts: totals.totalAccounts || 0,
        activeAccounts: statusCounts.active || 0,
        suspendedAccounts: statusCounts.suspended || 0,
        byBank: bankCounts,
        totalCredits: totals.totalCredits || 0,
        totalDebits: totals.totalDebits || 0,
        totalTransactions: totals.totalTransactions || 0,
      },
    });
  } catch (err) {
    handleError(res, err, 'GET /stats');
  }
});

/**
 * GET /virtual-accounts/:id
 * Get single virtual account
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let query: Record<string, unknown> = { merchantId: new Types.ObjectId(req.merchantId), isDeleted: false };

    // Support lookup by ID or VA number
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = new Types.ObjectId(id);
    } else {
      query.virtualAccountNumber = id.toUpperCase();
    }

    const va = await VirtualAccount.findOne(query)
      .populate('linkedEntityId', 'name email phone address')
      .lean();

    if (!va) {
      errorResponse(res, errors.notFound('Virtual account'));
      return;
    }

    res.json({ success: true, data: va });
  } catch (err) {
    handleError(res, err, 'GET /:id');
  }
});

/**
 * POST /virtual-accounts
 * Create a new virtual account
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const bodyResult = createVASchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const data = bodyResult.data;

    // Check if entity already has a VA
    const existing = await VirtualAccount.findOne({
      merchantId: new Types.ObjectId(req.merchantId),
      linkedEntityType: data.linkedEntityType,
      linkedEntityId: new Types.ObjectId(data.linkedEntityId),
      isDeleted: false,
    });

    if (existing) {
      errorResponse(res, errors.badRequest(`Entity already has virtual account: ${existing.virtualAccountNumber}`));
      return;
    }

    // Get entity name if not provided
    let accountHolderName = data.accountHolderName;
    if (!accountHolderName) {
      if (data.linkedEntityType === 'supplier') {
        const supplier = await Supplier.findById(data.linkedEntityId).select('name').lean();
        accountHolderName = supplier?.name || 'Unknown';
      }
    }

    const virtualAccountNumber = await VirtualAccount.generateAccountNumber();

    const va = new VirtualAccount({
      virtualAccountNumber,
      merchantId: new Types.ObjectId(req.merchantId),
      linkedEntityType: data.linkedEntityType,
      linkedEntityId: new Types.ObjectId(data.linkedEntityId),
      accountHolderName,
      bankCode: data.bankCode,
      upiId: data.upiId,
      reference: data.reference,
      maxTransactionAmount: data.maxTransactionAmount,
      minTransactionAmount: data.minTransactionAmount || 1,
      dailyLimit: data.dailyLimit,
      monthlyLimit: data.monthlyLimit,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      notifyOnCredit: true,
      notifyEmail: data.notifyEmail,
      notifyPhone: data.notifyPhone,
      status: 'active',
      validFrom: new Date(),
    });

    await va.save();

    logger.info('[VA] Created', { van: virtualAccountNumber, merchantId: req.merchantId });

    res.status(201).json({
      success: true,
      data: va,
      message: `Virtual account ${virtualAccountNumber} created`,
    });
  } catch (err) {
    handleError(res, err, 'POST /');
  }
});

/**
 * PUT /virtual-accounts/:id
 * Update virtual account settings
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid ID'));
      return;
    }

    const bodyResult = updateVASchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const va = await VirtualAccount.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!va) {
      errorResponse(res, errors.notFound('Virtual account'));
      return;
    }

    const data = bodyResult.data;

    // Handle status change
    if (data.status) {
      if (data.status === 'active') va.activate();
      else if (data.status === 'suspended') va.suspend('Manual suspension');
      else if (data.status === 'inactive') va.status = 'inactive';
    }

    // Update other fields
    if (data.accountHolderName) va.accountHolderName = data.accountHolderName;
    if (data.upiId !== undefined) va.upiId = data.upiId || undefined;
    if (data.maxTransactionAmount !== undefined) va.maxTransactionAmount = data.maxTransactionAmount;
    if (data.minTransactionAmount !== undefined) va.minTransactionAmount = data.minTransactionAmount;
    if (data.dailyLimit !== undefined) va.dailyLimit = data.dailyLimit;
    if (data.monthlyLimit !== undefined) va.monthlyLimit = data.monthlyLimit;
    if (data.validUntil !== undefined) va.validUntil = data.validUntil ? new Date(data.validUntil) : undefined;
    if (data.notifyOnCredit !== undefined) va.notifyOnCredit = data.notifyOnCredit;
    if (data.notifyEmail !== undefined) va.notifyEmail = data.notifyEmail || undefined;
    if (data.notifyPhone !== undefined) va.notifyPhone = data.notifyPhone || undefined;

    await va.save();

    res.json({ success: true, data: va, message: 'Virtual account updated' });
  } catch (err) {
    handleError(res, err, 'PUT /:id');
  }
});

/**
 * POST /virtual-accounts/:id/activate
 * Activate a suspended/inactive account
 */
router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid ID'));
      return;
    }

    const va = await VirtualAccount.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!va) {
      errorResponse(res, errors.notFound('Virtual account'));
      return;
    }

    va.activate();
    await va.save();

    res.json({ success: true, data: va, message: 'Virtual account activated' });
  } catch (err) {
    handleError(res, err, 'POST /:id/activate');
  }
});

/**
 * POST /virtual-accounts/:id/suspend
 * Suspend an active account
 */
router.post('/:id/suspend', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid ID'));
      return;
    }

    const { reason } = req.body;
    const va = await VirtualAccount.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!va) {
      errorResponse(res, errors.notFound('Virtual account'));
      return;
    }

    va.suspend(reason || 'Manual suspension');
    await va.save();

    res.json({ success: true, data: va, message: 'Virtual account suspended' });
  } catch (err) {
    handleError(res, err, 'POST /:id/suspend');
  }
});

/**
 * POST /virtual-accounts/:id/close
 * Close a virtual account
 */
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid ID'));
      return;
    }

    const { reason } = req.body;
    const va = await VirtualAccount.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!va) {
      errorResponse(res, errors.notFound('Virtual account'));
      return;
    }

    va.close(reason);
    await va.save();

    res.json({ success: true, message: 'Virtual account closed' });
  } catch (err) {
    handleError(res, err, 'POST /:id/close');
  }
});

/**
 * DELETE /virtual-accounts/:id
 * Soft delete (only if closed or no transactions)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid ID'));
      return;
    }

    const va = await VirtualAccount.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!va) {
      errorResponse(res, errors.notFound('Virtual account'));
      return;
    }

    if (va.totalTransactions > 0 && va.status !== 'closed') {
      errorResponse(res, errors.badRequest('Cannot delete account with transactions. Close it instead.'));
      return;
    }

    va.isDeleted = true;
    va.deletedAt = new Date();
    await va.save();

    res.json({ success: true, message: 'Virtual account deleted' });
  } catch (err) {
    handleError(res, err, 'DELETE /:id');
  }
});

export default router;
