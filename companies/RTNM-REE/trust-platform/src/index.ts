/**
 * REE - Trust Platform (Port 3001)
 *
 * Central trust scoring and fraud signal aggregation
 * for the RTNM Digital ecosystem.
 *
 * Features:
 * - Trust score calculation (user, merchant, transaction)
 * - Fraud signal aggregation and analysis
 * - Risk assessment and scoring
 * - Reputation tracking and history
 * - Real-time risk monitoring
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = parseInt(process.env.PORT || '3001', 10);

// ============================================
// IN-MEMORY DATA STORES
// ============================================

interface TrustScore {
  entityId: string;
  entityType: 'user' | 'merchant' | 'device' | 'ip';
  score: number; // 0-1000
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  factors: {
    name: string;
    weight: number;
    impact: number;
    description: string;
  }[];
  history: {
    timestamp: Date;
    score: number;
    change: number;
    reason: string;
  }[];
  lastUpdated: Date;
  verified: boolean;
  verificationLevel: 'none' | 'basic' | 'enhanced' | 'full';
}

interface FraudSignal {
  id: string;
  type: 'transaction' | 'login' | 'account' | 'device' | 'behavioral';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  targetId: string;
  targetType: 'user' | 'merchant' | 'device' | 'ip';
  signalData: {
    pattern?: string;
    anomaly?: string;
    velocity?: number;
    deviation?: number;
    confidence?: number;
  };
  indicators: {
    name: string;
    value: any;
    riskContribution: number;
  }[];
  timestamp: Date;
  processed: boolean;
  relatedSignals: string[];
  metadata: Record<string, any>;
}

interface RiskAssessment {
  id: string;
  entityId: string;
  entityType: 'user' | 'merchant' | 'transaction';
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  score: number;
  recommendation: 'allow' | 'review' | 'block' | 'challenge';
  factors: {
    category: string;
    score: number;
    details: string;
  }[];
  checks: {
    name: string;
    passed: boolean;
    score: number;
    details: string;
  }[];
  assessedAt: Date;
  expiresAt: Date;
}

interface ReputationRecord {
  entityId: string;
  entityType: 'user' | 'merchant' | 'device';
  positiveEvents: number;
  negativeEvents: number;
  neutralEvents: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  chargebacks: number;
  disputes: number;
  refunds: number;
  rating: number;
  reviewCount: number;
  verifiedContacts: number;
  accountAge: number; // days
  lastActivity: Date;
  flags: string[];
  badges: string[];
}

interface RiskRule {
  id: string;
  name: string;
  description: string;
  condition: {
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'in';
    value: any;
    conjunction?: 'AND' | 'OR';
    conditions?: RiskRule['condition'][];
  };
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  scoreImpact: number;
  enabled: boolean;
  action: 'flag' | 'block' | 'review' | 'score';
  priority: number;
}

// In-memory stores
const trustScores: Map<string, TrustScore> = new Map();
const fraudSignals: Map<string, FraudSignal> = new Map();
const riskAssessments: Map<string, RiskAssessment> = new Map();
const reputationRecords: Map<string, ReputationRecord> = new Map();
const riskRules: Map<string, RiskRule> = new Map();

// Initialize sample data
initializeSampleData();

// ============================================
// HELPER FUNCTIONS
// ============================================

function initializeSampleData() {
  // Sample trust scores
  const sampleTrustScores: Array<Omit<TrustScore, 'entityId' | 'lastUpdated'>> = [
    {
      entityType: 'user',
      score: 850,
      riskLevel: 'low',
      factors: [
        { name: 'account_age', weight: 0.2, impact: 50, description: 'Account is 2+ years old' },
        { name: 'verified_identity', weight: 0.25, impact: 75, description: 'Identity verified with KYC' },
        { name: 'transaction_history', weight: 0.3, impact: 80, description: 'Good transaction history' },
        { name: 'device_trust', weight: 0.15, impact: 60, description: 'Consistent device usage' },
        { name: 'social_verification', weight: 0.1, impact: 40, description: 'Verified contacts' }
      ],
      history: [],
      verified: true,
      verificationLevel: 'enhanced'
    },
    {
      entityType: 'user',
      score: 420,
      riskLevel: 'high',
      factors: [
        { name: 'account_age', weight: 0.2, impact:20, description: 'Account is less than 30 days old' },
        { name: 'velocity_spike', weight: 0.3, impact: -60, description: 'Unusual transaction velocity' },
        { name: 'new_device', weight: 0.15, impact: -40, description: 'Login from new device' },
        { name: 'address_mismatch', weight: 0.2, impact: -50, description: 'Shipping address mismatch' },
        { name: 'failed_verification', weight: 0.15, impact: -30, description: 'Failed verification attempts' }
      ],
      history: [],
      verified: false,
      verificationLevel: 'none'
    },
    {
      entityType: 'merchant',
      score: 920,
      riskLevel: 'very_low',
      factors: [
        { name: 'business_verification', weight: 0.3, impact: 100, description: 'Business fully verified' },
        { name: 'transaction_volume', weight: 0.2, impact: 80, description: 'High transaction volume with low disputes' },
        { name: 'chargeback_rate', weight: 0.25, impact: 90, description: 'Chargeback rate below 0.1%' },
        { name: 'response_time', weight: 0.15, impact: 70, description: 'Quick customer response' },
        { name: 'compliance_score', weight: 0.1, impact: 85, description: 'Full compliance achieved' }
      ],
      history: [],
      verified: true,
      verificationLevel: 'full'
    }
  ];

  sampleTrustScores.forEach((score, idx) => {
    const id = `entity-${String(idx + 1).padStart(4, '0')}`;
    trustScores.set(id, {
      ...score,
      entityId: id,
      lastUpdated: new Date()
    });
  });

  // Sample fraud signals
  const sampleSignals: Omit<FraudSignal, 'id' | 'timestamp'>[] = [
    {
      type: 'transaction',
      severity: 'high',
      source: 'payment-gateway',
      targetId: 'user-002',
      targetType: 'user',
      signalData: {
        pattern: 'velocity_exceeded',
        anomaly: '5x_normal_rate',
        velocity: 15,
        deviation: 2.5,
        confidence: 0.85
      },
      indicators: [
        { name: 'transaction_velocity', value: 15, riskContribution: 40 },
        { name: 'amount_anomaly', value: 50000, riskContribution: 30 },
        { name: 'new_recipient', value: true, riskContribution: 20 }
      ],
      processed: false,
      relatedSignals: []
    },
    {
      type: 'login',
      severity: 'medium',
      source: 'auth-service',
      targetId: 'user-003',
      targetType: 'user',
      signalData: {
        pattern: 'geo_anomaly',
        anomaly: 'unusual_location',
        confidence: 0.72
      },
      indicators: [
        { name: 'location_change', value: 'IN->US', riskContribution: 35 },
        { name: 'time_anomaly', value: '2am_local', riskContribution: 25 },
        { name: 'new_device', value: true, riskContribution: 30 }
      ],
      processed: true,
      relatedSignals: []
    },
    {
      type: 'device',
      severity: 'critical',
      source: 'fingerprint-service',
      targetId: 'device-001',
      targetType: 'device',
      signalData: {
        pattern: 'device_emulator',
        anomaly: 'emulator_detected',
        confidence: 0.95
      },
      indicators: [
        { name: 'emulator_signature', value: true, riskContribution: 50 },
        { name: 'gps_spoofing', value: true, riskContribution: 30 },
        { name: 'rooted_device', value: true, riskContribution: 20 }
      ],
      processed: false,
      relatedSignals: []
    }
  ];

  sampleSignals.forEach((signal, idx) => {
    const id = `signal-${String(idx + 1).padStart(4, '0')}`;
    fraudSignals.set(id, {
      ...signal,
      id,
      timestamp: new Date(Date.now() - idx * 60000)
    });
  });

  // Sample risk rules
  const sampleRules: Omit<RiskRule, 'id'>[] = [
    {
      name: 'High Velocity Transaction',
      description: 'Flag transactions that exceed normal velocity by 5x',
      condition: {
        field: 'transaction.velocity',
        operator: '>',
        value: 5
      },
      riskLevel: 'high',
      scoreImpact: -100,
      enabled: true,
      action: 'flag',
      priority: 1
    },
    {
      name: 'New Account High Value',
      description: 'Flag high-value transactions from new accounts',
      condition: {
        field: 'account.age_days',
        operator: '<',
        value: 30
      },
      riskLevel: 'medium',
      scoreImpact: -50,
      enabled: true,
      action: 'review',
      priority: 2
    },
    {
      name: 'VPN/Proxy Detection',
      description: 'Block transactions from VPN or proxy IPs',
      condition: {
        field: 'network.is_vpn',
        operator: '==',
        value: true
      },
      riskLevel: 'high',
      scoreImpact: -80,
      enabled: true,
      action: 'block',
      priority: 1
    },
    {
      name: 'Chargeback History',
      description: 'Flag merchants with high chargeback rates',
      condition: {
        field: 'merchant.chargeback_rate',
        operator: '>',
        value: 1
      },
      riskLevel: 'very_high',
      scoreImpact: -150,
      enabled: true,
      action: 'block',
      priority: 1
    }
  ];

  sampleRules.forEach((rule, idx) => {
    const id = `rule-${String(idx + 1).padStart(3, '0')}`;
    riskRules.set(id, { ...rule, id });
  });
}

function calculateRiskLevel(score: number): TrustScore['riskLevel'] {
  if (score >= 900) return 'very_low';
  if (score >= 700) return 'low';
  if (score >= 400) return 'medium';
  if (score >= 200) return 'high';
  return 'very_high';
}

function calculateTrustScore(factors: TrustScore['factors']): number {
  let totalScore = 500; // Base score
  let totalWeight = 0;

  factors.forEach(factor => {
    totalScore += factor.impact;
    totalWeight += factor.weight;
  });

  // Normalize by weight
  if (totalWeight > 0) {
    totalScore = Math.max(0, Math.min(1000, totalScore));
  }

  return Math.round(totalScore);
}

function aggregateFraudSignals(entityId: string): {
  totalSignals: number;
  unprocessedSignals: number;
  severityBreakdown: Record<string, number>;
  riskContribution: number;
} {
  let totalSignals = 0;
  let unprocessedSignals = 0;
  let riskContribution = 0;
  const severityBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };

  fraudSignals.forEach(signal => {
    if (signal.targetId === entityId) {
      totalSignals++;
      if (!signal.processed) unprocessedSignals++;
      severityBreakdown[signal.severity]++;
      riskContribution += signal.severity === 'critical' ? 100 :
        signal.severity === 'high' ? 50 :
          signal.severity === 'medium' ? 25 : 10;
    }
  });

  return { totalSignals, unprocessedSignals, severityBreakdown, riskContribution };
}

// ============================================
// HEALTH ENDPOINT
// ============================================

app.get('/health', (req: Request, res: Response) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let signalsLast24h = 0;
  let criticalSignals = 0;

  fraudSignals.forEach(signal => {
    if (signal.timestamp >= last24h) {
      signalsLast24h++;
      if (signal.severity === 'critical') criticalSignals++;
    }
  });

  res.json({
    status: 'healthy',
    service: 'trust-platform',
    version: '1.0.0',
    port: PORT,
    timestamp: now.toISOString(),
    metrics: {
      totalTrustScores: trustScores.size,
      totalFraudSignals: fraudSignals.size,
      signalsLast24h,
      criticalSignals,
      unprocessedSignals: Array.from(fraudSignals.values()).filter(s => !s.processed).length
    }
  });
});

// ============================================
// TRUST SCORE MANAGEMENT
// ============================================

// Get trust score
app.get('/api/trust/:entityType/:entityId', (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;

  // Find trust score
  let trustScore: TrustScore | undefined;
  trustScores.forEach(score => {
    if (score.entityId === entityId && score.entityType === entityType) {
      trustScore = score;
    }
  });

  if (!trustScore) {
    // Return default score for unknown entities
    res.json({
      entityId,
      entityType,
      score: 500,
      riskLevel: 'medium',
      factors: [],
      history: [],
      lastUpdated: new Date(),
      verified: false,
      verificationLevel: 'none'
    });
    return;
  }

  res.json({ trustScore });
});

// Calculate/Update trust score
app.post('/api/trust/calculate', (req: Request, res: Response) => {
  const { entityId, entityType, factors } = req.body;

  if (!entityId || !entityType) {
    res.status(400).json({ error: 'entityId and entityType are required' });
    return;
  }

  // Find existing score
  let existingScore: TrustScore | undefined;
  trustScores.forEach(score => {
    if (score.entityId === entityId && score.entityType === entityType) {
      existingScore = score;
    }
  });

  const newScore = calculateTrustScore(factors || existingScore?.factors || []);
  const riskLevel = calculateRiskLevel(newScore);
  const now = new Date();

  if (existingScore) {
    const change = newScore - existingScore.score;
    existingScore.score = newScore;
    existingScore.riskLevel = riskLevel;
    existingScore.lastUpdated = now;

    if (factors) {
      existingScore.factors = factors;
    }

    existingScore.history.push({
      timestamp: now,
      score: newScore,
      change,
      reason: factors ? 'Factors updated' : 'Score recalculated'
    });

    // Keep only last 100 history entries
    if (existingScore.history.length > 100) {
      existingScore.history = existingScore.history.slice(-100);
    }

    res.json({ success: true, trustScore: existingScore });
  } else {
    const newTrustScore: TrustScore = {
      entityId,
      entityType,
      score: newScore,
      riskLevel,
      factors: factors || [],
      history: [{
        timestamp: now,
        score: newScore,
        change: 0,
        reason: 'Initial score'
      }],
      lastUpdated: now,
      verified: false,
      verificationLevel: 'none'
    };

    trustScores.set(`${entityType}-${entityId}`, newTrustScore);
    res.status(201).json({ success: true, trustScore: newTrustScore });
  }
});

// Update trust factors
app.patch('/api/trust/:entityType/:entityId/factors', (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const { factors } = req.body;

  if (!factors || !Array.isArray(factors)) {
    res.status(400).json({ error: 'factors array is required' });
    return;
  }

  let trustScore: TrustScore | undefined;
  trustScores.forEach(score => {
    if (score.entityId === entityId && score.entityType === entityType) {
      trustScore = score;
    }
  });

  if (!trustScore) {
    res.status(404).json({ error: 'Trust score not found' });
    return;
  }

  const oldScore = trustScore.score;
  trustScore.factors = factors;
  trustScore.score = calculateTrustScore(factors);
  trustScore.riskLevel = calculateRiskLevel(trustScore.score);
  trustScore.lastUpdated = new Date();

  const change = trustScore.score - oldScore;
  trustScore.history.push({
    timestamp: new Date(),
    score: trustScore.score,
    change,
    reason: 'Factors updated'
  });

  res.json({ success: true, trustScore });
});

// Get trust history
app.get('/api/trust/:entityType/:entityId/history', (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const { limit = '50' } = req.query;

  let trustScore: TrustScore | undefined;
  trustScores.forEach(score => {
    if (score.entityId === entityId && score.entityType === entityType) {
      trustScore = score;
    }
  });

  if (!trustScore) {
    res.status(404).json({ error: 'Trust score not found' });
    return;
  }

  const limitNum = parseInt(String(limit), 10);
  const history = trustScore.history.slice(-limitNum).reverse();

  res.json({ history });
});

// ============================================
// FRAUD SIGNAL MANAGEMENT
// ============================================

// Submit fraud signal
app.post('/api/fraud/signals', (req: Request, res: Response) => {
  const {
    type,
    severity = 'medium',
    source,
    targetId,
    targetType,
    signalData = {},
    indicators = [],
    relatedSignals = [],
    metadata = {}
  } = req.body;

  if (!type || !source || !targetId || !targetType) {
    res.status(400).json({
      error: 'type, source, targetId, and targetType are required'
    });
    return;
  }

  const id = `signal-${uuidv4().slice(0, 8)}`;
  const now = new Date();

  const signal: FraudSignal = {
    id,
    type,
    severity,
    source,
    targetId,
    targetType,
    signalData,
    indicators,
    timestamp: now,
    processed: false,
    relatedSignals,
    metadata
  };

  fraudSignals.set(id, signal);

  // Auto-update trust score based on signal
  let trustScore: TrustScore | undefined;
  trustScores.forEach(score => {
    if (score.entityId === targetId && score.entityType === targetType) {
      trustScore = score;
    }
  });

  if (trustScore) {
    const scoreImpact = severity === 'critical' ? -50 :
      severity === 'high' ? -30 :
        severity === 'medium' ? -15 : -5;

    trustScore.score = Math.max(0, trustScore.score + scoreImpact);
    trustScore.riskLevel = calculateRiskLevel(trustScore.score);
    trustScore.lastUpdated = now;

    trustScore.history.push({
      timestamp: now,
      score: trustScore.score,
      change: scoreImpact,
      reason: `Fraud signal: ${type} (${severity})`
    });
  }

  res.status(201).json({
    success: true,
    signal: { id, type, severity, timestamp: now }
  });
});

// List fraud signals
app.get('/api/fraud/signals', (req: Request, res: Response) => {
  const { severity, type, targetId, processed, limit = '50', offset = '0' } = req.query;

  let filtered = Array.from(fraudSignals.values());

  if (severity) {
    filtered = filtered.filter(s => s.severity === severity);
  }
  if (type) {
    filtered = filtered.filter(s => s.type === type);
  }
  if (targetId) {
    filtered = filtered.filter(s => s.targetId === targetId);
  }
  if (processed !== undefined) {
    filtered = filtered.filter(s => s.processed === (processed === 'true'));
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const limitNum = parseInt(String(limit), 10);
  const offsetNum = parseInt(String(offset), 10);

  const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

  res.json({
    total: filtered.length,
    limit: limitNum,
    offset: offsetNum,
    signals: paginated
  });
});

// Get single signal
app.get('/api/fraud/signals/:id', (req: Request, res: Response) => {
  const signal = fraudSignals.get(req.params.id);

  if (!signal) {
    res.status(404).json({ error: 'Fraud signal not found' });
    return;
  }

  res.json({ signal });
});

// Process signal
app.patch('/api/fraud/signals/:id/process', (req: Request, res: Response) => {
  const signal = fraudSignals.get(req.params.id);

  if (!signal) {
    res.status(404).json({ error: 'Fraud signal not found' });
    return;
  }

  const { notes, action } = req.body;

  signal.processed = true;
  signal.metadata = {
    ...signal.metadata,
    processedAt: new Date(),
    notes,
    action
  };

  res.json({ success: true, signal });
});

// Get signals by entity
app.get('/api/fraud/entity/:entityType/:entityId', (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const { limit = '50' } = req.query;

  const signals = Array.from(fraudSignals.values())
    .filter(s => s.targetId === entityId && s.targetType === entityType)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, parseInt(String(limit), 10));

  const aggregated = aggregateFraudSignals(entityId);

  res.json({
    entityId,
    entityType,
    signals,
    aggregated
  });
});

// ============================================
// RISK ASSESSMENT
// ============================================

// Perform risk assessment
app.post('/api/risk/assess', (req: Request, res: Response) => {
  const { entityId, entityType, transactionData } = req.body;

  if (!entityId || !entityType) {
    res.status(400).json({ error: 'entityId and entityType are required' });
    return;
  }

  const id = `risk-${uuidv4().slice(0, 8)}`;
  const now = new Date();

  // Get trust score
  let trustScore: TrustScore | undefined;
  trustScores.forEach(score => {
    if (score.entityId === entityId && score.entityType === entityType) {
      trustScore = score;
    }
  });

  const baseScore = trustScore?.score || 500;
  const factors: RiskAssessment['factors'] = [];
  const checks: RiskAssessment['checks'] = [];

  // Check against rules
  let scoreModifier = 0;
  riskRules.forEach(rule => {
    if (!rule.enabled) return;

    // Simple rule evaluation
    let triggered = false;
    if (transactionData) {
      const value = (transactionData as any)[rule.condition.field.split('.')[1]];
      if (value !== undefined) {
        switch (rule.condition.operator) {
          case '>': triggered = value > rule.condition.value; break;
          case '<': triggered = value < rule.condition.value; break;
          case '>=': triggered = value >= rule.condition.value; break;
          case '<=': triggered = value <= rule.condition.value; break;
          case '==': triggered = value === rule.condition.value; break;
        }
      }
    }

    if (triggered) {
      scoreModifier += rule.scoreImpact;
      factors.push({
        category: 'rule_violation',
        score: rule.scoreImpact,
        details: rule.name
      });
      checks.push({
        name: rule.name,
        passed: false,
        score: rule.scoreImpact,
        details: rule.description
      });
    } else {
      checks.push({
        name: rule.name,
        passed: true,
        score: 0,
        details: 'Check passed'
      });
    }
  });

  // Add trust score factors
  if (trustScore) {
    trustScore.factors.forEach(factor => {
      factors.push({
        category: 'trust_factor',
        score: factor.impact,
        details: factor.description
      });
    });
  }

  const finalScore = Math.max(0, Math.min(1000, baseScore + scoreModifier));
  const riskLevel = calculateRiskLevel(finalScore);

  // Determine recommendation
  let recommendation: RiskAssessment['recommendation'] = 'allow';
  if (finalScore < 200) {
    recommendation = 'block';
  } else if (finalScore < 400) {
    recommendation = 'challenge';
  } else if (finalScore < 600) {
    recommendation = 'review';
  }

  const assessment: RiskAssessment = {
    id,
    entityId,
    entityType,
    riskLevel,
    score: finalScore,
    recommendation,
    factors,
    checks,
    assessedAt: now,
    expiresAt: new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes
  };

  riskAssessments.set(id, assessment);

  res.json({ success: true, assessment });
});

// Get risk assessment
app.get('/api/risk/:assessmentId', (req: Request, res: Response) => {
  const assessment = riskAssessments.get(req.params.assessmentId);

  if (!assessment) {
    res.status(404).json({ error: 'Risk assessment not found' });
    return;
  }

  // Check if expired
  if (new Date() > assessment.expiresAt) {
    res.json({
      assessment,
      expired: true,
      message: 'This assessment has expired. Please perform a new assessment.'
    });
    return;
  }

  res.json({ assessment });
});

// ============================================
// REPUTATION MANAGEMENT
// ============================================

// Get reputation
app.get('/api/reputation/:entityType/:entityId', (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;

  let reputation = reputationRecords.get(`${entityType}-${entityId}`);

  if (!reputation) {
    // Return default reputation
    reputation = {
      entityId,
      entityType,
      positiveEvents: 0,
      negativeEvents: 0,
      neutralEvents: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      chargebacks: 0,
      disputes: 0,
      refunds: 0,
      rating: 0,
      reviewCount: 0,
      verifiedContacts: 0,
      accountAge: 0,
      lastActivity: new Date(),
      flags: [],
      badges: []
    };
  }

  res.json({ reputation });
});

// Update reputation
app.patch('/api/reputation/:entityType/:entityId', (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const updates = req.body;

  let reputation = reputationRecords.get(`${entityType}-${entityId}`);

  if (!reputation) {
    reputation = {
      entityId,
      entityType,
      positiveEvents: 0,
      negativeEvents: 0,
      neutralEvents: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      chargebacks: 0,
      disputes: 0,
      refunds: 0,
      rating: 0,
      reviewCount: 0,
      verifiedContacts: 0,
      accountAge: 0,
      lastActivity: new Date(),
      flags: [],
      badges: []
    };
  }

  // Apply updates
  Object.keys(updates).forEach(key => {
    if (key in reputation!) {
      (reputation as any)[key] = updates[key];
    }
  });

  reputationRecords.set(`${entityType}-${entityId}`, reputation);

  res.json({ success: true, reputation });
});

// Record reputation event
app.post('/api/reputation/:entityType/:entityId/events', (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const { eventType, details } = req.body;

  if (!eventType) {
    res.status(400).json({ error: 'eventType is required' });
    return;
  }

  let reputation = reputationRecords.get(`${entityType}-${entityId}`);

  if (!reputation) {
    reputation = {
      entityId,
      entityType,
      positiveEvents: 0,
      negativeEvents: 0,
      neutralEvents: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      chargebacks: 0,
      disputes: 0,
      refunds: 0,
      rating: 0,
      reviewCount: 0,
      verifiedContacts: 0,
      accountAge: 0,
      lastActivity: new Date(),
      flags: [],
      badges: []
    };
  }

  // Update based on event type
  switch (eventType) {
    case 'positive':
      reputation.positiveEvents++;
      break;
    case 'negative':
      reputation.negativeEvents++;
      break;
    case 'neutral':
      reputation.neutralEvents++;
      break;
    case 'transaction_success':
      reputation.totalTransactions++;
      reputation.successfulTransactions++;
      break;
    case 'transaction_failed':
      reputation.totalTransactions++;
      reputation.failedTransactions++;
      break;
    case 'chargeback':
      reputation.chargebacks++;
      break;
    case 'dispute':
      reputation.disputes++;
      break;
    case 'refund':
      reputation.refunds++;
      break;
  }

  reputation.lastActivity = new Date();
  reputationRecords.set(`${entityType}-${entityId}`, reputation);

  res.json({ success: true, reputation });
});

// ============================================
// RISK RULES MANAGEMENT
// ============================================

// List risk rules
app.get('/api/risk/rules', (req: Request, res: Response) => {
  const { enabled, riskLevel } = req.query;

  let filtered = Array.from(riskRules.values());

  if (enabled !== undefined) {
    filtered = filtered.filter(r => r.enabled === (enabled === 'true'));
  }
  if (riskLevel) {
    filtered = filtered.filter(r => r.riskLevel === riskLevel);
  }

  filtered.sort((a, b) => a.priority - b.priority);

  res.json({ rules: filtered });
});

// Create risk rule
app.post('/api/risk/rules', (req: Request, res: Response) => {
  const { name, description, condition, riskLevel, scoreImpact, action, priority = 5 } = req.body;

  if (!name || !condition || !riskLevel) {
    res.status(400).json({ error: 'name, condition, and riskLevel are required' });
    return;
  }

  const id = `rule-${uuidv4().slice(0, 8)}`;

  const rule: RiskRule = {
    id,
    name,
    description: description || '',
    condition,
    riskLevel,
    scoreImpact: scoreImpact || 0,
    enabled: true,
    action: action || 'flag',
    priority
  };

  riskRules.set(id, rule);

  res.status(201).json({ success: true, rule });
});

// Update risk rule
app.patch('/api/risk/rules/:id', (req: Request, res: Response) => {
  const rule = riskRules.get(req.params.id);

  if (!rule) {
    res.status(404).json({ error: 'Risk rule not found' });
    return;
  }

  const allowedUpdates = ['name', 'description', 'condition', 'riskLevel', 'scoreImpact', 'enabled', 'action', 'priority'];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      (rule as any)[field] = req.body[field];
    }
  });

  res.json({ success: true, rule });
});

// ============================================
// DASHBOARD METRICS
// ============================================

app.get('/api/dashboard/metrics', (req: Request, res: Response) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Trust score distribution
  const trustDistribution = {
    very_low: 0,
    low: 0,
    medium: 0,
    high: 0,
    very_high: 0
  };

  trustScores.forEach(score => {
    trustDistribution[score.riskLevel]++;
  });

  // Fraud signal stats
  let signalsLast24h = 0;
  let signalsLast7d = 0;
  const severityBreakdown = { low: 0, medium: 0, high: 0, critical: 0 };

  fraudSignals.forEach(signal => {
    if (signal.timestamp >= last24h) signalsLast24h++;
    if (signal.timestamp >= last7d) signalsLast7d++;
    severityBreakdown[signal.severity]++;
  });

  // Average trust score
  const trustScoresArray = Array.from(trustScores.values());
  const avgTrustScore = trustScoresArray.length > 0
    ? trustScoresArray.reduce((a, b) => a + b.score, 0) / trustScoresArray.length
    : 500;

  res.json({
    timestamp: now.toISOString(),
    trustScores: {
      total: trustScores.size,
      avgScore: Math.round(avgTrustScore),
      distribution: trustDistribution
    },
    fraudSignals: {
      total: fraudSignals.size,
      last24h: signalsLast24h,
      last7d: signalsLast7d,
      unprocessed: Array.from(fraudSignals.values()).filter(s => !s.processed).length,
      severityBreakdown
    },
    riskAssessments: {
      total: riskAssessments.size
    },
    riskRules: {
      total: riskRules.size,
      enabled: Array.from(riskRules.values()).filter(r => r.enabled).length
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Trust Platform Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`[trust-platform] Trust Platform running on port ${PORT}`);
  console.log(`[trust-platform] Health check: http://localhost:${PORT}/health`);
  console.log(`[trust-platform] Trust scores: ${trustScores.size}`);
  console.log(`[trust-platform] Fraud signals: ${fraudSignals.size}`);
});

export default app;