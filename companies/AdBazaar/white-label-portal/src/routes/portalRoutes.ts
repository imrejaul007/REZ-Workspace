import { Router, Request, Response } from 'express';
import { validate, schemas, agencyAuth } from '../middleware';
import { portalService } from '../services/portalService';
import { brandingService } from '../services/brandingService';
import { domainService } from '../services/domainService';
import { analyticsService } from '../services/analyticsService';
import { reportService } from '../services/reportService';
import { logger } from 'utils/logger.js';

const router = Router();

/**
 * POST /api/portals
 * Create a new white label portal
 */
router.post('/', agencyAuth, validate(schemas.createPortal), async (req: Request, res: Response) => {
  try {
    const { agencyId, name, slug, domain, settings } = req.body;
    const createdBy = req.user?.id || 'system';

    const portal = await portalService.createPortal({
      agencyId,
      name,
      slug,
      domain,
      settings,
      createdBy,
    });

    res.status(201).json({
      success: true,
      data: portal,
      message: 'Portal created successfully',
    });
  } catch (error) {
    logger.error('Error creating portal', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create portal',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/portals
 * List all portals for an agency
 */
router.get('/', agencyAuth, async (req: Request, res: Response) => {
  try {
    const agencyId = req.user?.agencyId || req.headers['x-agency-id'] as string;
    const { page = '1', limit = '20', status } = req.query;

    const result = await portalService.listPortals(agencyId, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      status: status as 'active' | 'inactive' | 'suspended' | undefined,
    });

    res.json({
      success: true,
      data: result.portals,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Error listing portals', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list portals',
    });
  }
});

/**
 * GET /api/portals/:id
 * Get a specific portal
 */
router.get('/:id', agencyAuth, async (req: Request, res: Response) => {
  try {
    const portal = await portalService.getPortalById(req.params.id);

    if (!portal) {
      res.status(404).json({
        success: false,
        error: 'Portal not found',
      });
      return;
    }

    res.json({
      success: true,
      data: portal,
    });
  } catch (error) {
    logger.error('Error getting portal', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get portal',
    });
  }
});

/**
 * PUT /api/portals/:id
 * Update a portal
 */
router.put('/:id', agencyAuth, validate(schemas.updatePortal), async (req: Request, res: Response) => {
  try {
    const portal = await portalService.updatePortal(req.params.id, req.body);

    if (!portal) {
      res.status(404).json({
        success: false,
        error: 'Portal not found',
      });
      return;
    }

    res.json({
      success: true,
      data: portal,
      message: 'Portal updated successfully',
    });
  } catch (error) {
    logger.error('Error updating portal', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update portal',
    });
  }
});

/**
 * POST /api/portals/:id/branding
 * Set branding for a portal
 */
router.post('/:id/branding', agencyAuth, validate(schemas.createBranding), async (req: Request, res: Response) => {
  try {
    const portal = await portalService.getPortalById(req.params.id);
    if (!portal) {
      res.status(404).json({
        success: false,
        error: 'Portal not found',
      });
      return;
    }

    const updatedBy = req.user?.id || 'system';
    let branding = await brandingService.getBrandingByPortalId(req.params.id);

    if (branding) {
      // Update existing branding
      branding = await brandingService.updateBranding(req.params.id, { ...req.body, updatedBy });
    } else {
      // Create new branding
      branding = await brandingService.createBranding({
        portalId: req.params.id,
        logo: req.body.logo,
        favicon: req.body.favicon,
        colors: req.body.colors,
        fonts: req.body.fonts,
        customCSS: req.body.customCSS,
        emailTemplate: req.body.emailTemplate,
        updatedBy,
      });
    }

    res.json({
      success: true,
      data: branding,
      message: 'Branding set successfully',
    });
  } catch (error) {
    logger.error('Error setting branding', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to set branding',
    });
  }
});

/**
 * GET /api/portals/:id/branding
 * Get branding for a portal
 */
router.get('/:id/branding', agencyAuth, async (req: Request, res: Response) => {
  try {
    const branding = await brandingService.getBrandingByPortalId(req.params.id);

    if (!branding) {
      res.status(404).json({
        success: false,
        error: 'Branding not found',
      });
      return;
    }

    res.json({
      success: true,
      data: branding,
    });
  } catch (error) {
    logger.error('Error getting branding', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get branding',
    });
  }
});

/**
 * POST /api/portals/:id/domain
 * Set custom domain for a portal
 */
router.post('/:id/domain', agencyAuth, validate(schemas.createDomain), async (req: Request, res: Response) => {
  try {
    const portal = await portalService.getPortalById(req.params.id);
    if (!portal) {
      res.status(404).json({
        success: false,
        error: 'Portal not found',
      });
      return;
    }

    if (!portal.settings.allowCustomDomain) {
      res.status(403).json({
        success: false,
        error: 'Custom domain not allowed for this portal',
      });
      return;
    }

    const updatedBy = req.user?.id || 'system';
    const domain = await domainService.createDomain({
      portalId: req.params.id,
      domain: req.body.domain,
      subdomain: req.body.subdomain,
      method: req.body.method,
      updatedBy,
    });

    res.status(201).json({
      success: true,
      data: domain,
      message: 'Custom domain created. Please add DNS records to verify.',
    });
  } catch (error) {
    logger.error('Error creating domain', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create domain',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/portals/:id/analytics
 * Get portal analytics
 */
router.get('/:id/analytics', agencyAuth, async (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;

    const dashboardData = await analyticsService.getDashboardData(
      req.params.id,
      parseInt(days as string, 10)
    );

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Error getting analytics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
    });
  }
});

/**
 * GET /api/portals/:id/reports
 * Get custom reports for a portal
 */
router.get('/:id/reports', agencyAuth, async (req: Request, res: Response) => {
  try {
    const reports = await reportService.getReportsByPortalId(req.params.id);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    logger.error('Error getting reports', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get reports',
    });
  }
});

/**
 * POST /api/portals/:id/reports
 * Create a custom report
 */
router.post('/:id/reports', agencyAuth, validate(schemas.createReport), async (req: Request, res: Response) => {
  try {
    const createdBy = req.user?.id || 'system';
    const report = await reportService.createReport(req.params.id, req.body, createdBy);

    res.status(201).json({
      success: true,
      data: report,
      message: 'Report created successfully',
    });
  } catch (error) {
    logger.error('Error creating report', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create report',
    });
  }
});

/**
 * GET /api/portals/:id/clients
 * Get portal clients (placeholder - would integrate with actual client service)
 */
router.get('/:id/clients', agencyAuth, async (req: Request, res: Response) => {
  try {
    const portal = await portalService.getPortalById(req.params.id);
    if (!portal) {
      res.status(404).json({
        success: false,
        error: 'Portal not found',
      });
      return;
    }

    // Placeholder response - would fetch from client management service
    res.json({
      success: true,
      data: {
        portalId: req.params.id,
        totalClients: portal.stats.totalClients,
        clients: [],
        message: 'Client integration pending',
      },
    });
  } catch (error) {
    logger.error('Error getting clients', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get clients',
    });
  }
});

/**
 * DELETE /api/portals/:id
 * Delete a portal (suspend)
 */
router.delete('/:id', agencyAuth, async (req: Request, res: Response) => {
  try {
    const deleted = await portalService.deletePortal(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Portal not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Portal deleted (suspended) successfully',
    });
  } catch (error) {
    logger.error('Error deleting portal', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete portal',
    });
  }
});

export default router;