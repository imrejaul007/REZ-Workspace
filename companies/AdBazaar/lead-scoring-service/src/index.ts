/**
 * Lead Scoring Service
 *
 * Lead qualification and scoring with behavioral analysis.
 *
 * Port: 5034
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import crypto from 'crypto';
import winston from 'winston';
import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { z } from 'zod';

// ============================================================================
// LOGGING
// ============================================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================================================
// METRICS
// ============================================================================

const register = new Registry();
register.setDefaultLabels({ service: 'lead-scoring-service' });

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const leadsCreatedTotal = new Counter({
  name: 'leads_created_total',
  help: 'Total leads created',
  labelNames: ['source', 'grade'],
  registers: [register]
});

const leadScoreGauge = new Gauge({
  name: 'lead_score',
  help: 'Lead score distribution',
  labelNames: ['grade'],
  registers: [register]
});

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: req.path }, duration);
  });
  next();
});

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '5034', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lead_scoring';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// ============================================================================
// MONGODB MODELS
// ============================================================================

// Lead Model
const LeadSchema = new mongoose.Schema({
  leadId: { type: String, required: true, unique: true, index: true },
  advertiserId: { type: String, required: true, index: true },
  email: { type: String, index: true },
  phone: String,
  firstName: String,
  lastName: String,
  company: String,
  jobTitle: String,
  source: String,
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost'],
    default: 'new'
  },
  score: { type: Number, default: 0 },
  grade: { type: String, enum: ['A', 'B', 'C', 'D'], default: 'D' },
  priority: { type: String, enum: ['hot', 'warm', 'cold'], default: 'cold' },
  scores: {
    behavioral: { type: Number, default: 0 },
    demographic: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }
  },
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Lead = mongoose.model('Lead', LeadSchema);

// Score Model
const ScoreSchema = new mongoose.Schema({
  scoreId: { type: String, required: true, unique: true, index: true },
  leadId: { type: String, required: true, index: true },
  totalScore: { type: Number, default: 0 },
  behavioralScore: { type: Number, default: 0 },
  demographicScore: { type: Number, default: 0 },
  engagementScore: { type: Number, default: 0 },
  factors: [{
    name: String,
    value: Number,
    weight: Number
  }],
  calculatedAt: Date
}, { timestamps: true });

const Score = mongoose.model('Score', ScoreSchema);

// Activity Model
const ActivitySchema = new mongoose.Schema({
  activityId: { type: String, required: true, unique: true, index: true },
  leadId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['page_view', 'email_open', 'email_click', 'form_submit', 'call', 'meeting', 'demo', 'purchase'],
    required: true
  },
  metadata: mongoose.Schema.Types.Mixed,
  scoreImpact: { type: Number, default: 0 }
}, { timestamps: true });

const Activity = mongoose.model('Activity', ActivitySchema);

// Scoring Rule Model
const RuleSchema = new mongoose.Schema({
  ruleId: { type: String, required: true, unique: true, index: true },
  advertiserId: String,
  name: { type: String, required: true },
  category: { type: String, enum: ['behavioral', 'demographic', 'engagement'], required: true },
  condition: {
    field: String,
    operator: String,
    value: mongoose.Schema.Types.Mixed
  },
  score: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

const Rule = mongoose.model('Rule', RuleSchema);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createLeadSchema = z.object({
  advertiserId: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

const createActivitySchema = z.object({
  leadId: z.string(),
  type: z.enum(['page_view', 'email_open', 'email_click', 'form_submit', 'call', 'meeting', 'demo', 'purchase']),
  metadata: z.record(z.any()).optional()
});

const createRuleSchema = z.object({
  advertiserId: z.string().optional(),
  name: z.string().min(1),
  category: z.enum(['behavioral', 'demographic', 'engagement']),
  condition: z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any()
  }),
  score: z.number()
});

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function calculatePriority(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

async function calculateLeadScore(lead: any): Promise<{
  total: number;
  behavioral: number;
  demographic: number;
  engagement: number;
  factors: Array<{ name: string; value: number; weight: number }>;
}> {
  const rules = await Rule.find({ status: 'active' });
  const factors: Array<{ name: string; value: number; weight: number }> = [];

  let behavioral = 0;
  let demographic = 0;
  let engagement = 0;

  for (const rule of rules) {
    const fieldValue = lead[rule.condition.field];
    let matches = false;

    switch (rule.condition.operator) {
      case 'equals':
        matches = fieldValue === rule.condition.value;
        break;
      case 'contains':
        matches = String(fieldValue).includes(rule.condition.value);
        break;
      case 'gt':
        matches = Number(fieldValue) > Number(rule.condition.value);
        break;
      case 'lt':
        matches = Number(fieldValue) < Number(rule.condition.value);
        break;
      case 'exists':
        matches = fieldValue !== undefined && fieldValue !== null;
        break;
    }

    if (matches) {
      const factor = {
        name: rule.name,
        value: rule.score,
        weight: 1
      };
      factors.push(factor);

      switch (rule.category) {
        case 'behavioral':
          behavioral += rule.score;
          break;
        case 'demographic':
          demographic += rule.score;
          break;
        case 'engagement':
          engagement += rule.score;
          break;
      }
    }
  }

  // Activity-based scoring
  const activities = await Activity.find({ leadId: lead.leadId });
  for (const activity of activities) {
    engagement += activity.scoreImpact;
  }

  // Normalize scores to 0-100 range
  const total = Math.min(100, behavioral + demographic + engagement);

  return { total, behavioral, demographic, engagement, factors };
}

// ============================================================================
// HEALTH
// ============================================================================

app.get('/health', (_: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'lead-scoring-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (_: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ready', mongodb: mongoStatus });
});

app.get('/metrics', async (_: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// ============================================================================
// LEADS
// ============================================================================

app.post('/api/leads', async (req: Request, res: Response) => {
  try {
    const validated = createLeadSchema.parse(req.body);

    const lead = await Lead.create({
      leadId: generateId('LEAD'),
      ...validated
    });

    // Calculate initial score
    const scoreResult = await calculateLeadScore(lead);
    lead.score = scoreResult.total;
    lead.grade = calculateGrade(scoreResult.total);
    lead.priority = calculatePriority(scoreResult.total);
    lead.scores = {
      behavioral: scoreResult.behavioral,
      demographic: scoreResult.demographic,
      engagement: scoreResult.engagement
    };
    await lead.save();

    // Save score record
    await Score.create({
      scoreId: generateId('SCORE'),
      leadId: lead.leadId,
      ...scoreResult,
      calculatedAt: new Date()
    });

    logger.info('Lead created', { leadId: lead.leadId, score: lead.score });
    leadsCreatedTotal.inc({ source: lead.source || 'unknown', grade: lead.grade });
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create lead error', { error });
    res.status(500).json({ success: false, error: 'Failed to create lead' });
  }
});

app.get('/api/leads', async (req: Request, res: Response) => {
  try {
    const { advertiserId, status, grade, priority, search } = req.query;
    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;
    if (status) filter.status = status;
    if (grade) filter.grade = grade;
    if (priority) filter.priority = priority;

    let leads = await Lead.find(filter).sort({ score: -1, createdAt: -1 }).limit(100);

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      leads = leads.filter(l =>
        searchRegex.test(l.email || '') ||
        searchRegex.test(l.firstName || '') ||
        searchRegex.test(l.lastName || '') ||
        searchRegex.test(l.company || '')
      );
    }

    res.json({ success: true, data: leads, count: leads.length });
  } catch (error) {
    logger.error('List leads error', { error });
    res.status(500).json({ success: false, error: 'Failed to list leads' });
  }
});

app.get('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findOne({ leadId: req.params.id });
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Get latest score
    const latestScore = await Score.findOne({ leadId: lead.leadId }).sort({ calculatedAt: -1 });

    // Get recent activities
    const activities = await Activity.find({ leadId: lead.leadId }).sort({ createdAt: -1 }).limit(20);

    res.json({ success: true, data: { ...lead.toObject(), latestScore, activities } });
  } catch (error) {
    logger.error('Get lead error', { error });
    res.status(500).json({ success: false, error: 'Failed to get lead' });
  }
});

app.put('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const { email, phone, firstName, lastName, company, jobTitle, source, status, tags } = req.body;
    const lead = await Lead.findOneAndUpdate(
      { leadId: req.params.id },
      { email, phone, firstName, lastName, company, jobTitle, source, status, tags },
      { new: true }
    );
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Update lead error', { error });
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

app.delete('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    await Lead.findOneAndDelete({ leadId: req.params.id });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    logger.error('Delete lead error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

// ============================================================================
// SCORING
// ============================================================================

app.post('/api/leads/:id/score', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findOne({ leadId: req.params.id });
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const scoreResult = await calculateLeadScore(lead);

    lead.score = scoreResult.total;
    lead.grade = calculateGrade(scoreResult.total);
    lead.priority = calculatePriority(scoreResult.total);
    lead.scores = {
      behavioral: scoreResult.behavioral,
      demographic: scoreResult.demographic,
      engagement: scoreResult.engagement
    };
    await lead.save();

    // Save score record
    const score = await Score.create({
      scoreId: generateId('SCORE'),
      leadId: lead.leadId,
      ...scoreResult,
      calculatedAt: new Date()
    });

    logger.info('Lead scored', { leadId: lead.leadId, score: lead.score });

    res.json({
      success: true,
      data: {
        leadId: lead.leadId,
        score: lead.score,
        grade: lead.grade,
        priority: lead.priority,
        scores: lead.scores,
        factors: scoreResult.factors
      }
    });
  } catch (error) {
    logger.error('Score lead error', { error });
    res.status(500).json({ success: false, error: 'Failed to score lead' });
  }
});

// ============================================================================
// ANALYTICS
// ============================================================================

app.get('/api/leads/:id/analytics', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findOne({ leadId: req.params.id });
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const scores = await Score.find({ leadId: lead.leadId }).sort({ calculatedAt: -1 }).limit(30);
    const activities = await Activity.find({ leadId: lead.leadId }).sort({ createdAt: -1 });

    const activityCount = activities.length;
    const lastActivity = activities[0];
    const scoreHistory = scores.map(s => ({
      score: s.totalScore,
      date: s.calculatedAt
    }));

    const response = {
      leadId: lead.leadId,
      currentScore: lead.score,
      grade: lead.grade,
      priority: lead.priority,
      activityCount,
      lastActivityDate: lastActivity?.createdAt,
      scoreHistory,
      status: lead.status,
      createdAt: lead.createdAt
    };

    res.json({ success: true, data: response });
  } catch (error) {
    logger.error('Get analytics error', { error });
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// ============================================================================
// ACTIVITIES
// ============================================================================

app.post('/api/activities', async (req: Request, res: Response) => {
  try {
    const validated = createActivitySchema.parse(req.body);

    // Calculate score impact based on activity type
    const scoreImpacts: Record<string, number> = {
      page_view: 1,
      email_open: 2,
      email_click: 5,
      form_submit: 10,
      call: 15,
      meeting: 20,
      demo: 30,
      purchase: 50
    };

    const activity = await Activity.create({
      activityId: generateId('ACT'),
      ...validated,
      scoreImpact: scoreImpacts[validated.type] || 0
    });

    // Update lead score
    const lead = await Lead.findOne({ leadId: validated.leadId });
    if (lead) {
      const scoreResult = await calculateLeadScore(lead);
      lead.score = scoreResult.total;
      lead.grade = calculateGrade(scoreResult.total);
      lead.priority = calculatePriority(scoreResult.total);
      lead.scores = {
        behavioral: scoreResult.behavioral,
        demographic: scoreResult.demographic,
        engagement: scoreResult.engagement
      };
      await lead.save();
    }

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create activity error', { error });
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
});

app.get('/api/activities', async (req: Request, res: Response) => {
  try {
    const { leadId, type } = req.query;
    const filter: Record<string, unknown> = {};
    if (leadId) filter.leadId = leadId;
    if (type) filter.type = type;

    const activities = await Activity.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: activities, count: activities.length });
  } catch (error) {
    logger.error('List activities error', { error });
    res.status(500).json({ success: false, error: 'Failed to list activities' });
  }
});

// ============================================================================
// SCORING RULES
// ============================================================================

app.post('/api/rules', async (req: Request, res: Response) => {
  try {
    const validated = createRuleSchema.parse(req.body);

    const rule = await Rule.create({
      ruleId: generateId('RULE'),
      ...validated
    });

    logger.info('Scoring rule created', { ruleId: rule.ruleId });
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create rule error', { error });
    res.status(500).json({ success: false, error: 'Failed to create rule' });
  }
});

app.get('/api/rules', async (req: Request, res: Response) => {
  try {
    const { advertiserId, category, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;
    if (category) filter.category = category;
    if (status) filter.status = status;

    const rules = await Rule.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: rules });
  } catch (error) {
    logger.error('List rules error', { error });
    res.status(500).json({ success: false, error: 'Failed to list rules' });
  }
});

app.put('/api/rules/:id', async (req: Request, res: Response) => {
  try {
    const { name, condition, score, status } = req.body;
    const rule = await Rule.findOneAndUpdate(
      { ruleId: req.params.id },
      { name, condition, score, status },
      { new: true }
    );
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error('Update rule error', { error });
    res.status(500).json({ success: false, error: 'Failed to update rule' });
  }
});

app.delete('/api/rules/:id', async (req: Request, res: Response) => {
  try {
    await Rule.findOneAndDelete({ ruleId: req.params.id });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    logger.error('Delete rule error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete rule' });
  }
});

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
  logger.info('Starting Lead Scoring Service', { port: PORT });

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected');

    app.listen(PORT, () => {
      logger.info(`Lead Scoring Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Startup failed', { error });
    process.exit(1);
  }
}

start();

export default app;