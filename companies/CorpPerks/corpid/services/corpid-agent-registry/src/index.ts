/**
 * CorpID Agent Registry Service
 * Manages AI agents, capabilities, and provides capability matching for Sutar
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, model } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
}));

// Config
const PORT = parseInt(process.env.PORT || '4708', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token';

function generateId(prefix: string = 'AGT'): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.headers['x-internal-token'] === INTERNAL_TOKEN) return next();
  next(); // For development
}

// ============================================================================
// MONGODB SCHEMAS
// ============================================================================

// Agent Schema
const agentSchema = new Schema({
  agentId: { type: String, required: true, unique: true, index: true },
  corpId: { type: String, required: true, index: true }, // CI-AGT-XXXXX

  // Basic Info
  name: { type: String, required: true },
  description: String,
  version: String,
  agentType: {
    type: String,
    enum: ['SPECIALIZED', 'GENERALIST', 'ORCHESTRATOR'],
    default: 'SPECIALIZED',
  },

  // Status
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'DEPRECATED', 'MAINTENANCE'],
    default: 'ACTIVE',
  },

  // Capabilities (what the agent can do)
  capabilities: [{
    id: String,
    name: { type: String, required: true },
    description: String,
    category: String,
    inputTypes: [String],
    outputTypes: [String],
    keywords: [String], // For search/matching
    trust: {
      level: { type: Number, default: 0.5 },
      evidenceCount: { type: Number, default: 0 },
      lastVerified: Date,
    },
  }],

  // Tools (what the agent can use)
  tools: [{
    id: String,
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    config: Schema.Types.Mixed,
    permissions: [String],
  }],

  // Integration
  integrations: [{
    id: String,
    service: String,
    endpoint: String,
    authType: String,
    enabled: { type: Boolean, default: true },
  }],

  // Permissions
  permissions: {
    dataAccess: [String],
    actionAccess: [String],
    escalationRules: [{
      condition: String,
      action: String,
      target: String,
    }],
  },

  // Cost Profile
  costProfile: {
    perInvocation: Number,
    perTokenInput: Number,
    perTokenOutput: Number,
    monthlyBudget: Number,
    currency: { type: String, default: 'USD' },
  },

  // Performance Metrics
  metrics: {
    totalInvocations: { type: Number, default: 0 },
    successfulInvocations: { type: Number, default: 0 },
    failedInvocations: { type: Number, default: 0 },
    avgResponseTime: Number,
    avgAccuracy: Number,
    uptimePercent: { type: Number, default: 100 },
    lastInvokedAt: Date,
    lastErrorAt: Date,
  },

  // Trust & Reputation
  trust: {
    overallScore: { type: Number, default: 0.5 },
    humanRatings: {
      count: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      recent: [{
        rating: Number,
        comment: String,
        ratedBy: String,
        ratedAt: Date,
      }],
    },
    automatedScore: Number,
    lastComputed: Date,
  },

  // Ownership
  ownerId: String, // CorpID of owner (Human or Organization)
  teamId: String,

  // Limits
  limits: {
    maxConcurrentInvocations: { type: Number, default: 10 },
    rateLimitPerMinute: { type: Number, default: 60 },
    timeoutMs: { type: Number, default: 30000 },
  },

  // Scheduling
  availability: {
    timezone: { type: String, default: 'Asia/Kolkata' },
    schedule: [{
      day: String,
      startTime: String,
      endTime: String,
      enabled: { type: Boolean, default: true },
    }],
  },

  // Metadata
  metadata: Schema.Types.Mixed,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deprecatedAt: Date,
}, { timestamps: true });

// Compound indexes
agentSchema.index({ status: 1, agentType: 1 });
agentSchema.index({ 'capabilities.name': 1 });
agentSchema.index({ ownerId: 1 });
agentSchema.index({ 'trust.overallScore': -1 });

const Agent = model('Agent', agentSchema);

// Agent Invocation Log Schema
const invocationLogSchema = new Schema({
  logId: { type: String, required: true, unique: true, index: true },
  agentId: { type: String, required: true, index: true },
  corpId: String, // Caller's CorpID

  // Invocation details
  input: Schema.Types.Mixed,
  output: Schema.Types.Mixed,
  error: String,

  // Timing
  startedAt: Date,
  completedAt: Date,
  durationMs: Number,

  // Result
  success: Boolean,
  accuracy: Number, // If evaluable

  // Cost
  tokensUsed: {
    input: Number,
    output: Number,
  },
  cost: Number,

  // Rating (if provided)
  rating: Number,
  feedback: String,
}, { timestamps: true });

invocationLogSchema.index({ agentId: 1, startedAt: -1 });
invocationLogSchema.index({ corpId: 1, startedAt: -1 });

const InvocationLog = model('InvocationLog', invocationLogSchema);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'corpid-agent-registry',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// AGENT CRUD
// ============================================================================

/**
 * Register a new agent
 * POST /agents
 */
