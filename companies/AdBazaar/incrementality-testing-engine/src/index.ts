import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Utils
import { logger, logInfo, logError } from './utils/logger';
import { metrics, recordHttpRequest, metricsRegistry } from './utils/metrics';

// Models
import { Experiment, TestGroup, Result, LiftAnalysis } from './models';

// Services
import {
  experimentService,
  testGroupService,
  liftAnalysisService,
  geoTestService,
  recommendationService
} from './services';

// Types
import {
  ExperimentType,
  ExperimentStatus,
  TestGroupType,
  CreateExperimentRequest,
  UpdateExperimentRequest,
  RunAnalysisRequest,
  CreateGeoTestRequest,
  ApiResponse,
  PaginatedResponse
} from './types';

// Auth middleware
import { authMiddleware, AuthenticatedRequest } from './middleware/auth';

// Create Express app
const app = express();

// Configuration
const PORT = process.env.PORT || 4971;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/incrementality-testing';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    recordHttpRequest(req.method, req.route?.path || req.path, res.statusCode, duration);

    logInfo(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
      ip: req.ip
    });
  });

  next();
});

// Zod validation schemas
const CreateExperimentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  type: z.nativeEnum(ExperimentType),
  targeting: z.object({
    demographics: z.object({
      ageRanges: z.array(z.string()).optional(),
      genders: z.array(z.string()).optional(),
      locations: z.array(z.string()).optional(),
      incomeBrackets: z.array(z.string()).optional()
    }).optional(),
    behavior: z.object({
      interests: z.array(z.string()).optional(),
      purchaseFrequency: z.string().optional(),
      brandAffinity: z.array(z.string()).optional()
    }).optional(),
    geo: z.object({
      countries: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
      cities: z.array(z.string()).optional(),
      postalCodes: z.array(z.string()).optional()
    }).optional(),
    device: z.object({
      types: z.array(z.string()).optional(),
      os: z.array(z.string()).optional()
    }).optional()
  }).optional(),
  budget: z.number().min(0).optional(),
  testGroups: z.array(z.object({
    name: z.string(),
    type: z.nativeEnum(TestGroupType),
    allocation: z.number().min(0).max(100)
  })).optional()
});

const UpdateExperimentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  targeting: z.any().optional(),
  budget: z.number().min(0).optional()
});

const RunAnalysisSchema = z.object({
  confidenceLevel: z.number().min(0).max(1).optional(),
  groupId: z.string().optional()
});

const CreateGeoTestSchema = z.object({
  region: z.string(),
  treatmentRegions: z.array(z.string()),
  controlRegions: z.array(z.string()),
  budget: z.number().min(0),
  duration: z.number().int().min(1),
  targeting: z.any().optional()
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'incrementality-testing-engine',
    port: PORT,
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient?.isOpen ? 'connected' : 'disconnected'
  };

  res.json(health);
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// ==================== EXPERIMENT ROUTES ====================

// Create experiment
app.post('/api/experiments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = CreateExperimentSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const experiment = await experimentService.createExperiment(
      validation.data as CreateExperimentRequest,
      req.userId || 'unknown'
    );

    res.status(201).json({
      success: true,
      data: experiment,
      message: 'Experiment created successfully'
    });
  } catch (error) {
    logError('Failed to create experiment', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create experiment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get experiment by ID
app.get('/api/experiments/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const experiment = await experimentService.getExperiment(req.params.id);

    if (!experiment) {
      res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    logError('Failed to get experiment', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get experiment'
    });
  }
});

// List experiments
app.get('/api/experiments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ExperimentStatus;
    const type = req.query.type as ExperimentType;
    const search = req.query.search as string;

    const result = await experimentService.listExperiments({
      page,
      limit,
      status,
      type,
      search
    });

    res.json({
      success: true,
      data: result.experiments,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logError('Failed to list experiments', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list experiments'
    });
  }
});

// Update experiment
app.put('/api/experiments/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = UpdateExperimentSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const experiment = await experimentService.updateExperiment(
      req.params.id,
      validation.data as UpdateExperimentRequest
    );

    if (!experiment) {
      res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: experiment,
      message: 'Experiment updated successfully'
    });
  } catch (error) {
    logError('Failed to update experiment', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update experiment'
    });
  }
});

