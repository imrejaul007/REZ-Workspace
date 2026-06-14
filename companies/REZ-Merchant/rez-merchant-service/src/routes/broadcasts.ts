
import { Router, Request, Response } from 'express';
import { Broadcast } from '../models/Broadcast';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

const BROADCAST_ALLOWED_FIELDS = [
  'title', 'message', 'type', 'channel', 'storeId',
  'targetAudience', 'scheduledAt', 'status', 'template',
  'imageUrl', 'actionUrl', 'tags', 'metadata',
];

function pickBroadcastFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of BROADCAST_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      Broadcast.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Broadcast.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Broadcast.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const item = await Broadcast.create({ ...pickBroadcastFields(req.body), merchantId: req.merchantId });
    res.status(201).json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickBroadcastFields(req.body);
    allowedFields.updatedAt = new Date();
    const item = await Broadcast.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: allowedFields }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Broadcast.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// POST /broadcasts/estimate-audience
// NOTE: Customer data is owned by rez-backend. merchant-service estimates audience
// from StorePayment records (unique userId per store) as a proxy.
router.post('/estimate-audience', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.body;
    const { StorePayment } = await import('../models/StorePayment');
    const query: unknown = { merchantId: req.merchantId };
    if (storeId) query.storeId = storeId;
    const count = await StorePayment.distinct('userId', query).then(ids => ids.length);
    res.json({ success: true, data: { estimatedCount: count, segment: 'all' } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /broadcasts/audience/interests
router.get('/audience/interests', async (req: Request, res: Response) => {
  const interests = [
    { id: 'food', label: 'Food & Dining', count: 0 },
    { id: 'fashion', label: 'Fashion', count: 0 },
    { id: 'tech', label: 'Technology', count: 0 },
    { id: 'health', label: 'Health & Fitness', count: 0 },
    { id: 'travel', label: 'Travel', count: 0 },
    { id: 'beauty', label: 'Beauty & Salon', count: 0 },
    { id: 'grocery', label: 'Grocery', count: 0 },
    { id: 'entertainment', label: 'Entertainment', count: 0 },
  ];
  res.json({ success: true, data: interests });
});

// GET /broadcasts/audience/locations
router.get('/audience/locations', async (req: Request, res: Response) => {
  const locations = [
    { id: 'local', label: 'Nearby (<5km)', count: 0 },
    { id: 'city', label: 'Same City', count: 0 },
    { id: 'state', label: 'Same State', count: 0 },
    { id: 'all', label: 'All Locations', count: 0 },
  ];
  res.json({ success: true, data: locations });
});

// GET /broadcasts/marketing/campaigns
router.get('/marketing/campaigns', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const Broadcast = (await import('../models/Broadcast')).Broadcast;
    const [items, total] = await Promise.all([
      Broadcast.find({ merchantId: req.merchantId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Broadcast.countDocuments({ merchantId: req.merchantId }),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /broadcasts/marketing/analytics
router.get('/marketing/analytics', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 86400000);
    const Broadcast = (await import('../models/Broadcast')).Broadcast;
    const campaigns = await Broadcast.find({
      merchantId: req.merchantId,
      createdAt: { $gte: startDate },
    }).lean();
    const totalSent = campaigns.reduce((sum: number, c) => sum + ((c as unknown).reach || (c as unknown).sent || 0), 0);
    const totalOpened = campaigns.reduce((sum: number, c) => sum + ((c as unknown).opened || 0), 0);
    res.json({
      success: true,
      data: {
        totalCampaigns: campaigns.length,
        totalSent,
        totalOpened,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
        recentCampaigns: campaigns.slice(0, 5).map((c) => ({ id: c._id, name: (c as unknown).title || 'Untitled', sent: (c as unknown).reach || 0, opened: (c as unknown).opened || 0 })),
      },
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /broadcasts/keyword-bids
router.get('/keyword-bids', async (req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

export default router;
