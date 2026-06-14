/**
 * Bulk Payment Routes
 *
 * Process multiple payments in a single request:
 * - Batch payment to multiple suppliers
 * - Payment scheduling
 * - Bulk payment approval workflow
 * - Payment status tracking
 */

import { Router, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { PurchaseOrder, POPaymentStatus } from '../models/PurchaseOrder';
import { Supplier } from '../models/Supplier';
import { SupplierLedger } from '../models/SupplierLedger';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors } from '../utils/response';
import { recordPOPayment, processGoodsReceipt, GoodsReceiptItem } from '../services/purchaseOrderService';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
type PaymentMethod = 'bank_transfer' | 'upi' | 'cash' | 'cheque' | 'card';

interface BulkPaymentItem {
  poId?: string;
  supplierId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  scheduledDate?: Date;
  paymentDate?: Date;
}

interface BulkPaymentRecord {
  _id: Types.ObjectId;
  batchId: string;
  merchantId: Types.ObjectId;
  payments: Array<{
    poId?: Types.ObjectId;
    poNumber?: string;
    supplierId: Types.ObjectId;
    supplierName?: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    notes?: string;
    status: PaymentStatus;
    error?: string;
    processedAt?: Date;
    transactionId?: string;
  }>;
  totalAmount: number;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  status: 'draft' | 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Validation Schemas ─────────────────────────────────────────────────────────

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId' }
);

const paymentItemSchema = z.object({
  poId: objectIdSchema.optional(),
  supplierId: objectIdSchema,
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['bank_transfer', 'upi', 'cash', 'cheque', 'card']),
  reference: z.string().optional(),
  notes: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
  paymentDate: z.string().datetime().optional(),
});

const createBulkPaymentSchema = z.object({
  payments: z.array(paymentItemSchema).min(1, 'At least one payment is required'),
  description: z.string().max(500).optional(),
  scheduleDate: z.string().datetime().optional(),
  requiresApproval: z.boolean().optional(),
  autoApproveThreshold: z.number().positive().optional(),
});

const processBulkPaymentSchema = z.object({
  batchId: z.string(),
  action: z.enum(['approve', 'process', 'cancel']),
  approvedBy: objectIdSchema.optional(),
  notes: z.string().optional(),
});

