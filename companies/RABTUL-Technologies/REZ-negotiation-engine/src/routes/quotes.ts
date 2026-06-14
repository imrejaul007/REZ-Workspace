import { Router, Request, Response } from 'express';
import { Quote, IQuote } from '../models/Negotiation';
import { v4 as uuidv4 } from 'uuid';
import { publishEvent } from '../services/eventBus';

const router = Router();

/**
 * Create a quote
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const quoteId = `QT-${uuidv4().substring(0, 8).toUpperCase()}`;
    const { seller, buyer, product, pricing, delivery, validity } = req.body;

    const quote = new Quote({
      quoteId,
      seller,
      buyer,
      product,
      pricing,
      delivery,
      validity,
      status: 'draft',
      createdAt: new Date(),
      tenantId
    });

    await quote.save();

    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Get all quotes
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const { status, sellerId, page = 1, limit = 20 } = req.query;
    const filter: Record<string, unknown> = { tenantId };

    if (status) filter.status = status;
    if (sellerId) filter['seller.id'] = sellerId;

    const quotes = await Quote.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Quote.countDocuments(filter);

    res.json({
      success: true,
      data: quotes,
      pagination: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Get quote by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const quote = await Quote.findOne({ quoteId: req.params.id, tenantId });

    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    res.json({ success: true, data: quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Send quote
 */
router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const quote = await Quote.findOne({ quoteId: req.params.id, tenantId });

    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    quote.status = 'sent';
    await quote.save();

    await publishEvent('quote.sent', {
      quoteId: quote.quoteId,
      seller: quote.seller.name,
      buyer: quote.buyer.name,
      totalPrice: quote.pricing.totalPrice
    });

    res.json({ success: true, data: quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Accept quote
 */
router.post('/:id/accept', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const quote = await Quote.findOne({ quoteId: req.params.id, tenantId });

    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    quote.status = 'accepted';
    await quote.save();

    await publishEvent('quote.accepted', {
      quoteId: quote.quoteId,
      finalPrice: quote.pricing.totalPrice
    });

    res.json({ success: true, data: quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Reject quote
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const quote = await Quote.findOne({ quoteId: req.params.id, tenantId });

    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    quote.status = 'rejected';
    await quote.save();

    await publishEvent('quote.rejected', { quoteId: quote.quoteId });

    res.json({ success: true, data: quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
