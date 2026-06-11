/**
 * Campaign Orchestration Service
 * Multi-channel campaigns, A/B testing, and sequencing for CRM
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3023;
const SERVICE_NAME = 'campaign-orchestration-service';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// ============================================================================
// Types and Interfaces
// ============================================================================

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
export type CampaignType = 'promotional' | 'transactional' | 'nurture' | 're-engagement' | 'announcement';
export type ChannelType = 'email' | 'sms' | 'whatsapp' | 'push' | 'voice';
export type ABTestStatus = 'draft' | 'running' | 'completed';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  channels: ChannelType[];
  status: CampaignStatus;
  targetAudience: TargetAudience;
  content: Record<ChannelType, CampaignContent>;
  schedule: CampaignSchedule;
  segments: string[];
  tags: string[];
  budget?: number;
  spent: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface TargetAudience {
  industry?: string[];
  customerType?: 'all' | 'new' | 'existing' | 'churned' | 'vip';
  minLifetimeValue?: number;
  maxLifetimeValue?: number;
  tags?: string[];
  excludeTags?: string[];
  lastPurchaseDays?: number;
}

export interface CampaignContent {
  subject?: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface CampaignSchedule {
  startDate?: Date;
  endDate?: Date;
  timezone: string;
  recurring?: RecurringSchedule;
}

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  timeOfDay: string;
}

export interface ABTest {
  id: string;
  campaignId: string;
  name: string;
  status: ABTestStatus;
  variants: ABTestVariant[];
  winnerId?: string;
  startDate: Date;
  endDate?: Date;
  sampleSize: number;
  confidenceLevel: number;
}

export interface ABTestVariant {
  id: string;
  name: string;
  channel: ChannelType;
  subject?: string;
  body: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
}

export interface Sequence {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
  triggers: SequenceTrigger[];
  status: 'active' | 'paused' | 'completed';
  enrolledCount: number;
  completedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SequenceStep {
  id: string;
  order: number;
  delayDays: number;
  delayHours?: number;
  channel: ChannelType;
  subject?: string;
  body: string;
  conditions?: StepCondition[];
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface SequenceTrigger {
  type: 'purchase' | 'signup' | 'abandoned_cart' | 'inactivity' | 'tag_added' | 'manual';
  conditions?: Record<string, any>;
}

export interface CampaignEnrollment {
  id: string;
  campaignId: string;
  sequenceId?: string;
  customerId: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'unsubscribed' | 'failed';
  currentStep?: number;
  stepHistory: StepHistoryEntry[];
}

export interface StepHistoryEntry {
  stepId: string;
  executedAt: Date;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

export interface CampaignMetrics {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  bounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

// ============================================================================
// In-Memory Data Stores
// ============================================================================

const campaigns: Map<string, Campaign> = new Map();
const abTests: Map<string, ABTest> = new Map();
const sequences: Map<string, Sequence> = new Map();
const enrollments: Map<string, CampaignEnrollment> = new Map();
const campaignMetrics: Map<string, CampaignMetrics> = new Map();

// ============================================================================
// Initialize Sample Data
// ============================================================================

function initializeSampleData(): void {
  // Sample campaign
  const sampleCampaign: Campaign = {
    id: uuidv4(),
    name: 'Summer Sale 2024',
    description: 'Annual summer promotional campaign',
    type: 'promotional',
    channels: ['email', 'sms'],
    status: 'draft',
    targetAudience: {
      customerType: 'all',
      tags: ['summer', 'sale']
    },
    content: {
      email: {
        subject: 'Summer Sale - Up to 50% Off!',
        body: 'Don\'t miss our biggest summer sale yet! Shop now for amazing deals.',
        ctaText: 'Shop Now',
        ctaUrl: 'https://example.com/summer-sale'
      },
      sms: {
        body: 'Summer Sale! Use code SUMMER50 for 50% off. Shop now!'
      },
      whatsapp: {
        body: 'Hi! Summer sale is here with amazing deals!'
      },
      push: {
        body: 'Summer Sale is LIVE!'
      },
      voice: {
        body: 'Hello! This is a special summer sale announcement.'
      }
    },
    schedule: {
      timezone: 'America/New_York',
      timeOfDay: '10:00'
    },
    segments: ['summer-lover', 'discount-seeker'],
    tags: ['summer', 'promo', '2024'],
    budget: 5000,
    spent: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  campaigns.set(sampleCampaign.id, sampleCampaign);

  // Sample sequence
  const welcomeSequence: Sequence = {
    id: uuidv4(),
    name: 'Welcome Series',
    description: 'Onboarding sequence for new customers',
    steps: [
      {
        id: uuidv4(),
        order: 1,
        delayHours: 1,
        channel: 'email',
        subject: 'Welcome to Our Community!',
        body: 'Welcome aboard! We\'re thrilled to have you. Let us show you around.'
      },
      {
        id: uuidv4(),
        order: 2,
        delayDays: 2,
        channel: 'email',
        subject: 'Getting Started Guide',
        body: 'Here are our top tips to get the most out of your experience.'
      },
      {
        id: uuidv4(),
        order: 3,
        delayDays: 5,
        channel: 'sms',
        body: 'Have questions? Reply to this message and we\'ll help!'
      }
    ],
    triggers: [
      { type: 'signup' },
      { type: 'purchase' }
    ],
    status: 'active',
    enrolledCount: 0,
    completedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  sequences.set(welcomeSequence.id, welcomeSequence);
}

initializeSampleData();

// ============================================================================
// Helper Functions
// ============================================================================

function calculateMetrics(campaignId: string): CampaignMetrics {
  const campaignEnrollments = Array.from(enrollments.values())
    .filter(e => e.campaignId === campaignId);

  const sent = campaignEnrollments.length;
  const delivered = Math.floor(sent * 0.95);
  const opened = Math.floor(delivered * 0.25);
  const clicked = Math.floor(opened * 0.15);
  const converted = Math.floor(clicked * 0.08);
  const unsubscribed = Math.floor(sent * 0.005);
  const bounced = sent - delivered;

  return {
    campaignId,
    sent,
    delivered,
    opened,
    clicked,
    converted,
    unsubscribed,
    bounced,
    deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
    conversionRate: clicked > 0 ? (converted / clicked) * 100 : 0,
    revenue: converted * 50
  };
}

function determineWinner(test: ABTest): string | undefined {
  if (test.variants.length < 2) return undefined;

  const minImpressions = Math.min(...test.variants.map(v => v.impressions));
  if (minImpressions < test.sampleSize / test.variants.length) return undefined;

  const sortedVariants = [...test.variants].sort((a, b) => b.conversionRate - a.conversionRate);
  const winner = sortedVariants[0];
  const runnerUp = sortedVariants[1];

  const zScore = Math.abs(winner.conversionRate - runnerUp.conversionRate) /
    Math.sqrt((winner.conversionRate * (1 - winner.conversionRate) / winner.impressions) +
              (runnerUp.conversionRate * (1 - runnerUp.conversionRate) / runnerUp.impressions));

  if (zScore >= 1.96) {
    return winner.id;
  }

  return undefined;
}

// ============================================================================
// Campaign Routes
// ============================================================================

/**
 * Create a new campaign
 */
