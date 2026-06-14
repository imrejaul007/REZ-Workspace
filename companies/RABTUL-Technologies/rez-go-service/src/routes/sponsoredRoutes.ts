/**
 * REZ Go Sponsored Commerce Routes
 *
 * Brand sponsorship features:
 * - Get active campaigns
 * - Get featured products
 * - Track impressions & conversions
 * - ROAS analytics
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SponsoredCampaign, FeaturedProduct } from '../models/SponsoredCommerce.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/sponsored/campaigns
 * Get active sponsored campaigns for a store
 */
router.get('/campaigns', authMiddleware, async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string;
    const userId = (req as any).user?.sub || req.query.userId as string;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' });
    }

    const now = new Date();

    // Find active campaigns targeting this store
    const campaigns = await SponsoredCampaign.find({
      status: 'active',
      $or: [
        { storeId: storeId },
        { storeId: { $exists: false } }, // Global campaigns
      ],
      'targeting.timeRange.start': { $lte: now },
      'targeting.timeRange.end': { $gte: now },
      $expr: { $lt: ['$budget.spent', '$budget.total'] },
    }).sort({ 'metrics.impressions': -1 });

    res.json({
      success: true,
      campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error('Campaigns error:', error);
    res.status(500).json({ error: 'Failed to get campaigns' });
  }
});

/**
 * GET /api/sponsored/featured
 * Get featured products for a store
 */
router.get('/featured', authMiddleware, async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string;

    if (!storeId) {
      return res.status(400).json({ error: 'storeId is required' });
    }

    const now = new Date();

    // Find active featured products
    const featured = await FeaturedProduct.find({
      storeId,
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: { $gte: now } },
      ],
    }).sort({ position: 1 });

    res.json({
      success: true,
      featured,
      count: featured.length,
    });
  } catch (error) {
    console.error('Featured products error:', error);
    res.status(500).json({ error: 'Failed to get featured products' });
  }
});

/**
 * POST /api/sponsored/impression
 * Track campaign impression
 */
router.post('/impression', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { campaignId, userId, storeId, productId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId is required' });
    }

    // Update campaign metrics
    await SponsoredCampaign.updateOne(
      { campaignId },
      {
        $inc: { 'metrics.impressions': 1 },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Impression tracking error:', error);
    res.status(500).json({ error: 'Failed to track impression' });
  }
});

/**
 * POST /api/sponsored/scan
 * Track campaign scan
 */
router.post('/scan', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { campaignId, userId, storeId, productId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId is required' });
    }

    // Update campaign metrics
    await SponsoredCampaign.updateOne(
      { campaignId },
      {
        $inc: { 'metrics.scans': 1 },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Scan tracking error:', error);
    res.status(500).json({ error: 'Failed to track scan' });
  }
});

/**
 * POST /api/sponsored/redemption
 * Track campaign redemption
 */
router.post('/redemption', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { campaignId, userId, sessionId, amount, reward } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId is required' });
    }

    // Calculate new metrics
    const ctr = await SponsoredCampaign.findOne({ campaignId });
    const scans = (ctr?.metrics.scans || 0) + 1;
    const impressions = ctr?.metrics.impressions || 1;
    const newCtr = (scans / impressions) * 100;

    // Update campaign metrics
    await SponsoredCampaign.updateOne(
      { campaignId },
      {
        $inc: {
          'metrics.redemptions': 1,
          'metrics.revenue': amount || 0,
          'metrics.budget.spent': reward || 0,
          'metrics.budget.remaining': -(reward || 0),
        },
        $set: {
          'metrics.ctr': newCtr,
          'metrics.roas': amount ? (amount / (reward || 1)) : 0,
        },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Redemption tracking error:', error);
    res.status(500).json({ error: 'Failed to track redemption' });
  }
});

/**
 * GET /api/sponsored/analytics/:campaignId
 * Get campaign analytics
 */
router.get('/analytics/:campaignId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;

    const campaign = await SponsoredCampaign.findOne({ campaignId });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      success: true,
      analytics: {
        campaign: {
          name: campaign.name,
          brand: campaign.brandName,
          type: campaign.type,
          status: campaign.status,
        },
        metrics: campaign.metrics,
        budget: campaign.budget,
        ctr: `${campaign.metrics.ctr.toFixed(2)}%`,
        roas: campaign.metrics.roas.toFixed(2),
        cpc: campaign.metrics.impressions > 0
          ? (campaign.budget.spent / campaign.metrics.impressions).toFixed(2)
          : '0.00',
        conversionRate: campaign.metrics.scans > 0
          ? ((campaign.metrics.redemptions / campaign.metrics.scans) * 100).toFixed(2)
          : '0.00',
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * POST /api/sponsored/campaigns
 * Create a new sponsored campaign
 */
router.post('/campaigns', authMiddleware, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as any).user?.merchantId;
    if (!merchantId) {
      return res.status(403).json({ error: 'Merchant access required' });
    }

    const {
      storeId,
      brandId,
      brandName,
      name,
      description,
      type,
      budget,
      targeting,
      reward,
      productIds,
      categoryIds,
    } = req.body;

    if (!brandId || !name || !type || !budget || !reward) {
      return res.status(400).json({
        error: 'brandId, name, type, budget, and reward are required',
      });
    }

    const campaign = await SponsoredCampaign.create({
      campaignId: `CAMP-${uuidv4().substring(0, 8).toUpperCase()}`,
      merchantId,
      storeId,
      brandId,
      brandName,
      name,
      description,
      type,
      status: 'draft',
      budget: {
        total: budget,
        spent: 0,
        remaining: budget,
      },
      targeting,
      reward,
      productIds,
      categoryIds,
      metrics: {
        impressions: 0,
        scans: 0,
        redemptions: 0,
        revenue: 0,
        ctr: 0,
        roas: 0,
      },
    });

    res.status(201).json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

export default router;
