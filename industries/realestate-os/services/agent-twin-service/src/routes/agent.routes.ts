import { Router, Response } from 'express';
import { agentTwinService, AgentTwinQuery } from '../services/index.js';
import { apiKeyAuth, internalAuth, AuthRequest, validateBody, parsePagination } from '../middleware/index.js';
import {
  CreateAgentTwinRequestSchema,
  UpdateAgentTwinRequestSchema,
  UpdatePerformanceRequestSchema,
  UpdateAvailabilityRequestSchema,
  UpdateLeadPreferencesRequestSchema,
  AddListingRequestSchema,
  AddDealRequestSchema,
  CreateAgentTwinRequest,
  UpdateAgentTwinRequest,
  UpdatePerformanceRequest,
  UpdateAvailabilityRequest,
  UpdateLeadPreferencesRequest,
  AddListingRequest,
  AddDealRequest,
} from '../schemas/index.js';

const router = Router();

// Apply auth to all routes
router.use(apiKeyAuth);

// ============================================================================
// CREATE AGENT TWIN
// ============================================================================

/**
 * POST /api/twins/agent
 * Create a new agent twin
 */
router.post('/', validateBody(CreateAgentTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const agentTwin = await agentTwinService.create(req.validatedBody as CreateAgentTwinRequest);

    res.status(201).json({
      success: true,
      data: agentTwin,
      twin_id: agentTwin.twin_id,
    });
  } catch (error: unknown) {
    console.error('[Agent Routes] Error creating agent twin:', error);

    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'AGENT_TWIN_EXISTS',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create agent twin',
    });
  }
});

// ============================================================================
// GET AGENT TWIN
// ============================================================================

/**
 * GET /api/twins/agent/:id
 * Get agent twin by ID (agent_id or twin_id)
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Try to find by agent_id first, then by twin_id
    let agentTwin = await agentTwinService.getById(id);

    if (!agentTwin && id.startsWith('twin.realestate.agent.')) {
      agentTwin = await agentTwinService.getByTwinId(id);
    }

    if (!agentTwin) {
      res.status(404).json({
        success: false,
        error: `Agent twin not found: ${id}`,
        code: 'AGENT_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: agentTwin,
    });
  } catch (error) {
    console.error('[Agent Routes] Error getting agent twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent twin',
    });
  }
});

// ============================================================================
// LIST AGENT TWINS
// ============================================================================

/**
 * GET /api/twins/agent
 * List agent twins with pagination and filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const query: AgentTwinQuery = {
      page,
      limit,
    };

    if (req.query.brokerage_id) query.brokerage_id = req.query.brokerage_id as string;
    if (req.query.status) query.status = req.query.status as 'available' | 'busy' | 'unavailable';
    if (req.query.area) query.area = req.query.area as string;
    if (req.query.property_type) query.property_type = req.query.property_type as string;
    if (req.query.min_budget) query.min_budget = parseInt(req.query.min_budget as string, 10);
    if (req.query.max_budget) query.max_budget = parseInt(req.query.max_budget as string, 10);
    if (req.query.lead_routing_enabled !== undefined) {
      query.lead_routing_enabled = req.query.lead_routing_enabled === 'true';
    }

    const result = await agentTwinService.list(query);

    res.json({
      success: true,
      data: result.twins,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error('[Agent Routes] Error listing agent twins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list agent twins',
    });
  }
});

// ============================================================================
// FIND MATCHING AGENTS
// ============================================================================

/**
 * POST /api/twins/agent/match
 * Find agents matching lead criteria
 */
router.post('/match', async (req: AuthRequest, res: Response) => {
  try {
    const { budget, property_types, areas, limit } = req.body;

    const criteria = {
      budget,
      property_types,
      areas,
    };

    const agents = await agentTwinService.findMatchingAgents(criteria, limit || 5);

    res.json({
      success: true,
      data: agents,
      count: agents.length,
    });
  } catch (error) {
    console.error('[Agent Routes] Error finding matching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find matching agents',
    });
  }
});

// ============================================================================
// UPDATE AGENT TWIN
// ============================================================================

/**
 * PUT /api/twins/agent/:id
 * Update agent twin
 */
router.put('/:id', validateBody(UpdateAgentTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agentTwin = await agentTwinService.update(id, req.validatedBody as UpdateAgentTwinRequest);

    if (!agentTwin) {
      res.status(404).json({
        success: false,
        error: `Agent twin not found: ${id}`,
        code: 'AGENT_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: agentTwin,
    });
  } catch (error) {
    console.error('[Agent Routes] Error updating agent twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent twin',
    });
  }
});

// ============================================================================
// UPDATE PERFORMANCE
// ============================================================================

/**
 * PUT /api/twins/agent/:id/performance
 * Update agent performance metrics
 */
