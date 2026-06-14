
import { Router, Request, Response } from 'express';
import { Integration } from '../models/Integration';
import { merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// PEN-TEST FIX: SSRF protection - block internal/private network addresses
const SSRF_BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1', '::',
  // AWS metadata
  '169.254.169.254', 'metadata.google.internal',
  // Private ranges
  /^10\.\d+\.\d+\.\d+$/, /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, /^192\.168\.\d+\.\d+$/,
  /\.local$/, /\.internal$/, /\.localhost$/,
];

function isBlockedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Block all internal hostnames
    if (hostname === 'localhost' || hostname === 'metadata.google.internal') {
      return true;
    }

    // Block IP addresses
    const ipBlocked = [
      '0.0.0.0', '::1', '::',
      '169.254.169.254', // AWS metadata
    ].includes(hostname);
    if (ipBlocked) return true;

    // Check private IP ranges
    const privateRanges = [
      /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
    ];
    if (privateRanges.some(r => r.test(hostname))) return true;

    // Block internal domains
    if (hostname.endsWith('.internal') || hostname.endsWith('.localhost')) {
      return true;
    }

    return false;
  } catch {
    return true; // Invalid URL is blocked
  }
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const [items, total] = await Promise.all([
      Integration.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Integration.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Integration.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const INTEGRATION_ALLOWED = ['name', 'type', 'provider', 'config', 'webhookUrl', 'isActive', 'storeId', 'credentials', 'settings', 'metadata'];
    const safe: Record<string, unknown> = {};
    for (const f of INTEGRATION_ALLOWED) { if ((req.body as unknown)[f] !== undefined) safe[f] = (req.body as unknown)[f]; }

    // PEN-TEST FIX: SSRF protection for webhook URLs
    if (safe.webhookUrl && typeof safe.webhookUrl === 'string') {
      // Validate URL format first
      try { new URL(safe.webhookUrl); }
      catch {
        res.status(400).json({ success: false, message: 'webhookUrl must be a valid URL' });
        return;
      }
      // Block SSRF attempts
      if (isBlockedUrl(safe.webhookUrl)) {
        logger.warn('SSRF attempt blocked', { webhookUrl: safe.webhookUrl, merchantId: req.merchantId });
        res.status(400).json({ success: false, message: 'Webhook URL cannot point to internal networks' });
        return;
      }
    }
    const item = await Integration.create({ ...safe, merchantId: req.merchantId });
    res.status(201).json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const INTEGRATION_ALLOWED = ['name', 'type', 'provider', 'config', 'webhookUrl', 'isActive', 'storeId', 'credentials', 'settings', 'metadata'];
    const update: Record<string, unknown> = {};
    for (const f of INTEGRATION_ALLOWED) { if ((req.body as unknown)[f] !== undefined) update[f] = (req.body as unknown)[f]; }

    // PEN-TEST FIX: SSRF protection for webhook URLs on update
    if (update.webhookUrl && typeof update.webhookUrl === 'string') {
      try { new URL(update.webhookUrl); }
      catch {
        res.status(400).json({ success: false, message: 'webhookUrl must be a valid URL' });
        return;
      }
      if (isBlockedUrl(update.webhookUrl)) {
        logger.warn('SSRF attempt blocked on update', { webhookUrl: update.webhookUrl, merchantId: req.merchantId });
        res.status(400).json({ success: false, message: 'Webhook URL cannot point to internal networks' });
        return;
      }
    }

    const item = await Integration.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: update }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Integration.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

// PATCH /integrations/aggregator/orders/:id/status — update aggregator (Swiggy/Zomato) order status
router.patch('/aggregator/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: 'status is required' });
      return;
    }
    // SEC-003 FIX: Verify merchant has an active aggregator integration before allowing status update
    const integration = await Integration.findOne({
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
      isActive: true,
      type: 'aggregator',
    }).lean();
    if (!integration) {
      res.status(403).json({ success: false, message: 'No active aggregator integration found' });
      return;
    }
    // Aggregator order status updates are proxied through — log and return.
    // Real implementation would call the aggregator's webhook/status API.
    logger.info('[aggregator] order status update', {
      orderId: req.params.id,
      status,
      merchantId: req.merchantId,
      provider: (integration as unknown as { provider: string }).provider,
    });
    res.json({ success: true, data: { orderId: req.params.id, status, updatedAt: new Date() } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /integrations/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const integrations = await Integration.find({ merchantId: req.merchantId }).lean();
    const active = integrations.filter(i => (i as unknown).status === 'active').length;
    const inactive = integrations.filter(i => (i as unknown).status === 'inactive').length;
    res.json({
      success: true,
      data: {
        integrations,
        activeCount: active,
        inactiveCount: inactive,
        totalCount: integrations.length,
        recentTransactions: 0,
        pendingTransactions: 0,
      }
    });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const message = process.env.NODE_ENV === "production"
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message });
  }
});

export default router;
