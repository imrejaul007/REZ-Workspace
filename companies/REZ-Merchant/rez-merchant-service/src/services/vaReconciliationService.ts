/**
 * Virtual Account Auto-Reconciliation Service
 *
 * Automatically matches incoming payments to outstanding invoices:
 * - UPI payment matching by amount
 * - Bank statement parsing
 * - Smart matching with fuzzy logic
 * - Manual reconciliation fallback
 */

import { Types } from 'mongoose';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { SupplierLedger } from '../models/SupplierLedger';
import { VirtualAccount } from '../models/VirtualAccount';
import { logger } from '../config/logger';
import { redis } from '../config/redis';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaymentTransaction {
  id: string;
  amount: number;
  utrNumber: string;
  senderVpa?: string;
  senderAccount?: string;
  senderName?: string;
  timestamp: Date;
  paymentMode: 'upi' | 'neft' | 'rtgs' | 'imps' | 'bank_transfer';
  reference?: string;
}

export interface ReconciliationResult {
  success: boolean;
  matched: boolean;
  transactionId?: string;
  poId?: string;
  poNumber?: string;
  amount?: number;
  matchedAmount?: number;
  difference?: number;
  confidence: number; // 0-1
  matchType?: 'exact' | 'partial' | 'fuzzy';
  autoAction?: 'auto_reconcile' | 'needs_review' | 'create_dispute';
}

// ── Configuration ─────────────────────────────────────────────────────────────

const MATCH_CONFIDENCE_THRESHOLD = 0.85; // Auto-match above this
const PARTIAL_MATCH_THRESHOLD = 0.6; // Needs review above this
const AMOUNT_TOLERANCE_PERCENT = 0.01; // 1% tolerance for rounding

// ── Main Reconciliation Functions ─────────────────────────────────────────────

export async function reconcilePayment(
  merchantId: string,
  transaction: PaymentTransaction
): Promise<ReconciliationResult> {
  logger.info(`[VA-Reconcile] Processing transaction ${transaction.utrNumber}`);

  // Check for exact match by UTR
  const exactMatch = await findExactMatch(merchantId, transaction);
  if (exactMatch.matched && exactMatch.confidence >= MATCH_CONFIDENCE_THRESHOLD) {
    await autoReconcile(merchantId, exactMatch, transaction);
    return exactMatch;
  }

  // Check for partial match by amount
  const partialMatch = await findPartialMatch(merchantId, transaction);
  if (partialMatch.matched && partialMatch.confidence >= PARTIAL_MATCH_THRESHOLD) {
    return partialMatch;
  }

  // Try fuzzy match with supplier name
  const fuzzyMatch = await findFuzzyMatch(merchantId, transaction);
  if (fuzzyMatch.matched) {
    return fuzzyMatch;
  }

  // No match found - create unmatched record
  await createUnmatchedRecord(merchantId, transaction);

  return {
    success: true,
    matched: false,
    transactionId: transaction.id,
    confidence: 0,
    autoAction: 'create_dispute',
  };
}

/**
 * Find exact match by UTR reference or exact amount match
 */
async function findExactMatch(
  merchantId: string,
  transaction: PaymentTransaction
): Promise<ReconciliationResult> {
  // Try to find PO by reference (UTR in notes or reference field)
  const pos = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    paymentStatus: { $in: ['unpaid', 'partial'] },
    isDeleted: { $ne: true },
    $or: [
      { 'notes': { $regex: transaction.utrNumber, $options: 'i' } },
      { 'paymentReferences': transaction.utrNumber },
    ],
  }).lean();

  if (pos.length === 1) {
    const po = pos[0];
    const outstanding = po.totalAmount - (po.paidAmount || 0);

    if (Math.abs(transaction.amount - outstanding) <= transaction.amount * AMOUNT_TOLERANCE_PERCENT) {
      return {
        success: true,
        matched: true,
        transactionId: transaction.id,
        poId: po._id.toString(),
        poNumber: po.poNumber,
        amount: outstanding,
        matchedAmount: transaction.amount,
        confidence: 1.0,
        matchType: 'exact',
        autoAction: 'auto_reconcile',
      };
    }
  }

  return { success: true, matched: false, confidence: 0 };
}

/**
 * Find partial match by amount (within tolerance)
 */
