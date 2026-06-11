/**
 * Omnichannel Engagement Service
 * Journey tracking, channel preferences, and analytics for CRM
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3025;
const SERVICE_NAME = 'omnichannel-engagement-service';

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

export type ChannelType = 'email' | 'sms' | 'whatsapp' | 'push' | 'voice' | 'in_app' | 'web' | 'social';
export type JourneyStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type TouchpointType = 'impression' | 'click' | 'open' | 'conversion' | 'unsubscribe' | 'support';
export type EngagementScoreLevel = 'cold' | 'warm' | 'hot' | 'advocate';

export interface CustomerProfile {
  id: string;
  customerId: string;
  preferredChannels: ChannelType[];
  channelScores: Record<ChannelType, ChannelScore>;
  lastEngagedAt: Date;
  engagementFrequency: EngagementFrequency;
  optedOutChannels: ChannelType[];
  devices: DeviceInfo[];
  locations: LocationInfo[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelScore {
  totalInteractions: number;
  positiveInteractions: number;
  negativeInteractions: number;
  lastInteraction: Date;
  responseRate: number;
  avgResponseTime: number;
}

export interface EngagementFrequency {
  daily: number;
  weekly: number;
  monthly: number;
  lastUpdated: Date;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  firstSeen: Date;
  lastSeen: Date;
}

export interface LocationInfo {
  city?: string;
  country?: string;
  timezone: string;
  firstSeen: Date;
  lastSeen: Date;
}

export interface CustomerJourney {
  id: string;
  customerId: string;
  name: string;
  status: JourneyStatus;
  startDate: Date;
  endDate?: Date;
  touchpoints: Touchpoint[];
  currentStep: number;
  metadata: Record<string, any>;
}

export interface Touchpoint {
  id: string;
  journeyId: string;
  channel: ChannelType;
  type: TouchpointType;
  campaignId?: string;
  messageId?: string;
  content?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface ChannelPreference {
  id: string;
  customerId: string;
  channel: ChannelType;
  enabled: boolean;
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
  quietHoursStart?: string;
  quietHoursEnd?: string;
  notificationSettings: Record<string, boolean>;
  updatedAt: Date;
}

export interface EngagementMetrics {
  customerId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  totalTouchpoints: number;
  byChannel: Record<ChannelType, number>;
  byType: Record<TouchpointType, number>;
  engagementScore: number;
  engagementLevel: EngagementScoreLevel;
  conversionRate: number;
  churnRisk: number;
}

export interface JourneyTemplate {
  id: string;
  name: string;
  description: string;
  steps: JourneyStepTemplate[];
  triggers: JourneyTrigger[];
  active: boolean;
  createdAt: Date;
}

export interface JourneyStepTemplate {
  order: number;
  channel: ChannelType;
  template: string;
  delayDays: number;
  conditions?: StepCondition[];
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface JourneyTrigger {
  type: 'purchase' | 'signup' | 'abandoned_cart' | 'inactivity' | 'birthday' | 'manual';
  conditions?: Record<string, any>;
}

// ============================================================================
// In-Memory Data Stores
// ============================================================================

const customerProfiles: Map<string, CustomerProfile> = new Map();
const journeys: Map<string, CustomerJourney> = new Map();
const touchpoints: Map<string, Touchpoint> = new Map();
const channelPreferences: Map<string, ChannelPreference> = new Map();
const journeyTemplates: Map<string, JourneyTemplate> = new Map();
const engagementMetrics: Map<string, EngagementMetrics> = new Map();

// ============================================================================
// Initialize Sample Data
// ============================================================================

function initializeSampleData(): void {
  // Sample journey template
  const welcomeJourney: JourneyTemplate = {
    id: uuidv4(),
    name: 'Welcome Journey',
    description: 'Onboarding journey for new customers',
    steps: [
      { order: 1, channel: 'email', template: 'welcome-email', delayDays: 0 },
      { order: 2, channel: 'in_app', template: 'getting-started', delayDays: 1 },
      { order: 3, channel: 'sms', template: 'check-in', delayDays: 3 },
      { order: 4, channel: 'email', template: 'tip-of-the-day', delayDays: 7 }
    ],
    triggers: [{ type: 'signup' }],
    active: true,
    createdAt: new Date()
  };
  journeyTemplates.set(welcomeJourney.id, welcomeJourney);

  const reEngagementJourney: JourneyTemplate = {
    id: uuidv4(),
    name: 'Re-Engagement Journey',
    description: 'Win back inactive customers',
    steps: [
      { order: 1, channel: 'email', template: 'we-miss-you', delayDays: 0 },
      { order: 2, channel: 'sms', template: 'special-offer', delayDays: 3 },
      { order: 3, channel: 'push', template: 'last-chance', delayDays: 7 },
      { order: 4, channel: 'email', template: 'goodbye', delayDays: 14 }
    ],
    triggers: [{ type: 'inactivity', conditions: { days: 30 } }],
    active: true,
    createdAt: new Date()
  };
  journeyTemplates.set(reEngagementJourney.id, reEngagementJourney);
}

initializeSampleData();

// ============================================================================
// Helper Functions
// ============================================================================

function calculateEngagementScore(profile: CustomerProfile): { score: number; level: EngagementScoreLevel } {
  const channelWeights: Record<ChannelType, number> = {
    email: 1, sms: 1.2, whatsapp: 1.5, push: 1.3, voice: 0.8, in_app: 1.4, web: 1, social: 0.7
  };

  let totalScore = 0;
  let totalWeight = 0;

  for (const [channel, score] of Object.entries(profile.channelScores)) {
    const weight = channelWeights[channel as ChannelType] || 1;
    const responseWeight = score.responseRate * 0.6;
    const recencyWeight = Math.max(0, 1 - (Date.now() - new Date(score.lastInteraction).getTime()) / (7 * 24 * 60 * 60 * 1000));

    totalScore += (responseWeight + recencyWeight) * weight * 10;
    totalWeight += weight;
  }

  const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  let level: EngagementScoreLevel;
  if (normalizedScore >= 80) level = 'advocate';
  else if (normalizedScore >= 60) level = 'hot';
  else if (normalizedScore >= 30) level = 'warm';
  else level = 'cold';

  return { score: Math.min(100, normalizedScore), level };
}

function detectChurnRisk(profile: CustomerProfile): number {
  const daysSinceLastEngagement = (Date.now() - new Date(profile.lastEngagedAt).getTime()) / (24 * 60 * 60 * 1000);

  if (daysSinceLastEngagement > 60) return 0.9;
  if (daysSinceLastEngagement > 30) return 0.7;
  if (daysSinceLastEngagement > 14) return 0.4;
  if (daysSinceLastEngagement > 7) return 0.2;
  return 0;
}

function updateChannelScore(profile: CustomerProfile, channel: ChannelType, positive: boolean): void {
  if (!profile.channelScores[channel]) {
    profile.channelScores[channel] = {
      totalInteractions: 0,
      positiveInteractions: 0,
      negativeInteractions: 0,
      lastInteraction: new Date(),
      responseRate: 0,
      avgResponseTime: 0
    };
  }

  const score = profile.channelScores[channel];
  score.totalInteractions++;
  if (positive) score.positiveInteractions++;
  else score.negativeInteractions++;
  score.lastInteraction = new Date();
  score.responseRate = score.positiveInteractions / score.totalInteractions;
}

// ============================================================================
// Routes - Customer Profiles
// ============================================================================

/**
 * Create or update customer profile
 */
