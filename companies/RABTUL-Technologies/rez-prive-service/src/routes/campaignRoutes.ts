/**
 * Campaign Routes
 * API endpoints for Prive campaigns
 */

import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { logger } from '../config/logger';
import { Campaign, PriveUser, CampaignEnrollment } from '../models';

const router = Router();

/**
 * GET /api/campaigns
 * Get available Prive campaigns
 */
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { page = '1', limit = '20', status = 'active', category } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build query filters
    const query: Record<string, unknown> = {
      isActive: status === 'active' ? true : { $ne: false },
    };

    // Filter by date range (active campaigns)
    if (status === 'active') {
      const now = new Date();
      query.startDate = { $lte: now };
      query.$or = [
        { endDate: { $exists: false } },
        { endDate: { $gte: now } },
      ];
    }

    // Filter by category if provided
    if (category) {
      query.categories = category;
    }

    // Fetch campaigns from database
    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .sort({ startDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Campaign.countDocuments(query),
    ]);

    // Get user's enrollment status for each campaign
    const campaignIds = campaigns.map(c => c._id);
    const enrollments = await CampaignEnrollment.find({
      campaignId: { $in: campaignIds },
      userId,
    }).lean();

    const enrollmentMap = new Map(
      enrollments.map(e => [e.campaignId.toString(), e])
    );

    // Attach enrollment status to campaigns
    const campaignsWithEnrollment = campaigns.map(campaign => ({
      ...campaign,
      isEnrolled: enrollmentMap.has(campaign._id.toString()),
      enrolledAt: enrollmentMap.get(campaign._id.toString())?.enrolledAt,
    }));

    logger.info('[CampaignRoutes] Campaigns fetched', {
      userId,
      count: campaigns.length,
      total,
      page: pageNum,
    });

    res.json({
      success: true,
      data: campaignsWithEnrollment,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Failed to get campaigns', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get campaigns' });
  }
});

/**
 * GET /api/campaigns/eligible
 * Get campaigns user is eligible for
 */
router.get('/eligible', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Get user's Prive profile for segment/tier matching
    const priveUser = await PriveUser.findOne({ userId }).lean();

    // Get user's existing enrollments
    const existingEnrollments = await CampaignEnrollment.find({ userId }).lean();
    const enrolledCampaignIds = new Set(existingEnrollments.map(e => e.campaignId.toString()));

    const now = new Date();

    // Fetch eligible campaigns from database
    // A campaign is eligible if:
    // 1. It's active and within date range
    // 2. User is not already enrolled
    // 3. User meets target segments/categories criteria
    const query: Record<string, unknown> = {
      isActive: true,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: now } },
      ],
    };

    const campaigns = await Campaign.find(query)
      .sort({ endDate: 1, createdAt: -1 }) // Prioritize ending soonest
      .limit(50)
      .lean();

    // Filter campaigns based on eligibility criteria
    const eligibleCampaigns = campaigns.filter(campaign => {
      // Skip if already enrolled
      if (enrolledCampaignIds.has(campaign._id.toString())) {
        return false;
      }

      // Check if budget is exhausted
      if (campaign.budget && campaign.spent >= campaign.budget) {
        return false;
      }

      // Check target segments (if specified)
      if (campaign.targetSegments && campaign.targetSegments.length > 0) {
        const userSegment = priveUser?.segment || 'entry';
        if (!campaign.targetSegments.includes(userSegment)) {
          return false;
        }
      }

      // Check categories (if specified and user has one)
      if (campaign.categories && campaign.categories.length > 0 && priveUser?.category) {
        if (!campaign.categories.includes(priveUser.category)) {
          return false;
        }
      }

      return true;
    });

    logger.info('[CampaignRoutes] Eligible campaigns fetched', {
      userId,
      userSegment: priveUser?.segment,
      totalEligible: eligibleCampaigns.length,
    });

    res.json({
      success: true,
      data: eligibleCampaigns,
      meta: {
        userSegment: priveUser?.segment || 'entry',
        totalEligible: eligibleCampaigns.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get eligible campaigns', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'Failed to get campaigns' });
  }
});

export default router;
