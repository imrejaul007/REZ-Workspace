import { Router, Response } from 'express';
import { z } from 'zod';
import { sourceService } from '../services/SourceService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateSourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['ads', 'dooh', 'creators', 'campaigns', 'analytics', 'external']),
  connection: z.object({
    type: z.enum(['api', 'database', 'webhook', 'file']),
    endpoint: z.string().optional(),
    credentials: z.record(z.string()).optional()
  }),
  schema: z.object({
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string().optional()
    }))
  }).optional(),
  refreshInterval: z.number().min(60000).default(3600000),
  metadata: z.record(z.any()).optional()
});

const UpdateSourceSchema = CreateSourceSchema.partial();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const type = req.query.type as string | undefined;

    const sources = await sourceService.getSources(orgId, type);

    res.json({
      success: true,
      data: sources,
      count: sources.length
    });
  } catch (error: any) {
    logger.error('Error getting sources:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateSourceSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const source = await sourceService.createSource({
      ...validated,
      organizationId: orgId
    });

    res.status(201).json({
      success: true,
      data: source
    });
  } catch (error: any) {
    logger.error('Error creating source:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const source = await sourceService.getSourceById(id, orgId);

    if (!source) {
      res.status(404).json({
        success: false,
        error: 'Source not found'
      });
      return;
    }

    res.json({
      success: true,
      data: source
    });
  } catch (error: any) {
    logger.error(`Error getting source ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateSourceSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const source = await sourceService.updateSource(id, validated, orgId);

    if (!source) {
      res.status(404).json({
        success: false,
        error: 'Source not found'
      });
      return;
    }

    res.json({
      success: true,
      data: source
    });
  } catch (error: any) {
    logger.error(`Error updating source ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await sourceService.deleteSource(id, orgId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Source not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Source deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting source ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/sync', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const result = await sourceService.syncSource(id, orgId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`Error syncing source ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;