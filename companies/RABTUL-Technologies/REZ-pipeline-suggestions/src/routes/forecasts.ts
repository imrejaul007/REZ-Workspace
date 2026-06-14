import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Forecast, Pipeline } from '../models/Pipeline';
import { PipelineSuggestionService } from '../services/pipelineSuggestionService';

const router = Router();

// Validation schemas
const GenerateForecastSchema = z.object({
  pipelineId: z.string(),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string().datetime().optional()
});

// Generate forecast
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = GenerateForecastSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    const forecast = await PipelineSuggestionService.generateForecast(
      tenantId,
      data.pipelineId,
      data.period,
      data.startDate ? new Date(data.startDate) : undefined
    );

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    next(error);
  }
});

// Get forecasts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      page = 1,
      limit = 20,
      pipelineId,
      period
    } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (pipelineId) query.pipelineId = pipelineId;
    if (period) query.period = period;

    const skip = (Number(page) - 1) * Number(limit);

    const [forecasts, total] = await Promise.all([
      Forecast.find(query)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Forecast.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: forecasts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get latest forecast
router.get('/latest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { pipelineId, period = 'monthly' } = req.query;

    const query: Record<string, unknown> = { tenantId, period };
    if (pipelineId) query.pipelineId = pipelineId;

    const forecast = await Forecast.findOne(query)
      .sort({ startDate: -1 });

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    next(error);
  }
});

// Get forecast by ID
router.get('/:forecastId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const forecast = await Forecast.findOne({
      _id: req.params.forecastId,
      tenantId
    });

    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: 'Forecast not found'
      });
    }

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    next(error);
  }
});

// Get forecast comparison
router.get('/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { pipelineId, period = 'monthly' } = req.query;

    const query: Record<string, unknown> = { tenantId, period };
    if (pipelineId) query.pipelineId = pipelineId;

    const forecasts = await Forecast.find(query)
      .sort({ startDate: -1 })
      .limit(4);

    if (forecasts.length < 2) {
      return res.json({
        success: true,
        data: {
          message: 'Not enough data for comparison',
          forecasts
        }
      });
    }

    const current = forecasts[0];
    const previous = forecasts[1];

    const comparison = {
      current: {
        totalPipeline: current.totalPipeline,
        weightedPipeline: current.weightedPipeline,
        closedWon: current.closedWon
      },
      previous: {
        totalPipeline: previous.totalPipeline,
        weightedPipeline: previous.weightedPipeline,
        closedWon: previous.closedWon
      },
      changes: {
        pipelineChange: current.totalPipeline - previous.totalPipeline,
        pipelineChangePercent: previous.totalPipeline > 0
          ? ((current.totalPipeline - previous.totalPipeline) / previous.totalPipeline) * 100
          : 0,
        weightedChange: current.weightedPipeline - previous.weightedPipeline,
        weightedChangePercent: previous.weightedPipeline > 0
          ? ((current.weightedPipeline - previous.weightedPipeline) / previous.weightedPipeline) * 100
          : 0,
        closedWonChange: current.closedWon - previous.closedWon
      }
    };

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
});

// Delete forecast
router.delete('/:forecastId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const forecast = await Forecast.findOneAndDelete({
      _id: req.params.forecastId,
      tenantId
    });

    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: 'Forecast not found'
      });
    }

    res.json({
      success: true,
      message: 'Forecast deleted'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