app.post('/agents',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        corpId, name, description, version, agentType,
        capabilities, tools, permissions, costProfile, ownerId,
        limits, metadata
      } = req.body;

      if (!corpId || !name) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'corpId and name are required' },
        });
      }

      // Check if agent with this corpId already exists
      const existing = await Agent.findOne({ corpId });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: { code: 'ALREADY_EXISTS', message: 'Agent with this CorpID already exists' },
        });
      }

      const agent = new Agent({
        agentId: generateId('REG'),
        corpId,
        name,
        description,
        version,
        agentType: agentType || 'SPECIALIZED',
        capabilities: capabilities?.map((c: any) => ({
          id: generateId('CAP'),
          ...c,
          trust: { level: 0.5, evidenceCount: 0 },
        })) || [],
        tools: tools?.map((t: any) => ({
          id: generateId('TOL'),
          ...t,
        })) || [],
        permissions,
        costProfile,
        ownerId,
        limits,
        metadata,
      });

      await agent.save();

      res.status(201).json({
        success: true,
        data: {
          agentId: agent.agentId,
          corpId: agent.corpId,
          name: agent.name,
          agentType: agent.agentType,
          status: agent.status,
        },
      });
    } catch (error: any) {
      logger.error('Error registering agent:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to register agent' },
      });
    }
  }
);

/**
 * Get agent by CorpID
 * GET /agents/:corpId
 */
app.get('/agents/:corpId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;

      const agent = await Agent.findOne({ corpId }).lean();

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Agent not found' },
        });
      }

      res.json({
        success: true,
        data: {
          agentId: agent.agentId,
          corpId: agent.corpId,
          name: agent.name,
          description: agent.description,
          version: agent.version,
          agentType: agent.agentType,
          status: agent.status,
          capabilities: agent.capabilities,
          tools: agent.tools,
          permissions: agent.permissions,
          costProfile: agent.costProfile,
          metrics: agent.metrics,
          trust: agent.trust,
          ownerId: agent.ownerId,
          limits: agent.limits,
          createdAt: agent.createdAt,
        },
      });
    } catch (error) {
      logger.error('Error fetching agent:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch agent' },
      });
    }
  }
);

/**
 * Update agent
 * PATCH /agents/:corpId
 */
app.patch('/agents/:corpId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;
      const updates = req.body;

      // Don't allow direct trust/metrics updates via this endpoint
      delete updates.metrics;
      delete updates.trust;

      const agent = await Agent.findOneAndUpdate(
        { corpId },
        { $set: { ...updates, updatedAt: new Date() } },
        { new: true }
      );

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Agent not found' },
        });
      }

      res.json({
        success: true,
        data: {
          agentId: agent.agentId,
          corpId: agent.corpId,
          name: agent.name,
          status: agent.status,
          updatedAt: agent.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Error updating agent:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update agent' },
      });
    }
  }
);

/**
 * Deprecate agent
 * DELETE /agents/:corpId
 */
app.delete('/agents/:corpId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;
      const { permanent } = req.query;

      if (permanent === 'true') {
        await Agent.deleteOne({ corpId });
      } else {
        await Agent.findOneAndUpdate(
          { corpId },
          {
            $set: {
              status: 'DEPRECATED',
              deprecatedAt: new Date(),
              updatedAt: new Date(),
            },
          }
        );
      }

      res.json({
        success: true,
        data: { deprecated: true, permanent: permanent === 'true' },
      });
    } catch (error) {
      logger.error('Error deprecating agent:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to deprecate agent' },
      });
    }
  }
);

