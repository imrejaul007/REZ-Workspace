/**
 * Reconciliation Service
 *
 * Auto-reconciles payments with purchase orders and ledger entries.
 * Handles matching, dispute resolution, and reporting.
 */

import { Types } from 'mongoose';
import { SupplierLedger, ILedgerEntry } from '../models/SupplierLedger';
import { PurchaseOrder, POPaymentStatus } from '../models/PurchaseOrder';
import { Payment } from '../models/Payment';
import { logger } from '../config/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReconciliationStatus = 'pending' | 'matched' | 'partial' | 'unmatched' | 'disputed' | 'resolved';

export interface ReconciliationRecord {
  _id: Types.ObjectId;
  merchantId: Types.ObjectId;

  // Sources being reconciled
  source: 'ledger' | 'po' | 'payment' | 'bank';
  sourceId: Types.ObjectId;
  sourceRef?: string;

  // Match details
  matchedSource?: 'ledger' | 'po' | 'payment' | 'bank';
  matchedId?: Types.ObjectId;
  matchedRef?: string;
  matchedAmount: number;
  matchDifference: number; // Difference in amount (can be negative for overpayment)

  // Status
  status: ReconciliationStatus;
  matchConfidence: number; // 0-100
  matchReason?: string;

  // Timeline
  paymentDate?: Date;
  dueDate?: Date;
  reconciledAt?: Date;
  disputedAt?: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;

  // Financial details
  invoiceAmount?: number;
  paidAmount?: number;
  outstandingAmount?: number;

