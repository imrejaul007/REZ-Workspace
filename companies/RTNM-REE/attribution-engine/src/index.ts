/**
 * Attribution Engine - REE Service
 * Version: 1.0.0 | Date: June 11, 2026
 * Purpose: Marketing attribution tracking and multi-touch attribution models
 *
 * Features:
 * - Multi-touch attribution models (First Touch, Last Touch, Linear, Time-Decay, Position-Based)
 * - Conversion tracking across channels
 * - ROI calculation and reporting
 * - Channel performance analysis
 * - Customer journey mapping
 *
 * Port: 3004
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Touchpoint {
  id: string;
  sessionId: string;
  customerId: string;
  channel: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  keyword: string;
  timestamp: Date;
  revenue: number;
  interactionType: 'impression' | 'click' | 'engagement' | 'conversion';
  metadata: Record<string, unknown>;
}

interface Conversion {
  id: string;
  customerId: string;
  sessionId: string;
  touchpoints: string[];
  channel: string;
  source: string;
  revenue: number;
  conversionValue: number;
  conversionType: 'purchase' | 'signup' | 'lead' | 'download' | 'subscription';
  timestamp: Date;
  attributionModel: AttributionModel;
  attributedRevenue: Record<string, number>;
}

type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven';

interface Campaign {
  id: string;
  name: string;
  channel: string;
  budget: number;
  spent: number;
  conversions: number;
  revenue: number;
  roi: number;
  status: 'active' | 'paused' | 'completed' | 'draft';
  startDate: Date;
  endDate: Date;
}

interface Channel {
  id: string;
  name: string;
  type: 'paid' | 'organic' | 'social' | 'email' | 'direct' | 'referral';
  totalConversions: number;
  totalRevenue: number;
  attributedRevenue: number;
  roas: number;
}

interface AttributionReport {
  id: string;
  name: string;
  model: AttributionModel;
  startDate: Date;
  endDate: Date;
  totalConversions: number;
  totalRevenue: number;
  channelBreakdown: Record<string, ChannelAttribution>;
  topCampaigns: CampaignPerformance[];
  customerJourneyMetrics: JourneyMetrics;
  generatedAt: Date;
}

interface ChannelAttribution {
  channel: string;
  conversions: number;
  revenue: number;
  percentage: number;
  roas: number;
}

interface CampaignPerformance {
  campaignId: string;
  name: string;
  conversions: number;
  revenue: number;
  spend: number;
  roi: number;
}

interface JourneyMetrics {
  avgTouchpointsToConvert: number;
  avgDaysToConvert: number;
  avgRevenuePerConversion: number;
  topChannels: string[];
  conversionRate: number;
}

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

const touchpoints: Map<string, Touchpoint> = new Map();
const conversions: Map<string, Conversion> = new Map();
const campaigns: Map<string, Campaign> = new Map();
const channels: Map<string, Channel> = new Map();
const reports: Map<string, AttributionReport> = new Map();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function calculateAttribution(
  touchpointIds: string[],
  conversionRevenue: number,
  model: AttributionModel
): Record<string, number> {
  if (touchpointIds.length === 0) return {};

  const attribution: Record<string, number> = {};
  const touchpointMap = new Map<string, Touchpoint>();

  touchpointIds.forEach(id => {
    const tp = touchpoints.get(id);
    if (tp) touchpointMap.set(id, tp);
  });

  switch (model) {
    case 'first_touch':
      const firstTp = touchpointMap.get(touchpointIds[0]);
      if (firstTp) {
        attribution[firstTp.channel] = conversionRevenue;
      }
      break;

    case 'last_touch':
      const lastTp = touchpointMap.get(touchpointIds[touchpointIds.length - 1]);
      if (lastTp) {
        attribution[lastTp.channel] = conversionRevenue;
      }
      break;

    case 'linear':
      const equalShare = conversionRevenue / touchpointIds.length;
      touchpointIds.forEach(id => {
        const tp = touchpointMap.get(id);
        if (tp) {
          attribution[tp.channel] = (attribution[tp.channel] || 0) + equalShare;
        }
      });
      break;

    case 'time_decay':
      const decayFactor = 0.5;
      let totalWeight = 0;
      const weights: number[] = [];

      touchpointIds.forEach((_, index) => {
        const weight = Math.pow(decayFactor, touchpointIds.length - index - 1);
        weights.push(weight);
        totalWeight += weight;
      });

      touchpointIds.forEach((id, index) => {
        const tp = touchpointMap.get(id);
        if (tp) {
          const share = (weights[index] / totalWeight) * conversionRevenue;
          attribution[tp.channel] = (attribution[tp.channel] || 0) + share;
        }
      });
      break;

    case 'position_based':
      const firstWeight = 0.4;
      const lastWeight = 0.4;
      const middleWeight = 0.2;

      if (touchpointIds.length === 1) {
        const tp = touchpointMap.get(touchpointIds[0]);
        if (tp) attribution[tp.channel] = conversionRevenue;
      } else if (touchpointIds.length === 2) {
        const half = conversionRevenue / 2;
        touchpointIds.forEach(id => {
          const tp = touchpointMap.get(id);
          if (tp) attribution[tp.channel] = (attribution[tp.channel] || 0) + half;
        });
      } else {
        const firstTp = touchpointMap.get(touchpointIds[0]);
        const lastTp = touchpointMap.get(touchpointIds[touchpointIds.length - 1]);

        if (firstTp) attribution[firstTp.channel] = conversionRevenue * firstWeight;
        if (lastTp) attribution[lastTp.channel] = (attribution[lastTp.channel] || 0) + conversionRevenue * lastWeight;

        const middleCount = touchpointIds.length - 2;
        const middleShare = (conversionRevenue * middleWeight) / middleCount;

        for (let i = 1; i < touchpointIds.length - 1; i++) {
          const tp = touchpointMap.get(touchpointIds[i]);
          if (tp) attribution[tp.channel] = (attribution[tp.channel] || 0) + middleShare;
        }
      }
      break;

    case 'data_driven':
      // Simplified data-driven: weight by recency and frequency
      const channelScores: Record<string, { count: number; recency: number }> = {};

      touchpointIds.forEach((id, index) => {
        const tp = touchpointMap.get(id);
        if (tp) {
          if (!channelScores[tp.channel]) {
            channelScores[tp.channel] = { count: 0, recency: 0 };
          }
          channelScores[tp.channel].count++;
          channelScores[tp.channel].recency = Math.max(channelScores[tp.channel].recency, touchpointIds.length - index);
        }
      });

      let totalScore = 0;
      Object.values(channelScores).forEach(score => {
        totalScore += score.count * score.recency;
      });

      Object.entries(channelScores).forEach(([channel, score]) => {
        const weight = (score.count * score.recency) / totalScore;
        attribution[channel] = conversionRevenue * weight;
      });
      break;
  }

  return attribution;
}

function calculateROI(spent: number, revenue: number): number {
  if (spent === 0) return 0;
  return ((revenue - spent) / spent) * 100;
}

function calculateROAS(spent: number, revenue: number): number {
  if (spent === 0) return 0;
  return revenue / spent;
}

// ============================================================================
// EXPRESS APP
// ============================================================================

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3004', 10);
const SERVICE_NAME = 'attribution-engine';
const SERVICE_VERSION = '1.0.0';

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Request-Id'],
}));

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
  },
 standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// ============================================================================
// HEALTH ENDPOINTS
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stats: {
      touchpoints: touchpoints.size,
      conversions: conversions.size,
      campaigns: campaigns.size,
      channels: channels.size,
    },
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (_req: Request, res: Response) => {
  res.json({
    status: 'ready',
    checks: { memory: 'ok', storage: 'ok' },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// TOUCHPOINT ENDPOINTS
// ============================================================================

// Create touchpoint
app.post('/api/touchpoints', (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      customerId,
      channel,
      source,
      medium,
      campaign,
      content,
      keyword,
      revenue,
      interactionType,
      metadata,
    } = req.body;

    if (!sessionId || !customerId || !channel) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'sessionId, customerId, and channel are required' },
      });
    }

    const touchpoint: Touchpoint = {
      id: generateId('tp'),
      sessionId,
      customerId,
      channel,
      source: source || 'direct',
      medium: medium || 'none',
      campaign: campaign || '',
      content: content || '',
      keyword: keyword || '',
      timestamp: new Date(),
      revenue: revenue || 0,
      interactionType: interactionType || 'engagement',
      metadata: metadata || {},
    };

    touchpoints.set(touchpoint.id, touchpoint);

    // Update channel stats
    const channelData = channels.get(channel) || {
      id: channel,
      name: channel,
      type: 'direct' as const,
      totalConversions: 0,
      totalRevenue: 0,
      attributedRevenue: 0,
      roas: 0,
    };
    channelData.totalRevenue += revenue || 0;
    channels.set(channel, channelData);

    res.status(201).json({
      success: true,
      data: touchpoint,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

// List touchpoints
app.get('/api/touchpoints', (req: Request, res: Response) => {
  const { customerId, sessionId, channel, startDate, endDate } = req.query;
  let filtered = Array.from(touchpoints.values());

  if (customerId) filtered = filtered.filter(tp => tp.customerId === customerId);
  if (sessionId) filtered = filtered.filter(tp => tp.sessionId === sessionId);
  if (channel) filtered = filtered.filter(tp => tp.channel === channel);
  if (startDate) filtered = filtered.filter(tp => new Date(tp.timestamp) >= new Date(startDate as string));
  if (endDate) filtered = filtered.filter(tp => new Date(tp.timestamp) <= new Date(endDate as string));

  // Sort by timestamp descending
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    success: true,
    data: filtered,
    meta: {
      total: filtered.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// Get touchpoint
app.get('/api/touchpoints/:id', (req: Request, res: Response) => {
  const touchpoint = touchpoints.get(req.params.id);
  if (!touchpoint) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Touchpoint not found' },
    });
  }

  res.json({ success: true, data: touchpoint });
});

// ============================================================================
// CONVERSION ENDPOINTS
// ============================================================================

// Create conversion
app.post('/api/conversions', (req: Request, res: Response) => {
  try {
    const {
      customerId,
      sessionId,
      touchpointIds,
      channel,
      source,
      revenue,
      conversionValue,
      conversionType,
      attributionModel,
    } = req.body;

    if (!customerId || !conversionType) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'customerId and conversionType are required' },
      });
    }

    const model: AttributionModel = attributionModel || 'last_touch';
    const rev = revenue || conversionValue || 0;
    const attributedRevenue = calculateAttribution(touchpointIds || [], rev, model);

    const conversion: Conversion = {
      id: generateId('conv'),
      customerId,
      sessionId: sessionId || generateId('sess'),
      touchpoints: touchpointIds || [],
      channel: channel || 'direct',
      source: source || 'direct',
      revenue: rev,
      conversionValue: conversionValue || rev,
      conversionType,
      timestamp: new Date(),
      attributionModel: model,
      attributedRevenue,
    };

    conversions.set(conversion.id, conversion);

    // Update channel attribution
    Object.entries(attributedRevenue).forEach(([ch, amount]) => {
      const channelData = channels.get(ch) || {
        id: ch,
        name: ch,
        type: 'direct' as const,
        totalConversions: 0,
        totalRevenue: 0,
        attributedRevenue: 0,
        roas: 0,
      };
      channelData.totalConversions++;
      channelData.attributedRevenue += amount;
      channels.set(ch, channelData);
    });

    res.status(201).json({
      success: true,
      data: conversion,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

// List conversions
app.get('/api/conversions', (req: Request, res: Response) => {
  const { customerId, channel, conversionType, model, startDate, endDate } = req.query;
  let filtered = Array.from(conversions.values());

  if (customerId) filtered = filtered.filter(c => c.customerId === customerId);
  if (channel) filtered = filtered.filter(c => c.channel === channel);
  if (conversionType) filtered = filtered.filter(c => c.conversionType === conversionType);
  if (model) filtered = filtered.filter(c => c.attributionModel === model);
  if (startDate) filtered = filtered.filter(c => new Date(c.timestamp) >= new Date(startDate as string));
  if (endDate) filtered = filtered.filter(c => new Date(c.timestamp) <= new Date(endDate as string));

  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    success: true,
    data: filtered,
    meta: {
      total: filtered.length,
      totalRevenue: filtered.reduce((sum, c) => sum + c.revenue, 0),
      timestamp: new Date().toISOString(),
    },
  });
});

// Get conversion
app.get('/api/conversions/:id', (req: Request, res: Response) => {
  const conversion = conversions.get(req.params.id);
  if (!conversion) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Conversion not found' },
    });
  }

  res.json({ success: true, data: conversion });
});

// ============================================================================
// CAMPAIGN ENDPOINTS
// ============================================================================

// Create campaign
app.post('/api/campaigns', (req: Request, res: Response) => {
  try {
    const { name, channel, budget, startDate, endDate } = req.body;

    if (!name || !channel) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name and channel are required' },
      });
    }

    const campaign: Campaign = {
      id: generateId('camp'),
      name,
      channel,
      budget: budget || 0,
      spent: 0,
      conversions: 0,
      revenue: 0,
      roi: 0,
      status: 'draft',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    campaigns.set(campaign.id, campaign);

    res.status(201).json({
      success: true,
      data: campaign,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

// List campaigns
app.get('/api/campaigns', (req: Request, res: Response) => {
  const { status, channel } = req.query;
  let filtered = Array.from(campaigns.values());

  if (status) filtered = filtered.filter(c => c.status === status);
  if (channel) filtered = filtered.filter(c => c.channel === channel);

  res.json({
    success: true,
    data: filtered,
    meta: { total: filtered.length, timestamp: new Date().toISOString() },
  });
});

// Get campaign
app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Campaign not found' },
    });
  }

  res.json({ success: true, data: campaign });
});

// Update campaign
app.put('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Campaign not found' },
    });
  }

  const { name, channel, budget, status, spent, conversions, revenue } = req.body;

  if (name) campaign.name = name;
  if (channel) campaign.channel = channel;
  if (budget !== undefined) campaign.budget = budget;
  if (status) campaign.status = status;
  if (spent !== undefined) campaign.spent = spent;
  if (conversions !== undefined) campaign.conversions = conversions;
  if (revenue !== undefined) campaign.revenue = revenue;

  campaign.roi = calculateROI(campaign.spent, campaign.revenue);

  campaigns.set(campaign.id, campaign);

  res.json({
    success: true,
    data: campaign,
    meta: { timestamp: new Date().toISOString() },
  });
});

// ============================================================================
// CHANNEL ENDPOINTS
// ============================================================================

// List channels
app.get('/api/channels', (_req: Request, res: Response) => {
  const channelList = Array.from(channels.values());

  // Calculate ROAS for each channel
  channelList.forEach(ch => {
    ch.roas = calculateROAS(ch.attributedRevenue > 0 ? ch.attributedRevenue : ch.totalRevenue, ch.totalRevenue);
  });

  res.json({
    success: true,
    data: channelList,
    meta: {
      total: channelList.length,
      totalRevenue: channelList.reduce((sum, c) => sum + c.totalRevenue, 0),
      timestamp: new Date().toISOString(),
    },
  });
});

// Get channel
app.get('/api/channels/:id', (req: Request, res: Response) => {
  const channel = channels.get(req.params.id);
  if (!channel) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Channel not found' },
    });
  }

  res.json({ success: true, data: channel });
});

// ============================================================================
// REPORT ENDPOINTS
// ============================================================================

// Generate attribution report
app.post('/api/reports', (req: Request, res: Response) => {
  try {
    const { name, model, startDate, endDate } = req.body;

    const modelType: AttributionModel = model || 'last_touch';
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Filter conversions in date range
    const relevantConversions = Array.from(conversions.values()).filter(
      c => new Date(c.timestamp) >= start && new Date(c.timestamp) <= end
    );

    // Calculate channel breakdown
    const channelBreakdown: Record<string, ChannelAttribution> = {};
    let totalRevenue = 0;

    relevantConversions.forEach(conv => {
      const attributed = calculateAttribution(conv.touchpoints, conv.revenue, modelType);
      totalRevenue += conv.revenue;

      Object.entries(attributed).forEach(([channel, amount]) => {
        if (!channelBreakdown[channel]) {
          channelBreakdown[channel] = {
            channel,
            conversions: 0,
            revenue: 0,
            percentage: 0,
            roas: 0,
          };
        }
        channelBreakdown[channel].conversions++;
        channelBreakdown[channel].revenue += amount;
      });
    });

    // Calculate percentages
    Object.values(channelBreakdown).forEach(ch => {
      ch.percentage = totalRevenue > 0 ? (ch.revenue / totalRevenue) * 100 : 0;
      ch.roas = ch.revenue > 0 ? ch.revenue /1 : 0; // Assuming $1 spend per conversion for simplicity
    });

    // Calculate journey metrics
    const allTouchpoints = Array.from(touchpoints.values()).filter(
      tp => new Date(tp.timestamp) >= start && new Date(tp.timestamp) <= end
    );

    const customerJourneys: Map<string, Touchpoint[]> = new Map();
    allTouchpoints.forEach(tp => {
      const journey = customerJourneys.get(tp.customerId) || [];
      journey.push(tp);
      customerJourneys.set(tp.customerId, journey);
    });

    const journeyLengths: number[] = [];
    const conversionTimes: number[] = [];

    customerJourneys.forEach((journey, customerId) => {
      journeyLengths.push(journey.length);

      const customerConversions = relevantConversions.filter(c => c.customerId === customerId);
      if (customerConversions.length > 0 && journey.length > 0) {
        const firstTouch = journey.reduce((earliest, tp) =>
          new Date(tp.timestamp) < new Date(earliest.timestamp) ? tp : earliest
        );
        const firstConversion = customerConversions.reduce((earliest, conv) =>
          new Date(conv.timestamp) < new Date(earliest.timestamp) ? conv : earliest
        );
        const daysToConvert = (new Date(firstConversion.timestamp).getTime() - new Date(firstTouch.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        conversionTimes.push(daysToConvert);
      }
    });

    const journeyMetrics: JourneyMetrics = {
      avgTouchpointsToConvert: journeyLengths.length > 0 ? journeyLengths.reduce((a, b) => a + b, 0) / journeyLengths.length : 0,
      avgDaysToConvert: conversionTimes.length > 0 ? conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length : 0,
      avgRevenuePerConversion: relevantConversions.length > 0 ? totalRevenue / relevantConversions.length : 0,
      topChannels: Object.entries(channelBreakdown)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([ch]) => ch),
      conversionRate: allTouchpoints.length > 0 ? (relevantConversions.length / allTouchpoints.length) * 100 : 0,
    };

    // Top campaigns
    const campaignPerformance: CampaignPerformance[] = Array.from(campaigns.values()).map(c => ({
      campaignId: c.id,
      name: c.name,
      conversions: c.conversions,
      revenue: c.revenue,
      spend: c.spent,
      roi: c.roi,
    }));

    const report: AttributionReport = {
      id: generateId('rpt'),
      name: name || `Attribution Report ${new Date().toISOString()}`,
      model: modelType,
      startDate: start,
      endDate: end,
      totalConversions: relevantConversions.length,
      totalRevenue,
      channelBreakdown,
      topCampaigns: campaignPerformance.sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      customerJourneyMetrics: journeyMetrics,
      generatedAt: new Date(),
    };

    reports.set(report.id, report);

    res.status(201).json({
      success: true,
      data: report,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
});

// List reports
app.get('/api/reports', (_req: Request, res: Response) => {
  const reportList = Array.from(reports.values());
  res.json({
    success: true,
    data: reportList,
    meta: { total: reportList.length, timestamp: new Date().toISOString() },
  });
});

// Get report
app.get('/api/reports/:id', (req: Request, res: Response) => {
  const report = reports.get(req.params.id);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Report not found' },
    });
  }

  res.json({ success: true, data: report });
});

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

// Get attribution summary
app.get('/api/analytics/summary', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const relevantConversions = Array.from(conversions.values()).filter(
    c => new Date(c.timestamp) >= start && new Date(c.timestamp) <= end
  );

  const totalRevenue = relevantConversions.reduce((sum, c) => sum + c.revenue, 0);
  const totalSpend = Array.from(campaigns.values()).reduce((sum, c) => sum + c.spent, 0);

  res.json({
    success: true,
    data: {
      period: { start: start.toISOString(), end: end.toISOString() },
      conversions: relevantConversions.length,
      totalRevenue,
      totalSpend,
      overallROI: calculateROI(totalSpend, totalRevenue),
      avgRevenuePerConversion: relevantConversions.length > 0 ? totalRevenue / relevantConversions.length : 0,
      channelCount: channels.size,
      campaignCount: campaigns.size,
    },
    meta: { timestamp: new Date().toISOString() },
  });
});

// Get channel comparison
app.get('/api/analytics/channel-comparison', (req: Request, res: Response) => {
  const channelList = Array.from(channels.values());

  const comparison = channelList.map(ch => ({
    channel: ch.name,
    type: ch.type,
    conversions: ch.totalConversions,
    revenue: ch.totalRevenue,
    attributedRevenue: ch.attributedRevenue,
    roas: calculateROAS(ch.attributedRevenue || ch.totalRevenue, ch.totalRevenue),
    shareOfRevenue: 0, // Will be calculated
  }));

  const totalRevenue = comparison.reduce((sum, c) => sum + c.revenue, 0);
  comparison.forEach(ch => {
    ch.shareOfRevenue = totalRevenue > 0 ? (ch.revenue / totalRevenue) * 100 : 0;
  });

  // Sort by revenue descending
  comparison.sort((a, b) => b.revenue - a.revenue);

  res.json({
    success: true,
    data: comparison,
    meta: { totalRevenue, timestamp: new Date().toISOString() },
  });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
    meta: { timestamp: new Date().toISOString() },
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

interface AppError extends Error {
  code?: string;
  statusCode?: number;
}

app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
    },
    meta: { timestamp: new Date().toISOString() },
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   Attribution Engine - REE Service                           ║
║   Marketing Attribution & Multi-Touch Tracking               ║
║                                                              ║
║   Status:  RUNNING                                           ║
║   Port:    ${PORT.toString().padEnd(51)}║
║   Version: ${SERVICE_VERSION.padEnd(51)}║
║                                                              ║
║   Attribution Models:                                        ║
║   - First Touch    - Last Touch      - Linear                ║
║   - Time Decay     - Position Based  - Data Driven           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
