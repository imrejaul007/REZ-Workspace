import { Router, Response } from 'express';
import { z } from 'zod';
import tableService from '../services/TableService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateTableSchema = z.object({
  name: z.string().min(1),
  sourceId: z.string().min(1),
  schema: z.string().default('public'),
  columns: z.array(z.object({
    name: z.string(),
    dataType: z.string(),
    nullable: z.boolean().default(true),
    primaryKey: z.boolean().default(false)
  })).min(1),
  metadata: z.record(z.any()).optional()
});

const UpdateTableSchema = CreateTableSchema.partial();

router.get('/source/:sourceId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sourceId } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const tables = await tableService.getTables(sourceId, orgId);

    res.json({
      success: true,
      data: tables,
      count: tables.length
    });
  } catch (error: any) {
    logger.error(`Error getting tables for source ${req.params.sourceId}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateTableSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const table = await tableService.createTable({
      ...validated,
      organizationId: orgId
    });

    res.status(201).json({
      success: true,
      data: table
    });
  } catch (error: any) {
    logger.error('Error creating table:', error);
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

    const table = await tableService.getTableById(id, orgId);

    if (!table) {
      res.status(404).json({
        success: false,
        error: 'Table not found'
      });
      return;
    }

    res.json({
      success: true,
      data: table
    });
  } catch (error: any) {
    logger.error(`Error getting table ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateTableSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const table = await tableService.updateTable(id, validated, orgId);

    if (!table) {
      res.status(404).json({
        success: false,
        error: 'Table not found'
      });
      return;
    }

    res.json({
      success: true,
      data: table
    });
  } catch (error: any) {
    logger.error(`Error updating table ${req.params.id}:`, error);
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

    const deleted = await tableService.deleteTable(id, orgId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Table not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting table ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const stats = await tableService.getTableStats(id, orgId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error(`Error getting table stats ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id/data', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';
    const limit = parseInt(req.query.limit as string) || 100;

    const data = await tableService.getTableData(id, orgId, limit);

    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error: any) {
    logger.error(`Error getting table data ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;