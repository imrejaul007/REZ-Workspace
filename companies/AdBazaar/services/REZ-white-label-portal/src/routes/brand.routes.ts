import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { brandService } from '../services/brand.service';
import { CreateTenantBrandingSchema, CustomDomainSchema } from '../types';
import logger from '../utils/logger';

const brandLogger = logger.child({ component: 'BrandRoutes' });
const router = Router();

// Validation middleware
const validate = (schema: z.ZodSchema) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors,
        },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    next(error);
  }
};

import { v4 as uuidv4 } from 'uuid';

// ============== Tenant Routes ==============

// Create tenant
router.post('/tenants', async (req: Request, res: Response) => {
  try {
    const { name, slug, ownerId, plan } = req.body;
    
    const tenant = await brandService.createTenant({ name, slug, ownerId, plan });
    
    brandLogger.info('Tenant created', { tenantId: tenant.id });
    
    res.status(201).json({
      success: true,
      data: tenant,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to create tenant', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create tenant' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get tenant
router.get('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await brandService.getTenant(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tenant not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: tenant,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to get tenant', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get tenant' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get tenant by slug
router.get('/tenants/slug/:slug', async (req: Request, res: Response) => {
  try {
    const tenant = await brandService.getTenantBySlug(req.params.slug);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tenant not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: tenant,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to get tenant by slug', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get tenant' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Update tenant
router.patch('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await brandService.updateTenant(req.params.id, req.body);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tenant not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: tenant,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to update tenant', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update tenant' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// List tenants
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await brandService.listTenants({ page, limit });
    
    res.json({
      success: true,
      data: result.data,
      meta: { 
        requestId: req.headers['x-request-id'] as string || uuidv4(), 
        timestamp: new Date(),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error) {
    brandLogger.error('Failed to list tenants', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list tenants' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Activate tenant
router.post('/tenants/:id/activate', async (req: Request, res: Response) => {
  try {
    const tenant = await brandService.activateTenant(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tenant not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: tenant,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to activate tenant', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to activate tenant' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Suspend tenant
router.post('/tenants/:id/suspend', async (req: Request, res: Response) => {
  try {
    const tenant = await brandService.suspendTenant(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tenant not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: tenant,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to suspend tenant', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to suspend tenant' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Branding Routes ==============

// Create or update branding for tenant
router.post('/branding', validate(CreateTenantBrandingSchema), async (req: Request, res: Response) => {
  try {
    const branding = await brandService.createBranding(req.body);
    
    brandLogger.info('Branding created', { brandingId: branding.id, tenantId: branding.tenantId });
    
    res.status(201).json({
      success: true,
      data: branding,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to create branding', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create branding' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get branding for tenant
router.get('/branding/:tenantId', async (req: Request, res: Response) => {
  try {
    const branding = await brandService.getBranding(req.params.tenantId);
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branding not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: branding,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to get branding', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get branding' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Update branding
router.patch('/branding/:tenantId', async (req: Request, res: Response) => {
  try {
    const branding = await brandService.updateBranding(req.params.tenantId, req.body);
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branding not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: branding,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to update branding', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update branding' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Update branding colors
router.patch('/branding/:tenantId/colors', async (req: Request, res: Response) => {
  try {
    const branding = await brandService.updateColors(req.params.tenantId, req.body);
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branding not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: branding,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to update colors', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update colors' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Upload logo
router.post('/branding/:tenantId/logo', async (req: Request, res: Response) => {
  try {
    const { logoUrl } = req.body;
    const branding = await brandService.uploadLogo(req.params.tenantId, logoUrl);
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branding not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: branding,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to upload logo', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to upload logo' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Upload favicon
router.post('/branding/:tenantId/favicon', async (req: Request, res: Response) => {
  try {
    const { faviconUrl } = req.body;
    const branding = await brandService.uploadFavicon(req.params.tenantId, faviconUrl);
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branding not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: branding,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to upload favicon', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to upload favicon' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Apply custom CSS
router.post('/branding/:tenantId/css', async (req: Request, res: Response) => {
  try {
    const { css } = req.body;
    const branding = await brandService.applyCustomCss(req.params.tenantId, css);
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branding not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: branding,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to apply custom CSS', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to apply custom CSS' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Update email templates
router.post('/branding/:tenantId/templates', async (req: Request, res: Response) => {
  try {
    const { templates } = req.body;
    const branding = await brandService.updateEmailTemplates(req.params.tenantId, templates);
    
    if (!branding) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Branding not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: branding,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to update email templates', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update email templates' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get portal theme with CSS variables
router.get('/branding/:tenantId/theme', async (req: Request, res: Response) => {
  try {
    const theme = await brandService.getPortalTheme(req.params.tenantId);
    
    if (!theme) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Theme not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: theme,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to get portal theme', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get portal theme' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Custom Domain Routes ==============

// Add custom domain
router.post('/domains', validate(CustomDomainSchema), async (req: Request, res: Response) => {
  try {
    const domain = await brandService.addCustomDomain(req.body);
    
    brandLogger.info('Custom domain added', { domainId: domain.id, domain: domain.domain });
    
    res.status(201).json({
      success: true,
      data: domain,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to add custom domain', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add custom domain' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get custom domains for tenant
router.get('/domains/:tenantId', async (req: Request, res: Response) => {
  try {
    const domains = await brandService.getCustomDomains(req.params.tenantId);
    
    res.json({
      success: true,
      data: domains,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to get custom domains', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get custom domains' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get custom domain by domain name
router.get('/domains/lookup/:domain', async (req: Request, res: Response) => {
  try {
    const domain = await brandService.getCustomDomain(req.params.domain);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Domain not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: domain,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to get custom domain', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get custom domain' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Verify domain
router.post('/domains/:id/verify', async (req: Request, res: Response) => {
  try {
    const domain = await brandService.verifyDomain(req.params.id, {
      isVerified: true,
      sslEnabled: true,
    });
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Domain not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: domain,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to verify domain', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to verify domain' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Remove custom domain
router.delete('/domains/:id', async (req: Request, res: Response) => {
  try {
    const success = await brandService.removeCustomDomain(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Domain not found' },
        meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
      });
    }
    
    res.json({
      success: true,
      data: { deleted: true },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    brandLogger.error('Failed to remove custom domain', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to remove custom domain' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

export default router;
