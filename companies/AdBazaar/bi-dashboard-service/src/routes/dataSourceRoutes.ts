import { Router, Response } from 'express';
import { z } from 'zod';
import { dataSourceService } from '../services/DataSourceService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateDataSourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['mongodb', 'postgresql', 'mysql', 'api', 'rest', 'graphql', 'google_analytics', 'facebook_ads', 'google_ads']),
  connection: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    database: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    url: z.string().optional(),
    apiKey: z.string().optional(),
    credentials: z.record(z.string()).optional()
  }),
  schema: z.object({
    tables: z.array(z.object({
      name: z.string(),
      columns: z.array(z.object({
        name: z.string(),
        type: z.string(),
        description: z.string().optional()
      }))
    })).optional()
  }).optional(),
  refreshInterval: z.number().min(60000).optional(),
  isGlobal: z.boolean().optional()
});

const UpdateDataSourceSchema = CreateDataSourceSchema.partial();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const type = req.query.type as string | undefined;
    const globalOnly = req.query.global === 'true';

    let dataSources;
    if (globalOnly) {
      dataSources = await dataSourceService.getGlobalDataSources(type);
    } else {
      dataSources = await dataSourceService.getDataSources(orgId, type);
    }

    res.json({
      success: true,
      data: dataSources,
      count: dataSources.length
    });
  } catch (error: any) {
    logger.error('Error getting data sources:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateDataSourceSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const dataSource = await dataSourceService.createDataSource({
      ...validated,
      organizationId: orgId
    });

    res.status(201).json({
      success: true,
      data: dataSource
    });
  } catch (error: any) {
    logger.error('Error creating data source:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const dataSource = await dataSourceService.getDataSourceById(id, orgId);

    if (!dataSource) {
      res.status(404).json({ success: false, error: 'Data source not found' });
      return;
    }

    res.json({
      success: true,
      data: dataSource
    });
  } catch (error: any) {
    logger.error(`Error getting data source ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateDataSourceSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const dataSource = await dataSourceService.updateDataSource(id, validated, orgId);

    if (!dataSource) {
      res.status(404).json({ success: false, error: 'Data source not found' });
      return;
    }

    res.json({
      success: true,
      data: dataSource
    });
  } catch (error: any) {
    logger.error(`Error updating data source ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await dataSourceService.deleteDataSource(id, orgId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Data source not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Data source deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting data source ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/test', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const result = await dataSourceService.testConnection(id, orgId);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`Error testing connection for ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/fetch', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const query = req.query.query as string | undefined;

    const data = await dataSourceService.fetchData(id, query);

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error(`Error fetching data for ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;