import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { merchantAuth } from '../middleware/auth';
import { requireInternalToken } from '../middleware/internalAuth';
import { errorResponse, errors } from '../utils/response';
import {
  createRFQ,
  updateRFQ,
  deleteRFQ,
  getRFQById,
  listRFQs,
  openRFQ,
  closeRFQ,
  cancelRFQ,
  inviteSuppliers,
  getRFQQuotes,
  compareQuotes,
  awardAndCreatePO,
  getMerchantRFQStats,
  getBestQuote,
  RFQFilters,
} from '../services/rfqService';
import { rateLimitMiddleware } from '../middleware/rateLimiter';

const router = Router();

// All routes require merchant authentication
router.use(merchantAuth);

// ── Zod Schemas ────────────────────────────────────────────────────────────────

const rfqItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required').max(200),
  description: z.string().max(1000).optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required').max(50),
  specifications: z.record(z.unknown()).optional(),
});

const createRFQSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['raw_materials', 'equipment', 'services', 'packaging', 'logistics', 'other'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  items: z.array(rfqItemSchema).min(1, 'At least one item is required'),
  requiredByDate: z.string().datetime().optional().or(z.string().max(0).optional()),
  storeId: z.string().optional(),
  isPublic: z.boolean().optional(),
  invitedSuppliers: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
});

const updateRFQSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.enum(['raw_materials', 'equipment', 'services', 'packaging', 'logistics', 'other']).optional(),
  items: z.array(rfqItemSchema).min(1).optional(),
  requiredByDate: z.string().datetime().optional().or(z.string().max(0).optional()),
  isPublic: z.boolean().optional(),
  invitedSuppliers: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
});

const inviteSuppliersSchema = z.object({
  supplierIds: z.array(z.string().min(1)).min(1, 'At least one supplier ID is required'),
});

const statusTransitionSchema = z.object({});

// ── Helper Functions ───────────────────────────────────────────────────────────

