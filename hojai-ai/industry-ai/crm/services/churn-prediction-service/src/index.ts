/**
 * Churn Prediction Service
 * Risk scoring, early warnings, and retention recommendations for CRM
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3027;
const SERVICE_NAME = 'churn-prediction-service';

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

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ChurnIndicator = 'inactivity' | 'declining_engagement' | 'support_tickets' | 'negative_feedback' | 'price_sensitivity' | 'competitor_activity' | 'lifetime_value_drop';
export type RetentionActionType = 'personal_outreach' | 'special_offer' | 'loyalty_bonus' | 'check_in' | 'product_education' | 'win_back';
export type RetentionStatus = 'recommended' | 'in_progress' | 'completed' | 'declined' | 'failed';

export interface ChurnRiskScore {
  customerId: string;
  score: number; // 0-100
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  indicators: ChurnIndicator[];
  predictedAt: Date;
  confidence: number;
  daysUntilChurn?: number;
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  description: string;
}

export interface CustomerChurnProfile {
  customerId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  lastEngagementDate?: Date;
  lifetimeDays: number;
  churnScore: number;
  riskLevel: RiskLevel;
  engagementTrend: 'improving' | 'stable' | 'declining';
  purchaseFrequency: number;
  seasonalityPattern?: string;
}

export interface ChurnAlert {
  id: string;
  customerId: string;
  riskLevel: RiskLevel;
  score: number;
  triggers: ChurnIndicator[];
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  actionId?: string;
}

export interface RetentionRecommendation {
  id: string;
  customerId: string;
  riskLevel: RiskLevel;
  score: number;
  actionType: RetentionActionType;
  priority: number;
  title: string;
  description: string;
  offerValue?: number;
  estimatedImpact: number;
  confidence: number;
  expiresAt?: Date;
  createdAt: Date;
}

export interface RetentionCampaign {
  id: string;
  name: string;
  description: string;
  targetRiskLevel: RiskLevel[];
  actionType: RetentionActionType;
  offer?: RetentionOffer;
  targetCount: number;
  enrolledCount: number;
  successCount: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
}

export interface RetentionOffer {
  type: 'discount' | 'free_product' | 'loyalty_points' | 'free_shipping' | 'credit';
  value: number;
  code?: string;
  minPurchase?: number;
}

export interface RetentionAction {
  id: string;
  recommendationId?: string;
  customerId: string;
  campaignId?: string;
  actionType: RetentionActionType;
  status: RetentionStatus;
  offer?: RetentionOffer;
  outreachChannel?: 'email' | 'sms' | 'phone' | 'in_app';
  assignedTo?: string;
  notes?: string;
  sentAt?: Date;
  completedAt?: Date;
  outcome?: string;
  revenueImpact?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChurnPredictionModel {
  id: string;
  name: string;
  description: string;
  version: string;
  accuracy: number;
  features: string[];
  trainedAt: Date;
  active: boolean;
}

export interface ChurnAnalytics {
  totalCustomers: number;
  atRisk: number;
  churnRate: number;
  retentionRate: number;
  avgTimeToChurn: number;
  riskDistribution: Record<RiskLevel, number>;
  topIndicators: { indicator: ChurnIndicator; count: number }[];
  campaignSuccessRate: number;
}

// ============================================================================
// In-Memory Data Stores
// ============================================================================

const churnProfiles: Map<string, CustomerChurnProfile> = new Map();
const churnScores: Map<string, ChurnRiskScore> = new Map();
const churnAlerts: Map<string, ChurnAlert> = new Map();
const retentionRecommendations: Map<string, RetentionRecommendation> = new Map();
const retentionCampaigns: Map<string, RetentionCampaign> = new Map();
const retentionActions: Map<string, RetentionAction> = new Map();
const churnModels: Map<string, ChurnPredictionModel> = new Map();

// ============================================================================
// Initialize Sample Data
// ============================================================================

function initializeSampleData(): void {
  // Default churn model
  const defaultModel: ChurnPredictionModel = {
    id: uuidv4(),
    name: 'Default Risk Model',
    description: 'Standard churn prediction model based on engagement and purchase patterns',
    version: '1.0.0',
    accuracy: 0.85,
    features: ['days_since_last_order', 'order_frequency', 'engagement_score', 'support_tickets', 'nps_score', 'product_variety'],
    trainedAt: new Date(),
    active: true
  };
  churnModels.set(defaultModel.id, defaultModel);

  // Sample retention campaign
  const winBackCampaign: RetentionCampaign = {
    id: uuidv4(),
    name: 'Win Back Campaign - Q1',
    description: 'Re-engage customers at risk of churning',
    targetRiskLevel: ['high', 'critical'],
    actionType: 'win_back',
    offer: {
      type: 'discount',
      value: 20,
      code: 'WELCOMEBACK20',
      minPurchase: 50
    },
    targetCount: 0,
    enrolledCount: 0,
    successCount: 0,
    status: 'active',
    startDate: new Date(),
    createdAt: new Date()
  };
  retentionCampaigns.set(winBackCampaign.id, winBackCampaign);

  // Sample customers at risk
  const atRiskCustomers = [
    { customerId: 'cust-risk-001', churnScore: 78, riskLevel: 'high', indicators: ['inactivity', 'declining_engagement'] },
    { customerId: 'cust-risk-002', churnScore: 92, riskLevel: 'critical', indicators: ['negative_feedback', 'support_tickets'] },
    { customerId: 'cust-risk-003', churnScore: 65, riskLevel: 'medium', indicators: ['lifetime_value_drop'] }
  ];

  atRiskCustomers.forEach(c => {
    const score: ChurnRiskScore = {
      customerId: c.customerId,
      score: c.churnScore,
      riskLevel: c.riskLevel,
      factors: generateSampleFactors(c.churnScore),
      indicators: c.indicators as ChurnIndicator[],
      predictedAt: new Date(),
      confidence: 0.82 + Math.random() * 0.1
    };
    churnScores.set(c.customerId, score);

    const alert: ChurnAlert = {
      id: uuidv4(),
      customerId: c.customerId,
      riskLevel: c.riskLevel,
      score: c.churnScore,
      triggers: c.indicators as ChurnIndicator[],
      message: `Customer ${c.customerId} shows high churn risk (${c.churnScore}%) with indicators: ${c.indicators.join(', ')}`,
      createdAt: new Date(),
      acknowledged: false
    };
    churnAlerts.set(alert.id, alert);
  });
}

initializeSampleData();

// ============================================================================
// Helper Functions
// ============================================================================

function generateSampleFactors(baseScore: number): RiskFactor[] {
  return [
    {
      name: 'Days Since Last Order',
      weight: 0.3,
      value: Math.floor(30 + (100 - baseScore) / 2),
      trend: baseScore > 70 ? 'increasing' : 'stable',
      description: 'Number of days since last purchase'
    },
    {
      name: 'Engagement Decline',
      weight: 0.25,
      value: Math.floor(baseScore / 3),
      trend: baseScore > 60 ? 'increasing' : 'decreasing',
      description: 'Reduction in engagement metrics'
    },
    {
      name: 'Support Tickets',
      weight: 0.2,
      value: Math.floor(Math.random() * 5),
      trend: 'stable',
      description: 'Recent support ticket count'
    },
    {
      name: 'NPS Score',
      weight: 0.15,
      value: Math.floor(10 - baseScore / 15),
      trend: baseScore > 70 ? 'decreasing' : 'stable',
      description: 'Net Promoter Score'
    },
    {
      name: 'Product Variety',
      weight: 0.1,
      value: Math.floor(Math.random() * 10),
      trend: 'stable',
      description: 'Categories purchased from'
    }
  ];
}

function calculateChurnScore(customerId: string): ChurnRiskScore {
  // Simulated churn score calculation
  const baseScore = Math.random() * 100;

  const indicators: ChurnIndicator[] = [];
  const factors: RiskFactor[] = [];

  if (Math.random() > 0.5) {
    indicators.push('inactivity');
    factors.push({
      name: 'Days Since Last Activity',
      weight: 0.35,
      value: Math.floor(Math.random() * 90),
      trend: 'increasing',
      description: 'Customer has been inactive'
    });
  }

  if (Math.random() > 0.6) {
    indicators.push('declining_engagement');
    factors.push({
      name: 'Engagement Trend',
      weight: 0.25,
      value: Math.floor(Math.random() * 50),
      trend: 'decreasing',
      description: 'Engagement metrics declining over time'
    });
  }

  if (Math.random() > 0.7) {
    indicators.push('negative_feedback');
    factors.push({
      name: 'Recent Feedback',
      weight: 0.2,
      value: Math.floor(Math.random() * 3),
      trend: 'stable',
      description: 'Negative feedback received'
    });
  }

  if (Math.random() > 0.8) {
    indicators.push('support_tickets');
    factors.push({
      name: 'Open Support Tickets',
      weight: 0.15,
      value: Math.floor(Math.random() * 4),
      trend: 'increasing',
      description: 'Unresolved support issues'
    });
  }

  const score = Math.min(100, Math.max(0, baseScore + factors.reduce((sum, f) => sum + f.value * f.weight, 0) / 10));

  let riskLevel: RiskLevel;
  if (score >= 80) riskLevel = 'critical';
  else if (score >= 60) riskLevel = 'high';
  else if (score >= 40) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    customerId,
    score: Math.round(score),
    riskLevel,
    factors,
    indicators,
    predictedAt: new Date(),
    confidence: 0.75 + Math.random() * 0.2,
    daysUntilChurn: score > 50 ? Math.floor(30 - score / 4) : undefined
  };
}

function generateRetentionRecommendation(customerId: string, riskScore: ChurnRiskScore): RetentionRecommendation {
  let actionType: RetentionActionType;
  let priority: number;
  let title: string;
  let description: string;

  switch (riskScore.riskLevel) {
    case 'critical':
      actionType = 'win_back';
      priority = 1;
      title = 'Immediate Win-Back Campaign';
      description = 'Customer is highly at risk. Offer significant incentive to re-engage.';
      break;
    case 'high':
      actionType = 'personal_outreach';
      priority = 2;
      title = 'Personal Outreach Required';
      description = 'Schedule a personal call or send personalized email to understand concerns.';
      break;
    case 'medium':
      actionType = 'special_offer';
      priority = 3;
      title = 'Targeted Special Offer';
      description = 'Offer exclusive discount to encourage next purchase.';
      break;
    default:
      actionType = 'check_in';
      priority = 4;
      title = 'Gentle Check-In';
      description = 'Send a friendly check-in message to maintain engagement.';
  }

  return {
    id: uuidv4(),
    customerId,
    riskLevel: riskScore.riskLevel,
    score: riskScore.score,
    actionType,
    priority,
    title,
    description,
    estimatedImpact: 100 + riskScore.score * 5,
    confidence: 0.7 + (riskScore.confidence - 0.8),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date()
  };
}

// ============================================================================
// Routes - Churn Prediction
// ============================================================================

/**
 * Get churn risk score for customer
 */
