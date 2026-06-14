import { Router, Request, Response, NextFunction } from 'express';
import { clientService, contactService, campaignLinkService, analyticsService, noteService } from '../services';
import { internalServiceAuth, agencyAuth, validateRequest, validationSchemas } from '../middleware/auth';
import { logger } from '../utils';
import { ClientQuerySchema, SpendQuerySchema } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(internalServiceAuth);
router.use(agencyAuth);

/**
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'client-management-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * POST /api/clients - Create a new client
 */
router.post(
  '/api/clients',
  validateRequest(validationSchemas.createClient),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await clientService.createClient({
        ...req.body,
        agencyId: req.agencyId || req.body.agencyId,
      });

      res.status(201).json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clients - List clients with pagination and filters
 */
router.get('/api/clients', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryResult = ClientQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
      });
    }

    const result = await clientService.listClients(queryResult.data, req.agencyId);

    res.json({
      success: true,
      data: result.clients,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/stats - Get client statistics
 */
router.get('/api/clients/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await clientService.getClientStats(req.agencyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id - Get client by ID
 */
router.get('/api/clients/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await clientService.getClient(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/clients/:id - Update client
 */
router.put(
  '/api/clients/:id',
  validateRequest(validationSchemas.updateClient),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await clientService.updateClient(req.params.id, req.body);

      if (!client) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CLIENT_NOT_FOUND',
            message: 'Client not found',
          },
        });
      }

      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/clients/:id - Delete client
 */
router.delete('/api/clients/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await clientService.deleteClient(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    next(error);
  }
});

// ============ CONTACT ROUTES ============

/**
 * POST /api/clients/:id/contacts - Add contact to client
 */
router.post(
  '/api/clients/:id/contacts',
  validateRequest(validationSchemas.createContact),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contact = await contactService.createContact({
        ...req.body,
        clientId: req.params.id,
      });

      res.status(201).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clients/:id/contacts - List contacts for client
 */
router.get('/api/clients/:id/contacts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { includeInactive, page, limit } = req.query;
    const result = await contactService.getClientContacts(req.params.id, {
      includeInactive: includeInactive === 'true',
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.contacts,
      meta: { total: result.total },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/contacts/:contactId - Get specific contact
 */
router.get('/api/clients/:id/contacts/:contactId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await contactService.getContact(req.params.contactId);

    if (!contact || contact.clientId !== req.params.id) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONTACT_NOT_FOUND',
          message: 'Contact not found',
        },
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/clients/:id/contacts/:contactId - Update contact
 */
router.put('/api/clients/:id/contacts/:contactId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await contactService.updateContact(req.params.contactId, req.body);

    if (!contact || contact.clientId !== req.params.id) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONTACT_NOT_FOUND',
          message: 'Contact not found',
        },
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/clients/:id/contacts/:contactId - Delete contact
 */
router.delete('/api/clients/:id/contacts/:contactId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await contactService.deleteContact(req.params.contactId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONTACT_NOT_FOUND',
          message: 'Contact not found',
        },
      });
    }

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    next(error);
  }
});

// ============ CAMPAIGN ROUTES ============

/**
 * POST /api/clients/:id/campaigns - Link campaign to client
 */
router.post(
  '/api/clients/:id/campaigns',
  validateRequest(validationSchemas.linkCampaign),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaign = await campaignLinkService.linkCampaign({
        ...req.body,
        clientId: req.params.id,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      });

      res.status(201).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clients/:id/campaigns - List campaigns for client
 */
router.get('/api/clients/:id/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page, limit } = req.query;
    const result = await campaignLinkService.getClientCampaigns(req.params.id, {
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.campaigns,
      meta: { total: result.total },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/campaigns/:campaignId - Get specific campaign
 */
router.get('/api/clients/:id/campaigns/:campaignId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignLinkService.getCampaign(req.params.campaignId);

    if (!campaign || campaign.clientId !== req.params.id) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Campaign not found',
        },
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/clients/:id/campaigns/:campaignId - Update campaign
 */
router.put('/api/clients/:id/campaigns/:campaignId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignLinkService.updateCampaign(req.params.campaignId, req.body);

    if (!campaign || campaign.clientId !== req.params.id) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CAMPAIGN_NOT_FOUND',
          message: 'Campaign not found',
        },
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
});

// ============ SPEND ANALYTICS ROUTES ============

/**
 * GET /api/clients/:id/spend - Get spend analytics
 */
router.get('/api/clients/:id/spend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryResult = SpendQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid query parameters',
          details: queryResult.error.errors,
        },
      });
    }

    const analytics = await analyticsService.getSpendAnalytics(req.params.id, queryResult.data);

    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/performance - Get performance analytics
 */
