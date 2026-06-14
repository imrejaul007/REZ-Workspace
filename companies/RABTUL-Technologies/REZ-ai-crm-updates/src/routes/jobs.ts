import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UpdateJob, HealthScore, ActivitySummary } from '../models/AiCrmUpdates';
import { AiUpdateService } from '../services/aiUpdateService';

const router = Router();

// Validation schemas
const RunUpdateSchema = z.object({
  updateType: z.enum(['field_enrichment', 'contact_update', 'company_update', 'deal_update',
    'activity_log', 'sentiment_analysis', 'intent_detection', 'health_score', 'next_action']),
  targetEntity: z.enum(['contact', 'company', 'deal']),
  targetId: z.string(),
  aiConfig: z.object({
    model: z.enum(['openai', 'anthropic', 'internal', 'rule_based']).optional(),
    prompt: z.string().optional()
  }).optional()
});

// Run manual update
router.post('/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = RunUpdateSchema.parse(req.body);
    const tenantId = req.headers['x-tenant-id'] as string;

    // Create a temporary rule for this update
    const job = new UpdateJob({
      tenantId,
      jobType: 'manual',
      updateType: data.updateType,
      targetEntity: data.targetEntity,
      targetId: data.targetId,
      status: 'processing',
      startedAt: new Date(),
      createdBy: req.headers['x-user-id'] as string || 'system'
    });

    await job.save();

    // Process based on update type
    const updates: { field: string; oldValue?: unknown; newValue?: unknown; source: 'ai' | 'enrichment' | 'rule' | 'manual'; confidence?: number }[] = [];

    switch (data.updateType) {
      case 'health_score':
        // Simulate health score calculation
        const score = Math.floor(Math.random() * 40) + 50;
        updates.push({
          field: 'health_score',
          newValue: score,
          source: 'ai',
          confidence: 0.85
        });

        // Save health score record
        await HealthScore.create({
          tenantId,
          entityType: data.targetEntity,
          entityId: data.targetId,
          score,
          components: [
            { name: 'engagement', score: Math.floor(Math.random() * 30) + 20, weight: 0.4, reason: 'Based on activity' },
            { name: 'recency', score: Math.floor(Math.random() * 30) + 20, weight: 0.3, reason: 'Based on last contact' },
            { name: 'quality', score: Math.floor(Math.random() * 30) + 20, weight: 0.3, reason: 'Based on interaction quality' }
          ],
          positiveFactors: ['Recent activity'],
          negativeFactors: [],
          riskFactors: [],
          period: 'weekly',
          periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          periodEnd: new Date()
        });
        break;

      case 'sentiment_analysis':
        const sentiments = ['positive', 'neutral', 'negative'] as const;
        const sentiment = sentiments[Math.floor(Math.random() * 3)];
        const sentimentScore = sentiment === 'positive' ? 0.6 : sentiment === 'negative' ? -0.4 : 0.1;
        updates.push({
          field: 'ai_sentiment',
          newValue: sentiment,
          source: 'ai',
          confidence: 0.8
        });
        updates.push({
          field: 'ai_sentiment_score',
          newValue: sentimentScore,
          source: 'ai',
          confidence: 0.8
        });
        break;

      case 'next_action':
        const actions = ['Schedule follow-up call', 'Send relevant case study', 'Propose next steps'];
        const recommendedAction = actions[Math.floor(Math.random() * actions.length)];
        updates.push({
          field: 'ai_recommended_action',
          newValue: recommendedAction,
          source: 'ai',
          confidence: 0.75
        });
        break;

      default:
        updates.push({
          field: 'ai_updated',
          newValue: true,
          source: 'ai',
          confidence: 0.9
        });
    }

    job.updates = updates;
    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();

    res.json({
      success: true,
      data: {
        jobId: job._id,
        updates,
        status: 'completed'
      }
    });
  } catch (error) {
    next(error);
  }
});

// List jobs
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const {
      page = 1,
      limit = 20,
      status,
      updateType,
      targetEntity,
      targetId
    } = req.query;

    const query: Record<string, unknown> = { tenantId };
    if (status) query.status = status;
    if (updateType) query.updateType = updateType;
    if (targetEntity) query.targetEntity = targetEntity;
    if (targetId) query.targetId = targetId;

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      UpdateJob.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      UpdateJob.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: jobs,
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

// Get job
router.get('/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const job = await UpdateJob.findOne({
      _id: req.params.jobId,
      tenantId
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
});

// Get jobs for entity
router.get('/entity/:entityType/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { page = 1, limit = 20 } = req.query;

    const jobs = await AiUpdateService.getUpdateHistory(
      tenantId,
      req.params.entityType,
      req.params.entityId,
      Number(limit)
    );

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
});

// Get health score
router.get('/health-score/:entityType/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { period = 'weekly' } = req.query;

    const scores = await AiUpdateService.getHealthScoreHistory(
      tenantId,
      req.params.entityType,
      req.params.entityId,
      period as 'daily' | 'weekly' | 'monthly'
    );

    res.json({
      success: true,
      data: {
        current: scores[0] || null,
        history: scores
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get activity summary
router.get('/activity-summary/:entityType/:entityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const summary = await AiUpdateService.getActivitySummary(
      tenantId,
      req.params.entityType,
      req.params.entityId
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

// Get stats
router.get('/stats/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const [totalJobs, completedJobs, failedJobs, byUpdateType] = await Promise.all([
      UpdateJob.countDocuments({ tenantId, createdAt: { $gte: startDate } }),
      UpdateJob.countDocuments({ tenantId, status: 'completed', createdAt: { $gte: startDate } }),
      UpdateJob.countDocuments({ tenantId, status: 'failed', createdAt: { $gte: startDate } }),
      UpdateJob.aggregate([
        { $match: { tenantId, createdAt: { $gte: startDate } } },
        { $group: { _id: '$updateType', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        totalJobs,
        completedJobs,
        failedJobs,
        successRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
        byUpdateType: byUpdateType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
