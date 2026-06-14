/**
 * Purchase Order Service
 *
 * Business logic layer for purchase order operations:
 * - PO number generation
 * - Due date calculation
 * - Total calculation
 * - Status transition validation
 * - Credit limit checks
 * - Overdue PO queries
 * - Supplier aging reports
 */

import mongoose, { ClientSession, Types } from 'mongoose';
import { PurchaseOrder, IPurchaseOrder, IPOItem } from '../models/PurchaseOrder';
import { Supplier } from '../models/Supplier';
import {
  POStatus,
  POPaymentStatus,
  isValidPOStatusTransition,
  isValidPaymentStatusTransition,
  getValidNextStatuses,
  isTerminalStatus,
} from '../config/purchaseOrderTransitions';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

// ── PO Number Generation ───────────────────────────────────────────────────────

/**
 * Generate a unique PO number in format PO-YYYYMMDD-XXXX
 * @returns Unique PO number
 */
export async function generatePONumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const prefix = `PO-${dateStr}-`;

  // Use Redis INCR for atomic counter with daily reset
  const counterKey = `po:counter:${dateStr}`;
  let counter: number;

  try {
    // Try to increment the counter
    counter = await redis.incr(counterKey);

    // Set TTL to expire at midnight (24 hours from now, but max 48 hours for safety)
    const ttl = 48 * 60 * 60;
    await redis.expire(counterKey, ttl);
  } catch (err) {
    // Redis unavailable - fallback to MongoDB
    logger.warn('[PO Service] Redis unavailable, using MongoDB fallback for PO counter');
    const lastPO = await PurchaseOrder.findOne({ poNumber: { $regex: `^${prefix}` } })
      .sort({ poNumber: -1 })
      .lean()
      .select('poNumber');

    if (lastPO) {
      const lastNum = parseInt(lastPO.poNumber.split('-').pop() || '0', 10);
      counter = lastNum + 1;
    } else {
      counter = 1;
    }
  }

  return `${prefix}${counter.toString().padStart(4, '0')}`;
}

// ── Due Date Calculation ──────────────────────────────────────────────────────

/**
 * Calculate due date based on supplier's credit period
 * @param supplierId - Supplier ObjectId
 * @param orderDate - Order date (defaults to now)
 * @returns Due date
 */
export async function calculateDueDate(
  supplierId: Types.ObjectId,
  orderDate: Date = new Date()
): Promise<Date> {
  const supplier = await Supplier.findById(supplierId).select('creditPeriodDays paymentTerms').lean();

  if (!supplier) {
    logger.warn('[PO Service] Supplier not found for due date calculation', { supplierId });
    // Default to 30 days if supplier not found
    const defaultDueDate = new Date(orderDate);
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    return defaultDueDate;
  }

  const creditPeriodDays = (supplier as unknown).creditPeriodDays || 30;
  const dueDate = new Date(orderDate);
  dueDate.setDate(dueDate.getDate() + creditPeriodDays);

  logger.debug('[PO Service] Calculated due date', {
    supplierId,
    orderDate,
    creditPeriodDays,
    dueDate,
  });

  return dueDate;
}

// ── Total Calculations ────────────────────────────────────────────────────────

export interface CalculatedTotals {
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  totalAmount: number;
}

/**
 * Calculate totals for PO items
 * @param items - Array of PO items
 * @returns Calculated totals
 */