router.get('/api/clients/:id/performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period } = req.query;
    const analytics = await analyticsService.getPerformanceAnalytics(req.params.id, {
      period: period as 'week' | 'month' | 'quarter' | 'year',
    });

    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/budget - Get budget utilization
 */
router.get('/api/clients/:id/budget', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const utilization = await analyticsService.getBudgetUtilization(req.params.id);

    if (!utilization) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    res.json({
      success: true,
      data: utilization,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/roi - Get ROI analysis
 */
router.get('/api/clients/:id/roi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roi = await analyticsService.getROIAnalysis(req.params.id);

    if (!roi) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    res.json({
      success: true,
      data: roi,
    });
  } catch (error) {
    next(error);
  }
});

// ============ NOTES ROUTES ============

/**
 * POST /api/clients/:id/notes - Add note to client
 */
router.post(
  '/api/clients/:id/notes',
  validateRequest(validationSchemas.createNote),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const note = await noteService.createNote({
        ...req.body,
        clientId: req.params.id,
        author: {
          id: req.headers['x-user-id'] as string || 'system',
          name: req.headers['x-user-name'] as string || 'System',
          role: req.headers['x-user-role'] as string || 'system',
        },
      });

      res.status(201).json({
        success: true,
        data: note,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/clients/:id/notes - List notes for client
 */
router.get('/api/clients/:id/notes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, page, limit, includePinned } = req.query;
    const result = await noteService.getClientNotes(req.params.id, {
      type: type as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      includePinned: includePinned === 'true',
    });

    res.json({
      success: true,
      data: result.notes,
      meta: {
        total: result.total,
        pinnedCount: result.pinnedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/clients/:id/notes/:noteId - Get specific note
 */
router.get('/api/clients/:id/notes/:noteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const note = await noteService.getNote(req.params.noteId);

    if (!note || note.clientId !== req.params.id) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found',
        },
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/clients/:id/notes/:noteId - Update note
 */
router.put('/api/clients/:id/notes/:noteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const note = await noteService.updateNote(req.params.noteId, req.body);

    if (!note || note.clientId !== req.params.id) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found',
        },
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/clients/:id/notes/:noteId - Delete note
 */
router.delete('/api/clients/:id/notes/:noteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await noteService.deleteNote(req.params.noteId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found',
        },
      });
    }

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    next(error);
  }
});

// ============ DASHBOARD ROUTE ============

/**
 * GET /api/clients/:id/dashboard - Get client dashboard data
 */
router.get('/api/clients/:id/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await clientService.getClient(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    // Fetch all related data in parallel
    const [contacts, campaigns, spendAnalytics, performance, recentNotes] = await Promise.all([
      contactService.getClientContacts(req.params.id, { limit: 5 }),
      campaignLinkService.getClientCampaigns(req.params.id, { limit: 5 }),
      analyticsService.getSpendAnalytics(req.params.id, { period: 'monthly' }),
      analyticsService.getPerformanceAnalytics(req.params.id, { period: 'month' }),
      noteService.getClientNotes(req.params.id, { limit: 10 }),
    ]);

    // Generate alerts
    const alerts: any[] = [];

    if (spendAnalytics) {
      if (spendAnalytics.budget.utilizationRate > 90) {
        alerts.push({
          type: 'budget',
          severity: 'high',
          message: `Budget utilization at ${spendAnalytics.budget.utilizationRate.toFixed(1)}%`,
        });
      }
    }

    if (performance?.summary?.avgCTR && performance.summary.avgCTR < 1) {
      alerts.push({
        type: 'performance',
        severity: 'medium',
        message: 'CTR is below 1%, consider reviewing creative',
      });
    }

    if (client.status === 'inactive') {
      alerts.push({
        type: 'inactive',
        severity: 'high',
        message: 'Client is inactive, consider re-engagement',
      });
    }

    const dashboard = {
      client,
      contacts: contacts.contacts,
      campaigns: campaigns.campaigns,
      spendAnalytics,
      recentNotes: recentNotes.notes,
      performance: performance?.summary || {},
      alerts,
    };

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
});

export default router;