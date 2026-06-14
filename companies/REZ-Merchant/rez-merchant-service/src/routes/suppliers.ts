
import { Router, Request, Response } from 'express';
import { Supplier } from '../models/Supplier';
import { Product } from '../models/Product';
import { merchantAuth } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cacheMiddleware';
import {
  validateSupplierCreate,
  validateSupplierOwnership,
} from '../middleware/validateSupplier';
import {
  validateGstNumber,
  validatePan,
  validatePhone,
  validateEmail,
  validateCreditLimit,
  getSupplierCreditSummary,
  getSupplierAging,
  getSupplierStats,
  searchSuppliers,
  updateSupplierCredit,
} from '../services/supplierService';
import { CacheKeys, CacheTTL, cacheService } from '../services/cacheService';
import { rateLimitMiddleware } from '../middleware/rateLimiter';
import { publishEvent, WebhookEvents } from '../services/webhookService';
import { recordSupplierOperation } from '../metrics';
import { errorResponse } from '../utils/response';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: List suppliers
 *     description: Get paginated list of suppliers with optional filters
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, GST, or PAN
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, blocked]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags
 *     responses:
 *       200:
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Allowed fields for create/update operations (mass assignment prevention)
const SUPPLIER_ALLOWED_FIELDS = [
  // Basic Info
  'name',
  'contactPerson',
  'email',
  'phone',
  'address',
  // GST/PAN
  'gstNumber',
  'pan',
  // Credit
  'creditLimit',
  'creditUsed',
  'creditPeriodDays',
  // Due Date
  'dueDatePreference',
  'specificDayOfMonth',
  // Banking
  'bankName',
  'accountNumber',
  'ifscCode',
  'accountHolderName',
  // Status
  'isActive',
  'status',
  // Tags and Notes
  'tags',
  'notes',
  // Metadata
  'metadata',
];

/**
 * Picks allowed fields from request body
 */
function pickSupplierFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of SUPPLIER_ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      filtered[field] = body[field];
    }
  }
  return filtered;
}

/**
 * Standardized error handler helper
 */
function handleError(res: Response, err, requestId?: string): void {
  const msg =
    process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
  const statusCode = err.name === 'ValidationError' ? 400 : 500;
  res.status(statusCode).json({ success: false, message: msg });
}

// GET /suppliers - List suppliers with pagination and search
// Uses caching for improved performance
const supplierListCacheKey = (req: Request): string => {
  const { page, limit, search, status, isActive, tags } = req.query;
  return `suppliers:list:${req.merchantId}:${JSON.stringify({ page, limit, search, status, isActive, tags })}`;
};

