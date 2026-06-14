import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Pipeline } from '../models/Pipeline';

const router = Router();

// Validation schemas
const CreateStageSchema = z.object({
  name: z.string().min(1),
  order: z.number(),
  probability: z.number().min(0).max(100).default(0),
  avgDaysInStage: z.number().optional(),
  isWonStage: z.boolean().default(false),
  isLostStage: z.boolean().default(false)
});

const CreatePipelineSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  stages: z.array(CreateStageSchema).optional(),
  defaultCurrency: z.string().default('USD'),
  isDefault: z.boolean().default(false)
});

const UpdatePipelineSchema = CreatePipelineSchema.partial();

// Create pipeline
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreatePipelineSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await Pipeline.updateMany({ tenantId }, { $set: { isDefault: false } });
    }

    const pipeline = new Pipeline({
      ...data,
      tenantId,
      createdBy: req.headers['x-user-id'] as string || 'system'
    });

    await pipeline.save();

    res.status(201).json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    next(error);
  }
});

// List pipelines
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { includeInactive } = req.query;

    const query: Record<string, unknown> = { tenantId };

    const pipelines = await Pipeline.find(query)
      .sort({ isDefault: -1, name: 1 });

    res.json({
      success: true,
      data: pipelines
    });
  } catch (error) {
    next(error);
  }
});

// Get pipeline
router.get('/:pipelineId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const pipeline = await Pipeline.findOne({
      _id: req.params.pipelineId,
      tenantId
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    res.json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    next(error);
  }
});

// Update pipeline
router.patch('/:pipelineId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = UpdatePipelineSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await Pipeline.updateMany(
        { tenantId, _id: { $ne: req.params.pipelineId } },
        { $set: { isDefault: false } }
      );
    }

    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.pipelineId, tenantId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    res.json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    next(error);
  }
});

// Delete pipeline
router.delete('/:pipelineId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const pipeline = await Pipeline.findOne({
      _id: req.params.pipelineId,
      tenantId
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    if (pipeline.isDefault) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete default pipeline'
      });
    }

    await Pipeline.findByIdAndDelete(req.params.pipelineId);

    res.json({
      success: true,
      message: 'Pipeline deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Add stage
router.post('/:pipelineId/stages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateStageSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const pipeline = await Pipeline.findOne({
      _id: req.params.pipelineId,
      tenantId
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    // Add stage with tenantId
    const stage = {
      ...data,
      tenantId,
      isActive: true,
      dealCount: 0,
      totalValue: 0
    };

    pipeline.stages.push(stage as never);
    pipeline.markModified('stages');
    await pipeline.save();

    res.status(201).json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    next(error);
  }
});

// Update stage
router.patch('/:pipelineId/stages/:stageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateStageSchema.partial().parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const pipeline = await Pipeline.findOne({
      _id: req.params.pipelineId,
      tenantId
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    const stageIndex = pipeline.stages.findIndex(
      s => s._id?.toString() === req.params.stageId
    );

    if (stageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found'
      });
    }

    // Update stage fields
    Object.assign(pipeline.stages[stageIndex], data);
    pipeline.markModified('stages');
    await pipeline.save();

    res.json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    next(error);
  }
});

// Delete stage
router.delete('/:pipelineId/stages/:stageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const pipeline = await Pipeline.findOne({
      _id: req.params.pipelineId,
      tenantId
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    const stageIndex = pipeline.stages.findIndex(
      s => s._id?.toString() === req.params.stageId
    );

    if (stageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Stage not found'
      });
    }

    // Prevent deleting won/lost stages if they have deals
    const stage = pipeline.stages[stageIndex];
    if ((stage.isWonStage || stage.isLostStage) && stage.dealCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete stage with deals'
      });
    }

    pipeline.stages.splice(stageIndex, 1);
    pipeline.markModified('stages');
    await pipeline.save();

    res.json({
      success: true,
      message: 'Stage deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Reorder stages
router.post('/:pipelineId/stages/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stageOrder } = z.object({
      stageOrder: z.array(z.string())
    }).parse(req.body);

    const tenantId = req.headers['x-tenant-id'] as string;

    const pipeline = await Pipeline.findOne({
      _id: req.params.pipelineId,
      tenantId
    });

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    // Reorder stages
    const stageMap = new Map(
      pipeline.stages.map(s => [s._id?.toString(), s])
    );

    pipeline.stages = stageOrder
      .map(id => stageMap.get(id))
      .filter(Boolean) as typeof pipeline.stages;

    // Update order numbers
    pipeline.stages.forEach((stage, index) => {
      stage.order = index;
    });

    pipeline.markModified('stages');
    await pipeline.save();

    res.json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    next(error);
  }
});

export default router;
