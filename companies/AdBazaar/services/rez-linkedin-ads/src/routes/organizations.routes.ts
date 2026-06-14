import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import linkedInService from '../services/linkedin.service';
import logger from '../utils/logger';
import { requireTenantId } from '../middleware/validation.middleware';
import { ApiResponse } from '../types';

const router = Router();

// Apply tenant ID requirement to all routes
router.use(requireTenantId());

/**
 * GET /organizations - Get user's organizations
 */
router.get('/', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const organizations = await linkedInService.getOrganizations(tenantId);

    logger.info('Organizations retrieved', {
      orgCount: organizations.length,
      tenantId,
      requestId,
    });

    const response: ApiResponse<typeof organizations> = {
      success: true,
      data: organizations,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get organizations', {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_ORGS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get LinkedIn organizations',
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
 * GET /organizations/:id - Get organization details
 */
router.get('/:id', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const { id } = req.params;

    // Validate organization ID format
    if (!id || !/^\d+$/.test(id)) {
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

    const organization = await linkedInService.getOrganization(tenantId, id);

    const response: ApiResponse<typeof organization> = {
      success: true,
      data: organization,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get organization', {
      organizationId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_ORG_ERROR',
        message: error instanceof Error ? error.message : 'Organization not found',
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
