import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { modelService, trainingService, attributionService, optimizationService, scenarioService, forecastingService } from '../services';
import { CreateMMMModelSchema, UpdateMMMModelSchema, TrainModelRequestSchema, ScenarioRequestSchema } from '../types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/models - Create MMM model
 */
router.post('/models', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateMMMModelSchema.parse(req.body);
    const model = await modelService.createModel(validatedData);

    logger.info('MMM model created via API', { modelId: model.id });

    res.status(201).json({
      success: true,
      data: model
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      logger.error('Failed to create model', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create model'
      });
    }
  }
});

/**
 * GET /api/models - List models
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const { advertiserId, page = '1', limit = '20' } = req.query;

    const result = await modelService.listModels(
      advertiserId as string | undefined,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to list models', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list models'
    });
  }
});

/**
 * GET /api/models/:id - Get model
 */
router.get('/models/:id', async (req: Request, res: Response) => {
  try {
    const model = await modelService.getModel(req.params.id);

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    logger.error('Failed to get model', { modelId: req.params.id, error });
    res.status(404).json({
      success: false,
      error: 'Model not found'
    });
  }
});

/**
 * PUT /api/models/:id - Update model
 */
router.put('/models/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateMMMModelSchema.parse(req.body);
    const model = await modelService.updateModel(req.params.id, validatedData);

    logger.info('Model updated via API', { modelId: req.params.id });

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      logger.error('Failed to update model', { modelId: req.params.id, error });
      res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }
  }
});

/**
 * DELETE /api/models/:id - Delete model
 */
router.delete('/models/:id', async (req: Request, res: Response) => {
  try {
    await modelService.deleteModel(req.params.id);

    logger.info('Model deleted via API', { modelId: req.params.id });

    res.json({
      success: true,
      message: 'Model deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete model', { modelId: req.params.id, error });
    res.status(404).json({
      success: false,
      error: 'Model not found'
    });
  }
});

/**
 * POST /api/models/:id/train - Train model
 */
router.post('/models/:id/train', async (req: Request, res: Response) => {
  try {
    const options = req.body.hyperparameters
      ? TrainModelRequestSchema.parse(req.body)
      : undefined;

    const result = await trainingService.trainModel(req.params.id, options);

    logger.info('Model training triggered via API', { modelId: req.params.id });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to train model', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Training failed'
    });
  }
});

/**
 * GET /api/models/:id/results - Get model results
 */
router.get('/models/:id/results', async (req: Request, res: Response) => {
  try {
    const { ModelResult } = await import('../models');
    const results = await ModelResult.findOne({ modelId: req.params.id })
      .sort({ trainedAt: -1 });

    if (!results) {
      res.status(404).json({
        success: false,
        error: 'No results found. Model may not be trained.'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        modelId: results.modelId,
        trainedAt: results.trainedAt,
        roas: Object.fromEntries(results.roas),
        contribution: Object.fromEntries(results.contribution),
        saturation: Object.fromEntries(results.saturation),
        adstock: Object.fromEntries(results.adstock),
        marginalRoas: Object.fromEntries(results.marginalRoas),
        metrics: results.modelMetrics,
        featureImportance: Object.fromEntries(results.featureImportance)
      }
    });
  } catch (error) {
    logger.error('Failed to get results', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get results'
    });
  }
});

/**
 * GET /api/models/:id/attribution - Get channel attribution
 */
router.get('/models/:id/attribution', async (req: Request, res: Response) => {
  try {
    const { attributionModel } = req.query;
    const attribution = await attributionService.getAttribution(
      req.params.id,
      attributionModel as any
    );

    res.json({
      success: true,
      data: attribution
    });
  } catch (error) {
    logger.error('Failed to get attribution', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get attribution'
    });
  }
});

/**
 * GET /api/models/:id/attribution/summary - Get attribution summary
 */
router.get('/models/:id/attribution/summary', async (req: Request, res: Response) => {
  try {
    const summary = await attributionService.getAttributionSummary(req.params.id);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Failed to get attribution summary', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get attribution summary'
    });
  }
});

/**
 * GET /api/models/:id/roi - Get ROI by channel
 */
