/**
 * Purchase Order Routes
 *
 * Complete CRUD + B2B features for purchase order management:
 * - List with filters (status, supplierId, dateRange, storeId)
 * - Create with auto-calculate dueDate from supplier.creditPeriodDays
 * - Update (only if draft or pending_approval)
 * - Soft delete
 * - Submit for approval
 * - Approve/Reject
 * - Receive goods
 * - Record payments
 * - Approval history
 * - Dashboard stats
 */

import { Router, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { merchantAuth } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cacheMiddleware';
import { errorResponse, errors } from '../utils/response';
import {
  POStatus,
  POPaymentStatus,
  isValidPOStatusTransition,
} from '../config/purchaseOrderTransitions';
import {
  generatePONumber,
  calculateDueDate,
  calculateTotals,
  validateStatusTransition,
  checkCreditLimit,
  getOverduePOs,
  bulkGetSupplierAging,
  getPODashboardStats,
  withTransaction,
  processGoodsReceipt,
  recordPOPayment,
  GoodsReceiptItem,
} from '../services/purchaseOrderService';
import { CacheKeys, CacheTTL, cacheService } from '../services/cacheService';
import { recordPurchaseOrderEvent } from '../metrics';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// ── Validation Schemas ─────────────────────────────────────────────────────────

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId' }
);

const poItemSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  discount: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(100).default(0),
  receivedQty: z.number().nonnegative().default(0),
});

