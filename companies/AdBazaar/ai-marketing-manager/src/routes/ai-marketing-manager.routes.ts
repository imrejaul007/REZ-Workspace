import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { aiMarketingManagerService, recommendationService, campaignService, performanceService } from '../services';
import { authMiddleware, merchantAuthMiddleware, asyncHandler, validate } from '../middleware';
import { recordCampaignCreated, recordRecommendationGenerated } from '../middleware/metrics.middleware';
import {
  InitializeAIManagerRequestSchema,
  GetRecommendationsRequestSchema,
  ExecuteActionRequestSchema,
  GetCalendarRequestSchema,
  GetPerformanceRequestSchema,
  CreateCampaignRequestSchema,
  ReviewResponseRequestSchema,
  WhatsAppCampaignRequestSchema,
  SEOUpdateRequestSchema,
} from '../types';
import logger from 'utils/logger.js';

const router = Router();

/**
 * POST /api/ai/initialize
 * Initialize AI Marketing Manager for a merchant
 */
router.post(
  '/initialize',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = InitializeAIManagerRequestSchema.parse(req.body);
    const { merchantId, businessProfile, capabilities } = validated;

    logger.info(`Initializing AI Marketing Manager for merchant: ${merchantId}`);

    const manager = await aiMarketingManagerService.initialize(
      merchantId,
      businessProfile,
      capabilities
    );

    res.status(201).json({
      success: true,
      data: {
        managerId: manager.managerId,
        merchantId: manager.merchantId,
        businessProfile: manager.businessProfile,
        capabilities: manager.capabilities,
        status: manager.status,
        createdAt: manager.createdAt,
      },
      message: 'AI Marketing Manager initialized successfully',
    });
  })
);

/**
 * GET /api/ai/manager/:merchantId
 * Get manager status for a merchant
 */
router.get(
  '/manager/:merchantId',
  authMiddleware,
  merchantAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.params;

    const manager = await aiMarketingManagerService.getByMerchantId(merchantId);

    if (!manager) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'AI Marketing Manager not found for this merchant',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        managerId: manager.managerId,
        merchantId: manager.merchantId,
        businessProfile: manager.businessProfile,
        capabilities: manager.capabilities,
        activeCampaigns: manager.activeCampaigns,
        status: manager.status,
        performance: manager.performance,
        createdAt: manager.createdAt,
        updatedAt: manager.updatedAt,
      },
    });
  })
);

/**
 * POST /api/ai/recommend
 * Get marketing recommendations
 */
router.post(
  '/recommend',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = GetRecommendationsRequestSchema.parse(req.body);
    const { merchantId, category, limit } = validated;

    const manager = await aiMarketingManagerService.getByMerchantId(merchantId);

    if (!manager) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'AI Marketing Manager not found for this merchant',
        },
      });
      return;
    }

    // Get recommendations, optionally filtered by category
    let recommendations = manager.recommendations;

    if (category) {
      recommendations = recommendations.filter(r => r.category === category);
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations = recommendations
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, limit);

    // Record metrics
    recommendations.forEach(r => {
      recordRecommendationGenerated(r.priority);
    });

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
        managerId: manager.managerId,
      },
    });
  })
);

/**
 * POST /api/ai/execute
 * Execute a marketing action
 */