// ============================================================================
// CAPABILITY MATCHING (For Sutar)
// ============================================================================

/**
 * Find agents by capability
 * GET /agents/find
 */
app.get('/agents/find',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        capability, agentType, status, minTrust, maxCost,
        page = 1, limit = 20
      } = req.query;

      const filter: any = { status: 'ACTIVE' };
      if (status) filter.status = status;
      if (agentType) filter.agentType = agentType;

      let agents = await Agent.find(filter)
        .lean();

      // Filter by capability (case-insensitive search)
      if (capability) {
        const capLower = (capability as string).toLowerCase();
        agents = agents.filter(a =>
          a.capabilities.some(c =>
            c.name.toLowerCase().includes(capLower) ||
            c.keywords?.some((k: string) => k.toLowerCase().includes(capLower)) ||
            c.category?.toLowerCase().includes(capLower)
          )
        );
      }

      // Filter by minimum trust
      if (minTrust) {
        agents = agents.filter(a =>
          a.trust?.overallScore >= parseFloat(minTrust as string)
        );
      }

      // Calculate effective cost and filter
      if (maxCost) {
        const maxCostNum = parseFloat(maxCost as string);
        agents = agents.filter(a => {
          const costPerInvocation = a.costProfile?.perInvocation || 0;
          return costPerInvocation <= maxCostNum;
        });
      }

      // Sort by relevance (trust score * capability match)
      agents.sort((a, b) => {
        const aTrust = a.trust?.overallScore || 0.5;
        const bTrust = b.trust?.overallScore || 0.5;
        const aMetrics = a.metrics?.avgAccuracy || 0.5;
        const bMetrics = b.metrics?.avgAccuracy || 0.5;
        return (bTrust * bMetrics) - (aTrust * aMetrics);
      });

      // Paginate
      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100);
      const skip = (pageNum - 1) * limitNum;
      const paginated = agents.slice(skip, skip + limitNum);

      res.json({
        success: true,
        data: {
          items: paginated.map(a => ({
            corpId: a.corpId,
            name: a.name,
            agentType: a.agentType,
            status: a.status,
            capabilities: a.capabilities.map(c => ({
              name: c.name,
              category: c.category,
              trust: c.trust,
            })),
            costProfile: a.costProfile,
            trust: a.trust,
            metrics: {
              totalInvocations: a.metrics.totalInvocations,
              avgAccuracy: a.metrics.avgAccuracy,
              uptimePercent: a.metrics.uptimePercent,
            },
          })),
          total: agents.length,
          page: pageNum,
          pageSize: limitNum,
          totalPages: Math.ceil(agents.length / limitNum),
        },
      });
    } catch (error) {
      logger.error('Error finding agents:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to find agents' },
      });
    }
  }
);

/**
 * Match agents for a task (advanced matching)
 * POST /agents/match
 */
