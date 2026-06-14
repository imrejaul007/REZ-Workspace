import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoyaltyCampaignModel } from '../models';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Create a new campaign
 * POST /api/v1/campaigns
 */
router.post('/',
  validateBody(schemas.createCampaign),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      name,
      merchantId,
      vertical,
      type,
      multiplier,
      startDate,
      endDate,
      maxParticipants
    } = req.body;

    const campaignId = `camp_${uuidv4()}`;

    const campaign = new LoyaltyCampaignModel({
      campaignId,
      name,
      merchantId,
      vertical,
      type,
      multiplier,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxParticipants,
      participantCount: 0,
      participants: [],
      status: 'active',
      createdAt: new Date()
    });

    await campaign.save();

    logger.info(`Campaign created: ${campaignId}`);

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully'
    });
  })
);

/**
 * Get campaigns for a merchant
 * GET /api/v1/campaigns/:merchantId
 */
router.get('/:merchantId',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.params;
    const status = req.query.status as string;
    const vertical = req.query.vertical as string;

    const query: any = { merchantId };

    if (status) {
      query.status = status;
    }

    if (vertical) {
      query.vertical = vertical;
    }

    const campaigns = await LoyaltyCampaignModel.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        campaigns,
        count: campaigns.length
      }
    });
  })
);

/**
 * Get active campaigns
 * GET /api/v1/campaigns/active
 */
router.get('/active',
  asyncHandler(async (req: Request, res: Response) => {
    const vertical = req.query.vertical as string;
    const merchantId = req.query.merchantId as string;

    const campaigns = await LoyaltyCampaignModel.getActiveCampaigns(vertical, merchantId);

    res.json({
      success: true,
      data: {
        campaigns,
        count: campaigns.length
      }
    });
  })
);

/**
 * Get campaign by ID
 * GET /api/v1/campaigns/detail/:campaignId
 */
router.get('/detail/:campaignId',
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId } = req.params;

    const campaign = await LoyaltyCampaignModel.findOne({ campaignId });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...campaign.toObject(),
        isValid: campaign.isValid()
      }
    });
  })
);

/**
 * Join a campaign
 * POST /api/v1/campaigns/:campaignId/join
 */
router.post('/:campaignId/join',
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId } = req.params;
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    const campaign = await LoyaltyCampaignModel.findOne({ campaignId });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    if (!campaign.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Campaign is not valid or has ended'
      });
    }

    const success = await campaign.addParticipant(accountId);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: campaign.maxParticipants && campaign.participantCount >= campaign.maxParticipants
          ? 'Campaign is full'
          : 'Already a participant'
      });
    }

    logger.info(`Account ${accountId} joined campaign ${campaignId}`);

    res.json({
      success: true,
      data: {
        campaignId,
        accountId,
        participantCount: campaign.participantCount
      },
      message: 'Successfully joined campaign'
    });
  })
);

/**
 * Update campaign status
 * PUT /api/v1/campaigns/:campaignId/status
 */
router.put('/:campaignId/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const campaign = await LoyaltyCampaignModel.findOneAndUpdate(
      { campaignId },
      { status },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    logger.info(`Campaign ${campaignId} status updated to ${status}`);

    res.json({
      success: true,
      data: campaign,
      message: `Campaign status updated to ${status}`
    });
  })
);

/**
 * Delete/cancel a campaign
 * DELETE /api/v1/campaigns/:campaignId
 */
router.delete('/:campaignId',
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId } = req.params;

    const campaign = await LoyaltyCampaignModel.findOneAndUpdate(
      { campaignId },
      { status: 'cancelled' },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    logger.info(`Campaign ${campaignId} cancelled`);

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign cancelled successfully'
    });
  })
);

/**
 * Get campaigns by vertical
 * GET /api/v1/campaigns/vertical/:vertical
 */
router.get('/vertical/:vertical',
  asyncHandler(async (req: Request, res: Response) => {
    const { vertical } = req.params;
    const status = req.query.status as string || 'active';

    const now = new Date();

    const query: any = {
      vertical,
      status,
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    const campaigns = await LoyaltyCampaignModel.find(query)
      .sort({ multiplier: -1, endDate: 1 });

    res.json({
      success: true,
      data: {
        campaigns,
        count: campaigns.length,
        vertical
      }
    });
  })
);

/**
 * Get campaign performance
 * GET /api/v1/campaigns/:campaignId/performance
 */
router.get('/:campaignId/performance',
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId } = req.params;

    const campaign = await LoyaltyCampaignModel.findOne({ campaignId });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    const totalDays = Math.ceil(
      (campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.ceil(
      (campaign.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      success: true,
      data: {
        campaign,
        performance: {
          participantCount: campaign.participantCount,
          maxParticipants: campaign.maxParticipants,
          capacityUsed: campaign.maxParticipants
            ? ((campaign.participantCount / campaign.maxParticipants) * 100).toFixed(2)
            : 'N/A',
          duration: {
            totalDays,
            daysRemaining,
            percentComplete: ((1 - daysRemaining / totalDays) * 100).toFixed(2)
          }
        }
      }
    });
  })
);

export default router;