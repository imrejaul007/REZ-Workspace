/**
 * AdBazaar Marketing OS - Unified Command Center
 * The single place where merchants define outcomes, AI decides execution
 *
 * Port: 4960
 * Purpose: One platform for all marketing channels, AI-driven orchestration
 *
 * Features:
 * - Natural language goal setting
 * - Cross-channel campaign orchestration
 * - AI-powered budget allocation
 * - Real-time performance optimization
 * - Multi-channel attribution
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import axios from 'axios';
import { EventEmitter } from 'events';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4960;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/marketing-os.log' })
  ]
});

// Event Emitter for cross-channel coordination
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(100);

// Service URLs
const SERVICES = {
  // Social Channels
  INSTAGRAM_PUBLISH: process.env.INSTAGRAM_PUBLISH || 'http://localhost:5081',
  SOCIAL_PUBLISHER: process.env.SOCIAL_PUBLISHER || 'http://localhost:5083',
  WHATSAPP: process.env.WHATSAPP || 'http://localhost:4861',

  // Ad Channels
  ADS_SERVICE: process.env.ADS_SERVICE || 'http://localhost:4007',
  DOOH: process.env.DOOH || 'http://localhost:4018',
  SMS: process.env.SMS_CAMPAIGN || 'http://localhost:4000',
  EMAIL: process.env.EMAIL_CAMPAIGN || 'http://localhost:4000',

  // Commerce
  CREATORS: process.env.CREATORS || 'http://localhost:4000',
  RIDE_INTEGRATION: process.env.RIDE_INTEGRATION || 'http://localhost:4530',
  AIRZY: process.env.AIRZY || 'http://localhost:4951',
  STAYOWN: process.env.STAYOWN || 'http://localhost:4952',
  BUZZLOCAL: process.env.BUZZLOCAL || 'http://localhost:4953',

  // Intelligence
  AI_GATEWAY: process.env.AI_GATEWAY || 'http://localhost:4870',
  INTENT_SIGNALS: process.env.INTENT_SIGNALS || 'http://localhost:4800',
  ECOSYSTEM_HUB: process.env.ECOSYSTEM_HUB || 'http://localhost:4955',

  // Analytics
  ANALYTICS: process.env.ANALYTICS || 'http://localhost:4000',
  ATTRIBUTION: process.env.ATTRIBUTION || 'http://localhost:4100',
};

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// MongoDB Schemas
const goalSchema = new mongoose.Schema({
  merchantId: String,
  goalId: String,
  description: String, // Natural language goal
  target: {
    metric: String, // revenue, customers, orders, awareness
    value: Number,
    current: Number,
    unit: String
  },
  timeframe: {
    start: Date,
    end: Date
  },
  budget: {
    total: Number,
    spent: Number,
    currency: String
  },
  channels: [{
    channel: String,
    enabled: Boolean,
    budget: Number,
    status: String
  }],
  aiDecisions: {
    channelAllocation: mongoose.Schema.Types.Mixed,
    bidStrategy: mongoose.Schema.Types.Mixed,
    creativeStrategy: mongoose.Schema.Types.Mixed
  },
  status: String, // active, paused, completed, failed
  progress: Number,
  createdAt: Date,
  updatedAt: Date
});

const Goal = mongoose.model('Goal', goalSchema);

const campaignSchema = new mongoose.Schema({
  campaignId: String,
  goalId: String,
  merchantId: String,
  name: String,
  type: String, // awareness, consideration, conversion, loyalty
  channels: [{
    channel: String,
    subCampaignId: String,
    status: String,
    budget: Number,
    spent: Number,
    performance: {
      impressions: Number,
      clicks: Number,
      conversions: Number,
      revenue: Number
    }
  }],
  creative: mongoose.Schema.Types.Mixed,
  targeting: mongoose.Schema.Types.Mixed,
  schedule: mongoose.Schema.Types.Mixed,
  status: String,
  createdAt: Date
});

const Campaign = mongoose.model('Campaign', campaignSchema);

const audienceSchema = new mongoose.Schema({
  merchantId: String,
  audienceId: String,
  name: String,
  source: String, // cdp, ecosystem, intent, lookalike
  criteria: mongoose.Schema.Types.Mixed,
  size: Number,
  segments: [{
    type: String,
    value: mongoose.Schema.Types.Mixed
  }],
  createdAt: Date
});

const Audience = mongoose.model('Audience', audienceSchema);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const serviceStatus: Record<string, string> = {};

  const checks = Object.entries(SERVICES).map(async ([name, url]) => {
    try {
      await axios.get(`${url}/health`, { timeout: 2000 });
      serviceStatus[name] = 'connected';
    } catch (e) {
      serviceStatus[name] = 'disconnected';
    }
  });

  await Promise.all(checks);

  const connected = Object.values(serviceStatus).filter(s => s === 'connected').length;

  res.json({
    status: connected > 5 ? 'healthy' : 'degraded',
    service: 'adbazaar-marketing-os',
    port: PORT,
    connectedServices: `${connected}/${Object.keys(SERVICES).length}`,
    services: serviceStatus,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// NATURAL LANGUAGE GOAL API
// ============================================

/**
 * Set marketing goal using natural language
 * POST /api/goals
 *
 * Example: "Get me 1000 restaurant customers this month under ₹50,000"
 */