app.post('/api/campaigns', (req: Request, res: Response) => {
  try {
    const { name, description, type, channels, targetAudience, content, schedule, segments, tags, budget } = req.body;

    if (!name || !channels || channels.length === 0) {
      res.status(400).json({ error: 'Name and at least one channel are required' });
      return;
    }

    const campaign: Campaign = {
      id: uuidv4(),
      name,
      description: description || '',
      type: type || 'promotional',
      channels,
      status: 'draft',
      targetAudience: targetAudience || { customerType: 'all' },
      content: content || {} as Record<ChannelType, CampaignContent>,
      schedule: schedule || { timezone: 'UTC' },
      segments: segments || [],
      tags: tags || [],
      budget,
      spent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    campaigns.set(campaign.id, campaign);
    logger.info(`Campaign created: ${campaign.id}`);
    res.status(201).json(campaign);
  } catch (error) {
    logger.error(`Error creating campaign: ${error}`);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * Get all campaigns
 */
app.get('/api/campaigns', (req: Request, res: Response) => {
  const { status, type, tag } = req.query;

  let filtered = Array.from(campaigns.values());

  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  if (type) {
    filtered = filtered.filter(c => c.type === type);
  }
  if (tag) {
    filtered = filtered.filter(c => c.tags.includes(tag as string));
  }

  res.json(filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
});

/**
 * Get campaign by ID
 */
app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  res.json(campaign);
});

/**
 * Update campaign
 */
app.put('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const updates = req.body;
  Object.assign(campaign, updates, { updatedAt: new Date() });
  res.json(campaign);
});

/**
 * Update campaign status
 */
app.patch('/api/campaigns/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const validStatuses: CampaignStatus[] = ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  campaign.status = status;
  campaign.updatedAt = new Date();

  if (status === 'running' && !campaign.startedAt) {
    campaign.startedAt = new Date();
  }
  if (['completed', 'cancelled'].includes(status)) {
    campaign.completedAt = new Date();
  }

  res.json(campaign);
});

/**
 * Launch campaign
 */
app.post('/api/campaigns/:id/launch', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    res.status(400).json({ error: 'Campaign cannot be launched in current status' });
    return;
  }

  campaign.status = 'running';
  campaign.startedAt = new Date();
  campaign.updatedAt = new Date();

  logger.info(`Campaign launched: ${campaign.id}`);
  res.json(campaign);
});