app.get('/api/scores/:customerId', (req: Request, res: Response) => {
  const { recalculate } = req.query;

  let score = churnScores.get(req.params.customerId);

  if (!score || recalculate === 'true') {
    score = calculateChurnScore(req.params.customerId);
    churnScores.set(req.params.customerId, score);

    // Generate recommendation if high risk
    if (score.riskLevel === 'high' || score.riskLevel === 'critical') {
      const existingRec = Array.from(retentionRecommendations.values())
        .find(r => r.customerId === req.params.customerId && r.status !== 'completed');

      if (!existingRec) {
        const recommendation = generateRetentionRecommendation(req.params.customerId, score);
        retentionRecommendations.set(recommendation.id, recommendation);
      }
    }
  }

  res.json(score);
});

/**
 * Get all churn scores
 */
app.get('/api/scores', (req: Request, res: Response) => {
  const { riskLevel, minScore, maxScore, limit } = req.query;

  let filtered = Array.from(churnScores.values());

  if (riskLevel) {
    filtered = filtered.filter(s => s.riskLevel === riskLevel);
  }
  if (minScore) {
    filtered = filtered.filter(s => s.score >= parseInt(minScore as string));
  }
  if (maxScore) {
    filtered = filtered.filter(s => s.score <= parseInt(maxScore as string));
  }

  filtered.sort((a, b) => b.score - a.score);

  const limitNum = limit ? parseInt(limit as string) : 100;
  res.json(filtered.slice(0, limitNum));
});