app.post('/agents/match',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const {
        task, requiredCapabilities, preferredAgentType,
        maxCost, maxResponseTime, callerCorpId
      } = req.body;

      if (!task && (!requiredCapabilities || requiredCapabilities.length === 0)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'task or requiredCapabilities is required' },
        });
      }

      // Get all active agents
      const agents = await Agent.find({ status: 'ACTIVE' }).lean();

      // Score each agent
      const scoredAgents = agents.map(agent => {
        let score = 0;
        const matchedCapabilities = [];
        const missingCapabilities = [];

        // Capability matching
        if (requiredCapabilities && requiredCapabilities.length > 0) {
          for (const reqCap of requiredCapabilities) {
            const reqCapLower = reqCap.toLowerCase();
            const match = agent.capabilities.find(c =>
              c.name.toLowerCase().includes(reqCapLower) ||
              c.keywords?.some((k: string) => k.toLowerCase().includes(reqCapLower))
            );

            if (match) {
              matchedCapabilities.push({
                required: reqCap,
                found: match.name,
                trust: match.trust?.level || 0.5,
              });
              score += (match.trust?.level || 0.5) * 20; // Weight by trust
            } else {
              missingCapabilities.push(reqCap);
              score -= 10; // Penalty for missing capability
            }
          }
        }

        // Agent type matching
        if (preferredAgentType) {
          if (agent.agentType === preferredAgentType) {
            score += 15;
          } else if (
            preferredAgentType === 'SPECIALIZED' &&
            agent.agentType === 'ORCHESTRATOR'
          ) {
            score += 5; // Orchestrator can often do specialized work
          }
        }

        // Cost factor (lower is better)
        const costPerInvocation = agent.costProfile?.perInvocation || 0;
        if (maxCost && costPerInvocation <= maxCost) {
          score += 10 * (1 - costPerInvocation / maxCost);
        }

        // Response time factor
        const avgResponseTime = agent.metrics?.avgResponseTime || 5000;
        if (maxResponseTime && avgResponseTime <= maxResponseTime) {
          score += 10 * (1 - avgResponseTime / maxResponseTime);
        }

        // Trust factor
        score += (agent.trust?.overallScore || 0.5) * 15;

        // Accuracy factor
        score += (agent.metrics?.avgAccuracy || 0.5) * 10;

        return {
          agent,
          score: Math.round(score * 100) / 100,
          matchedCapabilities,
          missingCapabilities,
          costPerInvocation,
          avgResponseTime,
        };
      });

      // Sort by score
      scoredAgents.sort((a, b) => b.score - a.score);

      // Return top matches
      const topMatches = scoredAgents.slice(0, 10);

      res.json({
        success: true,
        data: {
          task,
          recommendedAgent: topMatches[0] ? {
            corpId: topMatches[0].agent.corpId,
            name: topMatches[0].agent.name,
            score: topMatches[0].score,
            reason: `Matches ${topMatches[0].matchedCapabilities.length} required capabilities`,
          } : null,
          alternatives: topMatches.slice(1, 5).map(a => ({
            corpId: a.agent.corpId,
            name: a.agent.name,
            score: a.score,
          })),
          allMatches: topMatches,
        },
      });
    } catch (error) {
      logger.error('Error matching agents:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to match agents' },
      });
    }
  }
);

// ============================================================================
// METRICS & MONITORING
// ============================================================================

/**
 * Log agent invocation
 * POST /agents/:corpId/invoke
 */
app.post('/agents/:corpId/invoke',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;
      const { input, callerCorpId, idempotencyKey } = req.body;

      const agent = await Agent.findOne({ corpId, status: 'ACTIVE' });

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Agent not found or inactive' },
        });
      }

      // Check rate limit
      const rateLimitPerMinute = agent.limits?.rateLimitPerMinute || 60;
      const recentInvocations = await InvocationLog.countDocuments({
        agentId: agent.agentId,
        startedAt: { $gte: new Date(Date.now() - 60000) },
      });

      if (recentInvocations >= rateLimitPerMinute) {
        return res.status(429).json({
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Agent rate limit exceeded' },
        });
      }

      // Create invocation log
      const log = new InvocationLog({
        logId: idempotencyKey || generateId('INV'),
        agentId: agent.agentId,
        corpId: callerCorpId,
        input,
        startedAt: new Date(),
      });

      await log.save();

      // Increment invocations counter
      await Agent.findOneAndUpdate(
        { corpId },
        {
          $inc: { 'metrics.totalInvocations': 1 },
          $set: { 'metrics.lastInvokedAt': new Date() },
        }
      );

      res.json({
        success: true,
        data: {
          invocationId: log.logId,
          agentCorpId: corpId,
          status: 'INVOKED',
        },
      });
    } catch (error) {
      logger.error('Error invoking agent:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to invoke agent' },
      });
    }
  }
);

/**
 * Complete invocation (update with result)
 * POST /invocations/:logId/complete
 */
