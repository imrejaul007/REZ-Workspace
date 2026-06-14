import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { register, metricsRouter, campaignMetrics } from './utils/metrics';
import logger from 'utils/logger.js';
import { authMiddleware, rateLimitMiddleware } from './middleware';
import {
  campaignService,
  decisionEngine,
  optimizationService,
  constraintService,
  humanInLoopService,
  CreateCampaignSchema,
  ConstraintInputSchema
} from './services';

// Environment configuration
const PORT = process.env.PORT || 4930;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar-autonomous-growth';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize Express app
const app = express();
const router = Router();

// Middleware
app.use(express.json());
app.use(rateLimitMiddleware(1000, 60000));

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'autonomous-growth-orchestrator',
    port: PORT,
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      redis: 'connected' // Redis status would be checked separately
    }
  });
});

// Metrics endpoint
app.get('/metrics', metricsRouter);

// ============================================
// CAMPAIGN MANAGEMENT ROUTES
// ============================================

// Create autonomous campaign
router.post('/api/campaigns', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validationResult = CreateCampaignSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validationResult.error.errors
      });
    }

    const campaign = await campaignService.createCampaign(validationResult.data);

    logger.info('Campaign created via API', { campaignId: campaign._id });

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    logger.error('Failed to create campaign', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Get campaign by ID
router.get('/api/campaigns/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.getCampaign(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    logger.error('Failed to get campaign', { error: error.message, campaignId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// List campaigns
router.get('/api/campaigns', authMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = {
      advertiserId: req.query.advertiserId as string,
      status: req.query.status as string,
      autonomousMode: req.query.autonomousMode === 'true' ? true : req.query.autonomousMode === 'false' ? false : undefined,
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0
    };

    const result = await campaignService.listCampaigns(filters);

    res.json({
      success: true,
      data: result.campaigns,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset
      }
    });
  } catch (error: any) {
    logger.error('Failed to list campaigns', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Start autonomous mode
router.post('/api/campaigns/:id/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.startAutonomousMode(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    logger.info('Autonomous mode started via API', { campaignId: campaign._id });

    res.json({
      success: true,
      message: 'Autonomous mode started',
      data: campaign
    });
  } catch (error: any) {
    logger.error('Failed to start autonomous mode', { error: error.message, campaignId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Pause autonomous mode
router.post('/api/campaigns/:id/pause', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.pauseAutonomousMode(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    logger.info('Autonomous mode paused via API', { campaignId: campaign._id });

    res.json({
      success: true,
      message: 'Autonomous mode paused',
      data: campaign
    });
  } catch (error: any) {
    logger.error('Failed to pause autonomous mode', { error: error.message, campaignId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// ============================================
// AI DECISIONS ROUTES
// ============================================

// Get AI decisions for campaign
router.get('/api/campaigns/:id/decisions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const decisions = await decisionEngine.getDecisions(req.params.id, {
      approved: req.query.approved === 'true' ? true : req.query.approved === 'false' ? false : undefined,
      executed: req.query.executed === 'true' ? true : req.query.executed === 'false' ? false : undefined,
      limit: parseInt(req.query.limit as string) || 50
    });

    res.json({
      success: true,
      data: decisions,
      count: decisions.length
    });
  } catch (error: any) {
    logger.error('Failed to get decisions', { error: error.message, campaignId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Trigger AI decision analysis
router.post('/api/campaigns/:id/analyze', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.getCampaign(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    const decisions = await decisionEngine.analyzeAndDecide({
      campaign,
      performance: campaign.performance
    });

    const savedDecisions = await decisionEngine.createDecisions(req.params.id, decisions);

    logger.info('AI analysis triggered', { campaignId: req.params.id, decisionsCount: decisions.length });

    res.json({
      success: true,
      message: 'Analysis complete',
      data: {
        decisions: savedDecisions,
        count: savedDecisions.length,
        pendingApprovals: savedDecisions.filter((d: any) => !d.approved).length
      }
    });
  } catch (error: any) {
    logger.error('Failed to analyze campaign', { error: error.message, campaignId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// ============================================
// OPTIMIZATION ROUTES
// ============================================

// Get optimization history
router.get('/api/campaigns/:id/optimizations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const optimizations = await optimizationService.getOptimizationHistory(req.params.id, {
      limit: parseInt(req.query.limit as string) || 50,
      type: req.query.type as string
    });

    res.json({
      success: true,
      data: optimizations,
      count: optimizations.length
    });
  } catch (error: any) {
    logger.error('Failed to get optimizations', { error: error.message, campaignId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Trigger optimization cycle
router.post('/api/optimization/cycle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await optimizationService.runOptimizationCycle();

    logger.info('Optimization cycle triggered', result);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to run optimization cycle', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// ============================================
// CONSTRAINT ROUTES
// ============================================

// Set constraints for campaign
router.post('/api/campaigns/:id/constraints', authMiddleware, async (req: Request, res: Response) => {
  try {
    const isBulk = Array.isArray(req.body);
    const input = isBulk ? req.body : [req.body];

    // Validate each constraint
    for (const constraint of input) {
      const validationResult = ConstraintInputSchema.safeParse(constraint);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation Error',
          details: validationResult.error.errors
        });
      }
    }

    const created = isBulk
      ? await constraintService.bulkAddConstraints(req.params.id, input)
      : [await constraintService.addConstraint(req.params.id, input[0])];

    logger.info('Constraints set', { campaignId: req.params.id, count: created.length });

    res.json({
      success: true,
      data: created,
      count: created.length
    });
  } catch (error: any) {
    logger.error('Failed to set constraints', { error: error.message, campaignId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Get campaign constraints
router.get('/api/campaigns/:id/constraints', authMiddleware, async (req: Request, res: Response) => {
  try {
    const constraints = await constraintService.getConstraints(
      req.params.id,
      req.query.activeOnly !== 'false'
    );

    res.json({
      success: true,
      data: constraints,
      count: constraints.length
    });
  } catch (error: any) {
    logger.error('Failed to get constraints', { error: error.message, campaignId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Delete constraint
router.delete('/api/campaigns/:id/constraints/:constraintId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await constraintService.removeConstraint(req.params.constraintId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Constraint not found'
      });
    }

    res.json({
      success: true,
      message: 'Constraint removed'
    });
  } catch (error: any) {
    logger.error('Failed to remove constraint', { error: error.message, constraintId: req.params.constraintId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// ============================================
// PERFORMANCE ROUTES
// ============================================

// Get live performance
router.get('/api/campaigns/:id/performance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.getCampaign(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    // Get additional metrics
    const [optimizationStats, constraintStats] = await Promise.all([
      optimizationService.getOptimizationStats(req.params.id),
      constraintService.getConstraintStats(req.params.id)
    ]);

    res.json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          status: campaign.status,
          autonomousMode: campaign.autonomousMode
        },
        performance: campaign.performance,
        objectives: campaign.objectives,
        budget: campaign.budget,
        optimization: optimizationStats,
        constraints: constraintStats,
        lastOptimization: campaign.lastOptimization,
        nextOptimization: campaign.nextOptimization
      }
    });
  } catch (error: any) {
    logger.error('Failed to get performance', { error: error.message, campaignId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// ============================================
// HUMAN-IN-THE-LOOP ROUTES
// ============================================

// Get recommendations requiring approval
router.get('/api/campaigns/:id/recommendations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const recommendations = await humanInLoopService.getRecommendations(req.params.id);

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });
  } catch (error: any) {
    logger.error('Failed to get recommendations', { error: error.message, campaignId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Approve recommendation
router.post('/api/campaigns/:id/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { decisionId, notes } = req.body;

    if (!decisionId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'decisionId is required'
      });
    }

    const approvedBy = req.headers['x-user-id'] as string || 'system';
    const result = await humanInLoopService.approveRecommendation(decisionId, approvedBy, notes);

    if (!result.success) {
      return res.status(400).json({
        error: 'Approval Failed',
        message: result.error
      });
    }

    logger.info('Recommendation approved', { decisionId, approvedBy });

    res.json({
      success: true,
      message: 'Recommendation approved',
      data: result.decision
    });
  } catch (error: any) {
    logger.error('Failed to approve recommendation', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Reject recommendation
router.post('/api/campaigns/:id/reject', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { decisionId, reason } = req.body;

    if (!decisionId || !reason) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'decisionId and reason are required'
      });
    }

    const rejectedBy = req.headers['x-user-id'] as string || 'system';
    const result = await humanInLoopService.rejectRecommendation(decisionId, rejectedBy, reason);

    if (!result.success) {
      return res.status(400).json({
        error: 'Rejection Failed',
        message: result.error
      });
    }

    logger.info('Recommendation rejected', { decisionId, rejectedBy, reason });

    res.json({
      success: true,
      message: 'Recommendation rejected'
    });
  } catch (error: any) {
    logger.error('Failed to reject recommendation', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// ============================================
// DASHBOARD ROUTES
// ============================================

// Get orchestrator dashboard
router.get('/api/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const [
      campaignStats,
      pendingApprovals,
      optimizationStats,
      constraintStats
    ] = await Promise.all([
      campaignService.getCampaignStats(),
      humanInLoopService.getPendingCount(),
      optimizationService.getOptimizationStats(),
      constraintService.getConstraintStats()
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalCampaigns: campaignStats.total,
          activeCampaigns: campaignStats.active,
          totalBudget: campaignStats.totalBudget,
          averageROAS: campaignStats.averageROAS
        },
        pendingApprovals,
        optimization: optimizationStats,
        constraints: constraintStats
      }
    });
  } catch (error: any) {
    logger.error('Failed to get dashboard', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Get pending approvals across all campaigns
router.get('/api/approvals', authMiddleware, async (req: Request, res: Response) => {
  try {
    const pending = await decisionEngine.getPendingApprovals();

    res.json({
      success: true,
      data: pending,
      count: pending.length
    });
  } catch (error: any) {
    logger.error('Failed to get pending approvals', { error: error.message });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// ============================================
// MONGOOSE MODELS INDEX
// ============================================

// Initialize database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// Initialize Redis connection
async function connectRedis(): Promise<ReturnType<typeof createClient> | null> {
  try {
    const client = createClient({ url: REDIS_URL });
    await client.connect();
    logger.info('Connected to Redis', { url: REDIS_URL });
    return client;
  } catch (error) {
    logger.warn('Failed to connect to Redis, continuing without cache', { error });
    return null;
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis (optional)
    const redisClient = await connectRedis();

    // Mount router
    app.use(router);

    // Start listening
    app.listen(PORT, () => {
      logger.info(`Autonomous Growth Orchestrator started on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`Dashboard: http://localhost:${PORT}/api/dashboard`);
    });

    // Update metrics
    const stats = await campaignService.getCampaignStats();
    campaignMetrics.totalCampaigns.set({ status: 'total' }, stats.total);
    campaignMetrics.activeCampaigns.set(stats.active);
    campaignMetrics.budgetAllocated.set(stats.totalBudget);
    campaignMetrics.averageROAS.set(stats.averageROAS);

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;