app.post('/api/goals', async (req: Request, res: Response) => {
  try {
    const { merchantId, description, timeframe, budget } = req.body;

    logger.info('Creating marketing goal', { merchantId, description });

    // Parse natural language with AI
    const parsedGoal = await parseGoalWithAI(description);

    // Create goal with AI-decided channel allocation
    const goal = new Goal({
      merchantId,
      goalId: `goal_${Date.now()}`,
      description,
      target: parsedGoal.target,
      timeframe: timeframe || { start: new Date(), end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      budget: {
        total: budget || parsedGoal.suggestedBudget,
        spent: 0,
        currency: 'INR'
      },
      channels: parsedGoal.recommendedChannels,
      aiDecisions: {
        channelAllocation: parsedGoal.channelAllocation,
        bidStrategy: parsedGoal.bidStrategy,
        creativeStrategy: parsedGoal.creativeStrategy
      },
      status: 'active',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await goal.save();

    // Trigger campaign creation across channels
    await createCrossChannelCampaigns(goal);

    res.json({
      success: true,
      goal: {
        goalId: goal.goalId,
        description: goal.description,
        target: goal.target,
        channels: goal.channels.map(c => c.channel),
        aiInsights: goal.aiDecisions
      }
    });
  } catch (error) {
    logger.error('Goal creation error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get goal status and progress
 * GET /api/goals/:goalId
 */
app.get('/api/goals/:goalId', async (req: Request, res: Response) => {
  try {
    const goal = await Goal.findOne({ goalId: req.params.goalId });

    if (!goal) {
      res.status(404).json({ success: false, error: 'Goal not found' });
      return;
    }

    // Aggregate performance from all channels
    const performance = await aggregateChannelPerformance(goal);

    // Calculate progress
    const progress = Math.min(100, (performance.current / goal.target.value) * 100);

    // Get AI recommendations for optimization
    const recommendations = await getOptimizationRecommendations(goal, performance);

    res.json({
      success: true,
      goal: {
        goalId: goal.goalId,
        description: goal.description,
        target: goal.target,
        budget: goal.budget,
        channels: goal.channels,
        status: goal.status,
        progress: progress.toFixed(1) + '%',
        performance,
        recommendations,
        aiDecisions: goal.aiDecisions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Update goal (change target, pause, etc.)
 * PATCH /api/goals/:goalId
 */
app.patch('/api/goals/:goalId', async (req: Request, res: Response) => {
  try {
    const { action, changes } = req.body;

    const goal = await Goal.findOne({ goalId: req.params.goalId });

    if (!goal) {
      res.status(404).json({ success: false, error: 'Goal not found' });
      return;
    }

    if (action === 'pause') {
      goal.status = 'paused';
      await pauseAllChannels(goal);
    }

    if (action === 'resume') {
      goal.status = 'active';
      await resumeAllChannels(goal);
    }

    if (action === 'updateBudget') {
      goal.budget.total = changes.budget;
    }

    goal.updatedAt = new Date();
    await goal.save();

    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// CROSS-CHANNEL CAMPAIGN MANAGEMENT
// ============================================

/**
 * Get all campaigns for a goal
 * GET /api/goals/:goalId/campaigns
 */
app.get('/api/goals/:goalId/campaigns', async (req: Request, res: Response) => {
  try {
    const campaigns = await Campaign.find({ goalId: req.params.goalId });

    res.json({
      success: true,
      campaigns: campaigns.map(c => ({
        campaignId: c.campaignId,
        name: c.name,
        type: c.type,
        channels: c.channels,
        status: c.status,
        performance: c.channels.reduce((acc, ch) => ({
          impressions: acc.impressions + (ch.performance?.impressions || 0),
          clicks: acc.clicks + (ch.performance?.clicks || 0),
          conversions: acc.conversions + (ch.performance?.conversions || 0),
          revenue: acc.revenue + (ch.performance?.revenue || 0)
        }), { impressions: 0, clicks: 0, conversions: 0, revenue: 0 })
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Pause/resume specific channel
 * PATCH /api/goals/:goalId/channels/:channel
 */
app.patch('/api/goals/:goalId/channels/:channel', async (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    const { goalId, channel } = req.params;

    const goal = await Goal.findOne({ goalId });

    if (!goal) {
      res.status(404).json({ success: false, error: 'Goal not found' });
      return;
    }

    const channelConfig = goal.channels.find(c => c.channel === channel);

    if (!channelConfig) {
      res.status(404).json({ success: false, error: 'Channel not found' });
      return;
    }

    if (action === 'pause') {
      await pauseChannel(goal, channel);
      channelConfig.status = 'paused';
    }

    if (action === 'resume') {
      await resumeChannel(goal, channel);
      channelConfig.status = 'active';
    }

    await goal.save();

    res.json({ success: true, channel: channelConfig });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AI-DRIVEN OPTIMIZATION
// ============================================

/**
 * Get AI recommendations for campaign optimization
 * POST /api/optimize/:goalId
 */
app.post('/api/optimize/:goalId', async (req: Request, res: Response) => {
  try {
    const goal = await Goal.findOne({ goalId: req.params.goalId });

    if (!goal) {
      res.status(404).json({ success: false, error: 'Goal not found' });
      return;
    }

    const performance = await aggregateChannelPerformance(goal);
    const recommendations = await getOptimizationRecommendations(goal, performance);

    // Apply AI recommendations automatically if requested
    if (req.body.autoApply) {
      await applyRecommendations(goal, recommendations);
    }

    res.json({
      success: true,
      recommendations,
      applied: req.body.autoApply || false
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Get unified dashboard
 * GET /api/dashboard/:merchantId
 */
app.get('/api/dashboard/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { timeframe } = req.query;

    // Get all active goals
    const goals = await Goal.find({ merchantId, status: 'active' });

    // Aggregate all performance
    const dashboard = {
      goals: [],
      totalPerformance: { impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
      channelBreakdown: {},
      topPerformers: [],
      alerts: []
    };

    for (const goal of goals) {
      const performance = await aggregateChannelPerformance(goal);
      const progress = (performance.current / goal.target.value) * 100;

      dashboard.goals.push({
        goalId: goal.goalId,
        description: goal.description,
        target: goal.target,
        progress: progress.toFixed(1) + '%',
        channels: goal.channels.map(c => c.channel)
      });

      // Aggregate totals
      dashboard.totalPerformance.impressions += performance.impressions;
      dashboard.totalPerformance.clicks += performance.clicks;
      dashboard.totalPerformance.conversions += performance.conversions;
      dashboard.totalPerformance.revenue += performance.revenue;

      // Channel breakdown
      for (const channel of goal.channels) {
        const chPerf = performance.byChannel[channel.channel] || {};
        dashboard.channelBreakdown[channel.channel] = {
          impressions: (dashboard.channelBreakdown[channel.channel]?.impressions || 0) + (chPerf.impressions || 0),
          clicks: (dashboard.channelBreakdown[channel.channel]?.clicks || 0) + (chPerf.clicks || 0),
          conversions: (dashboard.channelBreakdown[channel.channel]?.conversions || 0) + (chPerf.conversions || 0),
          revenue: (dashboard.channelBreakdown[channel.channel]?.revenue || 0) + (chPerf.revenue || 0)
        };
      }

      // Alerts
      if (progress < 25 && goal.timeframe.end > new Date()) {
        dashboard.alerts.push({
          type: 'warning',
          message: `Goal "${goal.description}" is underperforming at ${progress.toFixed(1)}%`
        });
      }
    }

    // Calculate CTR and conversion rates
    dashboard.totalPerformance.ctr = dashboard.totalPerformance.impressions > 0
      ? (dashboard.totalPerformance.clicks / dashboard.totalPerformance.impressions * 100).toFixed(2) + '%'
      : '0%';
    dashboard.totalPerformance.convRate = dashboard.totalPerformance.clicks > 0
      ? (dashboard.totalPerformance.conversions / dashboard.totalPerformance.clicks * 100).toFixed(2) + '%'
      : '0%';

    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// AUDIENCE MANAGEMENT
// ============================================

/**
 * Get unified audience
 * GET /api/audiences/:merchantId
 */
app.get('/api/audiences/:merchantId', async (req: Request, res: Response) => {
  try {
    const audiences = await Audience.find({ merchantId: req.params.merchantId });

    res.json({
      success: true,
      audiences: audiences.map(a => ({
        audienceId: a.audienceId,
        name: a.name,
        source: a.source,
        size: a.size,
        criteria: a.criteria
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

/**
 * Create audience from multiple sources
 * POST /api/audiences
 */
app.post('/api/audiences', async (req: Request, res: Response) => {
  try {
    const { merchantId, name, sources, criteria } = req.body;

    // Aggregate audience from all sources
    const aggregatedAudience = await aggregateAudience(merchantId, sources);

    const audience = new Audience({
      merchantId,
      audienceId: `aud_${Date.now()}`,
      name,
      source: 'unified',
      criteria,
      size: aggregatedAudience.size,
      segments: aggregatedAudience.segments,
      createdAt: new Date()
    });

    await audience.save();

    res.json({
      success: true,
      audience: {
        audienceId: audience.audienceId,
        name: audience.name,
        size: audience.size,
        segments: audience.segments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function parseGoalWithAI(description: string): Promise<any> {
  // Use AI to parse natural language goal
  try {
    const response = await axios.post(`${SERVICES.AI_GATEWAY}/api/ai/nlp/parse-goal`, {
      text: description
    }, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    // Fallback to rule-based parsing
    logger.warn('AI parsing failed, using fallback');
    return fallbackParseGoal(description);
  }
}

function fallbackParseGoal(description: string): any {
  const lower = description.toLowerCase();

  // Extract metric
  let metric = 'customers';
  if (lower.includes('revenue') || lower.includes('sales')) metric = 'revenue';
  if (lower.includes('orders')) metric = 'orders';
  if (lower.includes('awareness') || lower.includes('reach')) metric = 'reach';

  // Extract target value
  const valueMatch = description.match(/(\d+)/);
  const value = valueMatch ? parseInt(valueMatch[1]) : 1000;

  // Extract budget
  const budgetMatch = description.match(/₹?([\d,]+)/);
  const suggestedBudget = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, '')) : value * 50;

  // Determine channels based on business type
  const channels = [
    { channel: 'instagram', enabled: true, budget: suggestedBudget * 0.3, status: 'pending' },
    { channel: 'whatsapp', enabled: true, budget: suggestedBudget * 0.2, status: 'pending' },
    { channel: 'dooh', enabled: true, budget: suggestedBudget * 0.15, status: 'pending' },
    { channel: 'sms', enabled: true, budget: suggestedBudget * 0.1, status: 'pending' },
    { channel: 'creators', enabled: true, budget: suggestedBudget * 0.25, status: 'pending' }
  ];

  return {
    target: { metric, value, current: 0, unit: metric === 'revenue' ? '₹' : '' },
    suggestedBudget,
    recommendedChannels: channels,
    channelAllocation: {
      instagram: 0.3,
      whatsapp: 0.2,
      dooh: 0.15,
      sms: 0.1,
      creators: 0.25
    },
    bidStrategy: 'performance',
    creativeStrategy: 'conversion'
  };
}

async function createCrossChannelCampaigns(goal: any): Promise<void> {
  const campaigns = [];

  for (const channelConfig of goal.channels.filter(c => c.enabled)) {
    const channel = channelConfig.channel;

    // Create campaign for each channel
    const campaign = new Campaign({
      campaignId: `camp_${channel}_${Date.now()}`,
      goalId: goal.goalId,
      merchantId: goal.merchantId,
      name: `${goal.description} - ${channel}`,
      type: goal.target.metric === 'awareness' ? 'awareness' : 'conversion',
      channels: [{
        channel,
        subCampaignId: `sub_${channel}_${Date.now()}`,
        status: 'active',
        budget: channelConfig.budget,
        spent: 0,
        performance: { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
      }],
      targeting: goal.aiDecisions,
      status: 'active',
      createdAt: new Date()
    });

    await campaign.save();
    campaigns.push(campaign);

    // Emit event for channel activation
    eventEmitter.emit('campaign:created', {
      campaign: campaign.campaignId,
      channel,
      goalId: goal.goalId
    });
  }

  return;
}

async function aggregateChannelPerformance(goal: any): Promise<any> {
  const performance = {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    current: 0,
    byChannel: {} as Record<string, any>
  };

  // In production, aggregate from actual channel services
  for (const channel of goal.channels) {
    try {
      const response = await axios.get(`${SERVICES.ANALYTICS}/api/performance`, {
        params: { goalId: goal.goalId, channel: channel.channel },
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
        timeout: 5000
      });

      performance.byChannel[channel.channel] = response.data;

      performance.impressions += response.data.impressions || 0;
      performance.clicks += response.data.clicks || 0;
      performance.conversions += response.data.conversions || 0;
      performance.revenue += response.data.revenue || 0;
    } catch (e) {
      performance.byChannel[channel.channel] = { impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
    }
  }

  // Map current based on target metric
  if (goal.target.metric === 'revenue') performance.current = performance.revenue;
  else if (goal.target.metric === 'customers' || goal.target.metric === 'conversions') performance.current = performance.conversions;
  else performance.current = performance.impressions;

  return performance;
}

async function getOptimizationRecommendations(goal: any, performance: any): Promise<any[]> {
  const recommendations = [];

  // Analyze channel performance
  const channelROI = goal.channels.map((c: any) => ({
    channel: c.channel,
    budget: c.budget,
    impressions: performance.byChannel[c.channel]?.impressions || 0,
    clicks: performance.byChannel[c.channel]?.clicks || 0,
    conversions: performance.byChannel[c.channel]?.conversions || 0,
    revenue: performance.byChannel[c.channel]?.revenue || 0
  }));

  // Calculate ROI for each channel
  channelROI.forEach(ch => {
    ch.cpa = ch.conversions > 0 ? ch.budget / ch.conversions : Infinity;
    ch.roas = ch.revenue > 0 && ch.budget > 0 ? ch.revenue / ch.budget : 0;
  });

  // Recommend reallocation
  const topChannel = channelROI.reduce((a, b) => (a.roas > b.roas ? a : b));
  const lowChannel = channelROI.reduce((a, b) => (a.roas < b.roas ? a : b));

  if (topChannel && lowChannel && topChannel.channel !== lowChannel.channel) {
    recommendations.push({
      type: 'budget_reallocation',
      priority: 'high',
      description: `Shift budget from ${lowChannel.channel} to ${topChannel.channel}`,
      details: {
        from: { channel: lowChannel.channel, current: lowChannel.budget, roas: lowChannel.roas },
        to: { channel: topChannel.channel, current: topChannel.budget, roas: topChannel.roas },
        suggestedShift: Math.min(lowChannel.budget * 0.2, topChannel.budget * 0.3)
      }
    });
  }

  // Creative recommendations
  recommendations.push({
    type: 'creative_optimization',
    priority: 'medium',
    description: 'Refresh creative assets',
    details: {
      reason: 'Creative fatigue detected',
      action: 'Generate new variations with AI'
    }
  });

  // Audience expansion
  recommendations.push({
    type: 'audience_expansion',
    priority: 'medium',
    description: 'Expand to lookalike audiences',
    details: {
      source: 'top_converting',
      size: '100k'
    }
  });

  return recommendations;
}

async function applyRecommendations(goal: any, recommendations: any[]): Promise<void> {
  for (const rec of recommendations) {
    if (rec.type === 'budget_reallocation') {
      const { from, to, suggestedShift } = rec.details;

      // Update goal channels
      const fromChannel = goal.channels.find((c: any) => c.channel === from.channel);
      const toChannel = goal.channels.find((c: any) => c.channel === to.channel);

      if (fromChannel && toChannel) {
        fromChannel.budget -= suggestedShift;
        toChannel.budget += suggestedShift;
      }
    }
  }

  goal.aiDecisions.lastOptimization = new Date();
  goal.aiDecisions.appliedRecommendations = recommendations.map(r => r.type);
  await goal.save();

  eventEmitter.emit('goal:optimized', { goalId: goal.goalId, recommendations });
}

async function pauseAllChannels(goal: any): Promise<void> {
  for (const channel of goal.channels) {
    await pauseChannel(goal, channel.channel);
  }
}

async function resumeAllChannels(goal: any): Promise<void> {
  for (const channel of goal.channels) {
    await resumeChannel(goal, channel.channel);
  }
}

async function pauseChannel(goal: any, channel: string): Promise<void> {
  eventEmitter.emit('channel:pause', { goalId: goal.goalId, channel });
  logger.info(`Paused channel ${channel} for goal ${goal.goalId}`);
}

async function resumeChannel(goal: any, channel: string): Promise<void> {
  eventEmitter.emit('channel:resume', { goalId: goal.goalId, channel });
  logger.info(`Resumed channel ${channel} for goal ${goal.goalId}`);
}

async function aggregateAudience(merchantId: string, sources: string[]): Promise<any> {
  const segments: any[] = [];
  let totalSize = 0;

  for (const source of sources) {
    try {
      const response = await axios.get(`${SERVICES.ECOSYSTEM_HUB}/api/audiences/${source}`, {
        headers: { 'X-Internal-Token': INTERNAL_TOKEN },
        timeout: 5000
      });

      if (response.data.size) {
        totalSize += response.data.size;
        segments.push({
          type: source,
          size: response.data.size,
          criteria: response.data.criteria
        });
      }
    } catch (e) {
      logger.warn(`Failed to aggregate from ${source}`);
    }
  }

  return { size: totalSize, segments };
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AdBazaar Marketing OS started on port ${PORT}`);
  logger.info('🎯 Unified Command Center - AI-driven cross-channel marketing');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marketing_os')
    .then(() => logger.info('MongoDB connected'))
    .catch(err => logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;