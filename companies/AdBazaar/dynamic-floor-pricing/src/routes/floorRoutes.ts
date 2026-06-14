import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createLogger } from 'utils/logger.js';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  floorService,
  CreateFloorSchema,
  UpdateFloorSchema
} from '../services/floorService';
import { optimizationService } from '../services/optimizationService';
import { historyService } from '../services/historyService';
import { performanceService } from '../services/performanceService';
import { recommendationService } from '../services/recommendationService';

const router = Router();
const logger = createLogger('FloorRoutes');

// Validation schemas
const batchUpdateSchema = z.object({
  floors: z.array(z.object({
    inventoryId: z.string(),
    price: z.number().min(0),
    floorId: z.string().optional()
  })),
  reason: z.string().optional()
});

const optimizeSchema = z.object({
  force: z.boolean().optional(),
  targetEcpm: z.number().optional(),
  minImprovement: z.number().optional()
});

const historyQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50)
});

const performanceQuerySchema = z.object({
  period: z.enum(['1d', '7d', '30d', '90d']).optional().default('7d')
});

/**
 * POST /api/floors - Create a new floor price
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = CreateFloorSchema.parse(req.body);
    const floor = await floorService.createFloor(validatedData);

    res.status(201).json({
      success: true,
      data: floor
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      });
      return;
    }

    logger.error('Failed to create floor', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create floor price'
    });
  }
});

/**
 * GET /api/floors - List all floors
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, type, inventoryId, page, limit } = req.query;

    const result = await floorService.listFloors({
      status: status as string,
      type: type as string,
      inventoryId: inventoryId as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20
    });

    res.json({
      success: true,
      data: result.floors,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    logger.error('Failed to list floors', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * GET /api/floors/recommendations - Get AI recommendations
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const { inventoryIds, status, minConfidence, limit } = req.query;

    const recommendations = await recommendationService.getRecommendations({
      inventoryIds: inventoryIds ? (inventoryIds as string).split(',') : undefined,
      status: status as string,
      minConfidence: minConfidence ? parseFloat(minConfidence as string) : 0,
      limit: limit ? parseInt(limit as string, 10) : 50
    });

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Failed to get recommendations', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * POST /api/floors/recommendations/generate - Generate recommendations
 */
router.post('/recommendations/generate', async (req: Request, res: Response) => {
  try {
    const { floorIds } = req.body;

    const recommendations = await recommendationService.generateRecommendations(floorIds);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error) {
    logger.error('Failed to generate recommendations', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * POST /api/floors/recommendations/:id/apply - Apply a recommendation
 */
router.post('/recommendations/:id/apply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const recommendation = await recommendationService.applyRecommendation(id);

    if (!recommendation) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Recommendation not found'
      });
      return;
    }

    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    logger.error('Failed to apply recommendation', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * GET /api/floors/:inventoryId - Get floor by inventory ID
 */
router.get('/:inventoryId', async (req: Request, res: Response) => {
  try {
    const { inventoryId } = req.params;

    // Check if it's an ObjectId (MongoDB)
    if (inventoryId.length === 24 && /^[0-9a-fA-F]{24}$/.test(inventoryId)) {
      const floor = await floorService.getFloorById(inventoryId);
      if (!floor) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Floor not found'
        });
        return;
      }
      res.json({ success: true, data: floor });
      return;
    }

    // Otherwise, treat as inventory ID
    const floor = await floorService.getFloorByInventoryId(inventoryId);

    if (!floor) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Floor not found for this inventory'
      });
      return;
    }

    res.json({ success: true, data: floor });
  } catch (error) {
    logger.error('Failed to get floor', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * PUT /api/floors/:id - Update floor
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateFloorSchema.parse(req.body);

    const floor = await floorService.updateFloor(
      id,
      validatedData,
      req.serviceId || 'api'
    );

    if (!floor) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Floor not found'
      });
      return;
    }

    res.json({ success: true, data: floor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      });
      return;
    }

    logger.error('Failed to update floor', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * DELETE /api/floors/:id - Archive floor
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = await floorService.deleteFloor(id);

    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Floor not found'
      });
      return;
    }

    res.json({ success: true, message: 'Floor archived' });
  } catch (error) {
    logger.error('Failed to archive floor', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * POST /api/floors/:id/optimize - Optimize floor price
 */
router.post('/:id/optimize', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { force, targetEcpm, minImprovement } = req.body;

    const result = await optimizationService.optimizeFloor(id, force);

    res.json({
      success: true,
      data: {
        floorId: id,
        suggestedPrice: result.suggestedPrice,
        confidence: result.confidence,
        factors: result.factors,
        projectedImpact: result.projectedImpact,
        reason: result.reason,
        applied: result.confidence >= 0.7 || force
      }
    });
  } catch (error) {
    logger.error('Failed to optimize floor', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Optimization failed'
    });
  }
});

