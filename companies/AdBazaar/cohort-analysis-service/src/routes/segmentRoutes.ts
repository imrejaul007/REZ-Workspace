import { Router, Response } from 'express';
import { z } from 'zod';
import { segmentService } from '../services/SegmentService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateSegmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  criteria: z.object({
    rules: z.array(z.object({
      field: z.string(),
      operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in', 'contains', 'not_contains', 'between', 'exists']),
      value: z.any(),
      logicalOperator: z.enum(['and', 'or']).optional()
    })),
    logic: z.enum(['all', 'any']).default('all')
  }),
  color: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const UpdateSegmentSchema = CreateSegmentSchema.partial();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const activeOnly = req.query.activeOnly !== 'false';

    const segments = await segmentService.getSegments(orgId, activeOnly);

    res.json({
      success: true,
      data: segments,
      count: segments.length
    });
  } catch (error: any) {
    logger.error('Error getting segments:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateSegmentSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';
    const userId = req.user?.id || 'anonymous';

    const segment = await segmentService.createSegment({
      ...validated,
      organizationId: orgId,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: segment
    });
  } catch (error: any) {
    logger.error('Error creating segment:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const segment = await segmentService.getSegmentById(id, orgId);

    if (!segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }

    res.json({
      success: true,
      data: segment
    });
  } catch (error: any) {
    logger.error(`Error getting segment ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateSegmentSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const segment = await segmentService.updateSegment(id, validated, orgId);

    if (!segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }

    res.json({
      success: true,
      data: segment
    });
  } catch (error: any) {
    logger.error(`Error updating segment ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await segmentService.deleteSegment(id, orgId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Segment deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting segment ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/estimate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const size = await segmentService.estimateSize(id, orgId);

    res.json({
      success: true,
      data: { estimatedSize: size }
    });
  } catch (error: any) {
    logger.error(`Error estimating segment size ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;