router.put('/:id/performance', validateBody(UpdatePerformanceRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agentTwin = await agentTwinService.updatePerformance(id, req.validatedBody as UpdatePerformanceRequest);

    if (!agentTwin) {
      res.status(404).json({
        success: false,
        error: `Agent twin not found: ${id}`,
        code: 'AGENT_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: agentTwin.performance,
      updated: agentTwin,
    });
  } catch (error) {
    console.error('[Agent Routes] Error updating performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update performance',
    });
  }
});

// ============================================================================
// UPDATE AVAILABILITY
// ============================================================================

/**
 * PUT /api/twins/agent/:id/availability
 * Update agent availability
 */
router.put('/:id/availability', validateBody(UpdateAvailabilityRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agentTwin = await agentTwinService.updateAvailability(id, req.validatedBody as UpdateAvailabilityRequest);

    if (!agentTwin) {
      res.status(404).json({
        success: false,
        error: `Agent twin not found: ${id}`,
        code: 'AGENT_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: agentTwin.availability,
      updated: agentTwin,
    });
  } catch (error) {
    console.error('[Agent Routes] Error updating availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability',
    });
  }
});

// ============================================================================
// UPDATE LEAD PREFERENCES
// ============================================================================

/**
 * PUT /api/twins/agent/:id/lead-preferences
 * Update agent lead preferences
 */
router.put('/:id/lead-preferences', validateBody(UpdateLeadPreferencesRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agentTwin = await agentTwinService.updateLeadPreferences(id, req.validatedBody as UpdateLeadPreferencesRequest);

    if (!agentTwin) {
      res.status(404).json({
        success: false,
        error: `Agent twin not found: ${id}`,
        code: 'AGENT_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: agentTwin.lead_preferences,
      updated: agentTwin,
    });
  } catch (error) {
    console.error('[Agent Routes] Error updating lead preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead preferences',
    });
  }
});

// ============================================================================
// ADD LISTING
// ============================================================================

/**
 * POST /api/twins/agent/:id/listings
 * Add listing to agent
 */
router.post('/:id/listings', validateBody(AddListingRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { listing_id } = req.validatedBody as AddListingRequest;

    const agentTwin = await agentTwinService.addListing(id, listing_id);

    if (!agentTwin) {
      res.status(404).json({
        success: false,
        error: `Agent twin not found: ${id}`,
        code: 'AGENT_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Listing added successfully',
      data: agentTwin,
    });
  } catch (error) {
    console.error('[Agent Routes] Error adding listing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add listing',
    });
  }
});

// ============================================================================
// REMOVE LISTING
// ============================================================================

/**
 * DELETE /api/twins/agent/:id/listings/:listingId
 * Remove listing from agent
 */
router.delete('/:id/listings/:listingId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, listingId } = req.params;

    const agentTwin = await agentTwinService.removeListing(id, listingId);

    if (!agentTwin) {
      res.status(404).json({
        success: false,
        error: `Agent twin not found: ${id}`,
        code: 'AGENT_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Listing removed successfully',
      data: agentTwin,
    });
  } catch (error) {
    console.error('[Agent Routes] Error removing listing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove listing',
    });
  }
});

// ============================================================================
// ADD DEAL
// ============================================================================

/**
 * POST /api/twins/agent/:id/deals
 * Add deal to agent
 */
router.post('/:id/deals', validateBody(AddDealRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { deal_id } = req.validatedBody as AddDealRequest;

    const agentTwin = await agentTwinService.addDeal(id, deal_id);

    if (!agentTwin) {
      res.status(404).json({
        success: false,
        error: `Agent twin not found: ${id}`,
        code: 'AGENT_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Deal added successfully',
      data: agentTwin,
    });
  } catch (error) {
    console.error('[Agent Routes] Error adding deal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add deal',
    });
  }
});

// ============================================================================
// REMOVE DEAL
// ============================================================================

/**
 * DELETE /api/twins/agent/:id/deals/:dealId
 * Remove deal from agent
 */
router.delete('/:id/deals/:dealId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, dealId } = req.params;

    const agentTwin = await agentTwinService.removeDeal(id, dealId);

    if (!agentTwin) {
      res.status(404).json({
        success: false,
        error: `Agent twin not found: ${id}`,
        code: 'AGENT_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Deal removed successfully',
      data: agentTwin,
    });
  } catch (error) {
    console.error('[Agent Routes] Error removing deal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove deal',
    });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

/**
 * GET /api/twins/agent/stats
 * Get agent statistics
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const brokerage_id = req.query.brokerage_id as string | undefined;
    const stats = await agentTwinService.getStats(brokerage_id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Agent Routes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// ============================================================================
// DELETE AGENT TWIN
// ============================================================================

/**
 * DELETE /api/twins/agent/:id
 * Delete agent twin (internal only)
 */
router.delete('/:id', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await agentTwinService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Agent twin not found: ${id}`,
        code: 'AGENT_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Agent twin deleted successfully',
    });
  } catch (error) {
    console.error('[Agent Routes] Error deleting agent twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete agent twin',
    });
  }
});

export default router;