  // Counterparty
  supplierId?: Types.ObjectId;
  supplierName?: string;

  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store for demo (use DB in production)
const reconciliationRecords: Map<string, unknown> = new Map();

// ── Reconciliation Engine ─────────────────────────────────────────────────────

/**
 * Reconcile all pending ledger entries against POs and payments
 */
export async function runFullReconciliation(merchantId: string): Promise<{
  processed: number;
  matched: number;
  unmatched: number;
  disputed: number;
}> {
  const result = { processed: 0, matched: 0, unmatched: 0, disputed: 0 };

  // Get all unreconciled ledger entries
  const ledgerEntries = await SupplierLedger.find({
    merchantId: new Types.ObjectId(merchantId),
    reconciledAt: { $exists: false },
    isDeleted: false,
  }).populate('supplierId', 'name');

  for (const entry of ledgerEntries) {
    result.processed++;
    const matchResult = await reconcileEntry(merchantId, entry);

    if (matchResult.status === 'matched') {
      result.matched++;
    } else if (matchResult.status === 'disputed') {
      result.disputed++;
    } else {
      result.unmatched++;
    }
  }

  logger.info('[Reconciliation] Full run completed', { merchantId, ...result });
  return result;
}

/**
 * Reconcile a single ledger entry
 */
export async function reconcileEntry(
  merchantId: string,
  entry: ILedgerEntry
): Promise<{ status: ReconciliationStatus; matchConfidence: number; matchReason: string }> {
  // Try to match with a PO
  if (entry.reference) {
    const poByRef = await matchByReference(merchantId, entry);
    if (poByRef) return poByRef;
  }

  // Try to match by amount and date
  const byAmount = await matchByAmountAndDate(merchantId, entry);
  if (byAmount) return byAmount;

  // Try to match by supplier
  const bySupplier = await matchBySupplier(merchantId, entry);
  if (bySupplier) return bySupplier;

  return {
    status: 'unmatched',
    matchConfidence: 0,
    matchReason: 'No matching record found',
  };
}

/**
 * Match by reference number (UTR, transaction ID, etc.)
 */
async function matchByReference(
  merchantId: string,
  entry: ILedgerEntry
): Promise<{ status: ReconciliationStatus; matchConfidence: number; matchReason: string } | null> {
  if (!entry.reference) return null;

  // Try to find matching PO
  const po = await PurchaseOrder.findOne({
    merchantId: new Types.ObjectId(merchantId),
    $or: [
      { poNumber: { $regex: entry.reference, $options: 'i' } },
      { referenceNumber: { $regex: entry.reference, $options: 'i' } },
    ],
  });

  if (po) {
    // Check if amounts match
    const outstanding = po.totalAmount - (po.paidAmount || 0);
    const diff = Math.abs(entry.amount - outstanding);

    if (diff < 1) {
      return {
        status: 'matched',
        matchConfidence: 100,
        matchReason: `Exact match by PO reference ${po.poNumber}`,
      };
    } else if (diff <= outstanding * 0.1) {
      return {
        status: 'partial',
        matchConfidence: 80,
        matchReason: `Partial match (${diff.toFixed(2)} difference) by PO ${po.poNumber}`,
      };
    } else {
      return {
        status: 'disputed',
        matchConfidence: 50,
        matchReason: `Amount mismatch with PO ${po.poNumber}: expected ${outstanding}, got ${entry.amount}`,
      };
    }
  }

  // Try to find matching ledger entry (reverse)
  const reverseEntry = await SupplierLedger.findOne({
    merchantId: new Types.ObjectId(merchantId),
    _id: { $ne: entry._id },
    $or: [
      { reference: entry.reference },
      { transactionId: entry.transactionId },
    ],
  });

  if (reverseEntry && reverseEntry.type !== entry.type) {
    // This is a payment that matches an invoice
    return {
      status: 'matched',
      matchConfidence: 100,
      matchReason: 'Matched with reverse entry by reference',
    };
  }

  return null;
}

/**
 * Match by amount and date
 */
async function matchByAmountAndDate(
  merchantId: string,
  entry: ILedgerEntry
): Promise<{ status: ReconciliationStatus; matchConfidence: number; matchReason: string } | null> {
  const dateRange = 3; // days
  const fromDate = new Date(entry.createdAt);
  fromDate.setDate(fromDate.getDate() - dateRange);
  const toDate = new Date(entry.createdAt);
  toDate.setDate(toDate.getDate() + dateRange);

  // Find unreconciled POs
  const pos = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    reconciledAt: { $exists: false },
    status: { $nin: ['cancelled', 'draft'] },
  }).populate('supplierId', 'name');

  for (const po of pos) {
    const outstanding = po.totalAmount - (po.paidAmount || 0);

    // Check if amounts are close
    if (Math.abs(entry.amount - outstanding) < 10) {
      // Within ₹10 tolerance
      // Check if dates are within range
      const poDate = new Date(po.orderDate);
      if (poDate >= fromDate && poDate <= toDate) {
        return {
          status: 'matched',
          matchConfidence: 70,
          matchReason: `Match by amount (${entry.amount}) and date range`,
        };
      }
    }
  }

  return null;
}

/**
 * Match by supplier and amount
 */
async function matchBySupplier(
  merchantId: string,
  entry: ILedgerEntry
): Promise<{ status: ReconciliationStatus; matchConfidence: number; matchReason: string } | null> {
  if (!entry.supplierId) return null;

  // Find recent POs for this supplier
  const recentPOs = await PurchaseOrder.find({
    merchantId: new Types.ObjectId(merchantId),
    supplierId: entry.supplierId,
    reconciledAt: { $exists: false },
    paymentStatus: { $ne: POPaymentStatus.PAID },
  })
    .sort({ orderDate: -1 })
    .limit(5);

  for (const po of recentPOs) {
    const outstanding = po.totalAmount - (po.paidAmount || 0);

    // If amounts match exactly or very closely
    if (Math.abs(entry.amount - outstanding) < 1) {
      return {
        status: 'matched',
        matchConfidence: 60,
        matchReason: `Match by supplier and amount`,
      };
    }
  }

  return null;
}

// ── Manual Reconciliation ──────────────────────────────────────────────────────

/**
 * Manually reconcile two records
 */