app.post('/invocations/:logId/complete',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { logId } = req.params;
      const { output, error, success, accuracy, tokensUsed, cost } = req.body;

      const log = await InvocationLog.findOne({ logId });

      if (!log) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invocation not found' },
        });
      }

      log.output = output;
      log.error = error;
      log.success = success !== false;
      log.accuracy = accuracy;
      log.tokensUsed = tokensUsed;
      log.cost = cost;
      log.completedAt = new Date();
      log.durationMs = log.completedAt.getTime() - log.startedAt.getTime();

      await log.save();

      // Update agent metrics
      const updateOps: any = {
        $set: {
          'metrics.lastInvokedAt': new Date(),
        },
      };

      if (success) {
        updateOps.$inc = { 'metrics.successfulInvocations': 1 };
      } else {
        updateOps.$set['metrics.lastErrorAt'] = new Date();
        updateOps.$inc = { 'metrics.failedInvocations': 1 };
      }

      // Update average response time
      const avgRt = log.agent.metrics?.avgResponseTime || log.durationMs;
      updateOps.$set['metrics.avgResponseTime'] =
        (avgRt * (log.agent.metrics.totalInvocations - 1) + log.durationMs) /
        log.agent.metrics.totalInvocations;

      await Agent.findOneAndUpdate({ agentId: log.agentId }, updateOps);

      res.json({
        success: true,
        data: {
          invocationId: log.logId,
          success: log.success,
          durationMs: log.durationMs,
        },
      });
    } catch (error) {
      logger.error('Error completing invocation:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to complete invocation' },
      });
    }
  }
);

/**
 * Rate an agent invocation
 * POST /invocations/:logId/rate
 */
app.post('/invocations/:logId/rate',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { logId } = req.params;
      const { rating, feedback, ratedBy } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'rating must be 1-5' },
        });
      }

      const log = await InvocationLog.findOne({ logId });

      if (!log) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invocation not found' },
        });
      }

      log.rating = rating;
      log.feedback = feedback;
      await log.save();

      // Update agent's human ratings
      const agent = await Agent.findOne({ agentId: log.agentId });

      if (agent) {
        const currentCount = agent.trust.humanRatings.count;
        const currentAverage = agent.trust.humanRatings.average;

        const newAverage = (currentAverage * currentCount + rating) / (currentCount + 1);

        await Agent.findOneAndUpdate(
          { agentId: log.agentId },
          {
            $push: {
              'trust.humanRatings.recent': {
                rating,
                comment: feedback,
                ratedBy,
                ratedAt: new Date(),
              },
            },
            $set: {
              'trust.humanRatings.count': currentCount + 1,
              'trust.humanRatings.average': Math.round(newAverage * 100) / 100,
            },
          }
        );

        // Keep only last 20 recent ratings
        await Agent.findOneAndUpdate(
          { agentId: log.agentId },
          {
            $push: {
              'trust.humanRatings.recent': { $each: [], $slice: -20 },
            },
          }
        );
      }

      res.json({
        success: true,
        data: { rating, feedback },
      });
    } catch (error) {
      logger.error('Error rating invocation:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to rate invocation' },
      });
    }
  }
);

/**
 * Get agent metrics
 * GET /agents/:corpId/metrics
 */
app.get('/agents/:corpId/metrics',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;
      const { period } = req.query;

      const agent = await Agent.findOne({ corpId }).lean();

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Agent not found' },
        });
      }

      // Calculate time filter
      let timeFilter = {};
      if (period) {
        const periods: Record<string, number> = {
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
        };
        const ms = periods[period as string] || periods.month;
        timeFilter = { startedAt: { $gte: new Date(Date.now() - ms) } };
      }

      // Get recent invocations for detailed stats
      const recentLogs = await InvocationLog.find({
        agentId: agent.agentId,
        ...timeFilter,
      }).lean();

      const total = recentLogs.length;
      const successful = recentLogs.filter(l => l.success).length;
      const failed = recentLogs.filter(l => !l.success).length;
      const avgDuration = total > 0
        ? recentLogs.reduce((sum, l) => sum + (l.durationMs || 0), 0) / total
        : 0;
      const avgAccuracy = total > 0
        ? recentLogs.filter(l => l.accuracy).reduce((sum, l) => sum + (l.accuracy || 0), 0) / total
        : null;
      const totalCost = recentLogs.reduce((sum, l) => sum + (l.cost || 0), 0);

      res.json({
        success: true,
        data: {
          agentId: agent.agentId,
          corpId: agent.corpId,
          name: agent.name,
          status: agent.status,
          period: period || 'all',
          metrics: {
            totalInvocations: total,
            successfulInvocations: successful,
            failedInvocations: failed,
            successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
            avgResponseTimeMs: Math.round(avgDuration),
            avgAccuracy: avgAccuracy ? Math.round(avgAccuracy * 100) : null,
            totalCost: Math.round(totalCost * 100) / 100,
          },
          trust: agent.trust,
          limits: agent.limits,
        },
      });
    } catch (error) {
      logger.error('Error fetching metrics:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch metrics' },
      });
    }
  }
);