router.get('/models/:id/roi', async (req: Request, res: Response) => {
  try {
    const { ModelResult, Channel } = await import('../models');
    const model = await modelService.getModel(req.params.id);

    const modelResult = await ModelResult.findOne({ modelId: req.params.id })
      .sort({ trainedAt: -1 });

    const channels = await Channel.find({ _id: { $in: model.channels } });

    const roi = channels.map(ch => {
      const spend = ch.spend || 0;
      const revenue = ch.revenue || 0;
      const roas = spend > 0 ? revenue / spend : 0;
      const conversions = ch.conversions || 0;
      const cpa = conversions > 0 ? spend / conversions : 0;

      return {
        channelId: ch.channelId,
        channelName: ch.name,
        channelType: ch.type,
        spend,
        revenue,
        roas,
        cpa,
        contribution: modelResult?.contribution?.get?.(ch.channelId) || 0,
        marginalRoas: modelResult?.marginalRoas?.get?.(ch.channelId) || 0
      };
    });

    res.json({
      success: true,
      data: {
        modelId: req.params.id,
        channels: roi,
        totalSpend: roi.reduce((sum, ch) => sum + ch.spend, 0),
        totalRevenue: roi.reduce((sum, ch) => sum + ch.revenue, 0),
        overallRoas: roi.reduce((sum, ch) => sum + ch.spend, 0) > 0
          ? roi.reduce((sum, ch) => sum + ch.revenue, 0) / roi.reduce((sum, ch) => sum + ch.spend, 0)
          : 0
      }
    });
  } catch (error) {
    logger.error('Failed to get ROI', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get ROI'
    });
  }
});

/**
 * POST /api/models/:id/optimize - Get budget optimization
 */
router.post('/models/:id/optimize', async (req: Request, res: Response) => {
  try {
    const { totalBudget, constraints } = req.body;

    if (!totalBudget || totalBudget <= 0) {
      res.status(400).json({
        success: false,
        error: 'Valid totalBudget required'
      });
      return;
    }

    const optimization = await optimizationService.optimizeBudget(
      req.params.id,
      totalBudget,
      constraints
    );

    logger.info('Budget optimization via API', { modelId: req.params.id });

    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    logger.error('Failed to optimize budget', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Optimization failed'
    });
  }
});

/**
 * GET /api/models/:id/optimize/efficiency - Get channel efficiency
 */
router.get('/models/:id/optimize/efficiency', async (req: Request, res: Response) => {
  try {
    const efficiency = await optimizationService.getChannelEfficiency(req.params.id);

    res.json({
      success: true,
      data: efficiency
    });
  } catch (error) {
    logger.error('Failed to get efficiency', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get efficiency'
    });
  }
});

/**
 * POST /api/models/:id/scenarios - Create scenario
 */
router.post('/models/:id/scenarios', async (req: Request, res: Response) => {
  try {
    const validatedData = ScenarioRequestSchema.parse(req.body);
    const scenario = await scenarioService.createScenario(req.params.id, validatedData);

    logger.info('Scenario created via API', { modelId: req.params.id, scenarioId: scenario.id });

    res.status(201).json({
      success: true,
      data: scenario
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      logger.error('Failed to create scenario', { modelId: req.params.id, error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create scenario'
      });
    }
  }
});

/**
 * GET /api/models/:id/scenarios - List scenarios
 */
router.get('/models/:id/scenarios', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const result = await scenarioService.listScenarios(
      req.params.id,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to list scenarios', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to list scenarios'
    });
  }
});

/**
 * GET /api/models/:id/scenarios/:sid - Get scenario
 */
router.get('/models/:id/scenarios/:sid', async (req: Request, res: Response) => {
  try {
    const scenario = await scenarioService.getScenario(req.params.id, req.params.sid);

    res.json({
      success: true,
      data: scenario
    });
  } catch (error) {
    logger.error('Failed to get scenario', { scenarioId: req.params.sid, error });
    res.status(404).json({
      success: false,
      error: 'Scenario not found'
    });
  }
});

/**
 * POST /api/models/:id/scenarios/compare - Compare scenarios
 */
router.post('/models/:id/scenarios/compare', async (req: Request, res: Response) => {
  try {
    const { scenarioIds } = req.body;

    if (!scenarioIds || scenarioIds.length < 2) {
      res.status(400).json({
        success: false,
        error: 'At least 2 scenario IDs required for comparison'
      });
      return;
    }

    const comparison = await scenarioService.compareScenarios(req.params.id, scenarioIds);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    logger.error('Failed to compare scenarios', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to compare scenarios'
    });
  }
});

/**
 * POST /api/models/:id/forecasting - Generate forecast
 */
router.post('/api/models/:id/forecasting', async (req: Request, res: Response) => {
  try {
    const { period = 'MONTH', periodsAhead = 12 } = req.body;

    const forecasts = await forecastingService.generateForecast(
      req.params.id,
      period,
      periodsAhead
    );

    logger.info('Forecast generated via API', { modelId: req.params.id, period });

    res.json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    logger.error('Failed to generate forecast', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Forecast failed'
    });
  }
});

/**
 * GET /api/models/:id/forecasting - Get saved forecasts
 */
router.get('/models/:id/forecasting', async (req: Request, res: Response) => {
  try {
    const { period } = req.query;
    const forecasts = await forecastingService.getForecasts(req.params.id, period as string);

    res.json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    logger.error('Failed to get forecasts', { modelId: req.params.id, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get forecasts'
    });
  }
});

export default router;