router.get('/', cacheMiddleware({
  ttl: CacheTTL.MEDIUM,
  keyFn: supplierListCacheKey
}), async (req: Request, res: Response) => {
  try {
    const requestId = (req as unknown).res?.locals?.requestId;

    const {
      page = '1',
      limit = '20',
      search,
      status,
      isActive,
      tags,
    } = req.query;

    const result = await searchSuppliers(req.merchantId as string, {
      query: search as string,
      status: status as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      tags: tags ? (tags as string).split(',').map((t) => t.trim()) : undefined,
      page: parseInt(page as string) || 1,
      limit: Math.min(100, Math.max(1, parseInt(limit as string) || 20)),
    });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err: unknown) {
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

// GET /suppliers/stats - Get supplier statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getSupplierStats(req.merchantId as string);
    res.json({ success: true, data: stats });
  } catch (err: unknown) {
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

// GET /suppliers/tags - Get all unique supplier tags
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const { getSupplierTags } = await import('../services/supplierService');
    const tags = await getSupplierTags(req.merchantId as string);
    res.json({ success: true, data: tags });
  } catch (err: unknown) {
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     description: Returns a single supplier with computed credit available
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ObjectId
 *     responses:
 *       200:
 *         description: Supplier details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       404:
 *         description: Supplier not found
 */

// GET /suppliers/:id - Get single supplier
router.get('/:id', validateSupplierOwnership, async (req: Request, res: Response) => {
  try {
    const supplier = (req as unknown).supplier;
    // Add computed fields
    const response = {
      ...supplier,
      creditAvailable: Math.max(0, supplier.creditLimit - supplier.creditUsed),
    };
    res.json({ success: true, data: response });
  } catch (err: unknown) {
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

/**
 * @swagger
 * /suppliers/{id}/credit-summary:
 *   get:
 *     summary: Get supplier credit summary
 *     description: Returns credit limit, used, and available credit
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Credit summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     creditLimit:
 *                       type: number
 *                     creditUsed:
 *                       type: number
 *                     creditAvailable:
 *                       type: number
 *                     pendingPOValue:
 *                       type: number
 *       404:
 *         description: Supplier not found
 */

// GET /suppliers/:id/credit-summary - Get supplier credit summary
router.get('/:id/credit-summary', validateSupplierOwnership, async (req: Request, res: Response) => {
  try {
    const supplierId = req.params.id;
    const creditSummary = await getSupplierCreditSummary(supplierId);
    res.json({ success: true, data: creditSummary });
  } catch (err: unknown) {
    if (err.message === 'Supplier not found') {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

/**
 * @swagger
 * /suppliers/{id}/aging:
 *   get:
 *     summary: Get supplier aging report
 *     description: Returns outstanding amounts grouped by days overdue
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aging report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     supplierId:
 *                       type: string
 *                     supplierName:
 *                       type: string
 *                     totalOutstanding:
 *                       type: number
 *                     current:
 *                       type: number
 *                     days30to60:
 *                       type: number
 *                     days60to90:
 *                       type: number
 *                     days90Plus:
 *                       type: number
 *       404:
 *         description: Supplier not found
 */

// GET /suppliers/:id/aging - Get supplier aging report
router.get('/:id/aging', validateSupplierOwnership, async (req: Request, res: Response) => {
  try {
    const supplierId = req.params.id;
    const aging = await getSupplierAging(supplierId);
    res.json({ success: true, data: aging });
  } catch (err: unknown) {
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

/**
 * @swagger
 * /suppliers:
 *   post:
 *     summary: Create supplier
 *     description: Add a new supplier/vendor to the merchant's list
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: ABC Supplies Pvt Ltd
 *               contactPerson:
 *                 type: string
 *                 example: Rajesh Kumar
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rajesh@abcsupplies.com
 *               phone:
 *                 type: string
 *                 pattern: '^[0-9]{10}$'
 *                 example: '9876543210'
 *               gstNumber:
 *                 type: string
 *                 pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
 *                 example: '27ABCDE1234F1Z5'
 *               pan:
 *                 type: string
 *                 pattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
 *                 example: 'ABCDE1234F'
 *               creditLimit:
 *                 type: number
 *                 example: 500000
 *               creditPeriodDays:
 *                 type: integer
 *                 example: 30
 *               dueDatePreference:
 *                 type: string
 *                 enum: [end_of_month, immediate, specific_day]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Supplier created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Duplicate GST/PAN
 *       429:
 *         description: Rate limit exceeded
 */

// POST /suppliers - Create new supplier
router.post('/', rateLimitMiddleware('WRITE'), validateSupplierCreate, async (req: Request, res: Response) => {
  try {
    const safeFields = pickSupplierFields(req.body);

    // Additional validation for required fields
    if (!safeFields.name || safeFields.name.trim() === '') {
      res.status(400).json({ success: false, message: 'Supplier name is required' });
      return;
    }

    // Check for duplicate GST if provided
    if (safeFields.gstNumber) {
      const existingGst = await Supplier.findOne({
        merchantId: req.merchantId,
        gstNumber: safeFields.gstNumber,
        isDeleted: { $ne: true },
      }).lean();
      if (existingGst) {
        res.status(409).json({ success: false, message: 'A supplier with this GST number already exists' });
        return;
      }
    }

    // Check for duplicate PAN if provided
    if (safeFields.pan) {
      const existingPan = await Supplier.findOne({
        merchantId: req.merchantId,
        pan: safeFields.pan,
        isDeleted: { $ne: true },
      }).lean();
      if (existingPan) {
        res.status(409).json({ success: false, message: 'A supplier with this PAN already exists' });
        return;
      }
    }

    // Set defaults
    const supplierData = {
      ...safeFields,
      merchantId: req.merchantId,
      creditUsed: safeFields.creditUsed || 0,
      creditPeriodDays: safeFields.creditPeriodDays || 30,
      isActive: safeFields.isActive !== undefined ? safeFields.isActive : true,
      status: safeFields.status || 'pending',
      tags: safeFields.tags || [],
    };

    const supplier = await Supplier.create(supplierData);

    // Invalidate supplier list cache
    await cacheService.invalidate(`suppliers:list:${req.merchantId}:*`);

    // Record metrics
    recordSupplierOperation('created', req.merchantId as string);

    // Publish webhook event (fire and forget)
    publishEvent(req.merchantId as string, WebhookEvents.SUPPLIER_CREATED, {
      supplierId: supplier._id.toString(),
      name: supplier.name,
      gstNumber: supplier.gstNumber,
      creditLimit: supplier.creditLimit,
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
    });
  } catch (err: unknown) {
    if (err.name === 'ValidationError') {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

/**
 * @swagger
 * /suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     description: Update supplier details by ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               creditLimit:
 *                 type: number
 *               creditPeriodDays:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Supplier updated
 *       404:
 *         description: Supplier not found
 *       429:
 *         description: Rate limit exceeded
 */

// PUT /suppliers/:id - Update supplier
router.put('/:id', rateLimitMiddleware('WRITE'), validateSupplierOwnership, async (req: Request, res: Response) => {
  try {
    const supplierId = req.params.id;
    const currentSupplier = (req as unknown).supplier;
    const safeFields = pickSupplierFields(req.body);

    // Prevent changing merchantId
    delete safeFields.merchantId;
    delete safeFields._id;
    delete safeFields.createdAt;
    delete safeFields.updatedAt;

    // Check for duplicate GST if being changed
    if (safeFields.gstNumber && safeFields.gstNumber !== currentSupplier.gstNumber) {
      const existingGst = await Supplier.findOne({
        merchantId: req.merchantId,
        gstNumber: safeFields.gstNumber,
        _id: { $ne: supplierId },
        isDeleted: { $ne: true },
      }).lean();
      if (existingGst) {
        res.status(409).json({ success: false, message: 'A supplier with this GST number already exists' });
        return;
      }
    }

    // Check for duplicate PAN if being changed
    if (safeFields.pan && safeFields.pan !== currentSupplier.pan) {
      const existingPan = await Supplier.findOne({
        merchantId: req.merchantId,
        pan: safeFields.pan,
        _id: { $ne: supplierId },
        isDeleted: { $ne: true },
      }).lean();
      if (existingPan) {
        res.status(409).json({ success: false, message: 'A supplier with this PAN already exists' });
        return;
      }
    }

    // Handle credit limit decrease - ensure credit used doesn't exceed new limit
    if (safeFields.creditLimit !== undefined) {
      const newLimit = Number(safeFields.creditLimit);
      if (newLimit < currentSupplier.creditUsed) {
        res.status(400).json({
          success: false,
          message: `Cannot reduce credit limit below current usage (${currentSupplier.creditUsed})`,
        });
        return;
      }
    }

    const updated = await Supplier.findByIdAndUpdate(
      supplierId,
      { $set: safeFields },
      { new: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }

    // Invalidate caches
    await Promise.all([
      cacheService.invalidate(`suppliers:list:${req.merchantId}:*`),
      cacheService.invalidate(CacheKeys.supplier(supplierId)),
      cacheService.invalidate(CacheKeys.supplierLedger(supplierId)),
    ]);

    // Record metrics
    recordSupplierOperation('updated', req.merchantId as string);

    // Publish webhook event
    publishEvent(req.merchantId as string, WebhookEvents.SUPPLIER_UPDATED, {
      supplierId: supplierId,
      changes: safeFields,
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: {
        ...updated,
        creditAvailable: Math.max(0, updated.creditLimit - updated.creditUsed),
      },
    });
  } catch (err: unknown) {
    if (err.name === 'ValidationError') {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

// PATCH /suppliers/:id/status - Update supplier status
router.patch('/:id/status', validateSupplierOwnership, async (req: Request, res: Response) => {
  try {
    const supplierId = req.params.id;
    const currentSupplier = (req as unknown).supplier;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: 'Status is required' });
      return;
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'blocked'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['approved', 'rejected'],
      approved: ['blocked'],
      rejected: ['pending', 'blocked'],
      blocked: ['approved', 'pending'],
    };

    const allowedTransitions = validTransitions[currentSupplier.status] || [];
    if (!allowedTransitions.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Cannot transition from '${currentSupplier.status}' to '${status}'. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
      });
      return;
    }

    const updated = await Supplier.findByIdAndUpdate(
      supplierId,
      { $set: { status } },
      { new: true }
    ).lean();

    res.json({
      success: true,
      message: 'Supplier status updated',
      data: updated,
    });
  } catch (err: unknown) {
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

// PATCH /suppliers/:id/credit - Adjust supplier credit manually
router.patch('/:id/credit', validateSupplierOwnership, async (req: Request, res: Response) => {
  try {
    const supplierId = req.params.id;
    const { creditLimit, creditUsed } = req.body;

    const updates: Record<string, unknown> = {};

    if (creditLimit !== undefined) {
      const validation = validateCreditLimit(creditLimit);
      if (!validation.valid) {
        res.status(400).json({ success: false, message: validation.error });
        return;
      }
      updates.creditLimit = creditLimit;
    }

    if (creditUsed !== undefined) {
      if (typeof creditUsed !== 'number' || creditUsed < 0) {
        res.status(400).json({ success: false, message: 'creditUsed must be a non-negative number' });
        return;
      }
      updates.creditUsed = creditUsed;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ success: false, message: 'No valid credit fields provided' });
      return;
    }

    const updated = await Supplier.findByIdAndUpdate(
      supplierId,
      { $set: updates },
      { new: true }
    ).lean();

    res.json({
      success: true,
      message: 'Credit updated',
      data: {
        ...updated,
        creditAvailable: Math.max(0, (updated as unknown).creditLimit - (updated as unknown).creditUsed),
      },
    });
  } catch (err: unknown) {
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

// DELETE /suppliers/:id - Soft delete supplier
router.delete('/:id', rateLimitMiddleware('WRITE'), validateSupplierOwnership, async (req: Request, res: Response) => {
  try {
    const supplierId = req.params.id;

    // Check if supplier has active POs
    const { PurchaseOrder } = await import('../models/PurchaseOrder');
    const activePOs = await PurchaseOrder.countDocuments({
      supplier: new mongoose.Types.ObjectId(supplierId),
      status: { $in: ['approved', 'partial', 'received'] },
    });

    if (activePOs > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete supplier with ${activePOs} active purchase order(s). Close or cancel the POs first.`,
      });
      return;
    }

    // Soft delete
    await Supplier.findByIdAndUpdate(supplierId, {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
      },
    });

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (err: unknown) {
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

// GET /suppliers/:id/products - Get products from supplier
router.get('/:id/products', validateSupplierOwnership, async (req: Request, res: Response) => {
  try {
    const supplierId = req.params.id;

    const products = await Product.find({
      supplier: new mongoose.Types.ObjectId(supplierId),
      merchant: req.merchantId,
      isDeleted: { $ne: true },
    }).lean();

    res.json({ success: true, data: products });
  } catch (err: unknown) {
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

// POST /suppliers/:id/restore - Restore soft-deleted supplier
router.post('/:id/restore', async (req: Request, res: Response) => {
  try {
    const supplierId = req.params.id;

    const supplier = await Supplier.findOne({
      _id: supplierId,
      merchantId: req.merchantId,
    }).lean();

    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found' });
      return;
    }

    if (!supplier.isDeleted) {
      res.status(400).json({ success: false, message: 'Supplier is not deleted' });
      return;
    }

    await Supplier.findByIdAndUpdate(supplierId, {
      $set: {
        isDeleted: false,
        deletedAt: null,
        isActive: true,
      },
    });

    res.json({ success: true, message: 'Supplier restored successfully' });
  } catch (err: unknown) {
    handleError(res, err, (req as unknown).res?.locals?.requestId);
  }
});

export default router;