const listQuerySchema = z.object({
  status: z.enum(['draft', 'pending', 'processing', 'completed', 'failed', 'partial']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ── In-memory store for demo (replace with DB in production) ─────────────────────

// In production, use a dedicated BulkPayment collection
const bulkPayments: Map<string, BulkPaymentRecord> = new Map();

// ── Helper ─────────────────────────────────────────────────────────────────────

function handleError(res: Response, err: unknown, endpoint: string) {
  logger.error(`[BulkPayment] ${endpoint}`, { error: err });
  if (err instanceof z.ZodError) {
    errorResponse(res, errors.badRequest(err.errors[0].message));
  } else if (err instanceof Error) {
    errorResponse(res, errors.internal(err.message));
  } else {
    errorResponse(res, errors.internal('Unknown error'));
  }
}

/**
 * FIX (security): Replaced Math.random() with crypto.randomUUID()
 */
function generateBatchId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let random: string;
  try {
    const { randomUUID } = require('crypto');
    random = randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
  } catch {
    random = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  return `BP-${date}-${random}`;
}

async function getSupplierName(supplierId: string): Promise<string> {
  const supplier = await Supplier.findById(supplierId).select('name').lean();
  return supplier?.name || 'Unknown';
}

async function getPONumber(poId: string): Promise<string | undefined> {
  const po = await PurchaseOrder.findById(poId).select('poNumber').lean();
  return po?.poNumber;
}

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * POST /bulk-payments
 * Create a new bulk payment batch
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const bodyResult = createBulkPaymentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const { payments, description, scheduleDate, requiresApproval, autoApproveThreshold } = bodyResult.data;
    const batchId = generateBatchId();

    // Enrich payments with supplier names and PO numbers
    const enrichedPayments = await Promise.all(
      payments.map(async (p) => ({
        poId: p.poId ? new Types.ObjectId(p.poId) : undefined,
        poNumber: p.poId ? await getPONumber(p.poId) : undefined,
        supplierId: new Types.ObjectId(p.supplierId),
        supplierName: await getSupplierName(p.supplierId),
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        notes: p.notes,
        scheduledDate: p.scheduledDate,
        paymentDate: p.paymentDate,
        status: 'pending' as PaymentStatus,
      }))
    );

    const totalAmount = enrichedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Determine if approval is needed
    const needsApproval = requiresApproval || (autoApproveThreshold && totalAmount > autoApproveThreshold);

    const record: BulkPaymentRecord = {
      _id: new Types.ObjectId(),
      batchId,
      merchantId: new Types.ObjectId(req.merchantId),
      payments: enrichedPayments,
      totalAmount,
      totalCount: enrichedPayments.length,
      completedCount: 0,
      failedCount: 0,
      status: needsApproval ? 'pending' : 'draft',
      createdBy: new Types.ObjectId(req.merchantId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    bulkPayments.set(batchId, record);

    logger.info('[BulkPayment] Created batch', { batchId, totalAmount, count: enrichedPayments.length });

    res.status(201).json({
      success: true,
      data: record,
      message: `Bulk payment batch ${batchId} created`,
    });
  } catch (err) {
    handleError(res, err, 'POST /');
  }
});

/**
 * GET /bulk-payments
 * List bulk payment batches
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const queryResult = listQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      errorResponse(res, errors.badRequest(queryResult.error.errors[0].message));
      return;
    }

    const { status, dateFrom, dateTo, page, limit } = queryResult.data;
    const merchantId = req.merchantId;

    // Filter payments by merchant and status
    let filtered = Array.from(bulkPayments.values()).filter(
      (bp) => bp.merchantId.toString() === merchantId
    );

    if (status) {
      filtered = filtered.filter((bp) => bp.status === status);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((bp) => bp.createdAt >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      filtered = filtered.filter((bp) => bp.createdAt <= to);
    }

    // Sort by createdAt desc
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: {
        items: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    });
  } catch (err) {
    handleError(res, err, 'GET /');
  }
});

/**
 * GET /bulk-payments/stats
 * Dashboard statistics for bulk payments
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const payments = Array.from(bulkPayments.values());
    const totalBatches = payments.length;
    const pendingBatches = payments.filter((p) => p.status === 'pending').length;
    const processingBatches = payments.filter((p) => p.status === 'processing').length;
    const completedBatches = payments.filter((p) => p.status === 'completed').length;
    const totalAmount = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.totalCount, 0);
    const completedPayments = payments.reduce((sum, p) => sum + p.completedCount, 0);
    const failedPayments = payments.reduce((sum, p) => sum + p.failedCount, 0);

    res.json({
      success: true,
      data: {
        totalBatches,
        pendingBatches,
        processingBatches,
        completedBatches,
        totalAmount,
        totalPayments,
        completedPayments,
        failedPayments,
      },
    });
  } catch (err) {
    handleError(res, err, 'GET /stats');
  }
});

/**
 * GET /bulk-payments/:batchId
 * Get single bulk payment batch
 */
router.get('/:batchId', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const payment = bulkPayments.get(batchId);

    if (!payment || payment.merchantId.toString() !== req.merchantId) {
      errorResponse(res, errors.notFound('Bulk payment batch'));
      return;
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    handleError(res, err, 'GET /:batchId');
  }
});

/**
 * POST /bulk-payments/process
 * Process (approve and execute) a bulk payment batch
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const bodyResult = processBulkPaymentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const { batchId, action, approvedBy, notes } = bodyResult.data;
    const payment = bulkPayments.get(batchId);

    if (!payment || payment.merchantId.toString() !== req.merchantId) {
      errorResponse(res, errors.notFound('Bulk payment batch'));
      return;
    }

    if (action === 'cancel') {
      payment.status = 'cancelled' as unknown;
      payment.updatedAt = new Date();
      bulkPayments.set(batchId, payment);
      res.json({ success: true, data: payment, message: 'Bulk payment cancelled' });
      return;
    }

    if (action === 'approve') {
      payment.status = 'draft';
      payment.approvedBy = new Types.ObjectId(approvedBy);
      payment.approvedAt = new Date();
      payment.updatedAt = new Date();
      bulkPayments.set(batchId, payment);
      res.json({ success: true, data: payment, message: 'Bulk payment approved' });
      return;
    }

    // Process payments
    if (payment.status === 'processing') {
      errorResponse(res, errors.badRequest('Batch is already being processed'));
      return;
    }

    payment.status = 'processing';
    payment.updatedAt = new Date();
    bulkPayments.set(batchId, payment);

    // Process each payment
    let completedCount = 0;
    let failedCount = 0;

    for (const p of payment.payments) {
      if (p.status !== 'pending') continue;

      try {
        // If PO is provided, record payment against the PO
        if (p.poId) {
          await recordPOPayment(
            p.poId,
            {
              amount: p.amount,
              paymentMethod: p.paymentMethod,
              reference: p.reference,
              notes: p.notes,
              paymentDate: p.paymentDate || new Date(),
              recordedBy: payment.createdBy,
            }
          );
        }

        // Also create ledger entry
        if (p.supplierId) {
          await SupplierLedger.create({
            merchantId: payment.merchantId,
            supplierId: p.supplierId,
            type: 'credit',
            amount: p.amount,
            balance: 0, // Will be calculated
            reference: `BULK-${batchId}`,
            description: p.notes || `Bulk payment ${p.paymentMethod}`,
            paymentMethod: p.paymentMethod,
            // FIX (security): Replaced Math.random() with crypto.randomUUID()
            transactionId: (() => {
              try {
                const { randomUUID } = require('crypto');
                return `TXN-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 9)}`;
              } catch {
                return `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
              }
            })(),
            recordedBy: payment.createdBy,
          });
        }

        p.status = 'completed';
        p.processedAt = new Date();
        // FIX (security): Replaced Math.random() with crypto.randomUUID()
        p.transactionId = (() => {
          try {
            const { randomUUID } = require('crypto');
            return `TXN-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 9)}`;
          } catch {
            return `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          }
        })();
        completedCount++;
      } catch (err) {
        p.status = 'failed';
        p.error = err instanceof Error ? err.message : 'Unknown error';
        failedCount++;
        logger.error('[BulkPayment] Payment failed', { batchId, supplierId: p.supplierId, error: err });
      }
    }

    // Update batch status
    payment.completedCount = completedCount;
    payment.failedCount = failedCount;
    payment.processedAt = new Date();
    payment.status = failedCount === 0 ? 'completed' : completedCount === 0 ? 'failed' : 'partial';
    payment.updatedAt = new Date();
    bulkPayments.set(batchId, payment);

    logger.info('[BulkPayment] Batch processed', {
      batchId,
      completed: completedCount,
      failed: failedCount,
    });

    res.json({
      success: true,
      data: payment,
      message: `Processed ${completedCount} payments, ${failedCount} failed`,
    });
  } catch (err) {
    handleError(res, err, 'POST /process');
  }
});

/**
 * DELETE /bulk-payments/:batchId
 * Delete a draft/pending batch
 */
router.delete('/:batchId', async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;
    const payment = bulkPayments.get(batchId);

    if (!payment || payment.merchantId.toString() !== req.merchantId) {
      errorResponse(res, errors.notFound('Bulk payment batch'));
      return;
    }

    if (!['draft', 'pending'].includes(payment.status)) {
      errorResponse(res, errors.badRequest('Can only delete draft or pending batches'));
      return;
    }

    bulkPayments.delete(batchId);

    res.json({ success: true, message: 'Bulk payment batch deleted' });
  } catch (err) {
    handleError(res, err, 'DELETE /:batchId');
  }
});

/**
 * GET /bulk-payments/summary/suppliers
 * Get payment summary by supplier
 */
router.get('/summary/suppliers', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    const payments = Array.from(bulkPayments.values()).filter(
      (p) => p.merchantId.toString() === merchantId && p.status === 'completed'
    );

    // Aggregate by supplier
    const supplierSummary = new Map<string, { name: string; totalAmount: number; count: number }>();

    for (const bp of payments) {
      for (const p of bp.payments) {
        if (p.status !== 'completed') continue;
        const key = p.supplierId.toString();
        const existing = supplierSummary.get(key) || { name: p.supplierName || 'Unknown', totalAmount: 0, count: 0 };
        existing.totalAmount += p.amount;
        existing.count++;
        supplierSummary.set(key, existing);
      }
    }

    const summary = Array.from(supplierSummary.entries()).map(([supplierId, data]) => ({
      supplierId,
      ...data,
    }));

    res.json({ success: true, data: summary });
  } catch (err) {
    handleError(res, err, 'GET /summary/suppliers');
  }
});

export default router;
