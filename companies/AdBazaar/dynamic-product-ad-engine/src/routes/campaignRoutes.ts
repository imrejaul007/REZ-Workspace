/**
 * Campaign Routes
 * API endpoints for DPA campaign management
 */

import { Router, Request, Response } from 'express';
import { campaignService, rendererService } from '../services';
import {
  authenticate,
  validateBody,
  validateQuery,
  validateParams,
  recordCampaignCreated,
} from '../middleware';
import {
  createCampaignSchema,
  updateCampaignSchema,
  listCampaignsQuerySchema,
  idParamSchema,
  previewRequestSchema,
} from '../utils/validation';
import type { CreateCampaignRequest, UpdateCampaignInput } from '../types';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/dpa/campaign
 * Create a new DPA campaign
 */
router.post(
  '/campaign',
  authenticate,
  validateBody(createCampaignSchema),
  async (req: Request, res: Response) => {
    try {
      const data: CreateCampaignRequest = req.body;

      // Check campaign limit for advertiser
      const existingCampaigns = await campaignService.listCampaigns({
        advertiserId: data.advertiserId,
        limit: 1,
      });

      if (existingCampaigns.total >= 100) {
        res.status(400).json({
          success: false,
          error: 'Maximum number of campaigns (100) reached for this advertiser',
        });
        return;
      }

      const campaign = await campaignService.createCampaign(data);

      // Record metrics
      recordCampaignCreated();

      logger.info('Campaign created via API', {
        campaignId: campaign.campaignId,
        advertiserId: data.advertiserId,
      });

      res.status(201).json({
        success: true,
        data: {
          campaignId: campaign.campaignId,
          name: campaign.name,
          feedId: campaign.feedId,
          status: campaign.status,
          template: campaign.template,
          createdAt: campaign.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Feed not found')) {
        res.status(404).json({
          success: false,
          error: 'Feed not found. Please provide a valid feedId.',
        });
        return;
      }

      logger.error('Create campaign error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to create campaign',
      });
    }
  }
);

/**
 * GET /api/dpa/campaigns
 * List all campaigns with pagination
 */
router.get(
  '/campaigns',
  authenticate,
  validateQuery(listCampaignsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { advertiserId, status, feedId, page, limit, sortBy, sortOrder } = req.query as any;

      const result = await campaignService.listCampaigns({
        advertiserId,
        status,
        feedId,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result.campaigns.map(campaign => ({
          campaignId: campaign.campaignId,
          name: campaign.name,
          advertiserId: campaign.advertiserId,
          feedId: campaign.feedId,
          status: campaign.status,
          metrics: campaign.metrics,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        })),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      logger.error('List campaigns error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to list campaigns',
      });
    }
  }
);

/**
 * GET /api/dpa/campaigns/:id
 * Get a specific campaign by ID
 */
router.get(
  '/campaigns/:id',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.getCampaign(id);

      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      logger.error('Get campaign error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to get campaign',
      });
    }
  }
);

/**
 * PUT /api/dpa/campaigns/:id
 * Update a campaign
 */
router.put(
  '/campaigns/:id',
  authenticate,
  validateParams(idParamSchema),
  validateBody(updateCampaignSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: UpdateCampaignInput = req.body;

      const campaign = await campaignService.updateCampaign(id, data);

      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      logger.info('Campaign updated via API', { campaignId: id, updatedFields: Object.keys(data) });

      res.json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      logger.error('Update campaign error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to update campaign',
      });
    }
  }
);

/**
 * DELETE /api/dpa/campaigns/:id
 * Delete a campaign
 */
router.delete(
  '/campaigns/:id',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await campaignService.deleteCampaign(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      logger.info('Campaign deleted via API', { campaignId: id });

      res.json({
        success: true,
        message: 'Campaign deleted successfully',
      });
    } catch (error) {
      logger.error('Delete campaign error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to delete campaign',
      });
    }
  }
);

/**
 * POST /api/dpa/campaigns/:id/activate
 * Activate a campaign
 */
router.post(
  '/campaigns/:id/activate',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.activateCampaign(id);

      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          campaignId: campaign.campaignId,
          status: campaign.status,
        },
      });
    } catch (error) {
      logger.error('Activate campaign error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to activate campaign',
      });
    }
  }
);

/**
 * POST /api/dpa/campaigns/:id/pause
 * Pause a campaign
 */
router.post(
  '/campaigns/:id/pause',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.pauseCampaign(id);

      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          campaignId: campaign.campaignId,
          status: campaign.status,
        },
      });
    } catch (error) {
      logger.error('Pause campaign error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to pause campaign',
      });
    }
  }
);

/**
 * GET /api/dpa/campaigns/:id/preview
 * Preview a dynamic ad
 */
router.get(
  '/campaigns/:id/preview',
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { productId } = req.query as any;

      const ad = await rendererService.previewAd(id, productId);

      if (!ad) {
        res.status(404).json({
          success: false,
          error: 'Campaign or product not found',
        });
        return;
      }

      res.json({
        success: true,
        data: ad,
      });
    } catch (error) {
      logger.error('Preview ad error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to preview ad',
      });
    }
  }
);

/**
 * GET /api/dpa/campaigns/:id/metrics
 * Get campaign metrics
 */
router.get(
  '/campaigns/:id/metrics',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const metrics = await campaignService.getCampaignMetrics(id);

      if (!metrics) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Get metrics error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to get metrics',
      });
    }
  }
);

/**
 * GET /api/dpa/campaigns/:id/products
 * Get filtered products for a campaign
 */
router.get(
  '/campaigns/:id/products',
  authenticate,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const products = await campaignService.getFilteredProducts(id);

      res.json({
        success: true,
        data: {
          products,
          count: products.length,
        },
      });
    } catch (error) {
      logger.error('Get campaign products error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to get campaign products',
      });
    }
  }
);

/**
 * POST /api/dpa/campaigns/:id/record-click
 * Record a click on an ad
 */
router.post(
  '/campaigns/:id/record-click',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await campaignService.recordClick(id);

      res.json({
        success: true,
        message: 'Click recorded',
      });
    } catch (error) {
      logger.error('Record click error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to record click',
      });
    }
  }
);

/**
 * POST /api/dpa/campaigns/:id/record-conversion
 * Record a conversion
 */
router.post(
  '/campaigns/:id/record-conversion',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { revenue } = req.body;

      if (typeof revenue !== 'number' || revenue < 0) {
        res.status(400).json({
          success: false,
          error: 'Valid revenue value is required',
        });
        return;
      }

      await campaignService.recordConversion(id, revenue);

      res.json({
        success: true,
        message: 'Conversion recorded',
      });
    } catch (error) {
      logger.error('Record conversion error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Failed to record conversion',
      });
    }
  }
);

export default router;