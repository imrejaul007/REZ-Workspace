import { Router, Request, Response } from 'express';
import { RFQ, IRFQ } from '../models/Negotiation';
import { v4 as uuidv4 } from 'uuid';
import { publishEvent } from '../services/eventBus';

const router = Router();

/**
 * Create RFQ
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const rfqId = `RFQ-${uuidv4().substring(0, 8).toUpperCase()}`;
    const { buyer, product, requirements, createdBy } = req.body;

    const rfq = new RFQ({
      rfqId,
      buyer,
      product,
      requirements,
      status: 'draft',
      responses: [],
      createdBy,
      tenantId
    });

    await rfq.save();

    res.status(201).json({ success: true, data: rfq });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Get all RFQs
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'X-Tenant-Id header required' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, unknown> = { tenantId };

    if (status) filter.status = status;

    const rfqs = await RFQ.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await RFQ.countDocuments(filter);

    res.json({
      success: true,
      data: rfqs,
      pagination: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Get RFQ by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const rfq = await RFQ.findOne({ rfqId: req.params.id, tenantId });

    if (!rfq) {
      return res.status(404).json({ success: false, error: 'RFQ not found' });
    }

    res.json({ success: true, data: rfq });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Send RFQ to sellers
 */
router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const rfq = await RFQ.findOne({ rfqId: req.params.id, tenantId });

    if (!rfq) {
      return res.status(404).json({ success: false, error: 'RFQ not found' });
    }

    rfq.status = 'sent';
    await rfq.save();

    await publishEvent('rfq.sent', {
      rfqId: rfq.rfqId,
      product: rfq.product.name,
      quantity: rfq.product.quantity
    });

    res.json({ success: true, data: rfq });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Receive quote response
 */
router.post('/:id/respond', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const rfq = await RFQ.findOne({ rfqId: req.params.id, tenantId });

    if (!rfq) {
      return res.status(404).json({ success: false, error: 'RFQ not found' });
    }

    const { sellerId, sellerName, quotedPrice, deliveryTime, message } = req.body;

    rfq.responses.push({
      sellerId,
      sellerName,
      quotedPrice,
      deliveryTime,
      message,
      respondedAt: new Date()
    });

    rfq.status = 'quotes_received';
    await rfq.save();

    await publishEvent('rfq.quote_received', {
      rfqId: rfq.rfqId,
      sellerName,
      quotedPrice
    });

    res.json({ success: true, data: rfq });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
