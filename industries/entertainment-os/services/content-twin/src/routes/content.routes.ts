import { Router, Response } from 'express';
import { contentTwinService, ContentTwinQuery } from '../services/index.js';
import { apiKeyAuth, internalAuth, AuthRequest, validateBody, parsePagination } from '../middleware/index.js';
import {
  CreateContentTwinSchema,
  UpdateContentTwinSchema,
  UpdatePerformanceSchema,
  UpdateAudienceAlignmentSchema,
  AddPlacementSchema,
} from '../schemas/index.js';

const router = Router();

router.use(apiKeyAuth);

// ============================================================================
// CREATE CONTENT TWIN
// ============================================================================

router.post('/', validateBody(CreateContentTwinSchema), async (req: AuthRequest, res: Response) => {
  try {
    const twin = await contentTwinService.create(req.validatedBody);
    res.status(201).json({
      success: true,
      data: twin,
      twin_id: twin.twin_id,
    });
  } catch (error) {
    console.error('[Content Routes] Error creating content twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create content twin',
    });
  }
});

// ============================================================================
// GET CONTENT TWIN
// ============================================================================

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const twin = await contentTwinService.getById(req.params.id);
    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Content twin not found: ${req.params.id}`,
        code: 'CONTENT_TWIN_NOT_FOUND',
      });
      return;
    }
    res.json({ success: true, data: twin });
  } catch (error) {
    console.error('[Content Routes] Error getting content twin:', error);
    res.status(500).json({ success: false, error: 'Failed to get content twin' });
  }
});

// ============================================================================
// LIST CONTENT TWINS
// ============================================================================

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const query: ContentTwinQuery = { page, limit };

    if (req.query.content_type) query.content_type = req.query.content_type as string;
    if (req.query.genre) query.genre = req.query.genre as string;
    if (req.query.min_views) query.min_views = parseInt(req.query.min_views as string);
    if (req.query.min_engagement) query.min_engagement = parseFloat(req.query.min_engagement as string);

    const result = await contentTwinService.list(query);
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
    console.error('[Content Routes] Error listing content twins:', error);
    res.status(500).json({ success: false, error: 'Failed to list content twins' });
  }
});

// ============================================================================
// FIND BY AUDIENCE
// ============================================================================

router.get('/audience/:audienceId', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const content = await contentTwinService.findByAudience(req.params.audienceId, limit);
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('[Content Routes] Error finding content by audience:', error);
    res.status(500).json({ success: false, error: 'Failed to find content' });
  }
});

// ============================================================================
// UPDATE CONTENT TWIN
// ============================================================================

router.put('/:id', validateBody(UpdateContentTwinSchema), async (req: AuthRequest, res: Response) => {
  try {
    const twin = await contentTwinService.update(req.params.id, req.validatedBody);
    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Content twin not found: ${req.params.id}`,
        code: 'CONTENT_TWIN_NOT_FOUND',
      });
      return;
    }
    res.json({ success: true, data: twin });
  } catch (error) {
    console.error('[Content Routes] Error updating content twin:', error);
    res.status(500).json({ success: false, error: 'Failed to update content twin' });
  }
});

// ============================================================================
// UPDATE PERFORMANCE
// ============================================================================

router.put('/:id/performance', validateBody(UpdatePerformanceSchema), async (req: AuthRequest, res: Response) => {
  try {
    const twin = await contentTwinService.updatePerformance(req.params.id, req.validatedBody);
    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Content twin not found: ${req.params.id}`,
        code: 'CONTENT_TWIN_NOT_FOUND',
      });
      return;
    }
    res.json({ success: true, data: twin.performance_metrics });
  } catch (error) {
    console.error('[Content Routes] Error updating performance:', error);
    res.status(500).json({ success: false, error: 'Failed to update performance' });
  }
});

// ============================================================================
// UPDATE AUDIENCE ALIGNMENT
// ============================================================================

router.put('/:id/audience', validateBody(UpdateAudienceAlignmentSchema), async (req: AuthRequest, res: Response) => {
  try {
    const twin = await contentTwinService.updateAudienceAlignment(req.params.id, req.validatedBody);
    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Content twin not found: ${req.params.id}`,
        code: 'CONTENT_TWIN_NOT_FOUND',
      });
      return;
    }
    res.json({ success: true, data: twin.audience_alignment });
  } catch (error) {
    console.error('[Content Routes] Error updating audience alignment:', error);
    res.status(500).json({ success: false, error: 'Failed to update audience alignment' });
  }
});

// ============================================================================
// ADD PLACEMENT
// ============================================================================

router.post('/:id/placements', validateBody(AddPlacementSchema), async (req: AuthRequest, res: Response) => {
  try {
    const twin = await contentTwinService.addPlacement(req.params.id, req.validatedBody);
    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Content twin not found: ${req.params.id}`,
        code: 'CONTENT_TWIN_NOT_FOUND',
      });
      return;
    }
    res.status(201).json({ success: true, data: twin.placements });
  } catch (error) {
    console.error('[Content Routes] Error adding placement:', error);
    res.status(500).json({ success: false, error: 'Failed to add placement' });
  }
});

// ============================================================================
// PREDICT PERFORMANCE
// ============================================================================

router.get('/:id/predict/:audienceId', async (req: AuthRequest, res: Response) => {
  try {
    const prediction = await contentTwinService.predictPerformance(req.params.id, req.params.audienceId);
    res.json({ success: true, data: prediction });
  } catch (error: any) {
    console.error('[Content Routes] Error predicting performance:', error);
    res.status(404).json({ success: false, error: error.message || 'Failed to predict performance' });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await contentTwinService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Content Routes] Error getting stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// ============================================================================
// DELETE CONTENT TWIN
// ============================================================================

router.delete('/:id', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await contentTwinService.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Content twin not found: ${req.params.id}`,
        code: 'CONTENT_TWIN_NOT_FOUND',
      });
      return;
    }
    res.json({ success: true, message: 'Content twin deleted successfully' });
  } catch (error) {
    console.error('[Content Routes] Error deleting content twin:', error);
    res.status(500).json({ success: false, error: 'Failed to delete content twin' });
  }
});

export default router;