app.post('/api/profiles', (req: Request, res: Response) => {
  const { customerId, preferredChannels, devices, locations } = req.body;

  if (!customerId) {
    res.status(400).json({ error: 'Customer ID is required' });
    return;
  }

  let profile = Array.from(customerProfiles.values()).find(p => p.customerId === customerId);

  if (!profile) {
    const channelScores: Record<ChannelType, ChannelScore> = {} as Record<ChannelType, ChannelScore>;
    const channels: ChannelType[] = ['email', 'sms', 'whatsapp', 'push', 'in_app'];

    channels.forEach(ch => {
      channelScores[ch] = {
        totalInteractions: 0,
        positiveInteractions: 0,
        negativeInteractions: 0,
        lastInteraction: new Date(),
        responseRate: 0,
        avgResponseTime: 0
      };
    });

    profile = {
      id: uuidv4(),
      customerId,
      preferredChannels: preferredChannels || ['email'],
      channelScores,
      lastEngagedAt: new Date(),
      engagementFrequency: { daily: 0, weekly: 0, monthly: 0, lastUpdated: new Date() },
      optedOutChannels: [],
      devices: devices || [],
      locations: locations || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    customerProfiles.set(profile.id, profile);
  }

  res.status(201).json(profile);
});

/**
 * Get customer profile
 */
app.get('/api/profiles/:customerId', (req: Request, res: Response) => {
  const profile = Array.from(customerProfiles.values()).find(p => p.customerId === req.params.customerId);

  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  const { score, level } = calculateEngagementScore(profile);
  const churnRisk = detectChurnRisk(profile);

  res.json({
    ...profile,
    engagementScore: score,
    engagementLevel: level,
    churnRisk
  });
});

/**
 * Get all profiles
 */
app.get('/api/profiles', (req: Request, res: Response) => {
  const { engagementLevel, channel } = req.query;

  let filtered = Array.from(customerProfiles.values());

  if (engagementLevel) {
    filtered = filtered.filter(p => {
      const { level } = calculateEngagementScore(p);
      return level === engagementLevel;
    });
  }

  if (channel) {
    filtered = filtered.filter(p => p.preferredChannels.includes(channel as ChannelType));
  }

  res.json(filtered.map(p => {
    const { score, level } = calculateEngagementScore(p);
    return { ...p, engagementScore: score, engagementLevel: level };
  }));
});

/**
 * Update customer profile
 */
app.put('/api/profiles/:customerId', (req: Request, res: Response) => {
  const profile = Array.from(customerProfiles.values()).find(p => p.customerId === req.params.customerId);

  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  const { preferredChannels, optedOutChannels, devices, locations } = req.body;

  if (preferredChannels) profile.preferredChannels = preferredChannels;
  if (optedOutChannels) profile.optedOutChannels = optedOutChannels;
  if (devices) profile.devices = devices;
  if (locations) profile.locations = locations;
  profile.updatedAt = new Date();

  res.json(profile);
});

// ============================================================================
// Routes - Touchpoints
// ============================================================================

/**
 * Record touchpoint
 */
app.post('/api/touchpoints', (req: Request, res: Response) => {
  const { customerId, channel, type, campaignId, messageId, content, metadata } = req.body;

  if (!customerId || !channel || !type) {
    res.status(400).json({ error: 'Customer ID, channel, and type are required' });
    return;
  }

  // Find or create profile
  let profile = Array.from(customerProfiles.values()).find(p => p.customerId === customerId);
  if (!profile) {
    const profileRes = await new Promise((resolve) => {
      const mockReq = { body: { customerId } };
      app._router.handle({ ...mockReq, method: 'POST', url: '/api/profiles' }, { json: resolve, status: resolve });
    });
  }

  const touchpoint: Touchpoint = {
    id: uuidv4(),
    journeyId: '',
    customerId,
    channel,
    type,
    campaignId,
    messageId,
    content,
    timestamp: new Date(),
    metadata: metadata || {}
  };

  touchpoints.set(touchpoint.id, touchpoint);

  // Update profile
  if (profile) {
    profile.lastEngagedAt = new Date();
    updateChannelScore(profile, channel, type !== 'unsubscribe');
  }

  logger.info(`Touchpoint recorded: ${touchpoint.id}`);
  res.status(201).json(touchpoint);
});

/**
 * Get touchpoints for customer
 */
app.get('/api/touchpoints/:customerId', (req: Request, res: Response) => {
  const { channel, type, startDate, endDate, limit } = req.query;

  let filtered = Array.from(touchpoints.values())
    .filter(t => t.customerId === req.params.customerId);

  if (channel) {
    filtered = filtered.filter(t => t.channel === channel);
  }
  if (type) {
    filtered = filtered.filter(t => t.type === type);
  }
  if (startDate) {
    filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(startDate as string));
  }
  if (endDate) {
    filtered = filtered.filter(t => new Date(t.timestamp) <= new Date(endDate as string));
  }

  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const limitNum = limit ? parseInt(limit as string) : 100;
  res.json(filtered.slice(0, limitNum));
});