const createPOSchema = z.object({
  supplierId: objectIdSchema,
  storeId: objectIdSchema.optional(),
  items: z.array(poItemSchema).min(1, 'At least one item is required'),
  orderDate: z.string().datetime().optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  shippingAddress: z
    .object({
      address: z.string(),
      city: z.string(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  referenceNumber: z.string().optional(),
  source: z.enum(['manual', 'reorder', 'import', 'api']).default('manual'),
});

const updatePOSchema = z.object({
  supplierId: objectIdSchema.optional(),
  storeId: objectIdSchema.optional(),
  items: z.array(poItemSchema).min(1).optional(),
  orderDate: z.string().datetime().optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  shippingAddress: z
    .object({
      address: z.string(),
      city: z.string(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  referenceNumber: z.string().optional(),
});

const submitSchema = z.object({
  notes: z.string().optional(),
});

const approveSchema = z.object({
  approverId: objectIdSchema,
  comments: z.string().optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
  rejectedBy: objectIdSchema,
});

const receiveSchema = z.object({
  items: z.array(
    z.object({
      sku: z.string(),
      receivedQty: z.number().int().positive(),
      condition: z.enum(['good', 'damaged', 'partial']).default('good'),
      notes: z.string().optional(),
    })
  ),
  notes: z.string().optional(),
  receivedBy: objectIdSchema,
});

const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['bank_transfer', 'cash', 'upi', 'cheque', 'card', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().datetime().optional(),
  recordedBy: objectIdSchema,
});

const listQuerySchema = z.object({
  status: z.enum(Object.values(POStatus) as [string, ...string[]]).optional(),
  supplierId: objectIdSchema.optional(),
  storeId: objectIdSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  paymentStatus: z.enum(Object.values(POPaymentStatus) as [string, ...string[]]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'orderDate', 'dueDate', 'totalAmount', 'poNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Helper Functions ────────────────────────────────────────────────────────────

function handleError(res: Response, err: unknown, context?: string): void {
  const requestId = (res as unknown as { locals?: { requestId?: string } }).locals?.requestId;
  const errorMsg = err instanceof Error ? err.message : 'Unknown error';
  const logContext = context ? `[PO Routes] ${context}` : '[PO Routes]';
  logger.error(logContext, { error: errorMsg, requestId });
  const message =
    process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : errorMsg;
  errorResponse(res, errors.internalError({ message }));
}

// ── Route Handlers ────────────────────────────────────────────────────────────

// Cache key builder for PO list
const poListCacheKey = (req: Request): string => {
  const { status, supplierId, storeId, dateFrom, dateTo, paymentStatus, page, limit, sortBy, sortOrder } = req.query as Record<string, string>;
  return `po:list:${req.merchantId}:${JSON.stringify({ status, supplierId, storeId, dateFrom, dateTo, paymentStatus, page, limit, sortBy, sortOrder })}`;
};

/**
 * GET /purchase-orders
 * List POs with filters
 */
router.get('/', cacheMiddleware({
  ttl: CacheTTL.SHORT,
  keyFn: poListCacheKey,
  condition: (req) => {
    // Only cache simple list requests, not filtered ones
    const { status, supplierId, dateFrom, dateTo } = req.query;
    return !status && !supplierId && !dateFrom && !dateTo;
  }
}), async (req: Request, res: Response) => {
  try {
    const queryResult = listQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      errorResponse(res, errors.badRequest(queryResult.error.errors[0].message));
      return;
    }

    const {
      status,
      supplierId,
      storeId,
      dateFrom,
      dateTo,
      paymentStatus,
      page,
      limit,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build query
    const query: Record<string, unknown> = {
      merchantId: new Types.ObjectId(req.merchantId),
      isDeleted: false,
    };

    if (status) query.status = status;
    if (supplierId) query.supplierId = new Types.ObjectId(supplierId);
    if (storeId) query.storeId = new Types.ObjectId(storeId);
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (dateFrom || dateTo) {
      query.orderDate = {};
      if (dateFrom) (query.orderDate as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo) (query.orderDate as Record<string, unknown>).$lte = new Date(dateTo);
    }

    // Build sort
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query
    const [items, total] = await Promise.all([
      PurchaseOrder.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('supplierId', 'name email phone')
        .populate('storeId', 'name')
        .lean(),
      PurchaseOrder.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items,
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
 * GET /purchase-orders/stats
 * Dashboard statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.query;

    const query: Record<string, unknown> = {
      merchantId: new Types.ObjectId(req.merchantId),
    };
    if (storeId && mongoose.Types.ObjectId.isValid(storeId as string)) {
      query.storeId = new Types.ObjectId(storeId as string);
    }

    const stats = await getPODashboardStats(
      new Types.ObjectId(req.merchantId),
      storeId ? new Types.ObjectId(storeId as string) : undefined
    );

    res.json({ success: true, data: stats });
  } catch (err) {
    handleError(res, err, 'GET /stats');
  }
});

/**
 * GET /purchase-orders/overdue
 * Get overdue POs
 */
router.get('/overdue', async (req: Request, res: Response) => {
  try {
    const overduePOs = await getOverduePOs(new Types.ObjectId(req.merchantId));
    res.json({ success: true, data: overduePOs });
  } catch (err) {
    handleError(res, err, 'GET /overdue');
  }
});

/**
 * GET /purchase-orders/aging
 * Supplier aging report
 */
router.get('/aging', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.query;
    const aging = await bulkGetSupplierAging(
      new Types.ObjectId(req.merchantId),
      supplierId ? new Types.ObjectId(supplierId as string) : undefined
    );
    res.json({ success: true, data: aging });
  } catch (err) {
    handleError(res, err, 'GET /aging');
  }
});

/**
 * GET /purchase-orders/:id
 * Get single PO
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    })
      .populate('supplierId', 'name email phone address creditPeriodDays creditLimit')
      .populate('storeId', 'name')
      .populate('approvalHistory.approvedBy', 'name email')
      .populate('goodsReceipts.receivedBy', 'name email')
      .populate('paymentRecords.recordedBy', 'name email')
      .lean();

    if (!po) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    res.json({ success: true, data: po });
  } catch (err) {
    handleError(res, err, 'GET /:id');
  }
});

/**
 * GET /purchase-orders/:id/history
 * Get approval history
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    })
      .select('poNumber approvalHistory')
      .populate('approvalHistory.approvedBy', 'name email role')
      .lean();

    if (!po) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    res.json({
      success: true,
      data: {
        poNumber: po.poNumber,
        history: po.approvalHistory,
      },
    });
  } catch (err) {
    handleError(res, err, 'GET /:id/history');
  }
});

/**
 * POST /purchase-orders
 * Create new PO
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const bodyResult = createPOSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const { supplierId, storeId, items, orderDate, expectedDeliveryDate, notes, internalNotes, shippingAddress, referenceNumber, source } = bodyResult.data;

    // Generate PO number
    const poNumber = await generatePONumber();

    // Calculate totals
    const totals = calculateTotals(items);

    // Check credit limit
    const creditCheck = await checkCreditLimit(
      new Types.ObjectId(supplierId),
      totals.totalAmount
    );

    if (!creditCheck.allowed) {
      errorResponse(res, errors.badRequest(creditCheck.error || 'Credit limit exceeded'));
      return;
    }

    // Calculate due date from supplier's credit period
    const orderDateValue = orderDate ? new Date(orderDate) : new Date();
    const dueDate = await calculateDueDate(new Types.ObjectId(supplierId), orderDateValue);

    // Create PO
    const po = await withTransaction(async (session) => {
      const newPO = new PurchaseOrder({
        poNumber,
        merchantId: new Types.ObjectId(req.merchantId),
        storeId: storeId ? new Types.ObjectId(storeId) : undefined,
        supplierId: new Types.ObjectId(supplierId),
        items: items.map((item) => ({
          ...item,
          taxAmount: (item.quantity * item.unitPrice - item.discount) * (item.taxRate / 100),
          total: item.quantity * item.unitPrice - item.discount + (item.quantity * item.unitPrice - item.discount) * (item.taxRate / 100),
          pendingQty: item.quantity,
        })),
        status: POStatus.DRAFT,
        paymentStatus: POPaymentStatus.UNPAID,
        currency: 'INR',
        orderDate: orderDateValue,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        dueDate,
        notes,
        internalNotes,
        shippingAddress,
        referenceNumber,
        source: source || 'manual',
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        paidAmount: 0,
        paymentRecords: [],
        approvalHistory: [],
        goodsReceipts: [],
        attachments: [],
        isDeleted: false,
      });

      await newPO.save({ session });
      return newPO;
    });

    logger.info('[PO Routes] PO created', {
      poId: po._id,
      poNumber: po.poNumber,
      merchantId: req.merchantId,
      supplierId,
      totalAmount: totals.totalAmount,
    });

    // Invalidate list caches
    await cacheService.invalidate(`po:list:${req.merchantId}:*`);

    // Record metrics
    recordPurchaseOrderEvent('created', req.merchantId as string, totals.totalAmount, 'draft');

    res.status(201).json({
      success: true,
      message: 'Purchase order created',
      data: po,
    });
  } catch (err) {
    handleError(res, err, 'POST /');
  }
});

/**
 * PUT /purchase-orders/:id
 * Update PO (only draft or pending_approval)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const bodyResult = updatePOSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const existingPO = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!existingPO) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    // Only allow updates on draft or pending_approval
    if (![POStatus.DRAFT, POStatus.PENDING_APPROVAL].includes(existingPO.status)) {
      errorResponse(res, errors.badRequest(`Cannot update PO in '${existingPO.status}' status. Only 'draft' or 'pending_approval' POs can be edited.`));
      return;
    }

    const { supplierId, storeId, items, orderDate, expectedDeliveryDate, notes, internalNotes, shippingAddress, referenceNumber } = bodyResult.data;

    // Update fields
    if (supplierId) {
      existingPO.supplierId = new Types.ObjectId(supplierId);
      // Recalculate due date
      existingPO.dueDate = await calculateDueDate(
        new Types.ObjectId(supplierId),
        existingPO.orderDate
      );
    }
    if (storeId) existingPO.storeId = new Types.ObjectId(storeId);
    if (orderDate) existingPO.orderDate = new Date(orderDate);
    if (expectedDeliveryDate) existingPO.expectedDeliveryDate = new Date(expectedDeliveryDate);
    if (notes !== undefined) existingPO.notes = notes;
    if (internalNotes !== undefined) existingPO.internalNotes = internalNotes;
    if (shippingAddress) existingPO.shippingAddress = shippingAddress;
    if (referenceNumber !== undefined) existingPO.referenceNumber = referenceNumber;

    // Recalculate totals if items changed
    if (items && items.length > 0) {
      // Check credit limit for new total (excluding current PO)
      const totals = calculateTotals(items);
      if (existingPO.supplierId) {
        const creditCheck = await checkCreditLimit(
          existingPO.supplierId,
          totals.totalAmount,
          existingPO._id as Types.ObjectId
        );
        if (!creditCheck.allowed) {
          errorResponse(res, errors.badRequest(creditCheck.error || 'Credit limit exceeded'));
          return;
        }
      }

      existingPO.items = items.map((item) => ({
        ...item,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: item.taxRate || 0,
        taxAmount: (item.quantity * item.unitPrice - (item.discount || 0)) * ((item.taxRate || 0) / 100),
        total: item.quantity * item.unitPrice - (item.discount || 0) + (item.quantity * item.unitPrice - (item.discount || 0)) * ((item.taxRate || 0) / 100),
        receivedQty: item.receivedQty || 0,
        pendingQty: item.quantity - (item.receivedQty || 0),
      }));
      existingPO.subtotal = totals.subtotal;
      existingPO.totalDiscount = totals.totalDiscount;
      existingPO.taxAmount = totals.taxAmount;
      existingPO.totalAmount = totals.totalAmount;
    }

    await existingPO.save();

    logger.info('[PO Routes] PO updated', {
      poId: existingPO._id,
      poNumber: existingPO.poNumber,
      merchantId: req.merchantId,
    });

    // Invalidate caches
    await Promise.all([
      cacheService.invalidate(`po:list:${req.merchantId}:*`),
      cacheService.invalidate(CacheKeys.purchaseOrder(req.params.id)),
    ]);

    res.json({
      success: true,
      message: 'Purchase order updated',
      data: existingPO,
    });
  } catch (err) {
    handleError(res, err, 'PUT /:id');
  }
});

/**
 * DELETE /purchase-orders/:id
 * Soft delete PO (only draft)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!po) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    // Only allow delete on draft POs
    if (po.status !== POStatus.DRAFT) {
      errorResponse(res, errors.badRequest(`Cannot delete PO in '${po.status}' status. Only 'draft' POs can be deleted.`));
      return;
    }

    po.isDeleted = true;
    po.deletedAt = new Date();
    po.deletedBy = new Types.ObjectId(req.merchantUserId);
    await po.save();

    logger.info('[PO Routes] PO deleted', {
      poId: po._id,
      poNumber: po.poNumber,
      merchantId: req.merchantId,
    });

    // Invalidate caches
    await Promise.all([
      cacheService.invalidate(`po:list:${req.merchantId}:*`),
      cacheService.invalidate(CacheKeys.purchaseOrder(req.params.id)),
    ]);

    res.json({
      success: true,
      message: 'Purchase order deleted',
    });
  } catch (err) {
    handleError(res, err, 'DELETE /:id');
  }
});

/**
 * POST /purchase-orders/:id/submit
 * Submit PO for approval (draft → pending_approval)
 */
router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const bodyResult = submitSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!po) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    const transitionResult = validateStatusTransition(po.status, POStatus.PENDING_APPROVAL);
    if (!transitionResult.valid) {
      errorResponse(res, errors.badRequest(transitionResult.error));
      return;
    }

    const previousStatus = po.status;
    po.status = POStatus.PENDING_APPROVAL;
    po.approvalHistory.push({
      approvedBy: new Types.ObjectId(req.merchantUserId),
      approvedAt: new Date(),
      status: POStatus.PENDING_APPROVAL,
      previousStatus,
      comments: bodyResult.data.notes || 'Submitted for approval',
    });

    await po.save();

    logger.info('[PO Routes] PO submitted for approval', {
      poId: po._id,
      poNumber: po.poNumber,
      merchantId: req.merchantId,
      submittedBy: req.merchantUserId,
    });

    res.json({
      success: true,
      message: 'Purchase order submitted for approval',
      data: po,
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/submit');
  }
});

/**
 * POST /purchase-orders/:id/approve
 * Approve PO (pending_approval → approved)
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const bodyResult = approveSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!po) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    const transitionResult = validateStatusTransition(po.status, POStatus.APPROVED);
    if (!transitionResult.valid) {
      errorResponse(res, errors.badRequest(transitionResult.error));
      return;
    }

    const previousStatus = po.status;
    po.status = POStatus.APPROVED;
    po.approvalHistory.push({
      approvedBy: new Types.ObjectId(bodyResult.data.approverId),
      approvedAt: new Date(),
      status: POStatus.APPROVED,
      previousStatus,
      comments: bodyResult.data.comments,
    });

    await po.save();

    logger.info('[PO Routes] PO approved', {
      poId: po._id,
      poNumber: po.poNumber,
      merchantId: req.merchantId,
      approvedBy: bodyResult.data.approverId,
    });

    // Record metrics
    recordPurchaseOrderEvent('approved', req.merchantId as string);

    res.json({
      success: true,
      message: 'Purchase order approved',
      data: po,
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/approve');
  }
});

/**
 * POST /purchase-orders/:id/reject
 * Reject PO (pending_approval → rejected)
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const bodyResult = rejectSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!po) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    const transitionResult = validateStatusTransition(po.status, POStatus.REJECTED);
    if (!transitionResult.valid) {
      errorResponse(res, errors.badRequest(transitionResult.error));
      return;
    }

    const previousStatus = po.status;
    po.status = POStatus.REJECTED;
    po.approvalHistory.push({
      approvedBy: new Types.ObjectId(bodyResult.data.rejectedBy),
      approvedAt: new Date(),
      status: POStatus.REJECTED,
      previousStatus,
      comments: bodyResult.data.reason,
    });

    await po.save();

    logger.info('[PO Routes] PO rejected', {
      poId: po._id,
      poNumber: po.poNumber,
      merchantId: req.merchantId,
      rejectedBy: bodyResult.data.rejectedBy,
      reason: bodyResult.data.reason,
    });

    // Record metrics
    recordPurchaseOrderEvent('rejected', req.merchantId as string);

    res.json({
      success: true,
      message: 'Purchase order rejected',
      data: po,
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/reject');
  }
});

/**
 * POST /purchase-orders/:id/reopen
 * Reopen rejected PO (rejected → draft)
 */
router.post('/:id/reopen', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!po) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    if (po.status !== POStatus.REJECTED) {
      errorResponse(res, errors.badRequest(`Can only reopen rejected POs. Current status: '${po.status}'`));
      return;
    }

    const previousStatus = po.status;
    po.status = POStatus.DRAFT;
    po.approvalHistory.push({
      approvedBy: new Types.ObjectId(req.merchantUserId),
      approvedAt: new Date(),
      status: POStatus.DRAFT,
      previousStatus,
      comments: 'PO reopened for editing',
    });

    await po.save();

    logger.info('[PO Routes] PO reopened', {
      poId: po._id,
      poNumber: po.poNumber,
      merchantId: req.merchantId,
    });

    res.json({
      success: true,
      message: 'Purchase order reopened as draft',
      data: po,
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/reopen');
  }
});

/**
 * POST /purchase-orders/:id/place-order
 * Place order (approved → ordered)
 */
router.post('/:id/place-order', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!po) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    const transitionResult = validateStatusTransition(po.status, POStatus.ORDERED);
    if (!transitionResult.valid) {
      errorResponse(res, errors.badRequest(transitionResult.error));
      return;
    }

    const previousStatus = po.status;
    po.status = POStatus.ORDERED;
    po.approvalHistory.push({
      approvedBy: new Types.ObjectId(req.merchantUserId),
      approvedAt: new Date(),
      status: POStatus.ORDERED,
      previousStatus,
      comments: 'Order placed with supplier',
    });

    await po.save();

    logger.info('[PO Routes] PO placed as order', {
      poId: po._id,
      poNumber: po.poNumber,
      merchantId: req.merchantId,
    });

    res.json({
      success: true,
      message: 'Order placed with supplier',
      data: po,
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/place-order');
  }
});

/**
 * POST /purchase-orders/:id/receive
 * Mark items as received
 */
router.post('/:id/receive', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const bodyResult = receiveSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const { items, notes, receivedBy } = bodyResult.data;

    const result = await withTransaction(async (session) => {
      return processGoodsReceipt(
        new Types.ObjectId(req.params.id),
        new Types.ObjectId(req.merchantId),
        items as GoodsReceiptItem[],
        new Types.ObjectId(receivedBy),
        notes,
        session
      );
    });

    if (!result.success) {
      errorResponse(res, errors.badRequest(result.error));
      return;
    }

    logger.info('[PO Routes] Goods received', {
      poId: req.params.id,
      poNumber: result.po?.poNumber,
      merchantId: req.merchantId,
      receiptId: result.receiptId,
    });

    res.json({
      success: true,
      message: result.po?.status === POStatus.RECEIVED
        ? 'All items received successfully'
        : 'Partial items received',
      data: result.po,
      receiptId: result.receiptId,
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/receive');
  }
});

/**
 * POST /purchase-orders/:id/payment
 * Record payment against PO
 */
router.post('/:id/payment', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const bodyResult = paymentSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const { amount, paymentMethod, reference, notes, paymentDate, recordedBy } = bodyResult.data;

    const result = await withTransaction(async (session) => {
      return recordPOPayment(
        new Types.ObjectId(req.params.id),
        new Types.ObjectId(req.merchantId),
        amount,
        paymentMethod,
        new Types.ObjectId(recordedBy),
        { reference, notes, paymentDate: paymentDate ? new Date(paymentDate) : undefined },
        session
      );
    });

    if (!result.success) {
      errorResponse(res, errors.badRequest(result.error));
      return;
    }

    logger.info('[PO Routes] Payment recorded', {
      poId: req.params.id,
      poNumber: result.po?.poNumber,
      merchantId: req.merchantId,
      paymentId: result.paymentId,
      amount,
      newPaymentStatus: result.newPaymentStatus,
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: result.po,
      paymentId: result.paymentId,
      paymentStatus: result.newPaymentStatus,
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/payment');
  }
});

/**
 * POST /purchase-orders/:id/close
 * Close PO (received → closed)
 */
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!po) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    // Can close if received or fully paid
    if (po.status !== POStatus.RECEIVED) {
      errorResponse(res, errors.badRequest(`Can only close received POs. Current status: '${po.status}'`));
      return;
    }

    const previousStatus = po.status;
    po.status = POStatus.CLOSED;
    po.approvalHistory.push({
      approvedBy: new Types.ObjectId(req.merchantUserId),
      approvedAt: new Date(),
      status: POStatus.CLOSED,
      previousStatus,
      comments: 'PO closed - transaction complete',
    });

    await po.save();

    logger.info('[PO Routes] PO closed', {
      poId: po._id,
      poNumber: po.poNumber,
      merchantId: req.merchantId,
    });

    res.json({
      success: true,
      message: 'Purchase order closed',
      data: po,
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/close');
  }
});

/**
 * POST /purchase-orders/:id/cancel
 * Cancel PO
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid PO ID'));
      return;
    }

    const { reason } = req.body;
    if (!reason) {
      errorResponse(res, errors.badRequest('Cancellation reason is required'));
      return;
    }

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!po) {
      errorResponse(res, errors.notFound('Purchase order'));
      return;
    }

    const transitionResult = validateStatusTransition(po.status, POStatus.CANCELLED);
    if (!transitionResult.valid) {
      errorResponse(res, errors.badRequest(transitionResult.error));
      return;
    }

    const previousStatus = po.status;
    po.status = POStatus.CANCELLED;
    po.approvalHistory.push({
      approvedBy: new Types.ObjectId(req.merchantUserId),
      approvedAt: new Date(),
      status: POStatus.CANCELLED,
      previousStatus,
      comments: `Cancelled: ${reason}`,
    });

    await po.save();

    logger.info('[PO Routes] PO cancelled', {
      poId: po._id,
      poNumber: po.poNumber,
      merchantId: req.merchantId,
      reason,
    });

    res.json({
      success: true,
      message: 'Purchase order cancelled',
      data: po,
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/cancel');
  }
});

export default router;