export function calculateTotals(items: IPOItem[]): CalculatedTotals {
  let subtotal = 0;
  let totalDiscount = 0;
  let taxAmount = 0;

  for (const item of items) {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = item.discount || 0;
    const itemTaxable = itemSubtotal - itemDiscount;
    const itemTax = itemTaxable * ((item.taxRate || 0) / 100);

    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;
    taxAmount += itemTax;
  }

  const totalAmount = subtotal - totalDiscount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

// ── Status Transition Validation ──────────────────────────────────────────────

export interface StatusTransitionResult {
  valid: boolean;
  error?: string;
  allowedTransitions?: POStatus[];
}

/**
 * Validate if a status transition is allowed
 * @param currentStatus - Current status
 * @param newStatus - Desired new status
 * @returns Validation result
 */
export function validateStatusTransition(
  currentStatus: POStatus,
  newStatus: POStatus
): StatusTransitionResult {
  // Check if current status is terminal
  if (isTerminalStatus(currentStatus)) {
    return {
      valid: false,
      error: `Cannot transition from terminal status '${currentStatus}'`,
    };
  }

  // Validate transition
  if (!isValidPOStatusTransition(currentStatus, newStatus)) {
    const allowed = getValidNextStatuses(currentStatus);
    return {
      valid: false,
      error: `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
      allowedTransitions: allowed,
    };
  }

  return { valid: true, allowedTransitions: getValidNextStatuses(newStatus) };
}

/**
 * Validate payment status transition
 */
export function validatePaymentStatusTransition(
  currentStatus: POPaymentStatus,
  newStatus: POPaymentStatus,
  amount?: number
): StatusTransitionResult {
  if (!isValidPaymentStatusTransition(currentStatus, newStatus)) {
    return {
      valid: false,
      error: `Invalid payment status transition from '${currentStatus}' to '${newStatus}'`,
    };
  }

  return { valid: true };
}

// ── Credit Limit Checks ───────────────────────────────────────────────────────

export interface CreditCheckResult {
  allowed: boolean;
  error?: string;
  currentBalance?: number;
  creditLimit?: number;
  availableCredit?: number;
}

/**
 * Check if adding this PO would exceed supplier credit limit
 * @param supplierId - Supplier ObjectId
 * @param totalAmount - Total amount of the PO
 * @param excludePoId - Optional PO ID to exclude from calculation (for updates)
 * @returns Credit check result
 */
export async function checkCreditLimit(
  supplierId: Types.ObjectId,
  totalAmount: number,
  excludePoId?: Types.ObjectId
): Promise<CreditCheckResult> {
  const supplier = await Supplier.findById(supplierId).lean();

  if (!supplier) {
    return {
      allowed: false,
      error: 'Supplier not found',
    };
  }

  const creditLimit = (supplier as unknown).creditLimit || 0;
  if (creditLimit === 0) {
    // No credit limit set - allow all
    return { allowed: true };
  }

  // Calculate current outstanding amount for this supplier
  const matchQuery: Record<string, unknown> = {
    supplierId,
    isDeleted: false,
    paymentStatus: { $ne: POPaymentStatus.PAID },
    status: { $nin: [POStatus.CANCELLED, POStatus.DRAFT, POStatus.REJECTED] },
  };

  if (excludePoId) {
    matchQuery._id = { $ne: excludePoId };
  }

  const outstandingResult = await PurchaseOrder.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalOutstanding: {
          $sum: { $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] },
        },
      },
    },
  ]);

  const currentOutstanding = outstandingResult[0]?.totalOutstanding || 0;
  const projectedOutstanding = currentOutstanding + totalAmount;
  const availableCredit = creditLimit - currentOutstanding;

  if (projectedOutstanding > creditLimit) {
    return {
      allowed: false,
      error: `Order exceeds credit limit. Available credit: ${availableCredit.toFixed(2)}, Order total: ${totalAmount.toFixed(2)}`,
      currentBalance: currentOutstanding,
      creditLimit,
      availableCredit,
    };
  }

  return {
    allowed: true,
    currentBalance: currentOutstanding,
    creditLimit,
    availableCredit,
  };
}

// ── Overdue POs ───────────────────────────────────────────────────────────────

export interface OverduePO {
  poNumber: string;
  supplierId: Types.ObjectId;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: Date;
  daysOverdue: number;
}

/**
 * Get all overdue POs for a merchant
 * @param merchantId - Merchant ObjectId
 * @returns Array of overdue POs
 */
export async function getOverduePOs(merchantId: Types.ObjectId): Promise<OverduePO[]> {
  const now = new Date();

  const overduePOs = await PurchaseOrder.find({
    merchantId,
    isDeleted: false,
    paymentStatus: { $ne: POPaymentStatus.PAID },
    status: { $nin: [POStatus.CANCELLED, POStatus.DRAFT, POStatus.REJECTED] },
    dueDate: { $lt: now },
  })
    .populate('supplierId', 'name')
    .sort({ dueDate: 1 })
    .lean();

  return overduePOs.map((po) => {
    const outstandingAmount = (po.totalAmount || 0) - (po.paidAmount || 0);
    const daysOverdue = Math.floor((now.getTime() - (po.dueDate?.getTime() || 0)) / (1000 * 60 * 60 * 24));

    return {
      poNumber: po.poNumber,
      supplierId: po.supplierId as unknown as Types.ObjectId,
      supplierName: (po.supplierId as unknown)?.name || po.supplierName || 'Unknown',
      totalAmount: po.totalAmount || 0,
      paidAmount: po.paidAmount || 0,
      outstandingAmount,
      dueDate: po.dueDate!,
      daysOverdue,
    };
  });
}

// ── Supplier Aging Report ─────────────────────────────────────────────────────

export interface SupplierAgingBucket {
  supplierId: Types.ObjectId;
  supplierName: string;
  totalOutstanding: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  over90: number;
  poCount: number;
}

/**
 * Get aging report for all suppliers or a specific supplier
 * @param merchantId - Merchant ObjectId
 * @param supplierId - Optional supplier ObjectId
 * @returns Array of aging buckets
 */
export async function bulkGetSupplierAging(
  merchantId: Types.ObjectId,
  supplierId?: Types.ObjectId
): Promise<SupplierAgingBucket[]> {
  const matchStage: Record<string, unknown> = {
    merchantId,
    isDeleted: false,
    paymentStatus: { $ne: POPaymentStatus.PAID },
    status: { $nin: [POStatus.CANCELLED, POStatus.DRAFT, POStatus.REJECTED] },
  };

  if (supplierId) {
    matchStage.supplierId = supplierId;
  }

  const now = new Date();

  const result = await PurchaseOrder.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        outstanding: { $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] },
        daysPastDue: {
          $divide: [
            { $subtract: [now, { $ifNull: ['$dueDate', '$createdAt'] }] },
            86400000, // milliseconds per day
          ],
        },
      },
    },
    {
      $group: {
        _id: '$supplierId',
        supplierName: { $first: '$supplierName' },
        totalOutstanding: { $sum: '$outstanding' },
        current: {
          $sum: { $cond: [{ $lte: ['$daysPastDue', 0] }, '$outstanding', 0] },
        },
        days30: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$daysPastDue', 0] }, { $lte: ['$daysPastDue', 30] }] },
              '$outstanding',
              0,
            ],
          },
        },
        days60: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$daysPastDue', 30] }, { $lte: ['$daysPastDue', 60] }] },
              '$outstanding',
              0,
            ],
          },
        },
        days90: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$daysPastDue', 60] }, { $lte: ['$daysPastDue', 90] }] },
              '$outstanding',
              0,
            ],
          },
        },
        over90: {
          $sum: { $cond: [{ $gt: ['$daysPastDue', 90] }, '$outstanding', 0] },
        },
        poCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'suppliers',
        localField: '_id',
        foreignField: '_id',
        as: 'supplier',
      },
    },
    {
      $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        _id: 0,
        supplierId: '$_id',
        supplierName: { $ifNull: ['$supplier.name', '$supplierName', 'Unknown Supplier'] },
        totalOutstanding: { $round: ['$totalOutstanding', 2] },
        current: { $round: ['$current', 2] },
        days30: { $round: ['$days30', 2] },
        days60: { $round: ['$days60', 2] },
        days90: { $round: ['$days90', 2] },
        over90: { $round: ['$over90', 2] },
        poCount: 1,
      },
    },
    { $sort: { totalOutstanding: -1 } },
  ]);

  return result;
}

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export interface PODashboardStats {
  totalPOs: number;
  totalValue: number;
  pendingApproval: number;
  pendingDelivery: number;
  overdue: number;
  thisMonthCount: number;
  thisMonthValue: number;
  outstandingAmount: number;
  paidThisMonth: number;
}

/**
 * Get dashboard statistics for POs
 * @param merchantId - Merchant ObjectId
 * @param storeId - Optional store ObjectId
 * @returns Dashboard stats
 */
export async function getPODashboardStats(
  merchantId: Types.ObjectId,
  storeId?: Types.ObjectId
): Promise<PODashboardStats> {
  const baseMatch: Record<string, unknown> = {
    merchantId,
    isDeleted: false,
  };

  if (storeId) {
    baseMatch.storeId = storeId;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Run parallel aggregations
  const [summaryStats, statusStats, paymentStats, thisMonthStats] = await Promise.all([
    // Summary stats
    PurchaseOrder.aggregate([
      { $match: { ...baseMatch, status: { $nin: [POStatus.CANCELLED] } } },
      {
        $group: {
          _id: null,
          totalPOs: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' },
        },
      },
    ]),

    // Status breakdown
    PurchaseOrder.aggregate([
      {
        $match: {
          ...baseMatch,
          status: {
            $in: [POStatus.PENDING_APPROVAL, POStatus.APPROVED, POStatus.ORDERED],
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Payment stats
    PurchaseOrder.aggregate([
      {
        $match: {
          ...baseMatch,
          paymentStatus: { $ne: POPaymentStatus.PAID },
          status: { $nin: [POStatus.CANCELLED, POStatus.DRAFT, POStatus.REJECTED] },
        },
      },
      {
        $group: {
          _id: null,
          outstandingAmount: {
            $sum: { $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] },
          },
        },
      },
    ]),

    // This month stats
    PurchaseOrder.aggregate([
      {
        $match: {
          ...baseMatch,
          createdAt: { $gte: startOfMonth },
          status: { $nin: [POStatus.CANCELLED] },
        },
      },
      {
        $group: {
          _id: null,
          thisMonthCount: { $sum: 1 },
          thisMonthValue: { $sum: '$totalAmount' },
        },
      },
    ]),

    // Paid this month (from payment records)
    PurchaseOrder.aggregate([
      {
        $match: {
          ...baseMatch,
          status: { $nin: [POStatus.CANCELLED] },
        },
      },
      { $unwind: '$paymentRecords' },
      {
        $match: {
          'paymentRecords.paymentDate': { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          paidThisMonth: { $sum: '$paymentRecords.amount' },
        },
      },
    ]),
  ]);

  // Overdue count
  const overdueCount = await PurchaseOrder.countDocuments({
    ...baseMatch,
    paymentStatus: { $ne: POPaymentStatus.PAID },
    dueDate: { $lt: now },
    status: { $nin: [POStatus.CANCELLED, POStatus.DRAFT, POStatus.REJECTED] },
  });

  // Calculate status counts
  const statusMap: Record<string, number> = {};
  for (const s of statusStats) {
    statusMap[s._id] = s.count;
  }

  return {
    totalPOs: summaryStats[0]?.totalPOs || 0,
    totalValue: summaryStats[0]?.totalValue || 0,
    pendingApproval: statusMap[POStatus.PENDING_APPROVAL] || 0,
    pendingDelivery: (statusMap[POStatus.APPROVED] || 0) + (statusMap[POStatus.ORDERED] || 0),
    overdue: overdueCount,
    thisMonthCount: thisMonthStats[0]?.thisMonthCount || 0,
    thisMonthValue: thisMonthStats[0]?.thisMonthValue || 0,
    outstandingAmount: paymentStats[0]?.outstandingAmount || 0,
    paidThisMonth: paymentStats[4]?.[0]?.paidThisMonth || 0,
  };
}

// ── Idempotency Helpers ───────────────────────────────────────────────────────

/**
 * Check if a PO with the same PO number already exists
 * @param poNumber - PO number to check
 * @returns true if exists
 */
export async function poNumberExists(poNumber: string): Promise<boolean> {
  const existing = await PurchaseOrder.findOne({ poNumber, isDeleted: false })
    .select('_id')
    .lean();
  return !!existing;
}

/**
 * Create PO with idempotency check
 * @param poData - PO data
 * @param session - Optional MongoDB session
 * @returns Created PO or null if duplicate
 */
export async function createPOIdempotent(
  poData: Partial<IPurchaseOrder>,
  session?: ClientSession
): Promise<IPurchaseOrder | null> {
  const poNumber = poData.poNumber || (await generatePONumber());

  // Idempotency check
  const exists = await poNumberExists(poNumber);
  if (exists) {
    logger.warn('[PO Service] Duplicate PO number prevented', { poNumber });
    return null;
  }

  // Set defaults
  const now = new Date();
  const po = new PurchaseOrder({
    ...poData,
    poNumber,
    orderDate: poData.orderDate || now,
    status: poData.status || POStatus.DRAFT,
    paymentStatus: poData.paymentStatus || POPaymentStatus.UNPAID,
    paidAmount: 0,
    paymentRecords: [],
    approvalHistory: [],
    goodsReceipts: [],
    attachments: [],
    isDeleted: false,
    currency: poData.currency || 'INR',
  });

  // Calculate due date if supplier is provided
  if (po.supplierId && !po.dueDate) {
    po.dueDate = await calculateDueDate(po.supplierId as Types.ObjectId, po.orderDate);
  }

  // Calculate totals
  if (po.items && po.items.length > 0) {
    const totals = calculateTotals(po.items as IPOItem[]);
    po.subtotal = totals.subtotal;
    po.totalDiscount = totals.totalDiscount;
    po.taxAmount = totals.taxAmount;
    po.totalAmount = totals.totalAmount;
  }

  await po.save({ session });
  return po;
}

// ── Transaction Helpers ───────────────────────────────────────────────────────

/**
 * Execute a function within a MongoDB transaction
 * @param fn - Function to execute
 * @returns Result of the function
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// ── Goods Receipt Processing ─────────────────────────────────────────────────

export interface GoodsReceiptItem {
  sku: string;
  receivedQty: number;
  condition?: 'good' | 'damaged' | 'partial';
  notes?: string;
}

export interface ProcessGoodsReceiptResult {
  success: boolean;
  error?: string;
  po?: IPurchaseOrder;
  receiptId?: string;
}

/**
 * Process goods receipt for a PO
 * @param poId - PO ObjectId
 * @param merchantId - Merchant ObjectId (for verification)
 * @param items - Items received
 * @param receivedBy - User who received the goods
 * @param notes - Optional notes
 * @param session - Optional MongoDB session
 * @returns Receipt result
 */
export async function processGoodsReceipt(
  poId: Types.ObjectId,
  merchantId: Types.ObjectId,
  items: GoodsReceiptItem[],
  receivedBy: Types.ObjectId,
  notes?: string,
  session?: ClientSession
): Promise<ProcessGoodsReceiptResult> {
  const po = await PurchaseOrder.findOne({ _id: poId, merchantId, isDeleted: false });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  // Validate PO status allows receiving
  if (![POStatus.ORDERED, POStatus.PARTIAL_RECEIVED].includes(po.status)) {
    return {
      success: false,
      error: `Cannot receive goods for PO in '${po.status}' status. PO must be 'ordered' or 'partial_received'`,
    };
  }

  const receiptId = `GR-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

  // Update received quantities
  let hasPartialReceipt = false;
  let allItemsFullyReceived = true;

  for (const receiptItem of items) {
    const poItem = po.items.find((i) => i.sku === receiptItem.sku);
    if (!poItem) {
      return { success: false, error: `Item with SKU '${receiptItem.sku}' not found in PO` };
    }

    const newReceivedQty = poItem.receivedQty + receiptItem.receivedQty;
    if (newReceivedQty > poItem.quantity) {
      return {
        success: false,
        error: `Received quantity for SKU '${receiptItem.sku}' exceeds ordered quantity`,
      };
    }

    poItem.receivedQty = newReceivedQty;
    poItem.pendingQty = poItem.quantity - newReceivedQty;

    if (newReceivedQty < poItem.quantity) {
      hasPartialReceipt = true;
    }
  }

  // Check if all items are fully received
  allItemsFullyReceived = po.items.every((i) => i.receivedQty >= i.quantity);

  // Create goods receipt record
  const goodsReceipt = {
    receiptId,
    receivedAt: new Date(),
    items: items.map((i) => ({
      sku: i.sku,
      productName: po.items.find((pi) => pi.sku === i.sku)?.productName || i.sku,
      receivedQty: i.receivedQty,
      condition: i.condition || 'good',
      notes: i.notes,
    })),
    receivedBy,
    notes,
  };

  po.goodsReceipts.push(goodsReceipt);

  // Update PO status
  if (allItemsFullyReceived) {
    po.status = POStatus.RECEIVED;
    po.actualDeliveryDate = new Date();
  } else {
    po.status = POStatus.PARTIAL_RECEIVED;
  }

  await po.save({ session });

  logger.info('[PO Service] Goods receipt processed', {
    poId,
    poNumber: po.poNumber,
    receiptId,
    allItemsFullyReceived,
  });

  return { success: true, po, receiptId };
}

// ── Payment Recording ────────────────────────────────────────────────────────

export interface RecordPaymentResult {
  success: boolean;
  error?: string;
  po?: IPurchaseOrder;
  paymentId?: string;
  newPaymentStatus?: POPaymentStatus;
}

/**
 * Record a payment against a PO
 * @param poId - PO ObjectId
 * @param merchantId - Merchant ObjectId (for verification)
 * @param amount - Payment amount
 * @param paymentMethod - Payment method
 * @param recordedBy - User recording the payment
 * @param options - Additional payment options
 * @param session - Optional MongoDB session
 * @returns Payment result
 */
export async function recordPOPayment(
  poId: Types.ObjectId,
  merchantId: Types.ObjectId,
  amount: number,
  paymentMethod: 'bank_transfer' | 'cash' | 'upi' | 'cheque' | 'card' | 'other',
  recordedBy: Types.ObjectId,
  options?: {
    reference?: string;
    notes?: string;
    paymentDate?: Date;
  },
  session?: ClientSession
): Promise<RecordPaymentResult> {
  if (amount <= 0) {
    return { success: false, error: 'Payment amount must be greater than 0' };
  }

  const po = await PurchaseOrder.findOne({ _id: poId, merchantId, isDeleted: false });

  if (!po) {
    return { success: false, error: 'Purchase order not found' };
  }

  // Check if PO is in a state that allows payment
  if ([POStatus.CANCELLED, POStatus.DRAFT, POStatus.REJECTED].includes(po.status)) {
    return {
      success: false,
      error: `Cannot record payment for PO in '${po.status}' status`,
    };
  }

  // Check outstanding amount
  const outstanding = po.totalAmount - po.paidAmount;
  if (amount > outstanding + 0.01) {
    // Small tolerance for rounding
    return {
      success: false,
      error: `Payment amount (${amount}) exceeds outstanding amount (${outstanding.toFixed(2)})`,
    };
  }

  const paymentId = `PAY-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

  // Create payment record
  const paymentRecord = {
    paymentId,
    amount,
    paymentDate: options?.paymentDate || new Date(),
    paymentMethod,
    reference: options?.reference,
    notes: options?.notes,
    recordedBy,
    recordedAt: new Date(),
  };

  po.paymentRecords.push(paymentRecord);
  po.paidAmount = Math.min(po.paidAmount + amount, po.totalAmount);

  // Determine new payment status
  let newPaymentStatus: POPaymentStatus;
  if (Math.abs(po.paidAmount - po.totalAmount) < 0.01) {
    newPaymentStatus = POPaymentStatus.PAID;
  } else if (po.paidAmount > 0) {
    newPaymentStatus = POPaymentStatus.PARTIAL;
  } else {
    newPaymentStatus = POPaymentStatus.UNPAID;
  }

  po.paymentStatus = newPaymentStatus;

  // Auto-close PO if fully paid and received
  if (newPaymentStatus === POPaymentStatus.PAID && po.status === POStatus.RECEIVED) {
    po.status = POStatus.CLOSED;
  }

  await po.save({ session });

  logger.info('[PO Service] Payment recorded', {
    poId,
    poNumber: po.poNumber,
    paymentId,
    amount,
    newPaymentStatus,
    totalPaid: po.paidAmount,
  });

  return { success: true, po, paymentId, newPaymentStatus };
}