// ============================================================================
// Routes - Journeys
// ============================================================================

/**
 * Create journey
 */
app.post('/api/journeys', (req: Request, res: Response) => {
  const { customerId, name, templateId, metadata } = req.body;

  if (!customerId || !name) {
    res.status(400).json({ error: 'Customer ID and name are required' });
    return;
  }

  let steps: JourneyStepTemplate[] = [];

  if (templateId) {
    const template = journeyTemplates.get(templateId);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    steps = template.steps;
  }

  const journey: CustomerJourney = {
    id: uuidv4(),
    customerId,
    name,
    status: 'active',
    startDate: new Date(),
    touchpoints: [],
    currentStep: 0,
    metadata: metadata || {}
  };

  journeys.set(journey.id, journey);
  logger.info(`Journey created: ${journey.id}`);
  res.status(201).json({ ...journey, steps });
});

/**
 * Get customer journeys
 */
app.get('/api/journeys', (req: Request, res: Response) => {
  const { customerId, status } = req.query;

  let filtered = Array.from(journeys.values());

  if (customerId) {
    filtered = filtered.filter(j => j.customerId === customerId);
  }
  if (status) {
    filtered = filtered.filter(j => j.status === status);
  }

  res.json(filtered);
});

/**
 * Get journey by ID
 */