// Start experiment
app.post('/api/experiments/:id/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const experiment = await experimentService.startExperiment(req.params.id);

    if (!experiment) {
      res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: experiment,
      message: 'Experiment started successfully'
    });
  } catch (error) {
    logError('Failed to start experiment', error);
    res.status(400).json({
      success: false,
      error: 'Failed to start experiment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Pause experiment
app.post('/api/experiments/:id/pause', authMiddleware, async (req: Request, res: Response) => {
  try {
    const experiment = await experimentService.pauseExperiment(req.params.id);

    if (!experiment) {
      res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: experiment,
      message: 'Experiment paused successfully'
    });
  } catch (error) {
    logError('Failed to pause experiment', error);
    res.status(400).json({
      success: false,
      error: 'Failed to pause experiment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get experiment results
app.get('/api/experiments/:id/results', authMiddleware, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    const groupId = req.query.groupId as string;

    const results = await experimentService.getResults(req.params.id, {
      startDate,
      endDate,
      groupId
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logError('Failed to get experiment results', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get experiment results'
    });
  }
});

// Run analysis
app.post('/api/experiments/:id/analysis', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = RunAnalysisSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const analysis = await liftAnalysisService.runAnalysis(
      req.params.id,
      validation.data as RunAnalysisRequest
    );

    res.json({
      success: true,
      data: analysis,
      message: 'Analysis completed successfully'
    });
  } catch (error) {
    logError('Failed to run analysis', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get lift metrics
app.get('/api/experiments/:id/lift', authMiddleware, async (req: Request, res: Response) => {
  try {
    const liftMetrics = await liftAnalysisService.getLiftMetrics(req.params.id);

    res.json({
      success: true,
      data: liftMetrics
    });
  } catch (error) {
    logError('Failed to get lift metrics', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lift metrics'
    });
  }
});

// Create geo test
app.post('/api/experiments/:id/geotests', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = CreateGeoTestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.errors
      });
      return;
    }

    const experiment = await geoTestService.createGeoTest(
      req.params.id,
      validation.data as CreateGeoTestRequest
    );

    res.status(201).json({
      success: true,
      data: experiment,
      message: 'Geo test created successfully'
    });
  } catch (error) {
    logError('Failed to create geo test', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create geo test',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recommendations
app.get('/api/experiments/:id/recommendations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const generate = req.query.generate === 'true';

    let recommendations;
    if (generate) {
      recommendations = await recommendationService.generateRecommendations(req.params.id);
    } else {
      recommendations = await recommendationService.getRecommendations(req.params.id);
    }

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logError('Failed to get recommendations', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logError('Unhandled error', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Database connection
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logInfo('MongoDB connected successfully', { uri: MONGODB_URI });
  } catch (error) {
    logError('MongoDB connection failed', error);
    throw error;
  }
}

// Redis connection
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: REDIS_URL });

    redisClient.on('error', (err) => {
      logError('Redis error', err);
    });

    redisClient.on('connect', () => {
      logInfo('Redis connected successfully');
    });

    await redisClient.connect();
  } catch (error) {
    logError('Redis connection failed', error);
    // Redis is optional, continue without it
    redisClient = null;
  }
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  logInfo('Shutting down gracefully...');

  try {
    if (redisClient) {
      await redisClient.quit();
    }
    await mongoose.disconnect();
    logInfo('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logError('Error during shutdown', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start Express server
    app.listen(PORT, () => {
      logInfo(`Incrementality Testing Engine started`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development'
      });

      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║          INCREMENTALITY TESTING ENGINE STARTED                ║
╠═══════════════════════════════════════════════════════════════╣
║  Port: ${PORT} ║
║  Environment: ${process.env.NODE_ENV || 'development'}                            ║
║  MongoDB: ${MONGODB_URI}    ║
║  Redis: ${REDIS_URL}                                           ║
╠═══════════════════════════════════════════════════════════════╣
║  Competitor: Nielsen, Meta's lifted                          ║
║  Features: A/B Testing, Holdout Groups, Geo Experiments ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

startServer();

export default app;