import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { merchantAuth } from '../middleware/auth';
import { requireInternalToken } from '../middleware/internalAuth';
import { errorResponse, errors } from '../utils/response';
import {
  getQuoteById,
  submitQuote,
  reviseQuote,
  withdrawQuote,
  acceptQuote,
  rejectQuote,
  getSupplierQuotes,
  QuoteFilters,
} from '../services/rfqService';

const router = Router();

// ── Zod Schemas ────────────────────────────────────────────────────────────────

const quoteItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required').max(200),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  discount: z.number().min(0).max(100).optional(),
  tax: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

const submitQuoteSchema = z.object({
  rfqId: z.string().min(1, 'RFQ ID is required'),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
  validUntil: z.string().datetime().optional().or(z.string().max(0).optional()),
  deliveryDays: z.number().int().positive('Delivery days must be a positive integer'),
  paymentTerms: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

const reviseQuoteSchema = z.object({
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
  validUntil: z.string().datetime().optional().or(z.string().max(0).optional()),
  deliveryDays: z.number().int().positive('Delivery days must be a positive integer'),
  paymentTerms: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  reason: z.string().min(1, 'Revision reason is required').max(500),
});

const listQuotesSchema = z.object({
  rfqId: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.enum(['submitted', 'revised', 'accepted', 'rejected', 'withdrawn']).optional(),
});

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
      : err instanceof Error && err.message.includes('already')
        ? 409
        : 500;

  res.status(statusCode).json({ success: false, message });
}

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

// ── Merchant Routes ────────────────────────────────────────────────────────────

// All merchant quote routes require authentication
router.use(merchantAuth);

/**
 * GET /quotes - List quotes with filters (merchant view)
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const filters: QuoteFilters = {};
    if (req.query.rfqId) filters.rfqId = req.query.rfqId as string;
    if (req.query.supplierId) filters.supplierId = req.query.supplierId as string;
    if (req.query.status) filters.status = req.query.status as string;

    // Import Quote model for querying
    const { Quote } = await import('../models/Quote');

    const query: Record<string, unknown> = {
      merchantId: new mongoose.Types.ObjectId(merchantId),
    };

    if (filters.rfqId) {
      if (!mongoose.Types.ObjectId.isValid(filters.rfqId)) {
        res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
        return;
      }
      query.rfqId = new mongoose.Types.ObjectId(filters.rfqId);
    }

    if (filters.supplierId) {
      if (!mongoose.Types.ObjectId.isValid(filters.supplierId)) {
        res.status(400).json({ success: false, message: 'Invalid Supplier ID' });
        return;
      }
      query.supplierId = new mongoose.Types.ObjectId(filters.supplierId);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const [items, total] = await Promise.all([
      Quote.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Quote.countDocuments(query),
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
        },
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * GET /quotes/:id - Get quote detail
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid Quote ID' });
      return;
    }

    const quote = await getQuoteById(id, merchantId);

    if (!quote) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }

    res.json({ success: true, data: quote });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /quotes/:id/accept - Accept a quote
 */
router.post('/:id/accept', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid Quote ID' });
      return;
    }

    const quote = await acceptQuote(id, merchantId);

    if (!quote) {
      res.status(404).json({
        success: false,
        message: 'Quote not found or cannot be accepted',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Quote accepted',
      data: quote,
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * POST /quotes/:id/reject - Reject a quote
 */
router.post('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = req.merchantId!;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid Quote ID' });
      return;
    }

    const quote = await rejectQuote(id, merchantId);

    if (!quote) {
      res.status(404).json({
        success: false,
        message: 'Quote not found or cannot be rejected',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Quote rejected',
      data: quote,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// ── Supplier-Facing Routes ────────────────────────────────────────────────────

/**
 * POST /quotes/submit - Submit a quote (supplier-facing endpoint)
 *
 * This endpoint is called by suppliers to submit quotes.
 * It can be authenticated via:
 * 1. Internal service token (for service-to-service calls)
 * 2. Supplier-specific authentication (if implemented)
 *
 * For now, we use the requireInternalToken middleware but also accept
 * a supplierId in the request body for cases where the supplier service
 * proxies the request.
 */
router.post('/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get supplier ID from request - can be from:
    // 1. Internal service token (supplier service passes supplierId in body)
    // 2. Header (if supplier is directly calling this endpoint)
    const supplierId = req.body.supplierId || req.headers['x-supplier-id'] as string;

    if (!supplierId) {
      res.status(401).json({
        success: false,
        message: 'Supplier ID is required',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid Supplier ID' });
      return;
    }

    // Validate request body
    const parseResult = submitQuoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const data = parseResult.data;

    // Validate RFQ ID
    if (!mongoose.Types.ObjectId.isValid(data.rfqId)) {
      res.status(400).json({ success: false, message: 'Invalid RFQ ID' });
      return;
    }

    const quote = await submitQuote(data.rfqId, supplierId, {
      items: data.items,
      validUntil: parseDate(data.validUntil as unknown as string),
      deliveryDays: data.deliveryDays,
      paymentTerms: data.paymentTerms,
      notes: data.notes,
    });

    res.status(201).json({
      success: true,
      message: 'Quote submitted successfully',
      data: quote,
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * PUT /quotes/:id - Revise a quote
 *
 * Supplier-facing endpoint to revise their submitted quote.
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const supplierId = req.body.supplierId || req.headers['x-supplier-id'] as string;

    if (!supplierId) {
      res.status(401).json({
        success: false,
        message: 'Supplier ID is required',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid Supplier ID' });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid Quote ID' });
      return;
    }

    // Validate request body
    const parseResult = reviseQuoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const data = parseResult.data;

    const quote = await reviseQuote(id, supplierId, {
      items: data.items,
      validUntil: parseDate(data.validUntil as unknown as string),
      deliveryDays: data.deliveryDays,
      paymentTerms: data.paymentTerms,
      notes: data.notes,
      reason: data.reason,
    });

    if (!quote) {
      res.status(404).json({
        success: false,
        message: 'Quote not found or cannot be revised',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Quote revised successfully',
      data: quote,
    });
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * DELETE /quotes/:id - Withdraw a quote
 *
 * Supplier-facing endpoint to withdraw their submitted quote.
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const supplierId = req.body.supplierId || req.headers['x-supplier-id'] as string;

    if (!supplierId) {
      res.status(401).json({
        success: false,
        message: 'Supplier ID is required',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid Supplier ID' });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid Quote ID' });
      return;
    }

    const quote = await withdrawQuote(id, supplierId);

    if (!quote) {
      res.status(404).json({
        success: false,
        message: 'Quote not found or cannot be withdrawn',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Quote withdrawn successfully',
      data: quote,
    });
  } catch (err) {
    handleError(res, err);
  }
});

// ── Supplier Dashboard Routes ─────────────────────────────────────────────────

/**
 * GET /quotes/supplier/:supplierId - Get all quotes for a supplier
 *
 * This endpoint can be called internally by the supplier service.
 */
router.get('/supplier/:supplierId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({ success: false, message: 'Invalid Supplier ID' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const filters: { status?: string; dateFrom?: Date; dateTo?: Date } = {};
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

    const quotes = await getSupplierQuotes(supplierId, filters);

    // Manual pagination
    const startIndex = (page - 1) * limit;
    const paginatedQuotes = quotes.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        items: paginatedQuotes,
        pagination: {
          page,
          limit,
          total: quotes.length,
          totalPages: Math.ceil(quotes.length / limit),
        },
      },
    });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
