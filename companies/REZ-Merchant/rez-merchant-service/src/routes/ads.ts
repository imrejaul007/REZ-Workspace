import { Router, Request, Response } from 'express';
import { AdCampaign } from '../models/AdCampaign';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

const AD_ALLOWED_FIELDS = [
  'title', 'headline', 'description', 'ctaText', 'ctaUrl', 'imageUrl',
  'placement', 'targetSegment', 'bidType', 'bidAmount', 'dailyBudget',
  'totalBudget', 'startDate', 'endDate', 'storeId',
];

function pickAdFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const field of AD_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

// GET /ads — list merchant's ads
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: unknown = { merchantId: new mongoose.Types.ObjectId(req.merchantId as string) };
    if (req.query.status) query.status = req.query.status;
    if (req.query.storeId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.storeId as string)) {
        res.status(400).json({ success: false, message: 'Invalid storeId' }); return;
      }
      query.storeId = new mongoose.Types.ObjectId(req.query.storeId as string);
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    const [items, total] = await Promise.all([
      AdCampaign.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      AdCampaign.countDocuments(query),
    ]);

    res.json({ success: true, data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /ads/analytics — aggregate stats for merchant's ads
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const merchantOid = new mongoose.Types.ObjectId(req.merchantId as string);
    const [stats] = await AdCampaign.aggregate([
      { $match: { merchantId: merchantOid } },
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
          totalSpend: { $sum: '$totalSpent' },
          activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending_review'] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats ?? { totalImpressions: 0, totalClicks: 0, totalSpend: 0, activeCount: 0, pendingCount: 0 },
    });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /ads/:id — single ad
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await AdCampaign.findOne({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Ad not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /ads — create ad
router.post('/', async (req: Request, res: Response) => {
  try {
    const fields = pickAdFields(req.body);
    if (!fields.title || !fields.headline || !fields.imageUrl || !fields.placement || !fields.bidType) {
      res.status(400).json({ success: false, message: 'Missing required fields: title, headline, imageUrl, placement, bidType' });
      return;
    }
    const item = await AdCampaign.create({ ...fields, merchantId: req.merchantId, status: 'draft' });
    res.status(201).json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /ads/:id — update ad
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const fields = pickAdFields(req.body);
    const item = await AdCampaign.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: fields },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Ad not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /ads/:id — delete ad (only if draft)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await AdCampaign.findOne({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Ad not found' }); return; }
    if (item.status === 'active') {
      res.status(400).json({ success: false, message: 'Cannot delete an active ad. Pause it first.' });
      return;
    }
    await AdCampaign.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Ad deleted' });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /ads/:id/submit — submit for review
router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const item = await AdCampaign.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId, status: 'draft' },
      { $set: { status: 'pending_review' } },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Ad not found or not in draft status' }); return; }
    res.json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /ads/:id/pause — pause active ad
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const item = await AdCampaign.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId, status: 'active' },
      { $set: { status: 'paused' } },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Ad not found or not active' }); return; }
    res.json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /ads/:id/activate — reactivate paused ad
router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const item = await AdCampaign.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId, status: 'paused' },
      { $set: { status: 'active' } },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Ad not found or not paused' }); return; }
    res.json({ success: true, data: item });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /ads/:id/track-interaction — track ad interaction (click/impression) with budget check
router.post('/:id/track-interaction', async (req: Request, res: Response) => {
  try {
    const { interactionType, cost } = req.body;
    if (!interactionType || !['click', 'impression'].includes(interactionType)) {
      res.status(400).json({ success: false, message: 'Invalid interactionType (must be click or impression)' });
      return;
    }
    if (typeof cost !== 'number' || cost < 0) {
      res.status(400).json({ success: false, message: 'Invalid cost' });
      return;
    }

    const campaign = await AdCampaign.findOne({ _id: req.params.id, merchantId: req.merchantId });
    if (!campaign) { res.status(404).json({ success: false, message: 'Campaign not found' }); return; }

    // CRIT-12 FIX: Budget enforcement check before serving/tracking interactions
    if (campaign.totalSpent >= campaign.totalBudget) {
      // Auto-pause campaign when budget is exhausted
      await AdCampaign.findByIdAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: { status: 'paused' } });
      res.status(400).json({
        success: false,
        message: 'Campaign budget exhausted. Campaign has been automatically paused.',
      });
      return;
    }

    // Update metrics based on interaction type
    const updateObj: unknown = { $inc: { totalSpent: cost } };
    if (interactionType === 'click') updateObj.$inc.clicks = 1;
    else if (interactionType === 'impression') updateObj.$inc.impressions = 1;

    const updated = await AdCampaign.findByIdAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, updateObj, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : e.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
