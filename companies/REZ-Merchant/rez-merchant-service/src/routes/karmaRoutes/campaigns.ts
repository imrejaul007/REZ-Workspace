
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { KarmaCampaign } from '../../models/KarmaCampaign';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

const CAMPAIGN_ALLOWED_FIELDS = ['name', 'description', 'type', 'coinsReward', 'coinsRequired', 'minOrderValue', 'maxCoinsPerUser', 'startDate', 'endDate', 'isActive', 'storeIds'];

function pickCampaignFields(body: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const f of CAMPAIGN_ALLOWED_FIELDS) {
    if (body[f] !== undefined) filtered[f] = body[f];
  }
  return filtered;
}

function errorResponse(res: Response, err) {
  const requestId = (res as unknown as { locals?: { requestId?: string } }).locals?.requestId;
  const msg = process.env.NODE_ENV === 'production'
    ? `An error occurred. Reference: ${requestId || 'unknown'}`
    : err.message;
  res.status(500).json({ success: false, message: msg });
}

router.post('/campaign', async (req: Request, res: Response) => {
  try {
    const campaign = new KarmaCampaign({
      ...pickCampaignFields(req.body),
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
    });
    await campaign.save();
    res.status(201).json({ success: true, message: 'Karma campaign created', data: campaign });
  } catch (err) {
    errorResponse(res, err);
  }
});

router.get('/campaign', async (req: Request, res: Response) => {
  try {
    const query: Record<string, unknown> = {
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
    };
    if (req.query.status) query.status = req.query.status;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [campaigns, total] = await Promise.all([
      KarmaCampaign.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      KarmaCampaign.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        campaigns,
        pagination: { page, limit, totalCount: total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    errorResponse(res, err);
  }
});

router.get('/campaign/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await KarmaCampaign.findOne({
      _id: req.params.id,
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
    }).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  } catch (err) {
    errorResponse(res, err);
  }
});

router.put('/campaign/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await KarmaCampaign.findOneAndUpdate(
      {
        _id: req.params.id,
        merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
      },
      { $set: { ...pickCampaignFields(req.body), updatedAt: new Date() } },
      { new: true },
    );
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json({ success: true, message: 'Campaign updated', data: campaign });
  } catch (err) {
    errorResponse(res, err);
  }
});

export default router;
