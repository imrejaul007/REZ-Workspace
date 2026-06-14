import { Router, Request, Response } from 'express';
import { integrationService } from '../services/integration.service';
import { ApiResponse, Integration } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

// Create integration
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const integration = await integrationService.create(tenantId, req.body);
    const response: ApiResponse<Integration> = {
      success: true,
      data: integration,
      message: 'Integration created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create integration',
    };
    res.status(400).json(response);
  }
});

// Get all integrations
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const type = req.query.type as Integration['type'] | undefined;

    const integrations = type
      ? await integrationService.findByType(tenantId, type)
      : await integrationService.findByTenant(tenantId);

    const response: ApiResponse<Integration[]> = {
      success: true,
      data: integrations,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch integrations',
    };
    res.status(500).json(response);
  }
});

// Get integration by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const integration = await integrationService.findById(req.params.id);
    if (!integration) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Integration not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Integration> = {
      success: true,
      data: integration,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch integration',
    };
    res.status(500).json(response);
  }
});

// Update integration
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const integration = await integrationService.update(req.params.id, req.body);
    if (!integration) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Integration not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Integration> = {
      success: true,
      data: integration,
      message: 'Integration updated successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update integration',
    };
    res.status(400).json(response);
  }
});

// Update integration credentials
router.patch('/:id/credentials', async (req: Request, res: Response) => {
  try {
    const integration = await integrationService.updateCredentials(req.params.id, req.body);
    if (!integration) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Integration not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Integration> = {
      success: true,
      data: integration,
      message: 'Integration credentials updated',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update credentials',
    };
    res.status(400).json(response);
  }
});

// Toggle integration active status
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { isActive } = req.body;
    const integration = await integrationService.toggleActive(req.params.id, isActive);
    if (!integration) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Integration not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Integration> = {
      success: true,
      data: integration,
      message: `Integration ${isActive ? 'activated' : 'deactivated'}`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle integration',
    };
    res.status(400).json(response);
  }
});

// Delete integration
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await integrationService.delete(req.params.id);
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Integration not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<null> = {
      success: true,
      message: 'Integration deleted successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete integration',
    };
    res.status(500).json(response);
  }
});

export default router;
