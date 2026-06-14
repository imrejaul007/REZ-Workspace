/**
 * REZ Atlas v2 - Pipeline Service
 * Visual Pipeline Management
 * Production-ready with MongoDB, Winston logging, and security middleware
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { connectDatabase, disconnectDatabase, logger } from './database.js';
import { securityMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler, asyncHandler, NotFoundError, sendSuccess, ValidationError } from './middleware/errorHandler.js';
import { Pipeline, PipelineDeal } from './models/Pipeline.js';

const app = express();
const PORT = process.env.PORT || 5181;

// Default pipeline stages
const defaultStages = [
  { id: 'discovery', name: 'Discovery', order: 1, probability: 20, color: '#6366f1' },
  { id: 'qualification', name: 'Qualification', order: 2, probability: 40, color: '#8b5cf6' },
  { id: 'proposal', name: 'Proposal', order: 3, probability: 60, color: '#ec4899' },
  { id: 'negotiation', name: 'Negotiation', order: 4, probability: 80, color: '#f59e0b' },
  { id: 'closed_won', name: 'Closed Won', order: 5, probability: 100, color: '#10b981' },
  { id: 'closed_lost', name: 'Closed Lost', order: 6, probability: 0, color: '#ef4444' }
];

// Middleware
app.use(express.json());
app.use(securityMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request completed', { method: req.method, path: req.path, statusCode: res.statusCode, duration: Date.now() - start, requestId: (req as any).requestId });
  });
  next();
});

// ================================================
// Health Check Endpoints
// ================================================
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'atlas-pipeline', version: '2.0.0', timestamp: new Date().toISOString() }));
app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req, res) => {
  try {
    const count = await Pipeline.countDocuments().maxTimeMS(2000);
    res.json({ status: 'ready', database: 'connected', pipelines: count });
  } catch (error) {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// ================================================
// Pipeline API
// ================================================
app.get('/api/pipelines', asyncHandler(async (req, res) => {
  const pipelines = await Pipeline.find().sort({ isDefault: -1, createdAt: -1 });
  sendSuccess(res, { pipelines, count: pipelines.length }, 'Pipelines retrieved');
}));

app.post('/api/pipelines', asyncHandler(async (req, res) => {
  const { name, stages } = req.body;
  if (!name) throw new ValidationError('name is required');

  const pipeline = new Pipeline({
    name,
    stages: stages || defaultStages,
    isDefault: false
  });
  await pipeline.save();
  logger.info('Pipeline created', { pipelineId: pipeline._id, name });
  res.status(201).json({ success: true, data: pipeline });
}));

app.get('/api/pipelines/:id', asyncHandler(async (req, res) => {
  const pipeline = await Pipeline.findById(req.params.id);
  if (!pipeline) throw new NotFoundError('Pipeline');

  const deals = await PipelineDeal.find({ pipelineId: pipeline._id.toString() }).sort({ position: 1 });

  const stagesWithDeals = pipeline.stages.map(stage => ({
    ...stage,
    deals: deals.filter(d => d.stageId === stage.id)
  }));

  sendSuccess(res, { pipeline, stages: stagesWithDeals, dealCount: deals.length }, 'Pipeline retrieved');
}));

app.post('/api/pipelines/:id/deals', asyncHandler(async (req, res) => {
  const pipeline = await Pipeline.findById(req.params.id);
  if (!pipeline) throw new NotFoundError('Pipeline');

  const { opportunityId, stageId, value } = req.body;
  if (!opportunityId) throw new ValidationError('opportunityId is required');

  const stageDeals = await PipelineDeal.find({ pipelineId: pipeline._id.toString(), stageId: stageId || pipeline.stages[0].id });

  const deal = new PipelineDeal({
    opportunityId,
    pipelineId: pipeline._id.toString(),
    stageId: stageId || pipeline.stages[0].id,
    value: value || 0,
    position: stageDeals.length
  });
  await deal.save();
  logger.info('Deal added to pipeline', { dealId: deal._id, pipelineId: pipeline._id });

  res.status(201).json({ success: true, data: deal });
}));

// ================================================
// Deal API
// ================================================
app.post('/api/deals/:id/move', asyncHandler(async (req, res) => {
  const deal = await PipelineDeal.findById(req.params.id);
  if (!deal) throw new NotFoundError('Deal');

  const { stageId, position } = req.body;
  if (!stageId) throw new ValidationError('stageId is required');

  deal.stageId = stageId;
  deal.position = position || 0;
  await deal.save();

  logger.info('Deal moved', { dealId: deal._id, newStageId: stageId });
  sendSuccess(res, deal, 'Deal moved');
}));

app.get('/api/deals', asyncHandler(async (req, res) => {
  const { pipelineId, stageId } = req.query;
  const query: any = {};
  if (pipelineId) query.pipelineId = pipelineId;
  if (stageId) query.stageId = stageId;

  const deals = await PipelineDeal.find(query).sort({ position: 1 });
  sendSuccess(res, { deals, count: deals.length }, 'Deals retrieved');
}));

app.delete('/api/deals/:id', asyncHandler(async (req, res) => {
  const deal = await PipelineDeal.findByIdAndDelete(req.params.id);
  if (!deal) throw new NotFoundError('Deal');

  logger.info('Deal deleted', { dealId: req.params.id });
  sendSuccess(res, { deleted: true }, 'Deal deleted');
}));

// ================================================
// Analytics API
// ================================================
app.get('/api/analytics', asyncHandler(async (req, res) => {
  const pipelines = await Pipeline.find();
  const pipeline = pipelines.find(p => p.isDefault) || pipelines[0];

  if (!pipeline) {
    return sendSuccess(res, { totalDeals: 0, totalValue: 0, weightedValue: 0, byStage: [] }, 'No pipelines found');
  }

  const deals = await PipelineDeal.find({ pipelineId: pipeline._id.toString() });

  const byStage = pipeline.stages.map(stage => ({
    stage: stage.name,
    stageId: stage.id,
    count: deals.filter(d => d.stageId === stage.id).length,
    value: deals.filter(d => d.stageId === stage.id).reduce((sum, d) => sum + d.value, 0)
  }));

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = pipeline.stages.reduce((sum, stage) => {
    return sum + deals.filter(d => d.stageId === stage.id).reduce((s, d) => s + d.value * stage.probability / 100, 0);
  }, 0);

  res.json({
    success: true,
    data: {
      totalDeals: deals.length,
      totalValue,
      weightedValue: Math.round(weightedValue),
      byStage
    }
  });
}));

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ================================================
// Server Start
// ================================================
async function startServer() {
  try {
    await connectDatabase();

    // Seed default pipeline
    const exists = await Pipeline.findOne({ isDefault: true });
    if (!exists) {
      const defaultPipeline = new Pipeline({
        name: 'Sales Pipeline',
        stages: defaultStages,
        isDefault: true
      });
      await defaultPipeline.save();
      logger.info('Default pipeline created');
    }

    logger.info('Database connected, starting server...');

    app.listen(PORT, () => {
      logger.info(`📊 Atlas Pipeline running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        mongodb: process.env.MONGODB_URI ? 'connected' : 'not configured'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => { logger.info('SIGTERM received, shutting down'); await disconnectDatabase(); process.exit(0); });
process.on('SIGINT', async () => { logger.info('SIGINT received, shutting down'); await disconnectDatabase(); process.exit(0); });

startServer();

export default app;