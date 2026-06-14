/**
 * WhatsApp Campaign Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { whatsAppCampaignService } from '../services/whatsapp-campaign.service';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  createCampaignSchema,
  updateCampaignSchema,
  listCampaignsQuerySchema,
  campaignIdParamSchema,
  sendCampaignSchema,
} from '../validators/whatsapp.validators';
import {
  campaignCreatedTotal,
  campaignSentTotal,
} from '../middleware/metrics.middleware';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/whatsapp/campaign
 * Create a new WhatsApp campaign
 */
router.post(
  '/campaign',
  authMiddleware,
  validateBody(createCampaignSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await whatsAppCampaignService.createCampaign(req.body);

      campaignCreatedTotal.inc({ template_type: req.body.template.type });

      logger.info('Campaign created via API', {
        campaignId: campaign.campaignId,
        merchantId: campaign.merchantId,
      });

      res.status(201).json({
        success: true,
        data: campaign,
        message: 'Campaign created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/whatsapp/campaigns
 * List all campaigns
 */
router.get(
  '/campaigns',
  authMiddleware,
  validateQuery(listCampaignsQuerySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // If user is merchant, filter by their merchantId
      const query = {
        ...req.query,
        merchantId: req.user?.merchantId || req.query.merchantId,
      };

      const result = await whatsAppCampaignService.listCampaigns(query as typeof req.query);

      res.json({
        success: true,
        data: result.campaigns,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/whatsapp/campaigns/:id
 * Get campaign details
 */
router.get(
  '/campaigns/:id',
  authMiddleware,
  validateParams(campaignIdParamSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await whatsAppCampaignService.getCampaign(
        req.params.id,
        req.user?.merchantId
      );

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
      next(error);
    }
  }
);

/**
 * PATCH /api/whatsapp/campaigns/:id
 * Update a campaign
 */
router.patch(
  '/campaigns/:id',
  authMiddleware,
  validateParams(campaignIdParamSchema),
  validateBody(updateCampaignSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await whatsAppCampaignService.updateCampaign(
        req.params.id,
        req.body,
        req.user?.merchantId
      );

      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      logger.info('Campaign updated via API', {
        campaignId: req.params.id,
        merchantId: req.user?.merchantId,
      });

      res.json({
        success: true,
        data: campaign,
        message: 'Campaign updated successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('draft')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * DELETE /api/whatsapp/campaigns/:id
 * Delete a campaign
 */
router.delete(
  '/campaigns/:id',
  authMiddleware,
  validateParams(campaignIdParamSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await whatsAppCampaignService.deleteCampaign(
        req.params.id,
        req.user?.merchantId
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      logger.info('Campaign deleted via API', {
        campaignId: req.params.id,
        merchantId: req.user?.merchantId,
      });

      res.json({
        success: true,
        message: 'Campaign deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('draft')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * POST /api/whatsapp/campaigns/:id/send
 * Send a campaign
 */
router.post(
  '/campaigns/:id/send',
  authMiddleware,
  validateParams(campaignIdParamSchema),
  validateBody(sendCampaignSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await whatsAppCampaignService.sendCampaign(
        req.params.id,
        req.user?.merchantId
      );

      campaignSentTotal.inc({ status: campaign.status });

      logger.info('Campaign send initiated via API', {
        campaignId: req.params.id,
        merchantId: req.user?.merchantId,
      });

      res.json({
        success: true,
        data: campaign,
        message: 'Campaign sending initiated',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message,
          });
          return;
        }
        if (error.message.includes('Cannot send') || error.message.includes('already')) {
          res.status(400).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }
      next(error);
    }
  }
);

/**
 * POST /api/whatsapp/campaigns/:id/pause
 * Pause a running campaign
 */
router.post(
  '/campaigns/:id/pause',
  authMiddleware,
  validateParams(campaignIdParamSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await whatsAppCampaignService.pauseCampaign(
        req.params.id,
        req.user?.merchantId
      );

      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      campaignSentTotal.inc({ status: 'paused' });

      logger.info('Campaign paused via API', {
        campaignId: req.params.id,
        merchantId: req.user?.merchantId,
      });

      res.json({
        success: true,
        data: campaign,
        message: 'Campaign paused successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('sending')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * POST /api/whatsapp/campaigns/:id/resume
 * Resume a paused campaign
 */
router.post(
  '/campaigns/:id/resume',
  authMiddleware,
  validateParams(campaignIdParamSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const campaign = await whatsAppCampaignService.resumeCampaign(
        req.params.id,
        req.user?.merchantId
      );

      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      campaignSentTotal.inc({ status: 'resumed' });

      logger.info('Campaign resumed via API', {
        campaignId: req.params.id,
        merchantId: req.user?.merchantId,
      });

      res.json({
        success: true,
        data: campaign,
        message: 'Campaign resumed successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('paused')) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      next(error);
    }
  }
);

/**
 * GET /api/whatsapp/campaigns/:id/stats
 * Get campaign statistics
 */
router.get(
  '/campaigns/:id/stats',
  authMiddleware,
  validateParams(campaignIdParamSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await whatsAppCampaignService.getCampaignStats(
        req.params.id,
        req.user?.merchantId
      );

      if (!stats) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found',
        });
        return;
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/whatsapp/webhook
 * WhatsApp webhook endpoint
 */
router.post(
  '/webhook',
  optionalAuthMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    // Handle webhook verification
    if (req.query['hub.mode'] === 'subscribe') {
      const verifyToken = req.query['hub.verify_token'];
      if (verifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
        return;
      }
      res.status(403).send('Forbidden');
      return;
    }

    // Process webhook updates
    try {
      const { entry } = req.body;
      for (const change of entry[0]?.changes || []) {
        const statuses = change.value?.statuses || [];
        for (const status of statuses) {
          await whatsAppCampaignService.processWebhookUpdate(
            status.id,
            status.status,
            status.timestamp
          );
        }
      }
      res.sendStatus(200);
    } catch (error) {
      logger.error('Webhook processing error', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      res.sendStatus(200); // Always return 200 to WhatsApp
    }
  }
);

export default router;