export async function manualReconcile(
  merchantId: string,
  sourceType: 'ledger' | 'po' | 'payment' | 'bank',
  sourceId: string,
  targetType: 'ledger' | 'po' | 'payment' | 'bank',
  targetId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Mark source as reconciled
    if (sourceType === 'ledger') {
      await SupplierLedger.findByIdAndUpdate(sourceId, { reconciledAt: new Date() });
    } else if (sourceType === 'po') {
      await PurchaseOrder.findByIdAndUpdate(sourceId, { reconciledAt: new Date() });
    }

    logger.info('[Reconciliation] Manual reconcile', {
      merchantId,
      source: `${sourceType}:${sourceId}`,
      target: `${targetType}:${targetId}`,
    });

    return { success: true, message: 'Records reconciled successfully' };
  } catch (err) {
    logger.error('[Reconciliation] Manual reconcile failed', { error: err });
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Reconciliation failed',
    };
  }
}

/**
 * Mark record as disputed
 */
export async function disputeRecord(
  merchantId: string,
  recordType: 'ledger' | 'po' | 'payment' | 'bank',
  recordId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    const update: unknown = {
      disputedAt: new Date(),
      status: 'disputed',
    };

    if (recordType === 'ledger') {
      await SupplierLedger.findByIdAndUpdate(recordId, update);
    } else if (recordType === 'po') {
      await PurchaseOrder.findByIdAndUpdate(recordId, update);
    }

    logger.info('[Reconciliation] Record disputed', {
      merchantId,
      type: recordType,
      id: recordId,
      reason,
    });

    return { success: true, message: 'Record marked as disputed' };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Dispute failed',
    };
  }
}

/**
 * Resolve a disputed record
 */
export async function resolveDispute(
  merchantId: string,
  recordType: 'ledger' | 'po' | 'payment' | 'bank',
  recordId: string,
  resolution: 'write_off' | 'adjust' | 'recover' | 'other',
  notes: string
): Promise<{ success: boolean; message: string }> {
  try {
    const update: unknown = {
      resolvedAt: new Date(),
      status: 'resolved',
      resolutionNotes: notes,
    };

    if (recordType === 'ledger') {
      await SupplierLedger.findByIdAndUpdate(recordId, update);
    } else if (recordType === 'po') {
      await PurchaseOrder.findByIdAndUpdate(recordId, update);
    }

    logger.info('[Reconciliation] Dispute resolved', {
      merchantId,
      type: recordType,
      id: recordId,
      resolution,
    });

    return { success: true, message: `Dispute resolved as ${resolution}` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Resolution failed',
    };
  }
}

// ── Reports ────────────────────────────────────────────────────────────────────

/**
 * Get reconciliation summary
 */
export async function getReconciliationSummary(merchantId: string): Promise<{
  totalRecords: number;
  matched: number;
  unmatched: number;
  disputed: number;
  resolved: number;
  totalMatchedAmount: number;
  totalUnmatchedAmount: number;
}> {
  const ledgerEntries = await SupplierLedger.find({
    merchantId: new Types.ObjectId(merchantId),
    isDeleted: false,
  });

  const matched = ledgerEntries.filter((e) => (e as unknown).reconciledAt).length;
  const disputed = ledgerEntries.filter((e) => (e as unknown).status === 'disputed').length;
  const resolved = ledgerEntries.filter((e) => (e as unknown).status === 'resolved').length;

  const unmatched = ledgerEntries.filter(
    (e) => !(e as unknown).reconciledAt && (e as unknown).status !== 'disputed' && (e as unknown).status !== 'resolved'
  ).length;

  const matchedAmount = ledgerEntries
    .filter((e) => (e as unknown).reconciledAt)
    .reduce((sum, e) => sum + e.amount, 0);

  const unmatchedAmount = ledgerEntries
    .filter((e) => !(e as unknown).reconciledAt)
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    totalRecords: ledgerEntries.length,
    matched,
    unmatched,
    disputed,
    resolved,
    totalMatchedAmount: matchedAmount,
    totalUnmatchedAmount: unmatchedAmount,
  };
}