/**
 * POST /api/floors/batch - Batch update floors
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const validatedData = batchUpdateSchema.parse(req.body);

    // Get floors by inventory ID or floor ID
    const updates = await Promise.all(
      validatedData.floors.map(async (item) => {
        let floor;
        if (item.floorId) {
          floor = await floorService.getFloorById(item.floorId);
        } else {
          floor = await floorService.getFloorByInventoryId(item.inventoryId);
        }
        return floor ? { floorId: floor._id.toString(), price: item.price, updatedBy: 'batch' } : null;
      })
    );

    const validUpdates = updates.filter(u => u !== null) as Array<{
      floorId: string;
      price: number;
      updatedBy: string;
    }>;

    const result = await floorService.batchUpdateFloors(validUpdates);

    res.json({
      success: true,
      data: {
        success: result.success,
        failed: result.failed,
        total: validatedData.floors.length,
        updated: result.success.length,
        failedCount: result.failed.length
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      });
      return;
    }

    logger.error('Failed to batch update floors', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * GET /api/floors/:id/history - Get floor price history
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { from, to, page, limit } = req.query;

    const query = {
      floorId: id,
      startDate: from ? new Date(from as string) : undefined,
      endDate: to ? new Date(to as string) : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50
    };

    const result = await historyService.getHistory(query);

    // Get summary
    const summary = await historyService.getPriceChangeSummary(id, 30);

    res.json({
      success: true,
      data: result.history,
      summary,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    logger.error('Failed to get floor history', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * GET /api/floors/:id/performance - Get floor performance
 */
router.get('/:id/performance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { period } = req.query;

    const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '90d' ? 90 : 30;

    const summary = await performanceService.getPerformanceSummary(id, days);
    const comparison = await performanceService.comparePerformance(id, Math.min(days, 7), 7);
    const alerts = await performanceService.getPerformanceAlerts(id);

    // Get daily performance
    const { performance } = await performanceService.getPerformance({
      floorId: id,
      limit: days
    });

    res.json({
      success: true,
      data: {
        summary,
        comparison,
        alerts,
        daily: performance
      }
    });
  } catch (error) {
    logger.error('Failed to get floor performance', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * GET /api/floors/:id/trajectory - Get price trajectory
 */
router.get('/:id/trajectory', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { days } = req.query;

    const trajectory = await historyService.getPriceTrajectory(
      id,
      days ? parseInt(days as string, 10) : 30
    );

    res.json({
      success: true,
      data: trajectory
    });
  } catch (error) {
    logger.error('Failed to get price trajectory', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

/**
 * GET /api/floors/stats - Get floor statistics
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const activeCount = await floorService.getActiveFloorsCount();
    const topFloors = await performanceService.getTopPerformingFloors(7, 10);
    const recommendationStats = await recommendationService.getRecommendationStats(30);

    res.json({
      success: true,
      data: {
        activeFloors: activeCount,
        topPerforming: topFloors,
        recommendations: recommendationStats
      }
    });
  } catch (error) {
    logger.error('Failed to get stats', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

export default router;