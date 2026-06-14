import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { experimentService } from '../services/experimentService';
import { marketService } from '../services/marketService';
import { treatmentService } from '../services/treatmentService';
import { controlService } from '../services/controlService';
import { geoAnalysisService } from '../services/geoAnalysisService';
import {
  CreateExperimentSchema,
  UpdateExperimentSchema,
  AddMarketSchema,
  SetTreatmentSchema,
  SetControlSchema,
  ListExperimentsQuerySchema
} from '../types';
import { internalServiceAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const moduleLogger = logger.child({ module: 'Routes' });

// Validation helper
const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

// ==================== EXPERIMENTS ====================

/**
 * POST /api/experiments - Create a new geo experiment
 */
router.post(
  '/experiments',
  internalServiceAuth,
  validate(CreateExperimentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const experiment = await experimentService.create(req.body);
      res.status(201).json({
        success: true,
        data: experiment
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/experiments - List experiments
 */
router.get(
  '/experiments',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = ListExperimentsQuerySchema.parse(req.query);
      const result = await experimentService.list(query);

      res.json({
        success: true,
        data: result.experiments,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/experiments/:id - Get experiment by ID
 */
router.get(
  '/experiments/:id',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const experiment = await experimentService.getById(req.params.id);
      if (!experiment) {
        return res.status(404).json({
          success: false,
          error: 'Experiment not found'
        });
      }

      res.json({
        success: true,
        data: experiment
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/experiments/:id - Update experiment
 */
router.put(
  '/experiments/:id',
  internalServiceAuth,
  validate(UpdateExperimentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const experiment = await experimentService.update(req.params.id, req.body);
      if (!experiment) {
        return res.status(404).json({
          success: false,
          error: 'Experiment not found'
        });
      }

      res.json({
        success: true,
        data: experiment
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/experiments/:id/start - Start experiment
 */
router.post(
  '/experiments/:id/start',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const experiment = await experimentService.start(req.params.id);
      if (!experiment) {
        return res.status(400).json({
          success: false,
          error: 'Cannot start experiment. Ensure it exists and is in draft status.'
        });
      }

      res.json({
        success: true,
        data: experiment,
        message: 'Experiment started successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/experiments/:id/pause - Pause experiment
 */
router.post(
  '/experiments/:id/pause',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const experiment = await experimentService.pause(req.params.id);
      if (!experiment) {
        return res.status(400).json({
          success: false,
          error: 'Cannot pause experiment. Ensure it exists and is running.'
        });
      }

      res.json({
        success: true,
        data: experiment,
        message: 'Experiment paused successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/experiments/:id/complete - Complete experiment
 */
router.post(
  '/experiments/:id/complete',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const experiment = await experimentService.complete(req.params.id);
      if (!experiment) {
        return res.status(400).json({
          success: false,
          error: 'Cannot complete experiment. Ensure it exists and is running.'
        });
      }

      res.json({
        success: true,
        data: experiment,
        message: 'Experiment completed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/experiments/:id - Delete experiment
 */
router.delete(
  '/experiments/:id',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await experimentService.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Experiment not found'
        });
      }

      res.json({
        success: true,
        message: 'Experiment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== MARKETS ====================

/**
 * POST /api/experiments/:id/markets - Add market to experiment
 */
router.post(
  '/experiments/:id/markets',
  internalServiceAuth,
  validate(AddMarketSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const market = await marketService.addMarket(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: market
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/experiments/:id/markets - List markets for experiment
 */
router.get(
  '/experiments/:id/markets',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as any;
      const markets = await marketService.listByExperiment(req.params.id, type);

      res.json({
        success: true,
        data: markets
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/experiments/:id/markets/:marketId - Get market by ID
 */
router.get(
  '/experiments/:id/markets/:marketId',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const market = await marketService.getById(req.params.marketId);
      if (!market) {
        return res.status(404).json({
          success: false,
          error: 'Market not found'
        });
      }

      res.json({
        success: true,
        data: market
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== TREATMENT ====================

/**
 * POST /api/experiments/:id/treatment - Set treatment for market
 */
router.post(
  '/experiments/:id/treatment',
  internalServiceAuth,
  validate(SetTreatmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const treatment = await treatmentService.setTreatment(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: treatment
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/experiments/:id/treatment - List treatments for experiment
 */
router.get(
  '/experiments/:id/treatment',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const treatments = await treatmentService.listByExperiment(req.params.id);
      res.json({
        success: true,
        data: treatments
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== CONTROL ====================

/**
 * POST /api/experiments/:id/control - Set control for market
 */
router.post(
  '/experiments/:id/control',
  internalServiceAuth,
  validate(SetControlSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const control = await controlService.setControl(req.params.id, req.body);
      res.status(201).json({
        success: true,
        data: control
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/experiments/:id/control - List controls for experiment
 */
router.get(
  '/experiments/:id/control',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const controls = await controlService.listByExperiment(req.params.id);
      res.json({
        success: true,
        data: controls
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== RESULTS ====================

/**
 * GET /api/experiments/:id/results - Get geo results
 */
router.get(
  '/experiments/:id/results',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await geoAnalysisService.getResults(req.params.id);
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/experiments/:id/lift - Get lift analysis
 */
router.get(
  '/experiments/:id/lift',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const analysis = await geoAnalysisService.getLiftAnalysis(req.params.id);
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/experiments/:id/recalculate - Recalculate all results
 */
router.post(
  '/experiments/:id/recalculate',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await geoAnalysisService.recalculateAll(req.params.id);
      res.json({
        success: true,
        message: `Recalculated ${count} market results`,
        count
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== SUMMARY ====================

/**
 * GET /api/experiments/:id/summary - Get experiment summary
 */
router.get(
  '/experiments/:id/summary',
  internalServiceAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await experimentService.getSummary(req.params.id);
      if (!summary) {
        return res.status(404).json({
          success: false,
          error: 'Experiment not found'
        });
      }

      const [treatmentSummary, controlSummary] = await Promise.all([
        treatmentService.getSummary(req.params.id),
        controlService.getSummary(req.params.id)
      ]);

      res.json({
        success: true,
        data: {
          ...summary,
          treatment: treatmentSummary,
          control: controlSummary
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;