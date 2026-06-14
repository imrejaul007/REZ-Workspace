import { Router, Response } from 'express';
import { z } from 'zod';
import schemaService from '../services/SchemaService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateSchemaSchema = z.object({
  sourceId: z.string().min(1),
  name: z.string().min(1),
  tables: z.array(z.object({
    name: z.string(),
    columns: z.array(z.object({
      name: z.string(),
      dataType: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object', 'uuid']),
      nullable: z.boolean().default(true),
      primaryKey: z.boolean().default(false),
      unique: z.boolean().default(false),
      defaultValue: z.any().optional(),
      references: z.object({
        table: z.string(),
        column: z.string()
      }).optional()
    })),
    indexes: z.array(z.object({
      name: z.string(),
      columns: z.array(z.string()),
      unique: z.boolean().default(false)
    })).optional()
  })).min(1)
});

const UpdateSchemaSchema = CreateSchemaSchema.partial().omit({ sourceId: true });

const InferSchemaSchema = z.object({
  sampleData: z.array(z.record(z.any())).min(1)
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateSchemaSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const schema = await schemaService.createSchema(
      validated.sourceId,
      validated.name,
      validated.tables,
      orgId
    );

    res.status(201).json({
      success: true,
      data: schema
    });
  } catch (error: any) {
    logger.error('Error creating schema:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/source/:sourceId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sourceId } = req.params;

    const schema = await schemaService.getSchemaBySourceId(sourceId);

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
    logger.error(`Error getting schema for source ${req.params.sourceId}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateSchemaSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const schema = await schemaService.updateSchema(
      id,
      validated.tables || [],
      orgId
    );

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
    logger.error(`Error updating schema ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id/history', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const schema = await schemaService.getSchemaBySourceId(id);
    if (!schema) {
      res.status(404).json({
        success: false,
        error: 'Schema not found'
      });
      return;
    }

    const history = await schemaService.getSchemaHistory(schema.sourceId);

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    logger.error(`Error getting schema history ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/validate/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await schemaService.validateSchema(id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`Error validating schema ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/infer', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sampleData } = InferSchemaSchema.parse(req.body);

    const columns = await schemaService.inferSchema(sampleData);

    res.json({
      success: true,
      data: { columns }
    });
  } catch (error: any) {
    logger.error('Error inferring schema:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;