app.get('/api/journeys/:id', (req: Request, res: Response) => {
  const journey = journeys.get(req.params.id);
  if (!journey) {
    res.status(404).json({ error: 'Journey not found' });
    return;
  }
  res.json(journey);
});

/**
 * Update journey status
 */
app.patch('/api/journeys/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const journey = journeys.get(req.params.id);

  if (!journey) {
    res.status(404).json({ error: 'Journey not found' });
    return;
  }

  const validStatuses: JourneyStatus[] = ['active', 'paused', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  journey.status = status;
  if (status === 'completed' || status === 'cancelled') {
    journey.endDate = new Date();
  }

  res.json(journey);
});

/**
 * Advance journey step
 */
app.post('/api/journeys/:id/advance', (req: Request, res: Response) => {
  const journey = journeys.get(req.params.id);

  if (!journey) {
    res.status(404).json({ error: 'Journey not found' });
    return;
  }

  if (journey.status !== 'active') {
    res.status(400).json({ error: 'Journey is not active' });
    return;
  }

  journey.currentStep++;
  if (journey.currentStep >= 10) {
    journey.status = 'completed';
    journey.endDate = new Date();
  }

  res.json(journey);
});

// ============================================================================
// Routes - Channel Preferences
// ============================================================================

/**
 * Set channel preference
 */
app.post('/api/channel-preferences', (req: Request, res: Response) => {
  const { customerId, channel, enabled, frequency, quietHoursStart, quietHoursEnd, notificationSettings } = req.body;

  if (!customerId || !channel) {
    res.status(400).json({ error: 'Customer ID and channel are required' });
    return;
  }

  const prefKey = `${customerId}-${channel}`;
  let preference = channelPreferences.get(prefKey);

  if (!preference) {
    preference = {
      id: uuidv4(),
      customerId,
      channel,
      enabled: enabled !== false,
      frequency: frequency || 'realtime',
      notificationSettings: {},
      updatedAt: new Date()
    };
    channelPreferences.set(prefKey, preference);
  }

  if (enabled !== undefined) preference.enabled = enabled;
  if (frequency) preference.frequency = frequency;
  if (quietHoursStart !== undefined) preference.quietHoursStart = quietHoursStart;
  if (quietHoursEnd !== undefined) preference.quietHoursEnd = quietHoursEnd;
  if (notificationSettings) preference.notificationSettings = notificationSettings;
  preference.updatedAt = new Date();

  res.status(201).json(preference);
});

/**
 * Get channel preferences for customer
 */
app.get('/api/channel-preferences/:customerId', (req: Request, res: Response) => {
  const preferences = Array.from(channelPreferences.values())
    .filter(p => p.customerId === req.params.customerId);
  res.json(preferences);
});

/**
 * Opt out of channel
 */
app.post('/api/opt-out', (req: Request, res: Response) => {
  const { customerId, channel } = req.body;

  if (!customerId || !channel) {
    res.status(400).json({ error: 'Customer ID and channel are required' });
    return;
  }

  const profile = Array.from(customerProfiles.values()).find(p => p.customerId === customerId);
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  if (!profile.optedOutChannels.includes(channel)) {
    profile.optedOutChannels.push(channel);
    profile.updatedAt = new Date();
  }

  res.json({ success: true, optedOutChannels: profile.optedOutChannels });
});