/**
 * Get campaign metrics
 */
app.get('/api/campaigns/:id/metrics', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const metrics = calculateMetrics(campaign.id);
  campaignMetrics.set(campaign.id, metrics);
  res.json(metrics);
});

// ============================================================================
// A/B Test Routes
// ============================================================================

/**
 * Create A/B test for campaign
 */
app.post('/api/campaigns/:id/ab-tests', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const { name, variants, sampleSize, confidenceLevel } = req.body;

  if (!name || !variants || variants.length < 2) {
    res.status(400).json({ error: 'Name and at least 2 variants are required' });
    return;
  }

  const abTest: ABTest = {
    id: uuidv4(),
    campaignId: campaign.id,
    name,
    status: 'draft',
    variants: variants.map((v: any) => ({
      id: uuidv4(),
      name: v.name,
      channel: v.channel || 'email',
      subject: v.subject,
      body: v.body,
      impressions: 0,
      conversions: 0,
      conversionRate: 0
    })),
    sampleSize: sampleSize || 1000,
    confidenceLevel: confidenceLevel || 0.95,
    startDate: new Date()
  };

  abTests.set(abTest.id, abTest);
  res.status(201).json(abTest);
});

/**
 * Get A/B tests for campaign
 */
app.get('/api/campaigns/:id/ab-tests', (req: Request, res: Response) => {
  const tests = Array.from(abTests.values())
    .filter(t => t.campaignId === req.params.id);
  res.json(tests);
});

/**
 * Start A/B test
 */
app.post('/api/ab-tests/:id/start', (req: Request, res: Response) => {
  const test = abTests.get(req.params.id);
  if (!test) {
    res.status(404).json({ error: 'A/B test not found' });
    return;
  }

  test.status = 'running';
  test.startDate = new Date();
  res.json(test);
});

/**
 * Record A/B test result
 */
app.post('/api/ab-tests/:id/results', (req: Request, res: Response) => {
  const { variantId, impressions, conversions } = req.body;
  const test = abTests.get(req.params.id);

  if (!test) {
    res.status(404).json({ error: 'A/B test not found' });
    return;
  }

  const variant = test.variants.find(v => v.id === variantId);
  if (!variant) {
    res.status(404).json({ error: 'Variant not found' });
    return;
  }

  variant.impressions += impressions || 0;
  variant.conversions += conversions || 0;
  variant.conversionRate = variant.impressions > 0
    ? (variant.conversions / variant.impressions) * 100
    : 0;

  const winner = determineWinner(test);
  if (winner) {
    test.winnerId = winner;
    test.status = 'completed';
    test.endDate = new Date();
  }

  res.json(test);
});

/**
 * Get A/B test by ID
 */
app.get('/api/ab-tests/:id', (req: Request, res: Response) => {
  const test = abTests.get(req.params.id);
  if (!test) {
    res.status(404).json({ error: 'A/B test not found' });
    return;
  }
  res.json(test);
});

// ============================================================================
// Sequence Routes
// ============================================================================

/**
 * Create a new sequence
 */