async function findPartialMatch(
  merchantId: string,
  transaction: PaymentTransaction
): Promise<ReconciliationResult> {
  // Find POs with similar outstanding amounts
  const minAmount = transaction.amount * (1 - AMOUNT_TOLERANCE_PERCENT);
  const maxAmount = transaction.amount * (1 + AMOUNT_TOLERANCE_PERCENT);

  const pos = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    paymentStatus: { $in: ['unpaid', 'partial'] },
    isDeleted: { $ne: true },
    $expr: {
      $and: [
        { $gte: [{ $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] }, minAmount] },
        { $lte: [{ $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] }, maxAmount] },
      ],
    },
  })
    .sort({ dueDate: 1 }) // Prefer earliest due
    .limit(5)
    .lean();

  if (pos.length === 1) {
    const po = pos[0];
    const outstanding = po.totalAmount - (po.paidAmount || 0);
    const difference = Math.abs(transaction.amount - outstanding);
    const confidence = 1 - (difference / outstanding);

    return {
      success: true,
      matched: true,
      transactionId: transaction.id,
      poId: po._id.toString(),
      poNumber: po.poNumber,
      amount: outstanding,
      matchedAmount: transaction.amount,
      difference,
      confidence,
      matchType: 'partial',
      autoAction: confidence >= MATCH_CONFIDENCE_THRESHOLD ? 'auto_reconcile' : 'needs_review',
    };
  }

  if (pos.length > 1) {
    // Multiple candidates - needs review
    return {
      success: true,
      matched: true,
      confidence: 0.5,
      matchType: 'partial',
      autoAction: 'needs_review',
    };
  }

  return { success: true, matched: false, confidence: 0 };
}

/**
 * Find fuzzy match using supplier info
 */
async function findFuzzyMatch(
  merchantId: string,
  transaction: PaymentTransaction
): Promise<ReconciliationResult> {
  if (!transaction.senderName && !transaction.senderVpa) {
    return { success: true, matched: false, confidence: 0 };
  }

  // Search for supplier by name in sender info
  const searchTerms: string[] = [];
  if (transaction.senderName) searchTerms.push(...transaction.senderName.split(' '));
  if (transaction.senderVpa) searchTerms.push(transaction.senderVpa.split('@')[0]);

  // Find suppliers matching sender
  const suppliers = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    paymentStatus: { $in: ['unpaid', 'partial'] },
    isDeleted: { $ne: true },
  })
    .populate('supplierId', 'name')
    .limit(10)
    .lean();

  for (const po of suppliers) {
    const supplier = (po.supplierId as unknown)?.name || po.supplierName || '';
    const outstanding = po.totalAmount - (po.paidAmount || 0);

    // Check if any search term matches supplier name
    const matched = searchTerms.some((term) =>
      supplier.toLowerCase().includes(term.toLowerCase())
    );

    if (matched) {
      const amountMatch = Math.abs(transaction.amount - outstanding) / outstanding < 0.2; // 20% tolerance

      if (amountMatch) {
        return {
          success: true,
          matched: true,
          transactionId: transaction.id,
          poId: po._id.toString(),
          poNumber: po.poNumber,
          amount: outstanding,
          matchedAmount: transaction.amount,
          confidence: 0.65,
          matchType: 'fuzzy',
          autoAction: 'needs_review',
        };
      }
    }
  }

  return { success: true, matched: false, confidence: 0 };
}

/**
 * Auto-reconcile a matched payment
 */
async function autoReconcile(
  merchantId: string,
  match: ReconciliationResult,
  transaction: PaymentTransaction
): Promise<void> {
  if (!match.poId || !match.matchedAmount) return;

  try {
    // Update PO
    const po = await PurchaseOrder.findOneAndUpdate(
      { _id: new Types.ObjectId(match.poId), merchantId: new Types.ObjectId(merchantId) },
      {
        $inc: { paidAmount: match.matchedAmount },
        $set: {
          paymentStatus:
            match.matchedAmount >= match.amount! ? 'paid' : 'partial',
        },
        $push: {
          payments: {
            amount: match.matchedAmount,
            method: transaction.paymentMode,
            reference: transaction.utrNumber,
            date: transaction.timestamp,
            notes: `Auto-reconciled via UPI/Bank transfer`,
          },
          paymentHistory: {
            action: 'payment_recorded',
            amount: match.matchedAmount,
            timestamp: new Date(),
            method: transaction.paymentMode,
            reference: transaction.utrNumber,
          },
        },
      },
      { new: true }
    );

    // Create ledger entry
    await SupplierLedger.create({
      merchantId: new Types.ObjectId(merchantId),
      supplierId: po?.supplierId,
      entryType: 'payment',
      debitAmount: match.matchedAmount,
      creditAmount: 0,
      balanceAfter: 0, // Will be recalculated
      description: `Payment received via ${transaction.paymentMode.toUpperCase()}`,
      reference: transaction.utrNumber,
      referenceId: match.poId,
      isOverdue: false,
      dueDate: po?.dueDate,
    });

    // Cache invalidation
    await redis.del(`po:${match.poId}`);
    await redis.del(`supplier-ledger:${merchantId}:${po?.supplierId}`);

    logger.info(`[VA-Reconcile] Auto-reconciled ${match.poNumber} for ₹${match.matchedAmount}`);
  } catch (err) {
    logger.error(`[VA-Reconcile] Auto-reconcile failed`, { error: err });
    throw err;
  }
}