/**
 * Batch calculate churn scores
 */
app.post('/api/scores/batch', (req: Request, res: Response) => {
  const { customerIds } = req.body;

  if (!customerIds || !Array.isArray(customerIds)) {
    res.status(400).json({ error: 'Customer IDs array is required' });
    return;
  }

  const results = customerIds.map(customerId => {
    const score = calculateChurnScore(customerId);
    churnScores.set(customerId, score);
    return score;
  });

  logger.info(`Batch calculated ${results.length} churn scores`);
  res.json(results);
});

// ============================================================================
// Routes - Customer Profiles
// ============================================================================

/**
 * Get or create customer churn profile
 */
app.get('/api/profiles/:customerId', (req: Request, res: Response) => {
  let profile = churnProfiles.get(req.params.customerId);

  if (!profile) {
    // Generate sample profile
    profile = {
      customerId: req.params.customerId,
      totalOrders: Math.floor(Math.random() * 50) + 1,
      totalSpent: Math.floor(Math.random() * 10000) + 100,
      averageOrderValue: Math.floor(Math.random() * 200) + 20,
      lastOrderDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      lastEngagementDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      lifetimeDays: Math.floor(Math.random() * 365) + 30,
      churnScore: Math.floor(Math.random() * 100),
      riskLevel: 'low',
      engagementTrend: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)] as any,
      purchaseFrequency: Math.floor(Math.random() * 12) + 1
    };
    churnProfiles.set(profile.customerId, profile);
  }

  // Get latest churn score
  const churnScore = churnScores.get(req.params.customerId);
  if (churnScore) {
    profile.churnScore = churnScore.score;
    profile.riskLevel = churnScore.riskLevel;
  }

  res.json(profile);
});

