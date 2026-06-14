/**
 * BIZORA Business Identity Graph
 * Unified understanding of businesses, owners, vendors, suppliers, relationships
 * "LinkedIn + ERP + Marketplace Intelligence"
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface Business {
  id: string;
  name: string;
  type: 'sole_proprietorship' | 'partnership' | 'llp' | 'pvt_ltd' | 'ltd' | 'public';
  industry: string;
  stage: 'idea' | 'startup' | 'early' | 'growth' | 'established' | 'scaling';
  location: { city: string; state: string; country: string };
  founded: string;
  size: { employees: number; locations: number };
  owners: string[];  // Person IDs
  gst?: string;
  pan?: string;
  compliance: ComplianceStatus;
  score: BusinessScore;
  relationships: Relationship[];
  signals: Signal[];
}

interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'founder' | 'employee' | 'vendor' | 'partner';
  businesses: string[];  // Business IDs
  trustScore: number;
  verified: boolean;
}

interface Relationship {
  type: 'owns' | 'employs' | 'supplies_to' | 'buys_from' | 'partners_with' | 'refers' | 'franchises';
  targetId: string;
  targetName: string;
  strength: number;  // 0-100
  since: string;
  transactions: number;
  value: number;
  lastActivity: string;
}

interface ComplianceStatus {
  gst: 'active' | 'pending' | 'lapsed' | 'none';
  tds: 'compliant' | 'pending' | 'default';
  roc: 'compliant' | 'pending' | 'default';
  lastAudit: string;
}

interface BusinessScore {
  overall: number;
  paymentBehavior: number;
  complianceHistory: number;
  deliveryQuality: number;
  responseTime: number;
  growth: number;
  stability: number;
}

interface Signal {
  type: 'expansion' | 'hiring' | 'complaint' | 'payment_slow' | 'compliance_alert' | 'review_received';
  source: string;
  description: string;
  timestamp: string;
  confidence: number;
}

// ============================================================================
// Sample Data
// ============================================================================

const businesses: Map<string, Business> = new Map([
  ['b1', {
    id: 'b1',
    name: 'The Burger Joint',
    type: 'pvt_ltd',
    industry: 'restaurant',
    stage: 'growth',
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    founded: '2022',
    size: { employees: 25, locations: 2 },
    owners: ['p1'],
    gst: '27XXXXX1234Z5',
    pan: 'AABCU1234X',
    compliance: { gst: 'active', tds: 'compliant', roc: 'compliant', lastAudit: '2026-04' },
    score: { overall: 85, paymentBehavior: 92, complianceHistory: 95, deliveryQuality: 88, responseTime: 80, growth: 75, stability: 82 },
    relationships: [
      { type: 'supplies_to', targetId: 'b2', targetName: 'FoodPro Supplies', strength: 90, since: '2022-01', transactions: 156, value: 450000, lastActivity: '2026-05-20' },
      { type: 'supplies_to', targetId: 'b3', targetName: 'PackMart India', strength: 75, since: '2022-03', transactions: 89, value: 180000, lastActivity: '2026-05-15' },
      { type: 'partners_with', targetId: 'b4', targetName: 'Zomato', strength: 80, since: '2022-02', transactions: 2340, value: 1200000, lastActivity: '2026-05-23' },
    ],
    signals: [
      { type: 'hiring', source: 'PeopleOS', description: 'Posted 3 new job listings for kitchen staff', timestamp: '2026-05-22', confidence: 0.95 },
      { type: 'expansion', source: 'InvoiceFlow', description: 'Ordered POS equipment for 3rd location', timestamp: '2026-05-20', confidence: 0.85 },
    ],
  }],
  ['b2', {
    id: 'b2',
    name: 'FoodPro Supplies',
    type: 'pvt_ltd',
    industry: 'food_distribution',
    stage: 'established',
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    founded: '2018',
    size: { employees: 85, locations: 4 },
    owners: ['p2', 'p3'],
    gst: '27YYYYY5678Z9',
    pan: 'AABCF5678Y',
    compliance: { gst: 'active', tds: 'compliant', roc: 'compliant', lastAudit: '2026-03' },
    score: { overall: 92, paymentBehavior: 88, complianceHistory: 98, deliveryQuality: 94, responseTime: 90, growth: 65, stability: 95 },
    relationships: [
      { type: 'buys_from', targetId: 'b5', targetName: 'AgroFresh Farms', strength: 85, since: '2019-01', transactions: 234, value: 2500000, lastActivity: '2026-05-22' },
    ],
    signals: [],
  }],
]);

const persons: Map<string, Person> = new Map([
  ['p1', {
    id: 'p1',
    name: 'Rahul Sharma',
    email: 'rahul@burgerjoint.in',
    phone: '+91-9876500001',
    role: 'founder',
    businesses: ['b1'],
    trustScore: 88,
    verified: true,
  }],
  ['p2', {
    id: 'p2',
    name: 'Priya Patel',
    email: 'priya@foodpro.in',
    phone: '+91-9876500002',
    role: 'owner',
    businesses: ['b2'],
    trustScore: 92,
    verified: true,
  }],
]);

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'business-graph',
    businesses: businesses.size,
    persons: persons.size,
  });
});

// Get business profile
app.get('/api/businesses/:id', (req: Request, res: Response) => {
  const business = businesses.get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });
  res.json(business);
});

// Search businesses
app.get('/api/businesses', (req: Request, res: Response) => {
  const { industry, city, stage, minScore } = req.query;

  let results = Array.from(businesses.values());

  if (industry) results = results.filter(b => b.industry === industry);
  if (city) results = results.filter(b => b.location.city === city);
  if (stage) results = results.filter(b => b.stage === stage);
  if (minScore) results = results.filter(b => b.score.overall >= parseInt(minScore as string));

  res.json({ businesses: results, total: results.length });
});

// Get business network
app.get('/api/businesses/:id/network', (req: Request, res: Response) => {
  const business = businesses.get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  // Get related businesses
  const network = business.relationships.map(r => {
    const related = businesses.get(r.targetId);
    return {
      relationship: r,
      business: related || { id: r.targetId, name: r.targetName },
    };
  });

  res.json({
    business: { id: business.id, name: business.name },
    network,
    stats: {
      totalRelationships: network.length,
      suppliers: network.filter(n => n.relationship.type === 'supplies_to').length,
      customers: network.filter(n => n.relationship.type === 'buys_from').length,
      partners: network.filter(n => n.relationship.type === 'partners_with').length,
      totalValue: network.reduce((sum, n) => sum + n.relationship.value, 0),
    },
  });
});

// Get person profile
app.get('/api/persons/:id', (req: Request, res: Response) => {
  const person = persons.get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const personBusinesses = person.businesses.map(id => businesses.get(id)).filter(Boolean);

  res.json({
    ...person,
    businesses: personBusinesses,
  });
});

// Get business connections
app.get('/api/businesses/:id/connections', (req: Request, res: Response) => {
  const business = businesses.get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  // Find indirect connections (2nd degree)
  const directTargets = new Set(business.relationships.map(r => r.targetId));
  const indirect: any[] = [];

  for (const targetId of directTargets) {
    const target = businesses.get(targetId);
    if (target) {
      for (const rel of target.relationships) {
        if (!directTargets.has(rel.targetId) && rel.targetId !== req.params.id) {
          indirect.push({
            business: { id: rel.targetId, name: rel.targetName },
            through: target.name,
            relationship: rel.type,
          });
        }
      }
    }
  }

  res.json({
    direct: business.relationships.length,
    indirect: indirect.slice(0, 20),
    stats: {
      suppliers: business.relationships.filter(r => r.type === 'supplies_to').length,
      customers: business.relationships.filter(r => r.type === 'buys_from').length,
      partners: business.relationships.filter(r => r.type === 'partners_with').length,
    },
  });
});

// Get related businesses (industry/location based)
app.get('/api/businesses/:id/related', (req: Request, res: Response) => {
  const business = businesses.get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const related = Array.from(businesses.values())
    .filter(b =>
      b.id !== req.params.id &&
      (b.industry === business.industry || b.location.city === business.location.city)
    )
    .slice(0, 10);

  res.json({ related });
});

// Track relationship
app.post('/api/businesses/:id/relationships', (req: Request, res: Response) => {
  const business = businesses.get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const { type, targetId, targetName, value } = req.body;

  const relationship: Relationship = {
    type,
    targetId,
    targetName,
    strength: 50,
    since: new Date().toISOString().split('T')[0],
    transactions: 0,
    value: value || 0,
    lastActivity: new Date().toISOString(),
  };

  business.relationships.push(relationship);
  businesses.set(req.params.id, business);

  res.status(201).json({ relationship, message: 'Relationship tracked' });
});

// Get business signals
app.get('/api/businesses/:id/signals', (req: Request, res: Response) => {
  const business = businesses.get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  res.json({
    signals: business.signals,
    intent: {
      expansion: business.signals.some(s => s.type === 'expansion'),
      hiring: business.signals.some(s => s.type === 'hiring'),
      compliance: business.signals.some(s => s.type === 'compliance_alert'),
    },
  });
});

// Add signal
app.post('/api/businesses/:id/signals', (req: Request, res: Response) => {
  const business = businesses.get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const { type, source, description } = req.body;

  business.signals.push({
    type,
    source,
    description,
    timestamp: new Date().toISOString(),
    confidence: 0.8,
  });

  businesses.set(req.params.id, business);

  res.status(201).json({ signal: business.signals[business.signals.length - 1] });
});

// Graph analytics
app.get('/api/graph/analytics', (_req: Request, res: Response) => {
  const all = Array.from(businesses.values());

  res.json({
    totalBusinesses: all.length,
    byIndustry: Object.fromEntries(
      [...new Set(all.map(b => b.industry))].map(i => [
        i,
        all.filter(b => b.industry === i).length,
      ])
    ),
    byStage: Object.fromEntries(
      ['idea', 'startup', 'early', 'growth', 'established', 'scaling'].map(s => [
        s,
        all.filter(b => b.stage === s).length,
      ])
    ),
    averageScore: Math.round(all.reduce((sum, b) => sum + b.score.overall, 0) / all.length),
    topRelationships: all
      .flatMap(b => b.relationships)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  });
});

// Business lookup by GST/PAN
app.get('/api/lookup', (req: Request, res: Response) => {
  const { gst, pan, phone, email } = req.query;

  const found = Array.from(businesses.values()).find(b =>
    (gst && b.gst === gst) ||
    (pan && b.pan === pan)
  );

  if (found) {
    res.json({ found: true, business: found });
  } else {
    res.json({ found: false, message: 'No business found with this identifier' });
  }
});

const PORT = process.env.PORT || 4080;
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════╗
║  🕸️  Business Identity Graph              ║
║  LinkedIn + ERP + Marketplace Intelligence ║
║  Port: ${PORT}                               ║
╚═══════════════════════════════════════════════╝
  `);
});
