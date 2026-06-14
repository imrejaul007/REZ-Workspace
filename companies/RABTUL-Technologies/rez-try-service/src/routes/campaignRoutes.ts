/**
 * Campaign Routes
 */
import { Router, Request, Response } from 'express';
import { CampaignModel } from '../models';
import { logger } from '../config/logger';

const router = Router();

// Get all active campaigns
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const campaigns = await CampaignModel.find({
      isActive: true,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    }).sort({ endsAt: 1 });

    res.json({ success: true, data: campaigns });
  } catch (error) {
    logger.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaigns' });
  }
});

// Get campaign by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await CampaignModel.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, data: campaign });
  } catch (error) {
    logger.error('Error fetching campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaign' });
  }
});

export default router;