/**
 * Update customer profile
 */
app.put('/api/profiles/:customerId', (req: Request, res: Response) => {
  let profile = churnProfiles.get(req.params.customerId);

  if (!profile) {
    profile = {
      customerId: req.params.customerId,
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lifetimeDays: 0,
      churnScore: 0,
      riskLevel: 'low',
      engagementTrend: 'stable',
      purchaseFrequency: 0
    };
  }

  const updates = req.body;
  Object.assign(profile, updates);

  // Recalculate risk
  const score = calculateChurnScore(req.params.customerId);
  profile.churnScore = score.score;
  profile.riskLevel = score.riskLevel;

  churnProfiles.set(req.params.customerId, profile);
  res.json(profile);
});

// ============================================================================
// Routes - Alerts
// ============================================================================

/**
 * Get all churn alerts
 */
app.get('/api/alerts', (req: Request, res: Response) => {
  const { riskLevel, acknowledged, limit } = req.query;

  let filtered = Array.from(churnAlerts.values());

  if (riskLevel) {
    filtered = filtered.filter(a => a.riskLevel === riskLevel);
  }
  if (acknowledged !== undefined) {
    filtered = filtered.filter(a => a.acknowledged === (acknowledged === 'true'));
  }

  filtered.sort((a, b) => b.score - a.score);

  const limitNum = limit ? parseInt(limit as string) : 50;
  res.json(filtered.slice(0, limitNum));
});

/**
 * Acknowledge alert
 */