/**
 * Create unmatched payment record for manual review
 */
async function createUnmatchedRecord(
  merchantId: string,
  transaction: PaymentTransaction
): Promise<void> {
  // Store in Redis for quick lookup
  const key = `unmatched:${merchantId}:${transaction.utrNumber}`;
  await redis.setex(
    key,
    30 * 24 * 60 * 60, // 30 days
    JSON.stringify({
      transaction,
      merchantId,
      createdAt: new Date().toISOString(),
    })
  );

  logger.info(`[VA-Reconcile] Created unmatched record for UTR ${transaction.utrNumber}`);
}

/**
 * Get unmatched payments for manual review
 */
export async function getUnmatchedPayments(
  merchantId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{
  payments: Array<{
    utrNumber: string;
    amount: number;
    senderVpa?: string;
    timestamp: Date;
    paymentMode: string;
  }>;
  total: number;
}> {
  const pattern = `unmatched:${merchantId}:*`;
  const keys = await redis.keys(pattern);
  const total = keys.length;

  const payments: Array<{
    utrNumber: string;
    amount: number;
    senderVpa?: string;
    timestamp: Date;
    paymentMode: string;
  }> = [];

  const offset = options.offset || 0;
  const limit = options.limit || 20;
  const paginatedKeys = keys.slice(offset, offset + limit);

  for (const key of paginatedKeys) {
    const data = await redis.get(key);
    if (data) {
      const parsed = JSON.parse(data);
      payments.push({
        utrNumber: parsed.transaction.utrNumber,
        amount: parsed.transaction.amount,
        senderVpa: parsed.transaction.senderVpa,
        timestamp: new Date(parsed.transaction.timestamp),
        paymentMode: parsed.transaction.paymentMode,
      });
    }
  }

  return { payments, total };
}

/**
 * Manual reconciliation by admin
 */
export async function manualReconcile(
  merchantId: string,
  utrNumber: string,
  poId: string,
  amount: number
): Promise<ReconciliationResult> {
  const po = await PurchaseOrder.findOne({
    _id: new Types.ObjectId(poId),
    merchantId: new Types.ObjectId(merchantId),
  });

  if (!po) {
    return { success: false, matched: false, confidence: 0 };
  }

  const outstanding = po.totalAmount - (po.paidAmount || 0);
  const reconcileAmount = Math.min(amount, outstanding);

  // Update PO
  await PurchaseOrder.findByIdAndUpdate(poId, {
    $inc: { paidAmount: reconcileAmount },
    $set: {
      paymentStatus: reconcileAmount >= outstanding ? 'paid' : 'partial',
    },
    $push: {
      payments: {
        amount: reconcileAmount,
        method: 'bank_transfer',
        reference: utrNumber,
        date: new Date(),
        notes: 'Manual reconciliation',
      },
    },
  });

  // Create ledger entry
  await SupplierLedger.create({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: po.supplierId,
    entryType: 'payment',
    debitAmount: reconcileAmount,
    creditAmount: 0,
    description: `Manual reconciliation - UTR: ${utrNumber}`,
    reference: utrNumber,
    referenceId: poId,
  });

  // Remove from unmatched
  await redis.del(`unmatched:${merchantId}:${utrNumber}`);

  logger.info(`[VA-Reconcile] Manual reconcile ${po.poNumber} for ₹${reconcileAmount}`);

  return {
    success: true,
    matched: true,
    transactionId: utrNumber,
    poId,
    poNumber: po.poNumber,
    amount: outstanding,
    matchedAmount: reconcileAmount,
    confidence: 1.0,
    matchType: 'exact',
    autoAction: 'auto_reconcile',
  };
}
