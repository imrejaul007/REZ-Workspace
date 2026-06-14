/**
 * Delivery Challan Routes
 *
 * Complete CRUD + workflow for delivery challan management:
 * - List with filters (status, supplierId, dateRange)
 * - Create from PO or manual
 * - Issue, Dispatch, Track, Acknowledge
 * - Print/Export challan
 */

import { Router, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { DeliveryChallan, ChallanStatus, TransportMode } from '../models/DeliveryChallan';
import { merchantAuth } from '../middleware/auth';
import { errorResponse, errors } from '../utils/response';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// ── Validation Schemas ─────────────────────────────────────────────────────────

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId' }
);

const challanItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit: z.string().min(1).default('pcs'),
  rate: z.number().nonnegative(),
  discount: z.number().nonnegative().optional().default(0),
  taxRate: z.number().min(0).max(100).optional().default(0),
  poId: objectIdSchema.optional(),
  poItemIndex: z.number().int().nonnegative().optional(),
  dispatchedQty: z.number().int().nonnegative().optional(),
});

const createChallanSchema = z.object({
  supplierId: objectIdSchema.optional(),
  supplierName: z.string().optional(),
  purchaseOrderId: objectIdSchema.optional(),
  customerId: objectIdSchema.optional(),
  customerName: z.string().optional(),
  customerAddress: z.object({
    name: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  storeId: objectIdSchema.optional(),
  items: z.array(challanItemSchema).min(1, 'At least one item is required'),
  challanDate: z.string().datetime().optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
  shippingAddress: z.object({
    name: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
  }),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  source: z.enum(['manual', 'po', 'return', 'import']).default('manual'),
  sourceReference: z.string().optional(),
});

const updateChallanSchema = z.object({
  items: z.array(challanItemSchema).optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
  shippingAddress: z.object({
    name: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

const dispatchSchema = z.object({
  transportMode: z.enum(['road', 'rail', 'air', 'ship', 'courier', 'own_vehicle']),
  transportName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  lrNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
});

const acknowledgeSchema = z.object({
  receiverName: z.string().min(1, 'Receiver name is required'),
  receiverSignature: z.string().optional(),
});

const listQuerySchema = z.object({
  status: z.enum(['draft', 'issued', 'in_transit', 'delivered', 'acknowledged', 'cancelled']).optional(),
  supplierId: objectIdSchema.optional(),
  customerId: objectIdSchema.optional(),
  purchaseOrderId: objectIdSchema.optional(),
  storeId: objectIdSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'challanDate', 'challanNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Helper ─────────────────────────────────────────────────────────────────────

function handleError(res: Response, err: unknown, endpoint: string) {
  logger.error(`[Challan] ${endpoint}`, { error: err });
  if (err instanceof z.ZodError) {
    errorResponse(res, errors.badRequest(err.errors[0].message));
  } else if (err instanceof Error) {
    errorResponse(res, errors.internal(err.message));
  } else {
    errorResponse(res, errors.internal('Unknown error'));
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * GET /challans
 * List delivery challans with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const queryResult = listQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      errorResponse(res, errors.badRequest(queryResult.error.errors[0].message));
      return;
    }

    const { status, supplierId, customerId, purchaseOrderId, storeId, dateFrom, dateTo, page, limit, sortBy, sortOrder } = queryResult.data;

    // Build query
    const query: Record<string, unknown> = {
      merchantId: new Types.ObjectId(req.merchantId),
      isDeleted: false,
    };

    if (status) query.status = status;
    if (supplierId) query.supplierId = new Types.ObjectId(supplierId);
    if (customerId) query.customerId = new Types.ObjectId(customerId);
    if (purchaseOrderId) query.purchaseOrderId = new Types.ObjectId(purchaseOrderId);
    if (storeId) query.storeId = new Types.ObjectId(storeId);

    if (dateFrom || dateTo) {
      query.challanDate = {};
      if (dateFrom) (query.challanDate as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo) (query.challanDate as Record<string, unknown>).$lte = new Date(dateTo);
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      DeliveryChallan.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('supplierId', 'name phone')
        .populate('purchaseOrderId', 'poNumber')
        .lean(),
      DeliveryChallan.countDocuments(query),
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
 * GET /challans/stats
 * Dashboard statistics for challans
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const merchantId = new Types.ObjectId(req.merchantId);
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await DeliveryChallan.aggregate([
      { $match: { merchantId, isDeleted: false } },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalQuantity: { $sum: '$totalQuantity' },
                totalAmount: { $sum: '$totalAmount' },
              },
            },
          ],
          thisMonth: [
            { $match: { challanDate: { $gte: startOfMonth } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                quantity: { $sum: '$totalQuantity' },
              },
            },
          ],
          inTransit: [
            { $match: { status: 'in_transit' } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const result = stats[0] || {};
    const statusCounts = Object.fromEntries((result.byStatus || []).map((s) => [s._id, s.count]));
    const totals = result.totals?.[0] || { totalQuantity: 0, totalAmount: 0 };
    const thisMonth = result.thisMonth?.[0] || { count: 0, quantity: 0 };

    res.json({
      success: true,
      data: {
        totalChallans: Object.values(statusCounts).reduce((a: number, b) => a + b, 0) as number,
        byStatus: statusCounts,
        totalQuantity: totals.totalQuantity,
        totalAmount: totals.totalAmount,
        thisMonthCount: thisMonth.count,
        thisMonthQuantity: thisMonth.quantity,
        inTransit: result.inTransit?.[0]?.count || 0,
      },
    });
  } catch (err) {
    handleError(res, err, 'GET /stats');
  }
});

/**
 * GET /challans/:id
 * Get single challan
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid challan ID'));
      return;
    }

    const challan = await DeliveryChallan.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    })
      .populate('supplierId', 'name phone email address')
      .populate('purchaseOrderId', 'poNumber status')
      .populate('customerId', 'name phone')
      .lean();

    if (!challan) {
      errorResponse(res, errors.notFound('Delivery challan'));
      return;
    }

    res.json({ success: true, data: challan });
  } catch (err) {
    handleError(res, err, 'GET /:id');
  }
});

/**
 * POST /challans
 * Create a new delivery challan
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const bodyResult = createChallanSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const data = bodyResult.data;
    const challanNumber = await DeliveryChallan.generateChallanNumber(req.merchantId);

    const challan = new DeliveryChallan({
      challanNumber,
      merchantId: new Types.ObjectId(req.merchantId),
      storeId: data.storeId ? new Types.ObjectId(data.storeId) : undefined,
      supplierId: data.supplierId ? new Types.ObjectId(data.supplierId) : undefined,
      supplierName: data.supplierName,
      purchaseOrderId: data.purchaseOrderId ? new Types.ObjectId(data.purchaseOrderId) : undefined,
      customerId: data.customerId ? new Types.ObjectId(data.customerId) : undefined,
      customerName: data.customerName,
      customerAddress: data.customerAddress,
      items: data.items.map((item) => ({
        ...item,
        dispatchedQty: item.dispatchedQty ?? item.quantity,
      })),
      challanDate: data.challanDate ? new Date(data.challanDate) : new Date(),
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
      shippingAddress: data.shippingAddress,
      notes: data.notes,
      internalNotes: data.internalNotes,
      source: data.source,
      sourceReference: data.sourceReference,
      status: 'draft',
    });

    await challan.save();

    res.status(201).json({
      success: true,
      data: challan,
      message: 'Delivery challan created successfully',
    });
  } catch (err) {
    handleError(res, err, 'POST /');
  }
});

/**
 * PUT /challans/:id
 * Update a challan (only draft)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid challan ID'));
      return;
    }

    const bodyResult = updateChallanSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const challan = await DeliveryChallan.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!challan) {
      errorResponse(res, errors.notFound('Delivery challan'));
      return;
    }

    if (challan.status !== 'draft') {
      errorResponse(res, errors.badRequest('Only draft challans can be updated'));
      return;
    }

    // Update fields
    const data = bodyResult.data;
    if (data.items) {
      challan.items = data.items.map((item) => ({
        ...item,
        dispatchedQty: item.dispatchedQty ?? item.quantity,
      }));
    }
    if (data.expectedDeliveryDate) challan.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    if (data.shippingAddress) challan.shippingAddress = data.shippingAddress;
    if (data.notes !== undefined) challan.notes = data.notes;
    if (data.internalNotes !== undefined) challan.internalNotes = data.internalNotes;

    await challan.save();

    res.json({
      success: true,
      data: challan,
      message: 'Challan updated successfully',
    });
  } catch (err) {
    handleError(res, err, 'PUT /:id');
  }
});

/**
 * POST /challans/:id/issue
 * Issue a draft challan
 */
router.post('/:id/issue', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid challan ID'));
      return;
    }

    const challan = await DeliveryChallan.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!challan) {
      errorResponse(res, errors.notFound('Delivery challan'));
      return;
    }

    if (challan.status !== 'draft') {
      errorResponse(res, errors.badRequest('Only draft challans can be issued'));
      return;
    }

    challan.status = 'issued';
    challan.issueDate = new Date();
    await challan.save();

    res.json({
      success: true,
      data: challan,
      message: 'Challan issued successfully',
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/issue');
  }
});

/**
 * POST /challans/:id/dispatch
 * Mark challan as dispatched
 */
router.post('/:id/dispatch', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid challan ID'));
      return;
    }

    const bodyResult = dispatchSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const challan = await DeliveryChallan.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!challan) {
      errorResponse(res, errors.notFound('Delivery challan'));
      return;
    }

    if (challan.status !== 'issued') {
      errorResponse(res, errors.badRequest('Only issued challans can be dispatched'));
      return;
    }

    const { transportMode, transportName, vehicleNumber, driverName, driverPhone, lrNumber, trackingUrl } = bodyResult.data;

    challan.status = 'in_transit';
    challan.dispatchDate = new Date();
    challan.transportMode = transportMode;
    challan.transportName = transportName;
    challan.vehicleNumber = vehicleNumber;
    challan.driverName = driverName;
    challan.driverPhone = driverPhone;
    challan.lrNumber = lrNumber;
    challan.trackingUrl = trackingUrl;
    await challan.save();

    res.json({
      success: true,
      data: challan,
      message: 'Challan dispatched successfully',
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/dispatch');
  }
});

/**
 * POST /challans/:id/delivered
 * Mark challan as delivered
 */
router.post('/:id/delivered', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid challan ID'));
      return;
    }

    const challan = await DeliveryChallan.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!challan) {
      errorResponse(res, errors.notFound('Delivery challan'));
      return;
    }

    if (!['issued', 'in_transit'].includes(challan.status)) {
      errorResponse(res, errors.badRequest('Challan must be issued or in transit to mark as delivered'));
      return;
    }

    challan.status = 'delivered';
    challan.deliveryDate = new Date();
    await challan.save();

    res.json({
      success: true,
      data: challan,
      message: 'Challan marked as delivered',
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/delivered');
  }
});

/**
 * POST /challans/:id/acknowledge
 * Acknowledge receipt
 */
router.post('/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid challan ID'));
      return;
    }

    const bodyResult = acknowledgeSchema.safeParse(req.body);
    if (!bodyResult.success) {
      errorResponse(res, errors.badRequest(bodyResult.error.errors[0].message));
      return;
    }

    const challan = await DeliveryChallan.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!challan) {
      errorResponse(res, errors.notFound('Delivery challan'));
      return;
    }

    if (!['in_transit', 'delivered'].includes(challan.status)) {
      errorResponse(res, errors.badRequest('Challan must be in transit or delivered to acknowledge'));
      return;
    }

    challan.status = 'acknowledged';
    challan.deliveryDate = new Date();
    challan.acknowledgedAt = new Date();
    challan.receiverName = bodyResult.data.receiverName;
    challan.receiverSignature = bodyResult.data.receiverSignature;
    await challan.save();

    res.json({
      success: true,
      data: challan,
      message: 'Challan acknowledged successfully',
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/acknowledge');
  }
});

