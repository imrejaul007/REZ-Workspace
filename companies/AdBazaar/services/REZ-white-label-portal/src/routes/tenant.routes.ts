import { Router, Request, Response } from 'express';
import { tenantService } from '../services/tenant.service';
import { ApiResponse, Tenant } from '../types';

const router = Router();

// Create tenant
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenant = await tenantService.create(req.body);
    const response: ApiResponse<Tenant> = {
      success: true,
      data: tenant,
      message: 'Tenant created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create tenant',
    };
    res.status(400).json(response);
  }
});

// Get all tenants
router.get('/', async (_req: Request, res: Response) => {
  try {
    const tenants = await tenantService.findAll();
    const response: ApiResponse<Tenant[]> = {
      success: true,
      data: tenants,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tenants',
    };
    res.status(500).json(response);
  }
});

// Get tenant by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await tenantService.findById(req.params.id);
    if (!tenant) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Tenant not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Tenant> = {
      success: true,
      data: tenant,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tenant',
    };
    res.status(500).json(response);
  }
});

// Get tenant by slug
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const tenant = await tenantService.findBySlug(req.params.slug);
    if (!tenant) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Tenant not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Tenant> = {
      success: true,
      data: tenant,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tenant',
    };
    res.status(500).json(response);
  }
});

// Update tenant
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await tenantService.update(req.params.id, req.body);
    if (!tenant) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Tenant not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Tenant> = {
      success: true,
      data: tenant,
      message: 'Tenant updated successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tenant',
    };
    res.status(400).json(response);
  }
});

// Update tenant branding
router.patch('/:id/branding', async (req: Request, res: Response) => {
  try {
    const tenant = await tenantService.updateBranding(req.params.id, req.body);
    if (!tenant) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Tenant not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<Tenant> = {
      success: true,
      data: tenant,
      message: 'Tenant branding updated successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update branding',
    };
    res.status(400).json(response);
  }
});

// Delete tenant
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await tenantService.delete(req.params.id);
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Tenant not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<null> = {
      success: true,
      message: 'Tenant deleted successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete tenant',
    };
    res.status(500).json(response);
  }
});

export default router;