app.patch('/api/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const alert = churnAlerts.get(req.params.id);

  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  alert.acknowledged = true;
  alert.acknowledgedBy = req.body.userId || 'system';
  alert.acknowledgedAt = new Date();

  res.json(alert);
});

/**
 * Create alert
 */
app.post('/api/alerts', (req: Request, res: Response) => {
  const { customerId, riskLevel, score, triggers, message } = req.body;

  if (!customerId || riskLevel === undefined) {
    res.status(400).json({ error: 'Customer ID and risk level are required' });
    return;
  }

  const alert: ChurnAlert = {
    id: uuidv4(),
    customerId,
    riskLevel,
    score: score || 0,
    triggers: triggers || [],
    message: message || `Customer ${customerId} has churn risk level: ${riskLevel}`,
    createdAt: new Date(),
    acknowledged: false
  };

  churnAlerts.set(alert.id, alert);
  logger.info(`Churn alert created for customer: ${customerId}`);
  res.status(201).json(alert);
});

// ============================================================================
// Routes - Retention Recommendations
// ============================================================================

/**
 * Get retention recommendations
 */
app.get('/api/recommendations', (req: Request, res: Response) => {
  const { customerId, riskLevel, status, limit } = req.query;

  let filtered = Array.from(retentionRecommendations.values());

  if (customerId) {
    filtered = filtered.filter(r => r.customerId === customerId);
  }
  if (riskLevel) {
    filtered = filtered.filter(r => r.riskLevel === riskLevel);
  }
  if (status) {
    filtered = filtered.filter(r => (r as any).status === status);
  }

  filtered.sort((a, b) => a.priority - b.priority);

  const limitNum = limit ? parseInt(limit as string) : 50;
  res.json(filtered.slice(0, limitNum));
});

/**
 * Generate recommendation for customer
 */
app.post('/api/recommendations/generate', (req: Request, res: Response) => {
  const { customerId } = req.body;

  if (!customerId) {
    res.status(400).json({ error: 'Customer ID is required' });
    return;
  }

  let score = churnScores.get(customerId);
  if (!score) {
    score = calculateChurnScore(customerId);
    churnScores.set(customerId, score);
  }

  const recommendation = generateRetentionRecommendation(customerId, score);
  retentionRecommendations.set(recommendation.id, recommendation);

  logger.info(`Generated retention recommendation for: ${customerId}`);
  res.status(201).json(recommendation);
});

/**
 * Update recommendation
 */
app.patch('/api/recommendations/:id', (req: Request, res: Response) => {
  const recommendation = retentionRecommendations.get(req.params.id);

  if (!recommendation) {
    res.status(404).json({ error: 'Recommendation not found' });
    return;
  }

  const { status } = req.body;
  if (status) (recommendation as any).status = status;

  res.json(recommendation);
});

// ============================================================================
// Routes - Retention Campaigns
// ============================================================================

/**
 * Create retention campaign
 */
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { name, description, targetRiskLevel, actionType, offer } = req.body;

  if (!name || !targetRiskLevel || !actionType) {
    res.status(400).json({ error: 'Name, target risk levels, and action type are required' });
    return;
  }

  const campaign: RetentionCampaign = {
    id: uuidv4(),
    name,
    description: description || '',
    targetRiskLevel,
    actionType,
    offer,
    targetCount: 0,
    enrolledCount: 0,
    successCount: 0,
    status: 'draft',
    startDate: new Date(),
    createdAt: new Date()
  };

  retentionCampaigns.set(campaign.id, campaign);
  res.status(201).json(campaign);
});

/**
 * Get all campaigns
 */
app.get('/api/campaigns', (req: Request, res: Response) => {
  const { status, riskLevel } = req.query;

  let filtered = Array.from(retentionCampaigns.values());

  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  if (riskLevel) {
    filtered = filtered.filter(c => c.targetRiskLevel.includes(riskLevel as RiskLevel));
  }

  res.json(filtered);
});

/**
 * Get campaign by ID
 */