function handleError(res: Response, err: unknown, customMessage?: string): void {
  const requestId = (res as unknown as { locals?: { requestId?: string } }).locals?.requestId;
  const message = process.env.NODE_ENV === 'production'
    ? customMessage || `An error occurred. Reference: ${requestId || 'unknown'}`
    : err instanceof Error ? err.message : String(err);

  const statusCode = err instanceof Error && err.message.includes('not found')
    ? 404
    : err instanceof Error && err.message.includes('cannot')
      ? 400
      : 500;

  res.status(statusCode).json({ success: false, message });
}

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /rfqs:
 *   get:
 *     summary: List RFQs
 *     description: Get paginated list of RFQs with optional filters
 *     tags: [RFQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, open, closed, cancelled]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [raw_materials, equipment, services, packaging, logistics, other]
 *     responses:
 *       200:
 *         description: List of RFQs
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;

    // Parse query parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const filters: RFQFilters = {};
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.category) filters.category = req.query.category as string;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
    if (req.query.storeId) filters.storeId = req.query.storeId as string;

    const result = await listRFQs(merchantId, filters, page, limit);

    res.json({
      success: true,
      data: {
        items: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /rfqs/stats - Get RFQ statistics for merchant dashboard
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const stats = await getMerchantRFQStats(merchantId);

    res.json({ success: true, data: stats });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /rfqs/:id - Get RFQ by ID with quotes count
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    const rfq = await getRFQById(id, merchantId);

    if (!rfq) {
      res.status(404).json({ success: false, message: 'RFQ not found' });
      return;
    }

    res.json({ success: true, data: rfq });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * @swagger
 * /rfqs:
 *   post:
 *     summary: Create RFQ
 *     description: Create a new Request for Quotation
 *     tags: [RFQs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - items
 *             properties:
 *               title:
 *                 type: string
 *                 description: RFQ title
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [raw_materials, equipment, services, packaging, logistics, other]
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *               requiredByDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: RFQ created
 *       400:
 *         description: Validation error
 */
router.post('/', rateLimitMiddleware('WRITE'), async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;

    // Validate request body
    const parseResult = createRFQSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const data = parseResult.data;

    // Convert requiredByDate string to Date if provided
    if (data.requiredByDate) {
      data.requiredByDate = parseDate(data.requiredByDate as unknown as string);
    }

    const rfq = await createRFQ(merchantId, {
      title: data.title,
      description: data.description,
      category: data.category,
      items: data.items,
      requiredByDate: data.requiredByDate,
      storeId: data.storeId,
      isPublic: data.isPublic,
      invitedSuppliers: data.invitedSuppliers,
      notes: data.notes,
    });

    res.status(201).json({
      success: true,
      message: 'RFQ created successfully',
      data: rfq,
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * PUT /rfqs/:id - Update an RFQ (only if draft)
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    // Validate request body
    const parseResult = updateRFQSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const data = parseResult.data;

    // Convert requiredByDate string to Date if provided
    if (data.requiredByDate) {
      data.requiredByDate = parseDate(data.requiredByDate as unknown as string);
    }

    const rfq = await updateRFQ(id, merchantId, {
      title: data.title,
      description: data.description,
      category: data.category,
      items: data.items,
      requiredByDate: data.requiredByDate,
      isPublic: data.isPublic,
      invitedSuppliers: data.invitedSuppliers,
      notes: data.notes,
    });

    if (!rfq) {
      res.status(404).json({
        success: false,
        message: 'RFQ not found or cannot be edited (only draft RFQs can be edited)',
      });
      return;
    }

    res.json({ success: true, message: 'RFQ updated successfully', data: rfq });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * DELETE /rfqs/:id - Soft delete an RFQ
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    const deleted = await deleteRFQ(id, merchantId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'RFQ not found or cannot be deleted (only draft RFQs can be deleted)',
      });
      return;
    }

    res.json({ success: true, message: 'RFQ deleted successfully' });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /rfqs/:id/open - Open RFQ for quotes (draft -> open)
 */
router.post('/:id/open', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    const rfq = await openRFQ(id, merchantId);

    if (!rfq) {
      res.status(404).json({
        success: false,
        message: 'RFQ not found or cannot be opened (only draft RFQs with items can be opened)',
      });
      return;
    }

    res.json({ success: true, message: 'RFQ opened for quotes', data: rfq });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /rfqs/:id/close - Close RFQ (open -> closed)
 */
router.post('/:id/close', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    const rfq = await closeRFQ(id, merchantId);

    if (!rfq) {
      res.status(404).json({
        success: false,
        message: 'RFQ not found or cannot be closed (only open RFQs can be closed)',
      });
      return;
    }

    res.json({ success: true, message: 'RFQ closed', data: rfq });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /rfqs/:id/cancel - Cancel RFQ
 */
router.post('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    const rfq = await cancelRFQ(id, merchantId);

    if (!rfq) {
      res.status(404).json({
        success: false,
        message: 'RFQ not found or cannot be cancelled',
      });
      return;
    }

    res.json({ success: true, message: 'RFQ cancelled', data: rfq });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /rfqs/:id/invite - Invite suppliers to RFQ
 */
router.post('/:id/invite', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    // Validate request body
    const parseResult = inviteSuppliersSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const { supplierIds } = parseResult.data;

    // Validate supplier IDs
    for (const supplierId of supplierIds) {
      if (!mongoose.Types.ObjectId.isValid(supplierId)) {
        res.status(400).json({
          success: false,
          message: `Invalid supplier ID: ${supplierId}`,
        });
        return;
      }
    }

    const result = await inviteSuppliers(id, merchantId, supplierIds);

    res.json({
      success: true,
      message: `Invited ${result.added} suppliers`,
      data: {
        added: result.added,
        alreadyInvited: result.alreadyInvited,
        invalid: result.invalid,
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /rfqs/:id/quotes - List all quotes for an RFQ
 */
router.get('/:id/quotes', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    const status = req.query.status as string | undefined;
    const supplierId = req.query.supplierId as string | undefined;

    const quotes = await getRFQQuotes(id, merchantId, { status, supplierId });

    res.json({ success: true, data: quotes });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /rfqs/:id/quotes/best - Get the best (lowest) quote for an RFQ
 */
router.get('/:id/quotes/best', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    const bestQuote = await getBestQuote(id, merchantId);

    if (!bestQuote) {
      res.status(404).json({
        success: false,
        message: 'No quotes found for this RFQ',
      });
      return;
    }

    res.json({ success: true, data: bestQuote });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /rfqs/:id/quotes/compare - Compare quotes side-by-side
 */
router.get('/:id/quotes/compare', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    const comparison = await compareQuotes(id, merchantId);

    res.json({
      success: true,
      data: {
        quotes: comparison,
        summary: {
          totalQuotes: comparison.length,
          lowestQuote: comparison[0]?.totalAmount ?? null,
          highestQuote: comparison[comparison.length - 1]?.totalAmount ?? null,
          avgQuote: comparison.length > 0
            ? Math.round(comparison.reduce((sum, q) => sum + q.totalAmount, 0) / comparison.length * 100) / 100
            : null,
        },
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /rfqs/:id/award/:quoteId - Award RFQ to supplier and create draft PO
 */
router.post('/:id/award/:quoteId', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id, quoteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
      res.status(400).json({ success: false, message: 'Invalid Quote ID' });
      return;
    }

    const result = await awardAndCreatePO(id, quoteId, merchantId);

    res.json({
      success: true,
      message: 'RFQ awarded and draft purchase order created',
      data: {
        rfq: {
          _id: result.rfq._id,
          rfqNumber: result.rfq.rfqNumber,
          status: result.rfq.status,
          awardedSupplierId: result.rfq.awardedSupplierId,
          awardedQuoteId: result.rfq.awardedQuoteId,
        },
        purchaseOrder: {
          _id: result.purchaseOrder._id,
          poNumber: result.purchaseOrder.poNumber,
          status: result.purchaseOrder.status,
          supplier: result.purchaseOrder.supplier,
          totalAmount: result.purchaseOrder.items.reduce(
            (sum: number, item: { total?: number }) => sum + (item.total || 0),
            0,
          ),
        },
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
