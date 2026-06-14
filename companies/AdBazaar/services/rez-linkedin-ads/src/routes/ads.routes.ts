import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import linkedInService from '../services/linkedin.service';
import logger from '../utils/logger';
import { validateBody, requireTenantId } from '../middleware/validation.middleware';
import { CampaignCreateSchema, CreativeCreateSchema } from '../validators/linkedin.schemas';
import { ApiResponse } from '../types';

const router = Router();

// Apply tenant ID requirement to all routes
router.use(requireTenantId());

/**
 * GET /ads/accounts - Get ad accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const accounts = await linkedInService.getAdAccounts(tenantId);

    const response: ApiResponse<typeof accounts> = {
      success: true,
      data: accounts,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get ad accounts', {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_ACCOUNTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get ad accounts',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * POST /ads/campaigns - Create campaign
 */
router.post(
  '/campaigns',
  validateBody(CampaignCreateSchema),
  async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const tenantId = req.headers['x-tenant-id'] as string;

    try {
      const { accountId, ...campaignData } = req.body;

      if (!accountId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_ACCOUNT_ID',
            message: 'accountId is required in request body',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
        return res.status(400).json(response);
      }

      // Validate account ID format
      if (!/^\d+$/.test(accountId)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_ACCOUNT_ID',
            message: 'Invalid account ID format',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
        return res.status(400).json(response);
      }

      const campaign = await linkedInService.createCampaign(tenantId, accountId, campaignData);

      logger.info('Campaign created successfully', {
        campaignId: campaign.id,
        accountId,
        tenantId,
        requestId,
      });

      const response: ApiResponse<typeof campaign> = {
        success: true,
        data: campaign,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create campaign', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        requestId,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CREATE_CAMPAIGN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create campaign',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /ads/campaigns - Get campaigns by account
 */
router.get('/campaigns', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { accountId } = req.query;

    if (!accountId || typeof accountId !== 'string') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_ACCOUNT_ID',
          message: 'accountId query parameter is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    const campaigns = await linkedInService.getCampaigns(tenantId, accountId);

    const response: ApiResponse<typeof campaigns> = {
      success: true,
      data: campaigns,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get campaigns', {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_CAMPAIGNS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get campaigns',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * GET /ads/campaigns/:id - Get campaign
 */
router.get('/campaigns/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { id } = req.params;

    // Validate campaign ID format
    if (!/^\d+$/.test(id)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_CAMPAIGN_ID',
          message: 'Invalid campaign ID format',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    const campaign = await linkedInService.getCampaign(tenantId, id);

    const response: ApiResponse<typeof campaign> = {
      success: true,
      data: campaign,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get campaign', {
      campaignId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_CAMPAIGN_ERROR',
        message: error instanceof Error ? error.message : 'Campaign not found',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json(response);
  }
});

/**
 * PATCH /ads/campaigns/:id - Update campaign
 */
router.patch('/campaigns/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { id } = req.params;

    // Validate campaign ID format
    if (!/^\d+$/.test(id)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_CAMPAIGN_ID',
          message: 'Invalid campaign ID format',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    const updates = req.body;

    // Validate status if provided
    if (updates.status && !['ACTIVE', 'PAUSED', 'ARCHIVED', 'DRAFT'].includes(updates.status)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid campaign status. Must be one of: ACTIVE, PAUSED, ARCHIVED, DRAFT',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    const campaign = await linkedInService.updateCampaign(tenantId, id, updates);

    logger.info('Campaign updated successfully', { campaignId: id, tenantId, requestId });

    const response: ApiResponse<typeof campaign> = {
      success: true,
      data: campaign,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to update campaign', {
      campaignId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UPDATE_CAMPAIGN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update campaign',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * DELETE /ads/campaigns/:id - Archive campaign
 */
router.delete('/campaigns/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { id } = req.params;

    // Validate campaign ID format
    if (!/^\d+$/.test(id)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_CAMPAIGN_ID',
          message: 'Invalid campaign ID format',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    const archived = await linkedInService.archiveCampaign(tenantId, id);

    logger.info('Campaign archived', { campaignId: id, archived, tenantId, requestId });

    const response: ApiResponse<{ archived: boolean }> = {
      success: archived,
      data: { archived },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to archive campaign', {
      campaignId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'ARCHIVE_CAMPAIGN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to archive campaign',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * POST /ads/creatives - Create creative
 */
router.post(
  '/creatives',
  validateBody(CreativeCreateSchema),
  async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const tenantId = req.headers['x-tenant-id'] as string;

    try {
      const creative = await linkedInService.createCreative(tenantId, req.body);

      logger.info('Creative created successfully', {
        creativeId: creative.id,
        campaign: creative.campaign,
        tenantId,
        requestId,
      });

      const response: ApiResponse<typeof creative> = {
        success: true,
        data: creative,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create creative', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        requestId,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CREATE_CREATIVE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create creative',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * GET /ads/creatives/:id - Get creative
 */
router.get('/creatives/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { id } = req.params;

    // Validate creative ID format
    if (!/^\d+$/.test(id)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_CREATIVE_ID',
          message: 'Invalid creative ID format',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    const creative = await linkedInService.getCreative(tenantId, id);

    const response: ApiResponse<typeof creative> = {
      success: true,
      data: creative,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get creative', {
      creativeId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_CREATIVE_ERROR',
        message: error instanceof Error ? error.message : 'Creative not found',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json(response);
  }
});

export default router;