// ============================================================================
// CAPABILITY MANAGEMENT
// ============================================================================

/**
 * Add capability to agent
 * POST /agents/:corpId/capabilities
 */
app.post('/agents/:corpId/capabilities',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId } = req.params;
      const { name, description, category, inputTypes, outputTypes, keywords } = req.body;

      const agent = await Agent.findOne({ corpId });

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Agent not found' },
        });
      }

      // Check if capability already exists
      const exists = agent.capabilities.find(
        c => c.name.toLowerCase() === name.toLowerCase()
      );

      if (exists) {
        return res.status(400).json({
          success: false,
          error: { code: 'ALREADY_EXISTS', message: 'Capability already exists' },
        });
      }

      agent.capabilities.push({
        id: generateId('CAP'),
        name,
        description,
        category,
        inputTypes: inputTypes || [],
        outputTypes: outputTypes || [],
        keywords: keywords || [],
        trust: { level: 0.5, evidenceCount: 0 },
      });

      await agent.save();

      res.json({
        success: true,
        data: { capabilityId: agent.capabilities[agent.capabilities.length - 1].id },
      });
    } catch (error) {
      logger.error('Error adding capability:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to add capability' },
      });
    }
  }
);

/**
 * Update capability trust
 * PATCH /agents/:corpId/capabilities/:capabilityId/trust
 */
app.patch('/agents/:corpId/capabilities/:capabilityId/trust',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { corpId, capabilityId } = req.params;
      const { level, evidenceCount } = req.body;

      const agent = await Agent.findOneAndUpdate(
        { corpId, 'capabilities.id': capabilityId },
        {
          $set: {
            'capabilities.$.trust.level': level,
            'capabilities.$.trust.evidenceCount': evidenceCount,
            'capabilities.$.trust.lastVerified': new Date(),
          },
        },
        { new: true }
      );

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Agent or capability not found' },
        });
      }

      const capability = agent.capabilities.find(c => c.id === capabilityId);

      res.json({
        success: true,
        data: {
          capabilityId,
          trust: capability?.trust,
        },
      });
    } catch (error) {
      logger.error('Error updating capability trust:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update capability trust' },
      });
    }
  }
);

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get registry statistics
 * GET /stats
 */
app.get('/stats',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const [byStatus, byType, avgTrust, topAgents] = await Promise.all([
        Agent.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Agent.aggregate([{ $group: { _id: '$agentType', count: { $sum: 1 } } }]),
        Agent.aggregate([{ $group: { _id: null, avgTrust: { $avg: '$trust.overallScore' } } }]),
        Agent.find({ status: 'ACTIVE' })
          .sort({ 'trust.overallScore': -1 })
          .limit(5)
          .select('corpId name trust.overallScore metrics.totalInvocations')
          .lean(),
      ]);

      const totalAgents = await Agent.countDocuments();

      res.json({
        success: true,
        data: {
          totalAgents,
          byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
          byType: Object.fromEntries(byType.map(t => [t._id, t.count])),
          avgTrustScore: avgTrust[0]?.avgTrust
            ? Math.round(avgTrust[0].avgTrust * 100) / 100
            : null,
          topAgents,
        },
      });
    } catch (error) {
      logger.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' },
      });
    }
  }
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message },
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    await Agent.createIndexes();
    await InvocationLog.createIndexes();
    logger.info('Indexes created');

    app.listen(PORT, () => {
      logger.info(`CorpID Agent Registry Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