app.post('/api/sequences', (req: Request, res: Response) => {
  const { name, description, steps, triggers } = req.body;

  if (!name || !steps || steps.length === 0) {
    res.status(400).json({ error: 'Name and at least one step are required' });
    return;
  }

  const sequence: Sequence = {
    id: uuidv4(),
    name,
    description: description || '',
    steps: steps.map((s: any, index: number) => ({
      id: s.id || uuidv4(),
      order: index + 1,
      delayDays: s.delayDays || 0,
      delayHours: s.delayHours,
      channel: s.channel || 'email',
      subject: s.subject,
      body: s.body,
      conditions: s.conditions
    })),
    triggers: triggers || [{ type: 'manual' }],
    status: 'active',
    enrolledCount: 0,
    completedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  sequences.set(sequence.id, sequence);
  res.status(201).json(sequence);
});

/**
 * Get all sequences
 */
app.get('/api/sequences', (req: Request, res: Response) => {
  const { status } = req.query;

  let filtered = Array.from(sequences.values());
  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }

  res.json(filtered);
});

/**
 * Get sequence by ID
 */
app.get('/api/sequences/:id', (req: Request, res: Response) => {
  const sequence = sequences.get(req.params.id);
  if (!sequence) {
    res.status(404).json({ error: 'Sequence not found' });
    return;
  }
  res.json(sequence);
});

/**
 * Update sequence
 */
app.put('/api/sequences/:id', (req: Request, res: Response) => {
  const sequence = sequences.get(req.params.id);
  if (!sequence) {
    res.status(404).json({ error: 'Sequence not found' });
    return;
  }

  const { name, description, steps, triggers, status } = req.body;
  if (name) sequence.name = name;
  if (description) sequence.description = description;
  if (steps) {
    sequence.steps = steps.map((s: any, index: number) => ({
      id: s.id || uuidv4(),
      order: index + 1,
      delayDays: s.delayDays || 0,
      delayHours: s.delayHours,
      channel: s.channel || 'email',
      subject: s.subject,
      body: s.body,
      conditions: s.conditions
    }));
  }
  if (triggers) sequence.triggers = triggers;
  if (status) sequence.status = status;
  sequence.updatedAt = new Date();

  res.json(sequence);
});

/**
 * Enroll customer in sequence
 */
app.post('/api/sequences/:id/enroll', (req: Request, res: Response) => {
  const { customerId, campaignId } = req.body;

  if (!customerId) {
    res.status(400).json({ error: 'Customer ID is required' });
    return;
  }

  const sequence = sequences.get(req.params.id);
  if (!sequence) {
    res.status(404).json({ error: 'Sequence not found' });
    return;
  }

  const enrollment: CampaignEnrollment = {
    id: uuidv4(),
    campaignId: campaignId || '',
    sequenceId: sequence.id,
    customerId,
    enrolledAt: new Date(),
    status: 'active',
    currentStep: 1,
    stepHistory: []
  };

  enrollments.set(enrollment.id, enrollment);
  sequence.enrolledCount++;

  logger.info(`Customer ${customerId} enrolled in sequence ${sequence.id}`);
  res.status(201).json(enrollment);
});

// ============================================================================
// Enrollment Routes
// ============================================================================

/**
 * Get enrollments for campaign or sequence
 */
app.get('/api/enrollments', (req: Request, res: Response) => {
  const { campaignId, sequenceId, status, customerId } = req.query;

  let filtered = Array.from(enrollments.values());

  if (campaignId) {
    filtered = filtered.filter(e => e.campaignId === campaignId);
  }
  if (sequenceId) {
    filtered = filtered.filter(e => e.sequenceId === sequenceId);
  }
  if (status) {
    filtered = filtered.filter(e => e.status === status);
  }
  if (customerId) {
    filtered = filtered.filter(e => e.customerId === customerId);
  }

  res.json(filtered);
});

/**
 * Update enrollment status
 */
app.patch('/api/enrollments/:id', (req: Request, res: Response) => {
  const enrollment = enrollments.get(req.params.id);
  if (!enrollment) {
    res.status(404).json({ error: 'Enrollment not found' });
    return;
  }

  const { status, currentStep } = req.body;
  if (status) enrollment.status = status;
  if (currentStep !== undefined) enrollment.currentStep = currentStep;

  res.json(enrollment);
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      campaigns: campaigns.size,
      abTests: abTests.size,
      sequences: sequences.size,
      enrollments: enrollments.size
    }
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Server Start
// ============================================================================

app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

export default app;