app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = retentionCampaigns.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const enrolledActions = Array.from(retentionActions.values())
    .filter(a => a.campaignId === campaign.id);

  res.json({ ...campaign, actions: enrolledActions });
});

/**
 * Update campaign status
 */
app.patch('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = retentionCampaigns.get(req.params.id);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const { status, targetCount } = req.body;
  if (status) {
    campaign.status = status;
    if (status === 'active') {
      campaign.startDate = new Date();
    } else if (status === 'completed') {
      campaign.endDate = new Date();
    }
  }
  if (targetCount !== undefined) campaign.targetCount = targetCount;

  res.json(campaign);
});

/**
 * Enroll customers in campaign
 */
app.post('/api/campaigns/:id/enroll', (req: Request, res: Response) => {
  const { customerIds } = req.body;
  const campaign = retentionCampaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  if (!customerIds || !Array.isArray(customerIds)) {
    res.status(400).json({ error: 'Customer IDs array is required' });
    return;
  }

  const enrolledIds: string[] = [];

  customerIds.forEach(customerId => {
    const action: RetentionAction = {
      id: uuidv4(),
      customerId,
      campaignId: campaign.id,
      actionType: campaign.actionType,
      status: 'in_progress',
      offer: campaign.offer,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    retentionActions.set(action.id, action);
    enrolledIds.push(customerId);
  });

  campaign.enrolledCount += enrolledIds.length;

  logger.info(`Enrolled ${enrolledIds.length} customers in campaign ${campaign.id}`);
  res.json({ enrolled: enrolledIds.length, campaign });
});

// ============================================================================
// Routes - Retention Actions
// ============================================================================

/**
 * Get retention actions
 */
app.get('/api/actions', (req: Request, res: Response) => {
  const { customerId, campaignId, status, actionType } = req.query;

  let filtered = Array.from(retentionActions.values());

  if (customerId) filtered = filtered.filter(a => a.customerId === customerId);
  if (campaignId) filtered = filtered.filter(a => a.campaignId === campaignId);
  if (status) filtered = filtered.filter(a => a.status === status);
  if (actionType) filtered = filtered.filter(a => a.actionType === actionType);

  res.json(filtered);
});

/**
 * Create retention action
 */
app.post('/api/actions', (req: Request, res: Response) => {
  const { customerId, campaignId, actionType, offer, assignedTo } = req.body;

  if (!customerId || !actionType) {
    res.status(400).json({ error: 'Customer ID and action type are required' });
    return;
  }

  const action: RetentionAction = {
    id: uuidv4(),
    customerId,
    campaignId,
    actionType,
    status: 'in_progress',
    offer,
    assignedTo,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  retentionActions.set(action.id, action);
  res.status(201).json(action);
});

/**
 * Update retention action
 */
app.patch('/api/actions/:id', (req: Request, res: Response) => {
  const action = retentionActions.get(req.params.id);
  if (!action) {
    res.status(404).json({ error: 'Action not found' });
    return;
  }

  const { status, notes, outcome, revenueImpact } = req.body;

  if (status) {
    action.status = status;
    if (status === 'completed') {
      action.completedAt = new Date();
    }
  }
  if (notes !== undefined) action.notes = notes;
  if (outcome !== undefined) action.outcome = outcome;
  if (revenueImpact !== undefined) action.revenueImpact = revenueImpact;
  action.updatedAt = new Date();

  // Update campaign success count
  if (status === 'completed' && action.campaignId) {
    const campaign = retentionCampaigns.get(action.campaignId);
    if (campaign && outcome === 'saved') {
      campaign.successCount++;
    }
  }

  res.json(action);
});

// ============================================================================
// Routes - Analytics
// ============================================================================

/**
 * Get churn analytics
 */
app.get('/api/analytics', (req: Request, res: Response) => {
  const allScores = Array.from(churnScores.values());
  const allProfiles = Array.from(churnProfiles.values());
  const allActions = Array.from(retentionActions.values());

  const riskDistribution: Record<RiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };

  allScores.forEach(s => riskDistribution[s.riskLevel]++);

  const indicatorCounts: Record<string, number> = {};
  allScores.forEach(s => {
    s.indicators.forEach(ind => {
      indicatorCounts[ind] = (indicatorCounts[ind] || 0) + 1;
    });
  });

  const topIndicators = Object.entries(indicatorCounts)
    .map(([indicator, count]) => ({ indicator: indicator as ChurnIndicator, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const completedActions = allActions.filter(a => a.status === 'completed');
  const successfulActions = completedActions.filter(a => a.outcome === 'saved');
  const campaignSuccessRate = completedActions.length > 0
    ? (successfulActions.length / completedActions.length) * 100
    : 0;

  res.json({
    totalCustomers: allProfiles.length || allScores.length,
    atRisk: riskDistribution.high + riskDistribution.critical,
    churnRate: riskDistribution.critical / (allScores.length || 1) * 100,
    retentionRate: 100 - (riskDistribution.critical / (allScores.length || 1) * 100),
    avgTimeToChurn: 30,
    riskDistribution,
    topIndicators,
    campaignSuccessRate: Math.round(campaignSuccessRate)
  } as ChurnAnalytics);
});

/**
 * Get risk distribution
 */
app.get('/api/analytics/distribution', (req: Request, res: Response) => {
  const allScores = Array.from(churnScores.values());

  const distribution: Record<RiskLevel, ChurnRiskScore[]> = {
    low: [],
    medium: [],
    high: [],
    critical: []
  };

  allScores.forEach(s => distribution[s.riskLevel].push(s));

  res.json({
    low: { count: distribution.low.length, avgScore: calculateAvg(distribution.low) },
    medium: { count: distribution.medium.length, avgScore: calculateAvg(distribution.medium) },
    high: { count: distribution.high.length, avgScore: calculateAvg(distribution.high) },
    critical: { count: distribution.critical.length, avgScore: calculateAvg(distribution.critical) }
  });
});

function calculateAvg(scores: ChurnRiskScore[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
}

/**
 * Get retention campaign performance
 */
app.get('/api/analytics/campaigns', (req: Request, res: Response) => {
  const campaigns = Array.from(retentionCampaigns.values());
  const allActions = Array.from(retentionActions.values());

  const performance = campaigns.map(campaign => {
    const campaignActions = allActions.filter(a => a.campaignId === campaign.id);
    const completed = campaignActions.filter(a => a.status === 'completed');
    const saved = completed.filter(a => a.outcome === 'saved');
    const totalRevenue = saved.reduce((sum, a) => sum + (a.revenueImpact || 0), 0);

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      enrolledCount: campaign.enrolledCount,
      completedCount: completed.length,
      successCount: campaign.successCount,
      successRate: completed.length > 0 ? (campaign.successCount / completed.length) * 100 : 0,
      totalRevenueImpact: totalRevenue,
      roi: totalRevenue > 0 ? (totalRevenue / (campaign.enrolledCount * 10)) * 100 : 0
    };
  });

  res.json(performance);
});

// ============================================================================
// Routes - Models
// ============================================================================

/**
 * Get churn prediction models
 */
app.get('/api/models', (req: Request, res: Response) => {
  const { active } = req.query;

  let filtered = Array.from(churnModels.values());
  if (active !== undefined) {
    filtered = filtered.filter(m => m.active === (active === 'true'));
  }

  res.json(filtered);
});

/**
 * Update model
 */
app.patch('/api/models/:id', (req: Request, res: Response) => {
  const model = churnModels.get(req.params.id);
  if (!model) {
    res.status(404).json({ error: 'Model not found' });
    return;
  }

  const { active, accuracy } = req.body;
  if (active !== undefined) model.active = active;
  if (accuracy !== undefined) model.accuracy = accuracy;

  res.json(model);
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
      profiles: churnProfiles.size,
      scores: churnScores.size,
      alerts: churnAlerts.size,
      recommendations: retentionRecommendations.size,
      campaigns: retentionCampaigns.size,
      actions: retentionActions.size
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
