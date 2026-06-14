import { Router, Response } from 'express';
import { z } from 'zod';
import { campaignService } from '../services/campaign.service.js';
import { agentService } from '../services/agent.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Validation schemas
const campaignIdParamSchema = z.object({
  id: z.string().min(1)
});

const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  goal: z.object({
    type: z.enum(['leads', 'sales', 'bookings', 'app_installs', 'engagement']),
    target: z.number().positive(),
    budget: z.number().positive(),
    deadline: z.string().datetime().optional()
  }),
  advertiserId: z.string()
});

const setGoalSchema = z.object({
  type: z.enum(['leads', 'sales', 'bookings', 'app_installs', 'engagement']).optional(),
  target: z.number().positive().optional(),
  budget: z.number().positive().optional(),
  deadline: z.string().datetime().optional()
});

/**
 * POST /api/agent/campaign
 * Create a new goal-driven campaign
 */
router.post(
  '/campaign',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = createCampaignSchema.parse(req.body);

    const campaign = await campaignService.createCampaign({
      name: validatedData.name,
      goal: {
        type: validatedData.goal.type,
        target: validatedData.goal.target,
        budget: validatedData.goal.budget,
        deadline: validatedData.goal.deadline
          ? new Date(validatedData.goal.deadline)
          : undefined
      },
      advertiserId: validatedData.advertiserId
    });

    logger.info('Campaign created via API', {
      campaignId: campaign.campaignId,
      advertiserId: validatedData.advertiserId
    });

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully'
    });
  })
);

/**
 * GET /api/agent/campaign/:id
 * Get campaign status
 */
router.get(
  '/campaign/:id',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = campaignIdParamSchema.parse(req.params);

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    // Check ownership if not admin
    if (req.user?.role !== 'admin' && campaign.advertiserId !== req.user?.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this campaign'
      });
      return;
    }

    const agentRunning = agentService.isAgentRunning(id);

    res.json({
      success: true,
      data: {
        campaign,
        agentStatus: {
          running: agentRunning,
          agentId: campaign.agentId
        }
      }
    });
  })
);

/**
 * POST /api/agent/campaign/:id/goal
 * Set or change campaign goal
 */
router.post(
  '/campaign/:id/goal',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = campaignIdParamSchema.parse(req.params);
    const validatedData = setGoalSchema.parse(req.body);

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    // Check ownership if not admin
    if (req.user?.role !== 'admin' && campaign.advertiserId !== req.user?.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this campaign'
      });
      return;
    }

    const updatedCampaign = await campaignService.updateGoal(id, {
      type: validatedData.type,
      target: validatedData.target,
      budget: validatedData.budget,
      deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined
    });

    logger.info('Campaign goal updated via API', {
      campaignId: id,
      updatedBy: req.user?.userId
    });

    res.json({
      success: true,
      data: updatedCampaign,
      message: 'Goal updated successfully'
    });
  })
);

/**
 * GET /api/agent/campaign/:id/actions
 * Get AI actions taken
 */
router.get(
  '/campaign/:id/actions',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = campaignIdParamSchema.parse(req.params);

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    // Check ownership if not admin
    if (req.user?.role !== 'admin' && campaign.advertiserId !== req.user?.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this campaign'
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await campaignService.getAgentActions(id, limit, offset);

    res.json({
      success: true,
      data: {
        actions: result.actions,
        total: result.total,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < result.total
        }
      }
    });
  })
);

/**
 * PUT /api/agent/campaign/:id/pause
 * Pause agent
 */
router.put(
  '/campaign/:id/pause',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = campaignIdParamSchema.parse(req.params);

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    // Check ownership if not admin
    if (req.user?.role !== 'admin' && campaign.advertiserId !== req.user?.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this campaign'
      });
      return;
    }

    if (campaign.status === 'paused') {
      res.json({
        success: true,
        message: 'Campaign already paused',
        data: campaign
      });
      return;
    }

    await agentService.pauseAgent(id);

    const updatedCampaign = await campaignService.getCampaignById(id);

    logger.info('Campaign paused via API', {
      campaignId: id,
      pausedBy: req.user?.userId
    });

    res.json({
      success: true,
      data: updatedCampaign,
      message: 'Agent paused successfully'
    });
  })
);

/**
 * POST /api/agent/campaign/:id/resume
 * Resume paused agent
 */
router.post(
  '/campaign/:id/resume',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = campaignIdParamSchema.parse(req.params);

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    // Check ownership if not admin
    if (req.user?.role !== 'admin' && campaign.advertiserId !== req.user?.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this campaign'
      });
      return;
    }

    if (campaign.status !== 'paused') {
      res.status(400).json({
        success: false,
        error: 'Campaign must be paused to resume'
      });
      return;
    }

    // Update status to running
    await campaignService.updateStatus(id, 'running');

    // Start the agent loop
    agentService.startAgent(id);

    const updatedCampaign = await campaignService.getCampaignById(id);

    logger.info('Campaign resumed via API', {
      campaignId: id,
      resumedBy: req.user?.userId
    });

    res.json({
      success: true,
      data: updatedCampaign,
      message: 'Agent resumed successfully'
    });
  })
);

/**
 * GET /api/agent/campaign/:id/logs
 * Get agent activity logs
 */
router.get(
  '/campaign/:id/logs',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = campaignIdParamSchema.parse(req.params);

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    // Check ownership if not admin
    if (req.user?.role !== 'admin' && campaign.advertiserId !== req.user?.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this campaign'
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await campaignService.getLogs(id, limit, offset);

    res.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < result.total
        }
      }
    });
  })
);

/**
 * GET /api/agent/campaigns
 * List all campaigns for advertiser
 */
router.get(
  '/campaigns',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const advertiserId = req.user?.advertiserId;

    if (!advertiserId && req.user?.role !== 'admin') {
      res.status(400).json({
        success: false,
        error: 'Advertiser ID required'
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;

    let campaigns;
    if (status) {
      campaigns = await campaignService.getCampaignsByStatus(status as any);
      // Filter by advertiser if not admin
      if (req.user?.role !== 'admin') {
        campaigns = campaigns.filter((c) => c.advertiserId === advertiserId);
      }
    } else {
      campaigns = await campaignService.getCampaignsByAdvertiser(
        advertiserId!,
        limit
      );
    }

    res.json({
      success: true,
      data: {
        campaigns,
        total: campaigns.length
      }
    });
  })
);

/**
 * POST /api/agent/campaign/:id/start
 * Start the agent (manually trigger)
 */
router.post(
  '/campaign/:id/start',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = campaignIdParamSchema.parse(req.params);

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    // Check ownership if not admin
    if (req.user?.role !== 'admin' && campaign.advertiserId !== req.user?.advertiserId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this campaign'
      });
      return;
    }

    if (campaign.status === 'running') {
      res.json({
        success: true,
        message: 'Agent already running',
        data: campaign
      });
      return;
    }

    await agentService.startAgent(id);

    const updatedCampaign = await campaignService.getCampaignById(id);

    logger.info('Agent started via API', {
      campaignId: id,
      startedBy: req.user?.userId
    });

    res.json({
      success: true,
      data: updatedCampaign,
      message: 'Agent started successfully'
    });
  })
);

export default router;