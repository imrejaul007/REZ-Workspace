import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import linkedInService from '../services/linkedin.service';
import logger from '../utils/logger';
import { validateBody, requireTenantId } from '../middleware/validation.middleware';
import { LeadGenFormCreateSchema } from '../validators/linkedin.schemas';
import { ApiResponse } from '../types';

const router = Router();

// Apply tenant ID requirement to all routes
router.use(requireTenantId());

/**
 * POST /leads/forms - Create lead gen form
 */
router.post(
  '/forms',
  validateBody(LeadGenFormCreateSchema),
  async (req: Request, res: Response) => {
    const requestId = uuidv4();
    const tenantId = req.headers['x-tenant-id'] as string;

    try {
      const { organizationId, ...formData } = req.body;

      if (!organizationId) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_ORG_ID',
            message: 'organizationId is required in request body',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
        return res.status(400).json(response);
      }

      // Validate organization ID format
      if (!/^\d+$/.test(organizationId)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_ORG_ID',
            message: 'Invalid organization ID format',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
        return res.status(400).json(response);
      }

      const form = await linkedInService.createLeadGenForm(tenantId, organizationId, formData);

      logger.info('Lead gen form created successfully', {
        formId: form.id,
        organizationId,
        tenantId,
        requestId,
      });

      const response: ApiResponse<typeof form> = {
        success: true,
        data: form,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create lead gen form', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        requestId,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CREATE_FORM_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create lead gen form',
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
 * GET /leads/forms/:id - Get lead gen form
 */
router.get('/forms/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { id } = req.params;

    // Validate form ID format (can be URN or numeric ID)
    if (!id || (!/^\d+$/.test(id) && !id.startsWith('urn:'))) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_FORM_ID',
          message: 'Invalid form ID format',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    const form = await linkedInService.getLeadGenForm(tenantId, id);

    const response: ApiResponse<typeof form> = {
      success: true,
      data: form,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get lead gen form', {
      formId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_FORM_ERROR',
        message: error instanceof Error ? error.message : 'Form not found',
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
 * GET /leads/forms/:id/leads - Get leads from form
 */
router.get('/forms/:id/leads', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { id } = req.params;
    const { campaignId } = req.query;

    // Validate form ID format
    if (!id || (!/^\d+$/.test(id) && !id.startsWith('urn:'))) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_FORM_ID',
          message: 'Invalid form ID format',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    const leads = await linkedInService.getLeads(
      tenantId,
      id,
      typeof campaignId === 'string' ? campaignId : undefined
    );

    logger.info('Leads retrieved', {
      formId: id,
      leadCount: leads.length,
      tenantId,
      requestId,
    });

    const response: ApiResponse<typeof leads> = {
      success: true,
      data: leads,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get leads', {
      formId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_LEADS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get leads',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(500).json(response);
  }
});

export default router;
