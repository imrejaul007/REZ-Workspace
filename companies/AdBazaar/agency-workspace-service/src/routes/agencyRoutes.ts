import { Router, Request, Response } from 'express';
import { agencyService, clientService, teamService, templateService, performanceService } from '../services';
import { internalServiceAuth, requestLogger } from '../middleware';
import { logger } from '../utils/logger';
import { clientCreateSchema, teamMemberCreateSchema, campaignTemplateCreateSchema } from '../utils/helpers';

const router = Router();

// Apply authentication to all routes
router.use(internalServiceAuth);
router.use(requestLogger);

/**
 * Health check
 */
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'agency-workspace-service',
    version: '1.0.0',
    port: 5010,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Register new agency
 * POST /api/agencies
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const agency = await agencyService.createAgency(req.body);

    logger.info('Agency registered', { agencyId: agency._id });

    res.status(201).json({
      success: true,
      data: agency,
      message: 'Agency registered successfully'
    });
  } catch (error: any) {
    logger.error('Failed to register agency', { error: error.message });
    res.status(400).json({
      success: false,
      error: 'Registration Failed',
      message: error.message
    });
  }
});

/**
 * Get agency by ID
 * GET /api/agencies/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const agency = await agencyService.getAgencyById(req.params.id);

    if (!agency) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Agency not found'
      });
      return;
    }

    res.json({
      success: true,
      data: agency
    });
  } catch (error: any) {
    logger.error('Failed to get agency', { agencyId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * List all agencies
 * GET /api/agencies
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, tier, sortBy, sortOrder } = req.query;

    const result = await agencyService.listAgencies({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      tier: tier as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    res.json({
      success: true,
      data: result.agencies,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error: any) {
    logger.error('Failed to list agencies', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * Update agency
 * PUT /api/agencies/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const agency = await agencyService.updateAgency(req.params.id, req.body);

    if (!agency) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Agency not found'
      });
      return;
    }

    logger.info('Agency updated', { agencyId: req.params.id });

    res.json({
      success: true,
      data: agency,
      message: 'Agency updated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to update agency', { agencyId: req.params.id, error: error.message });
    res.status(400).json({
      success: false,
      error: 'Update Failed',
      message: error.message
    });
  }
});

/**
 * Add client to agency
 * POST /api/agencies/:id/clients
 */
router.post('/:id/clients', async (req: Request, res: Response) => {
  try {
    // Validate input
    clientCreateSchema.parse(req.body);

    const client = await clientService.addClient(req.params.id, req.body);

    logger.info('Client added to agency', {
      agencyId: req.params.id,
      clientId: client._id
    });

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client added successfully'
    });
  } catch (error: any) {
    logger.error('Failed to add client', { agencyId: req.params.id, error: error.message });
    res.status(400).json({
      success: false,
      error: 'Add Client Failed',
      message: error.message
    });
  }
});

/**
 * List clients for agency
 * GET /api/agencies/:id/clients
 */
router.get('/:id/clients', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, company, sortBy, sortOrder } = req.query;

    const result = await clientService.listClients(req.params.id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      company: company as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    res.json({
      success: true,
      data: result.clients,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error: any) {
    logger.error('Failed to list clients', { agencyId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * Add team member to agency
 * POST /api/agencies/:id/teams
 */
router.post('/:id/teams', async (req: Request, res: Response) => {
  try {
    // Validate input
    teamMemberCreateSchema.parse(req.body);

    const member = await teamService.addTeamMember(req.params.id, req.body);

    logger.info('Team member added', {
      agencyId: req.params.id,
      memberId: member._id
    });

    res.status(201).json({
      success: true,
      data: member,
      message: 'Team member added successfully'
    });
  } catch (error: any) {
    logger.error('Failed to add team member', { agencyId: req.params.id, error: error.message });
    res.status(400).json({
      success: false,
      error: 'Add Team Member Failed',
      message: error.message
    });
  }
});

/**
 * List team members for agency
 * GET /api/agencies/:id/teams
 */
router.get('/:id/teams', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', role, status, department, sortBy, sortOrder } = req.query;

    const result = await teamService.listTeamMembers(req.params.id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      role: role as string,
      status: status as string,
      department: department as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    res.json({
      success: true,
      data: result.members,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error: any) {
    logger.error('Failed to list team members', { agencyId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * Create campaign template
 * POST /api/agencies/:id/templates
 */
router.post('/:id/templates', async (req: Request, res: Response) => {
  try {
    // Validate input
    campaignTemplateCreateSchema.parse(req.body);

    const createdBy = req.headers['x-user-email'] as string || 'system';
    const template = await templateService.createTemplate(req.params.id, req.body, createdBy);

    logger.info('Campaign template created', {
      agencyId: req.params.id,
      templateId: template._id
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Campaign template created successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create template', { agencyId: req.params.id, error: error.message });
    res.status(400).json({
      success: false,
      error: 'Create Template Failed',
      message: error.message
    });
  }
});

/**
 * List campaign templates for agency
 * GET /api/agencies/:id/templates
 */
router.get('/:id/templates', async (req: Request, res: Response) => {
  try {
    const {
      page = '1', limit = '20', type, category, tags,
      includePublic = 'false', sortBy, sortOrder
    } = req.query;

    const result = await templateService.listTemplates(req.params.id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      type: type as string,
      category: category as string,
      tags: tags ? (tags as string).split(',') : undefined,
      includePublic: includePublic === 'true',
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    res.json({
      success: true,
      data: result.templates,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error: any) {
    logger.error('Failed to list templates', { agencyId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * Get agency performance metrics
 * GET /api/agencies/:id/performance
 */
router.get('/:id/performance', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const metrics = await performanceService.getAgencyPerformance(req.params.id, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    if (!metrics) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Agency not found'
      });
      return;
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    logger.error('Failed to get performance', { agencyId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * Get revenue analytics
 * GET /api/agencies/:id/revenue
 */
router.get('/:id/revenue', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const analytics = await performanceService.getRevenueAnalytics(req.params.id, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      groupBy: groupBy as 'day' | 'week' | 'month'
    });

    if (!analytics) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Agency not found'
      });
      return;
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    logger.error('Failed to get revenue analytics', { agencyId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * Get agency dashboard
 * GET /api/agencies/:id/dashboard
 */
router.get('/:id/dashboard', async (req: Request, res: Response) => {
  try {
    const dashboard = await performanceService.getDashboard(req.params.id);

    if (!dashboard) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Agency not found'
      });
      return;
    }

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error: any) {
    logger.error('Failed to get dashboard', { agencyId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

/**
 * List campaigns for agency
 * GET /api/agencies/:id/campaigns
 */
router.get('/:id/campaigns', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status } = req.query;

    const result = await performanceService.getAgencyCampaigns(req.params.id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string
    });

    res.json({
      success: true,
      data: result.campaigns,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    logger.error('Failed to list campaigns', { agencyId: req.params.id, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

export default router;