/**
 * POST /challans/:id/cancel
 * Cancel a challan
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid challan ID'));
      return;
    }

    const { reason } = req.body;
    if (!reason) {
      errorResponse(res, errors.badRequest('Cancellation reason is required'));
      return;
    }

    const challan = await DeliveryChallan.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!challan) {
      errorResponse(res, errors.notFound('Delivery challan'));
      return;
    }

    if (['acknowledged', 'cancelled'].includes(challan.status)) {
      errorResponse(res, errors.badRequest('Cannot cancel acknowledged or already cancelled challan'));
      return;
    }

    challan.status = 'cancelled';
    challan.internalNotes = (challan.internalNotes || '') + `\n[CANCELLED: ${reason}]`;
    await challan.save();

    res.json({
      success: true,
      data: challan,
      message: 'Challan cancelled successfully',
    });
  } catch (err) {
    handleError(res, err, 'POST /:id/cancel');
  }
});

/**
 * DELETE /challans/:id
 * Soft delete a challan (only draft)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      errorResponse(res, errors.badRequest('Invalid challan ID'));
      return;
    }

    const challan = await DeliveryChallan.findOne({
      _id: req.params.id,
      merchantId: req.merchantId,
      isDeleted: false,
    });

    if (!challan) {
      errorResponse(res, errors.notFound('Delivery challan'));
      return;
    }

    if (challan.status !== 'draft') {
      errorResponse(res, errors.badRequest('Only draft challans can be deleted'));
      return;
    }

    challan.isDeleted = true;
    challan.deletedAt = new Date();
    await challan.save();

    res.json({
      success: true,
      message: 'Challan deleted successfully',
    });
  } catch (err) {
    handleError(res, err, 'DELETE /:id');
  }
});

export default router;