router.post(
  '/execute',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = ExecuteActionRequestSchema.parse(req.body);
    const { merchantId, actionType, parameters } = validated;

    const manager = await aiMarketingManagerService.getByMerchantId(merchantId);

    if (!manager) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'AI Marketing Manager not found for this merchant',
        },
      });
      return;
    }

    let result: any;

    switch (actionType) {
      case 'create_campaign':
        const campaignResult = await campaignService.executeCampaign({
          merchantId,
          managerId: manager.managerId,
          type: parameters.type,
          name: parameters.name,
          headline: parameters.headline,
          body: parameters.body,
          imageUrl: parameters.imageUrl,
          callToAction: parameters.callToAction,
          budget: parameters.budget,
          startDate: parameters.startDate ? new Date(parameters.startDate) : undefined,
          endDate: parameters.endDate ? new Date(parameters.endDate) : undefined,
          frequency: parameters.frequency,
          platform: parameters.platform,
        });
        result = campaignResult;
        if (campaignResult.success) {
          recordCampaignCreated(parameters.type, 'active');
        }
        break;

      case 'optimize_campaign':
        result = await campaignService.optimizeCampaign(
          parameters.campaignId,
          parameters.optimizationType || 'creative'
        );
        break;

      case 'respond_to_review':
        result = await aiMarketingManagerService.respondToReview(parameters.reviewId, {
          content: parameters.response,
          tone: parameters.tone || 'professional',
        });
        break;

      case 'schedule_post':
        result = await aiMarketingManagerService.schedulePost(
          merchantId,
          manager.managerId,
          parameters.type || 'post',
          parameters.content,
          new Date(parameters.scheduledFor),
          parameters.platform
        );
        break;

      case 'send_whatsapp':
        // Execute WhatsApp campaign
        result = await campaignService.executeCampaign({
          merchantId,
          managerId: manager.managerId,
          type: 'whatsapp_broadcast',
          name: parameters.campaignName || 'WhatsApp Campaign',
          headline: parameters.campaignName || 'WhatsApp Campaign',
          body: parameters.message,
          frequency: parameters.frequency,
          startDate: parameters.scheduledFor ? new Date(parameters.scheduledFor) : undefined,
        });
        break;

      case 'request_review':
        result = await aiMarketingManagerService.schedulePost(
          merchantId,
          manager.managerId,
          'review_request',
          parameters.message || 'Please share your feedback with us!',
          new Date(parameters.scheduledFor || Date.now() + 60 * 60 * 1000),
          'google'
        );
        break;

      case 'update_seo':
        // Update business profile for SEO
        result = await aiMarketingManagerService.updateBusinessProfile(merchantId, {
          name: parameters.title,
          description: parameters.description,
        });
        break;

      default:
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Unknown action type: ${actionType}`,
          },
        });
        return;
    }

    res.json({
      success: true,
      data: result,
      message: `Action ${actionType} executed successfully`,
    });
  })
);

/**
 * GET /api/ai/calendar
 * Get marketing calendar
 */
router.get(
  '/calendar',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = GetCalendarRequestSchema.parse({
      ...req.query,
      merchantId: req.query.merchantId || req.user?.merchantId,
    });
    const { merchantId, startDate, endDate, type } = validated;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MERCHANT_ID_REQUIRED',
          message: 'Merchant ID is required',
        },
      });
      return;
    }

    const events = await aiMarketingManagerService.getCalendarEvents(
      merchantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      type
    );

    res.json({
      success: true,
      data: {
        events: events.map(e => ({
          eventId: e.eventId,
          type: e.type,
          content: e.content,
          scheduledFor: e.scheduledFor,
          platform: e.platform,
          status: e.status,
          campaignId: e.campaignId,
        })),
        total: events.length,
      },
    });
  })
);

/**
 * GET /api/ai/performance
 * Get performance report
 */
router.get(
  '/performance',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = GetPerformanceRequestSchema.parse({
      ...req.query,
      merchantId: req.query.merchantId || req.user?.merchantId,
    });
    const { merchantId, startDate, endDate, campaignId } = validated;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MERCHANT_ID_REQUIRED',
          message: 'Merchant ID is required',
        },
      });
      return;
    }

    const report = await performanceService.getPerformanceReport(
      merchantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({
      success: true,
      data: report,
    });
  })
);

/**
 * POST /api/ai/campaigns
 * Create a new campaign
 */
router.post(
  '/campaigns',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = CreateCampaignRequestSchema.parse(req.body);
    const { merchantId, type, name, content, budget, schedule } = validated;

    const manager = await aiMarketingManagerService.getByMerchantId(merchantId);

    if (!manager) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'AI Marketing Manager not found for this merchant',
        },
      });
      return;
    }

    const campaign = await aiMarketingManagerService.createCampaign(
      merchantId,
      manager.managerId,
      type,
      name,
      content,
      budget,
      schedule
    );

    recordCampaignCreated(type, 'draft');

    res.status(201).json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        merchantId: campaign.merchantId,
        type: campaign.type,
        status: campaign.status,
        name: campaign.name,
        content: campaign.content,
        budget: campaign.budget,
        schedule: campaign.schedule,
        createdAt: campaign.createdAt,
      },
      message: 'Campaign created successfully',
    });
  })
);

/**
 * GET /api/ai/campaigns
 * List campaigns
 */
router.get(
  '/campaigns',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const merchantId = req.query.merchantId as string || req.user?.merchantId;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MERCHANT_ID_REQUIRED',
          message: 'Merchant ID is required',
        },
      });
      return;
    }

    const { campaigns, total } = await aiMarketingManagerService.getCampaigns(merchantId, {
      status: req.query.status as any,
      type: req.query.type as any,
      limit: parseInt(req.query.limit as string) || 20,
      page: parseInt(req.query.page as string) || 1,
    });

    res.json({
      success: true,
      data: campaigns.map(c => ({
        campaignId: c.campaignId,
        type: c.type,
        status: c.status,
        name: c.name,
        content: c.content,
        budget: c.budget,
        performance: c.performance,
        createdAt: c.createdAt,
      })),
      meta: {
        total,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      },
    });
  })
);

/**
 * GET /api/ai/campaigns/:campaignId
 * Get campaign details
 */
router.get(
  '/campaigns/:campaignId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId } = req.params;

    const analytics = await campaignService.getCampaignAnalytics(campaignId);

    if (!analytics) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: analytics,
    });
  })
);

/**
 * PATCH /api/ai/campaigns/:campaignId/status
 * Update campaign status
 */
router.patch(
  '/campaigns/:campaignId/status',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId } = req.params;
    const { status } = req.body;

    if (!['draft', 'scheduled', 'active', 'paused', 'completed', 'failed'].includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid campaign status',
        },
      });
      return;
    }

    const campaign = await aiMarketingManagerService.updateCampaignStatus(campaignId, status);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        status: campaign.status,
      },
      message: 'Campaign status updated successfully',
    });
  })
);

/**
 * POST /api/ai/reviews/respond
 * Respond to a review
 */
router.post(
  '/reviews/respond',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = ReviewResponseRequestSchema.parse(req.body);
    const { merchantId, reviewId, response, tone } = validated;

    const review = await aiMarketingManagerService.respondToReview(reviewId, { content: response, tone });

    if (!review) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        reviewId: review.reviewId,
        response: review.response,
      },
      message: 'Review response submitted successfully',
    });
  })
);

/**
 * GET /api/ai/reviews
 * Get reviews
 */
router.get(
  '/reviews',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const merchantId = req.query.merchantId as string || req.user?.merchantId;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MERCHANT_ID_REQUIRED',
          message: 'Merchant ID is required',
        },
      });
      return;
    }

    const { reviews, total } = await aiMarketingManagerService.getReviews(merchantId, {
      platform: req.query.platform as string,
      sentiment: req.query.sentiment as string,
      limit: parseInt(req.query.limit as string) || 20,
      page: parseInt(req.query.page as string) || 1,
    });

    res.json({
      success: true,
      data: reviews,
      meta: {
        total,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      },
    });
  })
);

/**
 * POST /api/ai/whatsapp
 * Send WhatsApp campaign
 */
router.post(
  '/whatsapp',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = WhatsAppCampaignRequestSchema.parse(req.body);
    const { merchantId, campaignName, message, segment, scheduledFor } = validated;

    const manager = await aiMarketingManagerService.getByMerchantId(merchantId);

    if (!manager) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'AI Marketing Manager not found for this merchant',
        },
      });
      return;
    }

    if (!manager.capabilities.whatsappCampaigns) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CAPABILITY_NOT_ENABLED',
          message: 'WhatsApp campaigns are not enabled for this merchant',
        },
      });
      return;
    }

    const result = await campaignService.executeCampaign({
      merchantId,
      managerId: manager.managerId,
      type: 'whatsapp_broadcast',
      name: campaignName,
      headline: campaignName,
      body: message,
      startDate: scheduledFor ? new Date(scheduledFor) : undefined,
    });

    if (result.success) {
      recordCampaignCreated('whatsapp_broadcast', 'active');
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'WhatsApp campaign created successfully',
    });
  })
);

/**
 * PUT /api/ai/seo
 * Update SEO settings
 */
router.put(
  '/seo',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validated = SEOUpdateRequestSchema.parse(req.body);
    const { merchantId, updates } = validated;

    const manager = await aiMarketingManagerService.updateBusinessProfile(merchantId, {
      name: updates.title,
      description: updates.description,
    });

    if (!manager) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'AI Marketing Manager not found for this merchant',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        businessProfile: manager.businessProfile,
      },
      message: 'SEO settings updated successfully',
    });
  })
);

/**
 * GET /api/ai/recommendations/refresh
 * Refresh recommendations
 */
router.get(
  '/recommendations/refresh',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const merchantId = req.query.merchantId as string || req.user?.merchantId;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MERCHANT_ID_REQUIRED',
          message: 'Merchant ID is required',
        },
      });
      return;
    }

    const recommendations = await recommendationService.updateRecommendations(merchantId);

    recommendations.forEach(r => {
      recordRecommendationGenerated(r.priority);
    });

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
      },
      message: 'Recommendations refreshed successfully',
    });
  })
);

export default router;