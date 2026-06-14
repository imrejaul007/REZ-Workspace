/**
 * REZ Atlas v2 - Intent Engine
 * Real-time Intent Signal Detection
 *
 * Detects purchase readiness signals:
 * - New website
 * - New hiring
 * - New branch
 * - Funding
 * - Review spike
 * - Traffic increase
 * - Social activity spike
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5159;

// Signal Types
type SignalType =
  | 'new_website'
  | 'new_hiring'
  | 'new_branch'
  | 'funding'
  | 'review_spike'
  | 'traffic_increase'
  | 'social_spike'
  | 'review_decline'
  | 'rating_drop'
  | 'competitor_migration'
  | 'expansion'
  | 'technology_change';

// Intent Signal Interface
interface IntentSignal {
  id: string;
  merchantId: string;
  merchantName: string;
  type: SignalType;
  title: string;
  description: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detectedAt: string;
  expiresAt: string;
  source: string;
  metadata: Record<string, any>;
  engaged: boolean;
  engagementScore: number;
}

// ICP Match Interface
interface ICPMatch {
  id: string;
  merchantId: string;
  merchantName: string;
  icpName: string;
  matchScore: number;
  matchReasons: string[];
  createdAt: string;
}

// Intent storage
const intentSignals: Map<string, IntentSignal> = new Map();
const icpMatches: Map<string, ICPMatch> = new Map();

// ICP Templates
const icpTemplates = [
  {
    id: 'icp-restaurant-hot',
    name: 'Hot Restaurant ICP',
    criteria: {
      category: 'restaurant',
      minReviews: 50,
      minRating: 4.0,
      noLoyalty: true,
      locations: ['Bangalore', 'Mumbai', 'Delhi']
    }
  },
  {
    id: 'icp-salon-growth',
    name: 'Growth Salon ICP',
    criteria: {
      category: 'salon',
      minReviews: 30,
      minRating: 3.5,
      hasHiring: true,
      locations: ['Bangalore', 'Pune']
    }
  },
  {
    id: 'icp-retail-funded',
    name: 'Funded Retail ICP',
    criteria: {
      category: 'retail',
      hasFunding: true,
      minEmployees: 20,
      locations: ['All']
    }
  }
];

// Seed signals
const seedSignals: IntentSignal[] = [
  {
    id: uuidv4(),
    merchantId: 'm1',
    merchantName: 'Truffles Restaurant',
    type: 'new_hiring',
    title: 'Aggressive Hiring Detected',
    description: 'Hired 5 new staff members in last 30 days, indicating growth',
    confidence: 0.85,
    severity: 'high',
    detectedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'linkedin',
    metadata: { newHires: 5, department: 'service' },
    engaged: false,
    engagementScore: 0
  },
  {
    id: uuidv4(),
    merchantId: 'm2',
    merchantName: 'FreshMart Grocery',
    type: 'funding',
    title: 'Series B Funding Detected',
    description: 'Raised ₹50 Cr from Sequoia Capital - high expansion potential',
    confidence: 0.95,
    severity: 'critical',
    detectedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'crunchbase',
    metadata: { amount: 50000000, stage: 'Series B', investors: ['Sequoia'] },
    engaged: false,
    engagementScore: 0
  },
  {
    id: uuidv4(),
    merchantId: 'm3',
    merchantName: 'Urbanivan Salon',
    type: 'review_spike',
    title: 'Review Spike Detected',
    description: '30 new reviews in last 7 days - opportunity for review management',
    confidence: 0.72,
    severity: 'medium',
    detectedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'google',
    metadata: { reviewCount: 30, avgRating: 3.2 },
    engaged: false,
    engagementScore: 0
  }
];

seedSignals.forEach(s => intentSignals.set(s.id, s));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'atlas-intent-engine',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get all signals
app.get('/api/signals', (req, res) => {
  const { type, severity, merchantId, engaged, limit = 50 } = req.query;
  let signals = Array.from(intentSignals.values());

  if (type) signals = signals.filter(s => s.type === type);
  if (severity) signals = signals.filter(s => s.severity === severity);
  if (merchantId) signals = signals.filter(s => s.merchantId === merchantId);
  if (engaged !== undefined) signals = signals.filter(s => s.engaged === (engaged === 'true'));

  signals.sort((a, b) => b.confidence - a.confidence);

  res.json({
    signals: signals.slice(0, Number(limit)),
    count: signals.length,
    total: intentSignals.size
  });
});

// Get signal by ID
app.get('/api/signals/:id', (req, res) => {
  const signal = intentSignals.get(req.params.id);
  if (!signal) {
    return res.status(404).json({ error: 'Signal not found' });
  }
  res.json(signal);
});

// Create signal
app.post('/api/signals', (req, res) => {
  const { merchantId, merchantName, type, title, description, confidence, severity, source, metadata } = req.body;

  if (!merchantId || !type) {
    return res.status(400).json({ error: 'merchantId and type are required' });
  }

  const signal: IntentSignal = {
    id: uuidv4(),
    merchantId,
    merchantName: merchantName || 'Unknown',
    type,
    title: title || `${type} detected`,
    description: description || '',
    confidence: confidence || 0.7,
    severity: severity || 'medium',
    detectedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    source: source || 'system',
    metadata: metadata || {},
    engaged: false,
    engagementScore: 0
  };

  intentSignals.set(signal.id, signal);

  res.status(201).json(signal);
});

// Get signals by merchant
app.get('/api/merchants/:merchantId/signals', (req, res) => {
  const signals = Array.from(intentSignals.values()).filter(s => s.merchantId === req.params.merchantId);
  res.json({ signals, count: signals.length });
});

// Get critical signals
app.get('/api/signals/critical', (req, res) => {
  const critical = Array.from(intentSignals.values())
    .filter(s => s.severity === 'critical' || s.confidence > 0.9)
    .sort((a, b) => b.confidence - a.confidence);
  res.json({ signals: critical, count: critical.length });
});

// Get signals by type
app.get('/api/signals/type/:type', (req, res) => {
  const signals = Array.from(intentSignals.values())
    .filter(s => s.type === req.params.type)
    .sort((a, b) => b.confidence - a.confidence);
  res.json({ signals, count: signals.length });
});

// Engage with signal
app.post('/api/signals/:id/engage', (req, res) => {
  const signal = intentSignals.get(req.params.id);
  if (!signal) {
    return res.status(404).json({ error: 'Signal not found' });
  }

  signal.engaged = true;
  signal.engagementScore = signal.confidence * 100;
  intentSignals.set(signal.id, signal);

  res.json({ signal, action: 'engaged' });
});

// ICP Matching
app.get('/api/icp/matches', (req, res) => {
  const matches = Array.from(icpMatches.values())
    .sort((a, b) => b.matchScore - a.matchScore);
  res.json({ matches, count: matches.length });
});

// Create ICP
app.post('/api/icp', (req, res) => {
  const { name, criteria } = req.body;

  if (!name || !criteria) {
    return res.status(400).json({ error: 'name and criteria are required' });
  }

  const icp = {
    id: uuidv4(),
    name,
    criteria,
    createdAt: new Date().toISOString()
  };

  // In production, this would trigger ICP matching
  res.status(201).json(icp);
});

// Match merchant against ICPs
app.post('/api/icp/match', (req, res) => {
  const { merchantId, merchantName, category, reviews, rating, employees, funding, location } = req.body;

  const matches: ICPMatch[] = [];

  icpTemplates.forEach(template => {
    let score = 0;
    const reasons: string[] = [];

    if (template.criteria.category && template.criteria.category === category) {
      score += 30;
      reasons.push(`Category match: ${category}`);
    }

    if (template.criteria.minReviews && reviews >= template.criteria.minReviews) {
      score += 20;
      reasons.push(`${reviews} reviews (min: ${template.criteria.minReviews})`);
    }

    if (template.criteria.minRating && rating >= template.criteria.minRating) {
      score += 20;
      reasons.push(`Rating ${rating} (min: ${template.criteria.minRating})`);
    }

    if (template.criteria.hasFunding && funding) {
      score += 25;
      reasons.push(`Has funding: ${funding}`);
    }

    if (score >= 50) {
      matches.push({
        id: uuidv4(),
        merchantId,
        merchantName: merchantName || 'Unknown',
        icpName: template.name,
        matchScore: score,
        matchReasons: reasons,
        createdAt: new Date().toISOString()
      });
    }
  });

  matches.forEach(m => icpMatches.set(m.id, m));

  res.json({
    matches,
    bestMatch: matches[0] || null,
    matchCount: matches.length
  });
});

// Signal analytics
app.get('/api/analytics/signals', (req, res) => {
  const signals = Array.from(intentSignals.values());

  const byType = signals.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bySeverity = signals.reduce((acc, s) => {
    acc[s.severity] = (acc[s.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.json({
    totalSignals: signals.length,
    engagedSignals: signals.filter(s => s.engaged).length,
    byType,
    bySeverity,
    avgConfidence: (signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length).toFixed(2),
    topSignals: signals.slice(0, 5).map(s => ({
      id: s.id,
      merchantName: s.merchantName,
      type: s.type,
      confidence: s.confidence,
      severity: s.severity
    }))
  });
});

// Detect new signal (simulated)
app.post('/api/signals/detect', (req, res) => {
  const { merchantId, merchantName, signalType, data } = req.body;

  const signalTypes: Record<string, { title: string; severity: string; confidence: number }> = {
    new_website: { title: 'New Website Launched', severity: 'medium', confidence: 0.8 },
    new_hiring: { title: 'Aggressive Hiring', severity: 'high', confidence: 0.85 },
    new_branch: { title: 'New Branch Opening', severity: 'high', confidence: 0.9 },
    funding: { title: 'Funding Detected', severity: 'critical', confidence: 0.95 },
    review_spike: { title: 'Review Activity Spike', severity: 'medium', confidence: 0.75 },
    rating_drop: { title: 'Rating Decline', severity: 'high', confidence: 0.8 }
  };

  const config = signalTypes[signalType] || { title: 'Signal Detected', severity: 'medium', confidence: 0.7 };

  const signal: IntentSignal = {
    id: uuidv4(),
    merchantId,
    merchantName: merchantName || 'Unknown',
    type: signalType as SignalType,
    title: config.title,
    description: `Automated detection: ${signalType}`,
    confidence: config.confidence,
    severity: config.severity as IntentSignal['severity'],
    detectedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    source: 'automated',
    metadata: data || {},
    engaged: false,
    engagementScore: 0
  };

  intentSignals.set(signal.id, signal);

  res.status(201).json({
    signal,
    action: 'Signal detected and created'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`📡 Atlas Intent Engine running on port ${PORT}`);
  console.log(`   ${intentSignals.size} signals loaded`);
});

export default app;