/**
 * Goods Receipt Routes
 *
 * Handles partial and full goods receipt:
 * - Receive items against PO
 * - Partial receipt tracking
 * - Quality check workflow
 * - Shortage/damage reporting
 */

import { Router, Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { z } from 'zod';
import { PurchaseOrder, POItem, POStatus } from '../models/PurchaseOrder';
import { Supplier } from '../models/Supplier';
import { merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();
router.use(merchantAuth);

// ── Validation Schemas ─────────────────────────────────────────────────────────

const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId' }
);

const receiptItemSchema = z.object({
  poItemIndex: z.number().int().nonnegative(),
  productName: z.string().optional(),
  sku: z.string().optional(),
  receivedQuantity: z.number().int().nonnegative('Quantity must be non-negative'),
  damagedQuantity: z.number().int().nonnegative().default(0),
  rejectedQuantity: z.number().int().nonnegative().default(0),
  unitPrice: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  qualityCheckPassed: z.boolean().default(true),
});

const createGoodsReceiptSchema = z.object({
  purchaseOrderId: objectIdSchema,
  receiptDate: z.string().datetime().optional(),
  receivedBy: z.string().optional(),
  items: z.array(receiptItemSchema).min(1, 'At least one item required'),
  notes: z.string().optional(),
  warehouseId: objectIdSchema.optional(),
});

// ── Goods Receipt Routes ───────────────────────────────────────────────────────

/**
 * POST /goods-receipt
 * Create a goods receipt against a PO
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const bodyResult = createGoodsReceiptSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        message: bodyResult.error.errors[0].message,
      });
      return;
    }

    const { purchaseOrderId, receiptDate, receivedBy, items, notes, warehouseId } = bodyResult.data;

    // Get PO
    const po = await PurchaseOrder.findOne({
      _id: new Types.ObjectId(purchaseOrderId),
      merchantId: new Types.ObjectId(req.merchantId!),
    });

    if (!po) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }

    // Check if PO is in valid state
    if (!['approved', 'confirmed', 'partial_received'].includes(po.status)) {
      res.status(400).json({
        success: false,
        message: `Cannot receive goods. PO status is "${po.status}"`,
      });
      return;
    }

    // Process items
    const receiptItems: unknown[] = [];
    let totalReceivedValue = 0;
    let hasShortage = false;
    let hasDamage = false;

    for (const item of items) {
      const poItem = po.items[item.poItemIndex];
      if (!poItem) {
        res.status(400).json({
          success: false,
          message: `Invalid PO item index: ${item.poItemIndex}`,
        });
        return;
      }

      const previousReceived = poItem.receivedQty || 0;
      const totalNow = previousReceived + item.receivedQuantity;
      const pendingQty = poItem.quantity - totalNow;

      if (totalNow > poItem.quantity) {
        res.status(400).json({
          success: false,
          message: `Received quantity exceeds ordered for item "${poItem.productName}"`,
        });
        return;
      }

      if (item.damagedQuantity > 0) hasDamage = true;
      if (item.rejectedQuantity > 0 || item.damagedQuantity > 0) hasShortage = true;

      const itemValue = (item.unitPrice || poItem.unitPrice) * item.receivedQuantity;
      totalReceivedValue += itemValue;

      receiptItems.push({
        poItemIndex: item.poItemIndex,
        productName: poItem.productName,
        sku: poItem.sku,
        orderedQuantity: poItem.quantity,
        previousReceivedQty: previousReceived,
        receivedQuantity: item.receivedQuantity,
        damagedQuantity: item.damagedQuantity,
        rejectedQuantity: item.rejectedQuantity,
        pendingQuantity: poItem.quantity - totalNow,
        unitPrice: item.unitPrice || poItem.unitPrice,
        itemValue,
        qualityCheckPassed: item.qualityCheckPassed,
        notes: item.notes,
      });

      // Update PO item
      poItem.receivedQty = totalNow;
      poItem.pendingQty = Math.max(0, pendingQty);
    }

    // Create goods receipt record
    // FIX (security): Replaced Math.random() with crypto.randomUUID()
    let grNumber: string;
    try {
      const { randomUUID } = require('crypto');
      grNumber = `GR-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase()}`;
    } catch {
      grNumber = `GR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    const goodsReceipt = {
      _id: new Types.ObjectId(),
      grNumber,
      purchaseOrderId: po._id,
      poNumber: po.poNumber,
      merchantId: po.merchantId,
      supplierId: po.supplierId,
      receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
      receivedBy: receivedBy || req.userId,
      warehouseId: warehouseId ? new Types.ObjectId(warehouseId) : undefined,
      items: receiptItems,
      totalReceivedValue,
      status: hasShortage ? 'partial_shortage' : 'received',
      notes,
      qualityIssues: hasDamage ? {
        hasDamage: true,
        hasRejects: true,
      } : undefined,
      createdAt: new Date(),
    };

    // Update PO status
    const allReceived = po.items.every(
      (item) => (item.receivedQty || 0) >= item.quantity
    );
    const anyReceived = po.items.some(
      (item) => (item.receivedQty || 0) > 0
    );

    if (allReceived) {
      po.status = POStatus.RECEIVED;
    } else if (anyReceived) {
      po.status = POStatus.PARTIAL_RECEIVED;
    }

    // Add receipt to PO history
    po.receipts = po.receipts || [];
    po.receipts.push({
      receiptId: goodsReceipt._id,
      grNumber,
      receiptDate: goodsReceipt.receiptDate,
      receivedBy: goodsReceipt.receivedBy,
      items: receiptItems.length,
      totalValue: totalReceivedValue,
    });

    await po.save();

    res.status(201).json({
      success: true,
      message: `Goods receipt ${grNumber} created`,
      data: {
        grNumber,
        purchaseOrderId: po._id,
        poNumber: po.poNumber,
        status: po.status,
        items: receiptItems,
        totalReceivedValue,
      },
    });
  } catch (err) {
    logger.error('[GoodsReceipt] Create failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to create goods receipt' });
  }
});

/**
 * GET /goods-receipt
 * List goods receipts with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      purchaseOrderId,
      status,
      fromDate,
      toDate,
      page = '1',
      limit = '20',
    } = req.query;

    const query: unknown = {
      merchantId: new Types.ObjectId(req.merchantId!),
    };

    if (purchaseOrderId) {
      query.purchaseOrderId = new Types.ObjectId(purchaseOrderId as string);
    }
    if (status) {
      query.status = status;
    }
    if (fromDate || toDate) {
      query.receiptDate = {};
      if (fromDate) query.receiptDate.$gte = new Date(fromDate as string);
      if (toDate) query.receiptDate.$lte = new Date(toDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const { default: mongoose } = await import('mongoose');
    const receipts = await mongoose.model('GoodsReceipt').find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await mongoose.model('GoodsReceipt').countDocuments(query);

    res.json({
      success: true,
      data: receipts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error('[GoodsReceipt] List failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to list receipts' });
  }
});

/**
 * GET /goods-receipt/:id
 * Get goods receipt details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const receipt = await mongoose.model('GoodsReceipt').findOne({
      _id: new Types.ObjectId(req.params.id),
      merchantId: new Types.ObjectId(req.merchantId!),
    }).populate('purchaseOrderId', 'poNumber status supplierId supplierName');

    if (!receipt) {
      res.status(404).json({ success: false, message: 'Goods receipt not found' });
      return;
    }

    res.json({ success: true, data: receipt });
  } catch (err) {
    logger.error('[GoodsReceipt] Get failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to get receipt' });
  }
});

/**
 * GET /goods-receipt/po/:poId
 * Get all receipts for a PO
 */
router.get('/po/:poId', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.poId)) {
      res.status(400).json({ success: false, message: 'Invalid PO ID' });
      return;
    }

    const receipts = await mongoose.model('GoodsReceipt').find({
      purchaseOrderId: new Types.ObjectId(req.params.poId),
      merchantId: new Types.ObjectId(req.merchantId!),
    })
      .sort({ receiptDate: -1 })
      .lean();

    // Calculate totals
    const summary = {
      totalReceipts: receipts.length,
      totalReceivedValue: receipts.reduce((sum: number, r) => sum + r.totalReceivedValue, 0),
      totalItemsReceived: receipts.reduce(
        (sum: number, r) => sum + r.items.reduce((s: number, i) => s + i.receivedQuantity, 0),
        0
      ),
    };

    res.json({
      success: true,
      data: {
        receipts,
        summary,
      },
    });
  } catch (err) {
    logger.error('[GoodsReceipt] PO receipts failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to get receipts' });
  }
});