// ============================================================================
// Routes - Journey Templates
// ============================================================================

/**
 * Create journey template
 */
app.post('/api/journey-templates', (req: Request, res: Response) => {
  const { name, description, steps, triggers } = req.body;

  if (!name || !steps || steps.length === 0) {
    res.status(400).json({ error: 'Name and steps are required' });
    return;
  }

  const template: JourneyTemplate = {
    id: uuidv4(),
    name,
    description: description || '',
    steps,
    triggers: triggers || [{ type: 'manual' }],
    active: true,
    createdAt: new Date()
  };

  journeyTemplates.set(template.id, template);
  res.status(201).json(template);
});

/**
 * Get journey templates
 */
app.get('/api/journey-templates', (req: Request, res: Response) => {
  const { active } = req.query;

  let filtered = Array.from(journeyTemplates.values());
  if (active !== undefined) {
    filtered = filtered.filter(t => t.active === (active === 'true'));
  }

  res.json(filtered);
});

// ============================================================================
// Routes - Analytics
// ============================================================================

/**
 * Get engagement metrics
 */
app.get('/api/analytics', (req: Request, res: Response) => {
  const { customerId, period } = req.query;
  const p = (period as 'day' | 'week' | 'month' | 'quarter' | 'year') || 'month';

  if (customerId) {
    const profile = Array.from(customerProfiles.values()).find(p => p.customerId === customerId);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const { score, level } = calculateEngagementScore(profile);
    const touchpointList = Array.from(touchpoints.values())
      .filter(t => t.customerId === customerId);

    const byChannel: Record<ChannelType, number> = {} as Record<ChannelType, number>;
    const byType: Record<TouchpointType, number> = {} as Record<TouchpointType, number>;

    touchpointList.forEach(t => {
      byChannel[t.channel] = (byChannel[t.channel] || 0) + 1;
      byType[t.type] = (byType[t.type] || 0) + 1;
    });

    const metrics: EngagementMetrics = {
      customerId,
      period: p,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      totalTouchpoints: touchpointList.length,
      byChannel,
      byType,
      engagementScore: score,
      engagementLevel: level,
      conversionRate: byType.conversion || 0 / (byType.impression || 1),
      churnRisk: detectChurnRisk(profile)
    };

    res.json(metrics);
  } else {
    // Overall analytics
    const allProfiles = Array.from(customerProfiles.values());
    const allTouchpoints = Array.from(touchpoints.values());

    const engagementLevels = allProfiles.map(p => {
      const { level } = calculateEngagementScore(p);
      return level;
    });

    const levelCounts: Record<EngagementScoreLevel, number> = {
      cold: 0, warm: 0, hot: 0, advocate: 0
    };
    engagementLevels.forEach(l => levelCounts[l]++);

    res.json({
      totalCustomers: allProfiles.length,
      totalTouchpoints: allTouchpoints.length,
      engagementLevelDistribution: levelCounts,
      averageEngagementScore: allProfiles.length > 0
        ? allProfiles.reduce((sum, p) => {
            const { score } = calculateEngagementScore(p);
            return sum + score;
          }, 0) / allProfiles.length
        : 0
    });
  }
});

/**
 * Get channel performance
 */
app.get('/api/analytics/channels', (req: Request, res: Response) => {
  const allProfiles = Array.from(customerProfiles.values());
  const channels: ChannelType[] = ['email', 'sms', 'whatsapp', 'push', 'in_app', 'web', 'social', 'voice'];

  const channelStats = channels.map(channel => {
    const profilesWithChannel = allProfiles.filter(p => p.preferredChannels.includes(channel));
    const avgScore = profilesWithChannel.length > 0
      ? profilesWithChannel.reduce((sum, p) => {
          const { score } = calculateEngagementScore(p);
          return sum + score;
        }, 0) / profilesWithChannel.length
      : 0;

    return {
      channel,
      subscriberCount: profilesWithChannel.length,
      averageEngagementScore: avgScore,
      optOutRate: allProfiles.length > 0
        ? allProfiles.filter(p => p.optedOutChannels.includes(channel)).length / allProfiles.length
        : 0
    };
  });

  res.json(channelStats);
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
      profiles: customerProfiles.size,
      journeys: journeys.size,
      touchpoints: touchpoints.size,
      templates: journeyTemplates.size
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
