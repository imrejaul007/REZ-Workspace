// Merchant AI Employee UI - Training Data Routes
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { trainingDataService } from '../services/trainingDataService';
import { TrainingDataType } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const addTrainingDataSchema = z.object({
  type: z.nativeEnum(TrainingDataType),
  question: z.string().min(1).max(1000),
  answer: z.string().min(1).max(5000),
  intent: z.string().optional(),
  entities: z.array(z.string()).optional(),
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    confidence: z.number().min(0).max(1).optional(),
    source: z.string().optional(),
  }).optional(),
  enabled: z.boolean().optional(),
});

const bulkImportSchema = z.object({
  records: z.array(z.object({
    type: z.nativeEnum(TrainingDataType),
    question: z.string().min(1).max(1000),
    answer: z.string().min(1).max(5000),
    intent: z.string().optional(),
    entities: z.array(z.string()).optional(),
    metadata: z.object({
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      confidence: z.number().min(0).max(1).optional(),
      source: z.string().optional(),
    }).optional(),
  })).min(1).max(1000),
});

const startTrainingJobSchema = z.object({
  agentId: z.string().min(1, 'agentId is required'),
  dataTypes: z.array(z.nativeEnum(TrainingDataType)).optional(),
});

const updateTrainingDataSchema = addTrainingDataSchema.partial();

// Middleware for merchant context
const withMerchantContext = (req: Request, res: Response, next: () => void) => {
  const merchantId = req.headers['x-merchant-id'] as string;
  if (!merchantId) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_MERCHANT_ID', message: 'x-merchant-id header required' }
    });
  }
  (req as any).merchantId = merchantId;
  next();
};

// Add training data
router.post('/training', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const validated = addTrainingDataSchema.parse(req.body);
    const record = await trainingDataService.addTrainingData(
      (req as any).merchantId,
      validated
    );

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors }
      });
    }
    logger.error('[TrainingRoutes] Add training data failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add training data' }
    });
  }
});

// List training data
router.get('/training', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const { type, enabled, page, limit } = req.query;

    const result = await trainingDataService.listTrainingData(
      (req as any).merchantId,
      {
        type: type as TrainingDataType | undefined,
        enabled: enabled === 'true' ? true : enabled === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      }
    );

    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      },
    });
  } catch (error) {
    logger.error('[TrainingRoutes] List training data failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list training data' }
    });
  }
});

// Get training data
router.get('/training/:id', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const record = await trainingDataService.getTrainingData(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Training data not found' }
      });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('[TrainingRoutes] Get training data failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get training data' }
    });
  }
});

// Update training data
router.put('/training/:id', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const validated = updateTrainingDataSchema.parse(req.body);
    const record = await trainingDataService.updateTrainingData(req.params.id, validated);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Training data not found' }
      });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors }
      });
    }
    logger.error('[TrainingRoutes] Update training data failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update training data' }
    });
  }
});

// Delete training data
router.delete('/training/:id', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const deleted = await trainingDataService.deleteTrainingData(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Training data not found' }
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[TrainingRoutes] Delete training data failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete training data' }
    });
  }
});

// Bulk delete training data
router.post('/training/bulk-delete', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'ids array required' }
      });
    }

    const deleted = await trainingDataService.bulkDelete((req as any).merchantId, ids);

    res.json({ success: true, data: { deleted } });
  } catch (error) {
    logger.error('[TrainingRoutes] Bulk delete failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete training data' }
    });
  }
});

// Import batch
router.post('/training/import', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const validated = bulkImportSchema.parse(req.body);
    const result = await trainingDataService.importBatch(
      (req as any).merchantId,
      validated.records
    );

    res.status(201).json({
      success: true,
      data: {
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors }
      });
    }
    logger.error('[TrainingRoutes] Import batch failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to import training data' }
    });
  }
});

// Start training job
router.post('/training/jobs', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const validated = startTrainingJobSchema.parse(req.body);

    const job = await trainingDataService.startTrainingJob(
      (req as any).merchantId,
      validated.agentId,
      validated.dataTypes
    );

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors }
      });
    }
    logger.error('[TrainingRoutes] Start training job failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to start training job' }
    });
  }
});

// Get training job
router.get('/training/jobs/:jobId', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const job = await trainingDataService.getTrainingJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Training job not found' }
      });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    logger.error('[TrainingRoutes] Get training job failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get training job' }
    });
  }
});

// List training jobs
router.get('/training/jobs', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const jobs = await trainingDataService.listTrainingJobs((req as any).merchantId);
    res.json({ success: true, data: jobs });
  } catch (error) {
    logger.error('[TrainingRoutes] List training jobs failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list training jobs' }
    });
  }
});

// Get knowledge base stats
router.get('/training/stats', withMerchantContext, async (req: Request, res: Response) => {
  try {
    const stats = await trainingDataService.getKnowledgeBaseStats((req as any).merchantId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('[TrainingRoutes] Get stats failed', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get stats' }
    });
  }
});

export default router;
