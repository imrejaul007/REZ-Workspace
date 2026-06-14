/**
 * HOJAI Relationship Intelligence Platform (RIP)
 * Agentic CRM / Relationship OS
 *
 * A unified intelligence layer that manages ALL relationships
 * across the entire RTMN ecosystem.
 *
 * Port: 4800
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import {
  Entity,
  Relationship,
  Interaction,
  AITask,
  Conversation,
  Metric,
  KnowledgeDocument,
} from './models';

// ============================================
// LOGGING & CONFIG
// ============================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'hojai-relationship-os' },
});

const PORT = parseInt(process.env.PORT || '4800', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/hojai-relationship-os';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ============================================
// TYPES
// ============================================

interface AuthRequest extends Request {
  user?: any;
  isInternal?: boolean;
}

interface AICommand {
  intent: string;
  entities?: string[];
  parameters?: Record<string, any>;
  raw: string;
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const internalToken = req.headers['x-internal-token'];
  if (internalToken === INTERNAL_TOKEN) { req.isInternal = true; return next(); }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/validate`, {
      headers: { Authorization: authHeader, 'X-Internal-Token': INTERNAL_TOKEN },
    });
    if (!response.ok) return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN' } });
    const data = await response.json();
    req.user = data.user || data;
    next();
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ success: false, error: { code: 'AUTH_SERVICE_ERROR' } });
  }
};

// ============================================
// AI COMMAND PARSER
// ============================================

function parseCommand(text: string): AICommand {
  const lower = text.toLowerCase();

  // Revenue queries
  if (lower.includes('revenue') || lower.includes('sales') || lower.includes('today')) {
    return { intent: 'revenue_report', raw: text };
  }

  // Pipeline queries
  if (lower.includes('pipeline') || lower.includes('deals') || lower.includes('opportunities')) {
    return { intent: 'pipeline_view', raw: text };
  }

  // Team performance
  if (lower.includes('team') || lower.includes('performance') || lower.includes('salesperson')) {
    return { intent: 'team_performance', raw: text };
  }

  // Entity search
  if (lower.includes('show') || lower.includes('find') || lower.includes('search')) {
    return { intent: 'entity_search', raw: text };
  }

  // Action execution
  if (lower.includes('create') || lower.includes('assign') || lower.includes('send')) {
    return { intent: 'execute_action', raw: text };
  }

  // Analysis
  if (lower.includes('why') || lower.includes('analyze') || lower.includes('compare')) {
    return { intent: 'analysis', raw: text };
  }

  // Default to chat
  return { intent: 'chat', raw: text };
}

// ============================================
// AI AGENTS
// ============================================

const AI_AGENTS = {
  'ceo-agent': {
    name: 'CEO Agent',
    role: 'Strategic Advisor',
    responsibilities: [
      'Revenue monitoring',
      'Growth analysis',
      'Risk identification',
      'Market intelligence',
      'Strategic planning',
    ],
    color: '#1a1a2e',
  },
  'revenue-agent': {
    name: 'Chief Revenue Officer Agent',
    role: 'Revenue Tracking',
    responsibilities: [
      'Sales pipeline monitoring',
      'Opportunity tracking',
      'Revenue forecasting',
      'Upsell suggestions',
      'Deal risk alerts',
    ],
    color: '#16213e',
  },
  'sdr-agent': {
    name: 'SDR Agent',
    role: '24/7 Lead Qualification',
    responsibilities: [
      'Lead qualification',
      'Auto follow-up',
      'Email sequencing',
      'Meeting scheduling',
      'CRM updates',
    ],
    color: '#0f3460',
  },
  'success-agent': {
    name: 'Customer Success Agent',
    role: 'Retention & Growth',
    responsibilities: [
      'Customer health tracking',
      'Churn prediction',
      'Engagement campaigns',
      'Renewal tracking',
      'NPS management',
    ],
    color: '#533483',
  },
  'marketing-agent': {
    name: 'Marketing Agent',
    role: 'Campaign Management',
    responsibilities: [
      'Campaign creation',
      'Audience segmentation',
      'Lead generation',
      'Attribution analysis',
      'A/B testing',
    ],
    color: '#e94560',
  },
  'operations-agent': {
    name: 'Operations Agent',
    role: 'Task & Project Management',
    responsibilities: [
      'Task assignment',
      'SOP compliance',
      'Delay detection',
      'Escalation routing',
      'Performance tracking',
    ],
    color: '#0a3d62',
  },
  'finance-agent': {
    name: 'Finance Agent',
    role: 'Financial Intelligence',
    responsibilities: [
      'Revenue vs expenses',
      'Profitability analysis',
      'Cash flow monitoring',
      'Runway calculation',
      'Budget tracking',
    ],
    color: '#1289A7',
  },
  'hr-agent': {
    name: 'HR Agent',
    role: 'People Operations',
    responsibilities: [
      'Hiring pipeline',
      'Attendance tracking',
      'Performance reviews',
      'Payroll management',
      'Employee engagement',
    ],
    color: '#A8E6CF',
  },
};

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    service: 'hojai-relationship-os',
    version: '1.0.0',
    description: 'Agentic CRM / Relationship Intelligence Platform',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ status: 'not_ready' });
  res.json({ status: 'ready' });
});

// ============================================
// AI STATUS
// ============================================

app.get('/ai/status', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      platform: 'HOJAI Relationship Intelligence Platform',
      agents: Object.entries(AI_AGENTS).map(([id, agent]) => ({
        id,
        ...agent,
        status: 'active',
        uptime: process.uptime(),
      })),
      totalAgents: Object.keys(AI_AGENTS).length,
      version: '1.0.0',
    },
  });
});

// ============================================
// NATURAL LANGUAGE COMMAND INTERFACE
// ============================================

app.post('/ai/command', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { command, context } = req.body;

    if (!command) return res.status(400).json({ success: false, error: { code: 'MISSING_COMMAND' } });

    logger.info(`AI Command received: ${command}`);

    const parsed = parseCommand(command);

    let response: any = {
      command,
      parsed,
      success: true,
    };

    // Execute based on intent
    switch (parsed.intent) {
      case 'revenue_report': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const metrics = await Metric.aggregate([
          { $match: { metricType: 'revenue', periodStart: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$value' }, count: { $sum: 1 } } },
        ]);

        response.data = {
          message: `Today's revenue: ₹${metrics[0]?.total || 0}`,
          totalRevenue: metrics[0]?.total || 0,
          transactions: metrics[0]?.count || 0,
        };

        // Get comparison with yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayMetrics = await Metric.aggregate([
          {
            $match: {
              metricType: 'revenue',
              periodStart: { $gte: yesterday, $lt: today },
            },
          },
          { $group: { _id: null, total: { $sum: '$value' } } },
        ]);

        const yesterdayRevenue = yesterdayMetrics[0]?.total || 0;
        const change = yesterdayRevenue > 0
          ? (((metrics[0]?.total || 0) - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
          : '0';

        response.data.yesterdayRevenue = yesterdayRevenue;
        response.data.changePercent = change;
        break;
      }

      case 'pipeline_view': {
        const pipelineMetrics = await Metric.find({ metricType: 'deal_value' }).sort({ periodStart: -1 }).limit(10);
        response.data = {
          deals: pipelineMetrics.map(m => ({
            id: m._id,
            value: m.value,
            period: m.period,
          })),
          total: pipelineMetrics.reduce((sum, m) => sum + m.value, 0),
        };
        break;
      }

      case 'team_performance': {
        const performers = await Entity.find({ type: 'employee' })
          .sort({ lifetimeValue: -1 })
          .limit(10)
          .select('name lifetimeValue metadata');

        response.data = {
          topPerformers: performers.map(p => ({
            name: p.name,
            value: p.lifetimeValue,
            score: p.metadata?.performanceScore || 0,
          })),
        };
        break;
      }

      case 'entity_search': {
        const entities = await Entity.find({
          $or: [
            { name: new RegExp(command, 'i') },
            { email: new RegExp(command, 'i') },
            { phone: new RegExp(command.replace(/\D/g, ''), 'i') },
          ],
        }).limit(20);

        response.data = {
          count: entities.length,
          entities: entities.map(e => ({
            id: e.entityId,
            name: e.name,
            type: e.type,
            phone: e.phone,
            healthScore: e.healthScore,
            lifetimeValue: e.lifetimeValue,
          })),
        };
        break;
      }

      case 'analysis': {
        // AI analysis of trends
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const trends = await Metric.aggregate([
          { $match: { periodStart: { $gte: last30Days } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$periodStart' } },
              revenue: { $sum: { $cond: [{ $eq: ['$metricType', 'revenue'] }, '$value', 0] } },
              leads: { $sum: { $cond: [{ $eq: ['$metricType', 'lead'] }, 1, 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        response.data = {
          trends,
          insights: [
            'Revenue trend for last 30 days',
            'Lead generation patterns',
            'Conversion rates',
          ],
        };
        break;
      }

      default:
        // Chat response
        response.data = {
          message: `I understand you want to: ${parsed.intent}. How can I help you with this?`,
          suggestions: [
            'Show today\'s revenue',
            'List top performers',
            'Display pipeline',
            'Create follow-up task',
          ],
        };
    }

    // Create AI task for tracking
    await AITask.create({
      taskId: `TASK-${Date.now().toString(36)}`,
      type: parsed.intent,
      title: `AI Command: ${parsed.intent}`,
      description: command,
      assignedTo: 'ceo-agent',
      status: 'completed',
      aiInitiated: true,
      result: response.data,
    });

    res.json(response);
  } catch (error) {
    logger.error('AI Command error:', error);
    res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: 'Failed to process command' } });
  }
});

// ============================================
// ENTITY MANAGEMENT (Relationship Graph)
// ============================================

app.post('/api/entities', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      type: z.string(),
      source: z.string(),
      sourceId: z.string(),
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().min(10),
      metadata: z.record(z.any()).optional(),
      tags: z.array(z.string()).optional(),
    });

    const validated = schema.parse(req.body);
    const entityId = `ENT-${Date.now().toString(36)}`;

    const entity = await Entity.create({
      ...validated,
      entityId,
      segments: [],
      healthScore: 100,
      riskScore: 0,
      lifetimeValue: 0,
    });

    logger.info(`Entity created: ${entityId}`, { type: validated.type, source: validated.source });

    // Create initial interaction
    await Interaction.create({
      interactionId: uuidv4(),
      entityId,
      type: 'system',
      direction: 'system',
      summary: 'Entity created in Relationship OS',
      aiGenerated: true,
    });

    res.status(201).json({ success: true, data: entity });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } });
  }
});

app.get('/api/entities', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type, source, search, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (type) filter.type = type;
    if (source) filter.source = source;
    if (search) {
      filter.$or = [
        { name: new RegExp(search as string, 'i') },
        { email: new RegExp(search as string, 'i') },
        { phone: new RegExp(search as string, 'i') },
      ];
    }

    const entities = await Entity.find(filter)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ updatedAt: -1 });

    const total = await Entity.countDocuments(filter);

    res.json({ success: true, data: { entities, pagination: { page: Number(page), limit: Number(limit), total } } });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

app.get('/api/entities/:entityId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const entity = await Entity.findOne({ entityId: req.params.entityId });
    if (!entity) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });

    // Get relationships
    const relationships = await Relationship.find({
      $or: [{ fromEntityId: entity.entityId }, { toEntityId: entity.entityId }],
    });

    // Get interactions
    const interactions = await Interaction.find({ entityId: entity.entityId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get metrics
    const metrics = await Metric.find({ entityId: entity.entityId })
      .sort({ periodStart: -1 })
      .limit(30);

    res.json({
      success: true,
      data: {
        entity,
        relationships,
        interactions,
        metrics,
      },
    });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// ============================================
// RELATIONSHIP MANAGEMENT
// ============================================

app.post('/api/relationships', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const relationship = await Relationship.create({
      relationshipId: `REL-${Date.now().toString(36)}`,
      fromEntityId: req.body.fromEntityId,
      toEntityId: req.body.toEntityId,
      type: req.body.type,
      strength: req.body.strength || 50,
      metadata: req.body.metadata || {},
      source: req.body.source || 'manual',
    });

    res.status(201).json({ success: true, data: relationship });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/relationships/:entityId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const relationships = await Relationship.find({
      $or: [{ fromEntityId: req.params.entityId }, { toEntityId: req.params.entityId }],
    });
    res.json({ success: true, data: relationships });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// ============================================
// INTERACTION / TIMELINE
// ============================================

app.post('/api/interactions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const interaction = await Interaction.create({
      interactionId: uuidv4(),
      entityId: req.body.entityId,
      type: req.body.type || 'system',
      direction: req.body.direction || 'system',
      channel: req.body.channel,
      summary: req.body.summary,
      sentiment: req.body.sentiment,
      intent: req.body.intent,
      value: req.body.value,
      metadata: req.body.metadata || {},
      createdBy: req.body.createdBy,
      aiGenerated: false,
    });

    // Update entity's health score based on interaction
    if (interaction.sentiment === 'positive') {
      await Entity.findOneAndUpdate({ entityId: interaction.entityId }, { $inc: { healthScore: 1 } });
    } else if (interaction.sentiment === 'negative') {
      await Entity.findOneAndUpdate({ entityId: interaction.entityId }, { $inc: { healthScore: -2, riskScore: 5 } });
    }

    res.status(201).json({ success: true, data: interaction });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/interactions/:entityId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type, sentiment, page = 1, limit = 50 } = req.query;
    const filter: any = { entityId: req.params.entityId };

    if (type) filter.type = type;
    if (sentiment) filter.sentiment = sentiment;

    const interactions = await Interaction.find(filter)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Interaction.countDocuments(filter);
    res.json({ success: true, data: { interactions, pagination: { page: Number(page), limit: Number(limit), total } } });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// ============================================
// AI TASKS
// ============================================

app.post('/api/tasks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const task = await AITask.create({
      taskId: `TASK-${Date.now().toString(36)}`,
      entityId: req.body.entityId,
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      assignedTo: req.body.assignedTo || 'ceo-agent',
      priority: req.body.priority || 'medium',
      scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined,
      createdBy: req.body.createdBy,
      aiInitiated: req.body.aiInitiated || false,
    });

    logger.info(`AI Task created: ${task.taskId}`, { assignedTo: task.assignedTo });
    res.status(201).json({ success: true, data: task });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/tasks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { agentId, status, priority, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (agentId) filter.assignedTo = agentId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await AITask.find(filter)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ priority: -1, createdAt: -1 });

    const total = await AITask.countDocuments(filter);
    res.json({ success: true, data: { tasks, pagination: { page: Number(page), limit: Number(limit), total } } });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

app.patch('/api/tasks/:taskId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const updateData: any = {};
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.result) updateData.result = req.body.result;
    if (req.body.completedAt) updateData.completedAt = new Date(req.body.completedAt);

    const task = await AITask.findOneAndUpdate(
      { taskId: req.params.taskId },
      { $set: updateData },
      { new: true }
    );

    if (!task) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    res.json({ success: true, data: task });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR' } }); }
});

// ============================================
// METRICS & ANALYTICS
// ============================================

app.post('/api/metrics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const metric = await Metric.create({
      metricId: `MET-${Date.now().toString(36)}`,
      entityId: req.body.entityId,
      source: req.body.source,
      metricType: req.body.metricType,
      value: req.body.value,
      unit: req.body.unit,
      period: req.body.period || 'daily',
      periodStart: req.body.periodStart ? new Date(req.body.periodStart) : new Date(),
      periodEnd: req.body.periodEnd ? new Date(req.body.periodEnd) : new Date(),
      metadata: req.body.metadata || {},
    });

    res.status(201).json({ success: true, data: metric });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/analytics/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { source } = req.query;
    const filter: any = source ? { source } : {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalEntities,
      todayMetrics,
      weekMetrics,
      monthMetrics,
      activeTasks,
      pendingTasks,
    ] = await Promise.all([
      Entity.countDocuments(filter),
      Metric.aggregate([{ $match: { ...filter, periodStart: { $gte: today } } }, { $group: { _id: '$metricType', value: { $sum: '$value' } } }]),
      Metric.aggregate([{ $match: { ...filter, periodStart: { $gte: weekAgo } } }, { $group: { _id: '$metricType', value: { $sum: '$value' } } }]),
      Metric.aggregate([{ $match: { ...filter, periodStart: { $gte: monthAgo } } }, { $group: { _id: '$metricType', value: { $sum: '$value' } } }]),
      AITask.countDocuments({ status: 'in_progress' }),
      AITask.countDocuments({ status: 'pending' }),
    ]);

    // Get entity type distribution
    const entityTypes = await Entity.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalEntities,
          activeTasks,
          pendingTasks,
        },
        today: todayMetrics,
        thisWeek: weekMetrics,
        thisMonth: monthMetrics,
        entityDistribution: entityTypes,
        agents: Object.keys(AI_AGENTS).map(id => ({
          id,
          name: AI_AGENTS[id as keyof typeof AI_AGENTS].name,
          status: 'active',
        })),
      },
    });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'ANALYTICS_ERROR' } }); }
});

// ============================================
// KNOWLEDGE BASE
// ============================================

app.post('/api/knowledge', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const document = await KnowledgeDocument.create({
      documentId: `DOC-${Date.now().toString(36)}`,
      title: req.body.title,
      content: req.body.content,
      type: req.body.type,
      category: req.body.category,
      tags: req.body.tags || [],
      metadata: req.body.metadata || {},
      createdBy: req.body.createdBy,
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'CREATE_ERROR' } }); }
});

app.get('/api/knowledge', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type, category, search } = req.query;
    const filter: any = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: new RegExp(search as string, 'i') },
        { content: new RegExp(search as string, 'i') },
      ];
    }

    const documents = await KnowledgeDocument.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, data: documents });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'FETCH_ERROR' } }); }
});

// ============================================
// COMMAND CENTER (Live Dashboard)
// ============================================

app.get('/api/command-center', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Live metrics
    const [todayRevenue, todayLeads, activeEntities, aiTasksActive, totalInteractions] = await Promise.all([
      Metric.aggregate([{ $match: { metricType: 'revenue', periodStart: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$value' } } }]),
      Metric.aggregate([{ $match: { metricType: 'lead', periodStart: { $gte: today } } }, { $group: { _id: null, count: { $sum: 1 } } }]),
      Entity.countDocuments({ healthScore: { $gte: 50 } }),
      AITask.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
      Interaction.countDocuments({ createdAt: { $gte: today } }),
    ]);

    res.json({
      success: true,
      data: {
        live: {
          revenue: todayRevenue[0]?.total || 0,
          leads: todayLeads[0]?.count || 0,
          activeEntities,
          aiTasks: aiTasksActive,
          interactions: totalInteractions,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) { logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'COMMAND_ERROR' } }); }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const shutdown = async () => {
  logger.info('Shutting down Relationship OS...');
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ============================================
// START
// ============================================

const start = async () => {
  try {
    await mongoose.connect(MONGO_URL, { maxPoolSize: 50, minPoolSize: 10 });
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info('═══════════════════════════════════════════════════════════');
      logger.info('  HOJAI Relationship Intelligence Platform (RIP)');
      logger.info('  Agentic CRM / Relationship OS');
      logger.info('═══════════════════════════════════════════════════════════');
      logger.info(`  Port: ${PORT}`);
      logger.info(`  MongoDB: hojai-relationship-os`);
      logger.info(`  AI Agents: ${Object.keys(AI_AGENTS).length}`);
      logger.info('═══════════════════════════════════════════════════════════');
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
};

start();