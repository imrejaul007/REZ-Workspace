import { Router, Response } from 'express';
import { z } from 'zod';
import { cohortService } from '../services/CohortService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateCohortSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cohortType: z.enum(['retention', 'revenue', 'engagement', 'conversion', 'behavioral']),
  definition: z.object({
    groupBy: z.object({
      field: z.string(),
      granularity: z.enum(['day', 'week', 'month', 'quarter', 'year'])
    }),
    dateRange: z.object({
      start: z.string().transform(s => new Date(s)),
      end: z.string().transform(s => new Date(s))
    }),
    filters: z.array(z.object({
      field: z.string(),
      operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'contains']),
      value: z.any()
    })).optional(),
    event: z.object({
      type: z.enum(['acquisition', 'activation', 'engagement', 'revenue', 'retention']),
      name: z.string()
    }).optional()
  }),
  segments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    criteria: z.any()
  })).optional(),
  metrics: z.array(z.string()).optional(),
  visualization: z.object({
    type: z.enum(['heatmap', 'line', 'bar', 'table']).optional(),
    colorScheme: z.array(z.string()).optional()
  }).optional()
});

const UpdateCohortSchema = CreateCohortSchema.partial();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const cohortType = req.query.type as string | undefined;

    const result = await cohortService.listCohorts(orgId, page, limit, cohortType);

    res.json({
      success: true,
      data: result.cohorts,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    logger.error('Error listing cohorts:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateCohortSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';
    const userId = req.user?.id || 'anonymous';

    const cohort = await cohortService.createCohort({
      ...validated,
      organizationId: orgId,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: cohort
    });
  } catch (error: any) {
    logger.error('Error creating cohort:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const cohort = await cohortService.getCohortById(id, orgId);

    if (!cohort) {
      res.status(404).json({ success: false, error: 'Cohort not found' });
      return;
    }

    res.json({
      success: true,
      data: cohort
    });
  } catch (error: any) {
    logger.error(`Error getting cohort ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateCohortSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const cohort = await cohortService.updateCohort(id, validated, orgId);

    if (!cohort) {
      res.status(404).json({ success: false, error: 'Cohort not found' });
      return;
    }

    res.json({
      success: true,
      data: cohort
    });
  } catch (error: any) {
    logger.error(`Error updating cohort ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await cohortService.deleteCohort(id, orgId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Cohort not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Cohort deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting cohort ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/analysis', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const analysis = await cohortService.analyzeCohort(id, orgId);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    logger.error(`Error analyzing cohort ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/compare', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const compareWith = req.query.compareWith as string | undefined;
    const orgId = req.user?.organizationId || 'default';

    if (!compareWith) {
      res.status(400).json({ success: false, error: 'compareWith query parameter is required' });
      return;
    }

    const cohortIds = [id, ...compareWith.split(',')];
    const comparison = await cohortService.compareCohorts(cohortIds, orgId);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    logger.error(`Error comparing cohorts ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/export', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const format = (req.query.format as 'json' | 'csv') || 'json';
    const orgId = req.user?.organizationId || 'default';

    const exportData = await cohortService.exportCohort(id, format, orgId);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="cohort-${id}.csv"`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error: any) {
    logger.error(`Error exporting cohort ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;