/**
 * GET /goods-receipt/:id/quality-report
 * Generate quality report for a receipt
 */
router.get('/:id/quality-report', async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid ID' });
      return;
    }

    const receipt = await mongoose.model('GoodsReceipt').findOne({
      _id: new Types.ObjectId(req.params.id),
      merchantId: new Types.ObjectId(req.merchantId!),
    }).lean();

    if (!receipt) {
      res.status(404).json({ success: false, message: 'Goods receipt not found' });
      return;
    }

    const qualityItems = receipt.items.map((item) => ({
      productName: item.productName,
      sku: item.sku,
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.receivedQuantity,
      damagedQuantity: item.damagedQuantity,
      rejectedQuantity: item.rejectedQuantity,
      acceptedQuantity: item.receivedQuantity - item.damagedQuantity - item.rejectedQuantity,
      qualityCheckPassed: item.qualityCheckPassed,
    }));

    const totalOrdered = qualityItems.reduce((s: number, i) => s + i.orderedQuantity, 0);
    const totalReceived = qualityItems.reduce((s: number, i) => s + i.receivedQuantity, 0);
    const totalDamaged = qualityItems.reduce((s: number, i) => s + i.damagedQuantity, 0);
    const totalRejected = qualityItems.reduce((s: number, i) => s + i.rejectedQuantity, 0);
    const totalAccepted = qualityItems.reduce((s: number, i) => s + i.acceptedQuantity, 0);

    res.json({
      success: true,
      data: {
        grNumber: receipt.grNumber,
        receiptDate: receipt.receiptDate,
        poNumber: receipt.poNumber,
        summary: {
          totalOrdered,
          totalReceived,
          totalDamaged,
          totalRejected,
          totalAccepted,
          acceptanceRate: totalReceived > 0 ? (totalAccepted / totalReceived) * 100 : 100,
        },
        items: qualityItems,
      },
    });
  } catch (err) {
    logger.error('[GoodsReceipt] Quality report failed', { error: err });
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

export default router;
