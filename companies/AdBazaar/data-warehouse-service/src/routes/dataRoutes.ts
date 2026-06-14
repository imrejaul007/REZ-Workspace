import { Router, Response } from 'express';
import { z } from 'zod';
import dataService from '../services/DataService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const SyncSchema = z.object({
  sourceId: z.string().min(1),
  type: z.enum(['full', 'incremental', 'realtime']).default('incremental')
});

const TransformSchema = z.object({
  sourceId: z.string().min(1),
  transformations: z.array(z.object({
    type: z.enum(['filter', 'map', 'aggregate', 'join']),
    field: z.string().optional(),
    expression: z.string().optional(),
    operations: z.any().optional()
  })).min(1)
});

const QuerySchema = z.object({
  sourceId: z.string().min(1),
  query: z.string().min(1),
  params: z.record(z.any()).optional()
});

router.post('/sync', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = SyncSchema.parse(req.body);
    const userId = req.user?.id || 'system';

    const sync = await dataService.syncData(validated.sourceId, validated.type, userId);

    res.json({
      success: true,
      data: sync
    });
  } catch (error: any) {
    logger.error('Error syncing data:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:source', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { source } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const data = await dataService.getData(source, orgId);

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error(`Error getting data for source ${req.params.source}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/transform', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = TransformSchema.parse(req.body);

    const result = await dataService.transformData(
      validated.sourceId,
      validated.transformations
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error transforming data:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:source/schema', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { source } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const schema = await dataService.getSchema(source, orgId);

    if (!schema) {
      res.status(404).json({
        success: false,
        error: 'Schema not found'
      });
      return;
    }

    res.json({
      success: true,
      data: schema
    });
  } catch (error: any) {
    logger.error(`Error getting schema for source ${req.params.source}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/query', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sourceId, query, params } = QuerySchema.parse(req.body);

    const result = await dataService.executeQuery(sourceId, query, params);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error executing query:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;