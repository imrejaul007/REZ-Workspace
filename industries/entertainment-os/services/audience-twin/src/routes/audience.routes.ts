import { Router, Response } from 'express';
import { audienceTwinService, AudienceTwinQuery } from '../services/index.js';
import { apiKeyAuth, internalAuth, AuthRequest, validateBody, parsePagination } from '../middleware/index.js';
import {
  CreateAudienceTwinSchema,
  UpdateAudienceTwinSchema,
  UpdateEngagementSchema,
  UpdateSizeEstimateSchema,
  UpdateRelationshipsSchema,
} from '../schemas/index.js';

const router = Router();

// Apply auth to all routes
router.use(apiKeyAuth);

// ============================================================================
// CREATE AUDIENCE TWIN
// ============================================================================

/**
 * POST /api/twins/audience
 * Create a new audience twin
 */
router.post('/', validateBody(CreateAudienceTwinSchema), async (req: AuthRequest, res: Response) => {
  try {
    const twin = await audienceTwinService.create(req.validatedBody);

    res.status(201).json({
      success: true,
      data: twin,
      twin_id: twin.twin_id,
    });
  } catch (error: any) {
    console.error('[Audience Routes] Error creating audience twin:', error);

    if (error.message?.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'AUDIENCE_TWIN_EXISTS',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create audience twin',
    });
  }
});

// ============================================================================
// GET AUDIENCE TWIN
// ============================================================================

/**
 * GET /api/twins/audience/:id
 * Get audience twin by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const twin = await audienceTwinService.getById(id);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Audience twin not found: ${id}`,
        code: 'AUDIENCE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: twin,
    });
  } catch (error) {
    console.error('[Audience Routes] Error getting audience twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audience twin',
    });
  }
});

// ============================================================================
// LIST AUDIENCE TWINS
// ============================================================================

/**
 * GET /api/twins/audience
 * List audience twins with pagination and filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const query: AudienceTwinQuery = { page, limit };

    if (req.query.segment_type) query.segment_type = req.query.segment_type as string;
    if (req.query.min_reach) query.min_reach = parseInt(req.query.min_reach as string);
    if (req.query.max_reach) query.max_reach = parseInt(req.query.max_reach as string);

    const result = await audienceTwinService.list(query);

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
    console.error('[Audience Routes] Error listing audience twins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list audience twins',
    });
  }
});

// ============================================================================
// UPDATE AUDIENCE TWIN
// ============================================================================

/**
 * PUT /api/twins/audience/:id
 * Update audience twin
 */
router.put('/:id', validateBody(UpdateAudienceTwinSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const twin = await audienceTwinService.update(id, req.validatedBody);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Audience twin not found: ${id}`,
        code: 'AUDIENCE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: twin,
    });
  } catch (error) {
    console.error('[Audience Routes] Error updating audience twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update audience twin',
    });
  }
});

// ============================================================================
// UPDATE ENGAGEMENT
// ============================================================================

/**
 * PUT /api/twins/audience/:id/engagement
 * Update audience engagement metrics
 */
router.put('/:id/engagement', validateBody(UpdateEngagementSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const twin = await audienceTwinService.updateEngagement(id, req.validatedBody);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Audience twin not found: ${id}`,
        code: 'AUDIENCE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: twin.engagement_metrics,
      updated: twin,
    });
  } catch (error) {
    console.error('[Audience Routes] Error updating engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update engagement',
    });
  }
});

// ============================================================================
// UPDATE SIZE ESTIMATE
// ============================================================================

/**
 * PUT /api/twins/audience/:id/size
 * Update audience size estimate
 */
router.put('/:id/size', validateBody(UpdateSizeEstimateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const twin = await audienceTwinService.updateSizeEstimate(id, req.validatedBody);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Audience twin not found: ${id}`,
        code: 'AUDIENCE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: twin.size_estimate,
      updated: twin,
    });
  } catch (error) {
    console.error('[Audience Routes] Error updating size estimate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update size estimate',
    });
  }
});

// ============================================================================
// UPDATE RELATIONSHIPS
// ============================================================================

/**
 * PUT /api/twins/audience/:id/relationships
 * Update audience relationships
 */
router.put('/:id/relationships', validateBody(UpdateRelationshipsSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const twin = await audienceTwinService.updateRelationships(id, req.validatedBody);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Audience twin not found: ${id}`,
        code: 'AUDIENCE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: twin.relationships,
      updated: twin,
    });
  } catch (error) {
    console.error('[Audience Routes] Error updating relationships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update relationships',
    });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

/**
 * GET /api/twins/audience/stats
 * Get audience twin statistics
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await audienceTwinService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Audience Routes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// ============================================================================
// GET AUDIENCE OVERLAP
// ============================================================================

/**
 * POST /api/twins/audience/overlap
 * Get venue overlap for multiple audiences
 */
router.post('/overlap', async (req: AuthRequest, res: Response) => {
  try {
    const { audience_ids } = req.body;

    if (!audience_ids || !Array.isArray(audience_ids)) {
      res.status(400).json({
        success: false,
        error: 'audience_ids array is required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const overlap = await audienceTwinService.getAudienceOverlap(audience_ids);

    res.json({
      success: true,
      data: overlap,
    });
  } catch (error) {
    console.error('[Audience Routes] Error getting overlap:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audience overlap',
    });
  }
});

// ============================================================================
// FIND SIMILAR AUDIENCES
// ============================================================================

/**
 * GET /api/twins/audience/:id/similar
 * Find similar audiences
 */
router.get('/:id/similar', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    const similar = await audienceTwinService.findSimilarAudiences(id, limit);

    res.json({
      success: true,
      data: similar,
    });
  } catch (error) {
    console.error('[Audience Routes] Error finding similar audiences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find similar audiences',
    });
  }
});

// ============================================================================
// DELETE AUDIENCE TWIN
// ============================================================================

/**
 * DELETE /api/twins/audience/:id
 * Delete audience twin
 */
router.delete('/:id', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await audienceTwinService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Audience twin not found: ${id}`,
        code: 'AUDIENCE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Audience twin deleted successfully',
    });
  } catch (error) {
    console.error('[Audience Routes] Error deleting audience twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete audience twin',
    });
  }
});

export default router;
