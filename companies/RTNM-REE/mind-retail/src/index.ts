/**
 * MIND-RETAIL Service - Retail Vertical AI
 *
 * REE Service for retail-specific intelligence:
 * - Customer segmentation
 * - Personalization engine
 * - Churn prediction
 * - Cross-sell recommendations
 *
 * Port: 3009
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3009;
const SERVICE_KEY = process.env.SERVICE_KEY || 'ree-mind-retail-key';

// ============================================
// IN-MEMORY STORAGE
// ============================================

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: 'premium' | 'regular' | 'budget' | 'new';
  lifetimeValue: number;
  totalOrders: number;
  avgOrderValue: number;
  lastPurchaseDate: string;
  firstPurchaseDate: string;
  preferences: string[];
  channels: string[];
  churnScore: number;
  engagementScore: number;
  tags: string[];
  metadata: Record<string, any>;
}

interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: {
    minLifetimeValue?: number;
    maxLifetimeValue?: number;
    minOrders?: number;
    maxOrders?: number;
    tags?: string[];
    churnScoreMin?: number;
    churnScoreMax?: number;
  };
  customerCount: number;
  avgOrderValue: number;
  totalRevenue: number;
}

interface Personalization {
  id: string;
  customerId: string;
  type: 'recommendation' | 'offer' | 'content' | 'notification';
  content: string;
  score: number;
  reason: string;
  expiresAt: string;
  shown: boolean;
  converted: boolean;
}

interface ChurnRisk {
  customerId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendedActions: string[];
  lastActiveDate: string;
  predictedChurnDate: string;
}

interface CrossSell {
  id: string;
  customerId: string;
  sourceProductId: string;
  targetProductId: string;
  score: number;
  reason: string;
  conversionProbability: number;
  createdAt: string;
}

// Storage
const customers: Map<string, Customer> = new Map();
const segments: Map<string, Segment> = new Map();
const personalizations: Map<string, Personalization> = new Map();
const churnRisks: Map<string, ChurnRisk> = new Map();
const crossSells: Map<string, CrossSell> = new Map();

// ============================================
// SEED DATA
// ============================================

function seedInitialData() {
  // Seed segments
  const seedSegments: Segment[] = [
    {
      id: 'seg-premium',
      name: 'Premium Customers',
      description: 'High-value customers with lifetime value > 50000',
      criteria: { minLifetimeValue: 50000 },
      customerCount: 0,
      avgOrderValue: 0,
      totalRevenue: 0
    },
    {
      id: 'seg-regular',
      name: 'Regular Customers',
      description: 'Frequent buyers with 10+ orders',
      criteria: { minOrders: 10, maxLifetimeValue: 50000 },
      customerCount: 0,
      avgOrderValue: 0,
      totalRevenue: 0
    },
    {
      id: 'seg-budget',
      name: 'Budget Conscious',
      description: 'Price-sensitive customers with lower AOV',
      criteria: { maxLifetimeValue: 5000 },
      customerCount: 0,
      avgOrderValue: 0,
      totalRevenue: 0
    },
    {
      id: 'seg-new',
      name: 'New Customers',
      description: 'Customers acquired in last 90 days',
      criteria: {},
      customerCount: 0,
      avgOrderValue: 0,
      totalRevenue: 0
    }
  ];

  seedSegments.forEach(s => segments.set(s.id, s));

  // Seed customers
  const seedCustomers: Customer[] = [
    {
      id: 'cust-001',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+919876543210',
      segment: 'premium',
      lifetimeValue: 125000,
      totalOrders: 45,
      avgOrderValue: 2778,
      lastPurchaseDate: '2026-06-08',
      firstPurchaseDate: '2024-03-15',
      preferences: ['electronics', 'fashion', 'home'],
      channels: ['app', 'website', 'store'],
      churnScore: 0.15,
      engagementScore: 0.92,
      tags: ['vip', 'early-adopter', 'repeat-buyer'],
      metadata: { birthday: '1990-05-20', city: 'Mumbai' }
    },
    {
      id: 'cust-002',
      name: 'Rahul Verma',
      email: 'rahul.v@email.com',
      phone: '+919876543211',
      segment: 'regular',
      lifetimeValue: 28000,
      totalOrders: 18,
      avgOrderValue: 1556,
      lastPurchaseDate: '2026-06-05',
      firstPurchaseDate: '2024-08-20',
      preferences: ['electronics', 'sports'],
      channels: ['app', 'website'],
      churnScore: 0.35,
      engagementScore: 0.68,
      tags: ['frequent-buyer'],
      metadata: { city: 'Delhi' }
    },
    {
      id: 'cust-003',
      name: 'Anita Desai',
      email: 'anita.d@email.com',
      phone: '+919876543212',
      segment: 'budget',
      lifetimeValue: 3200,
      totalOrders: 8,
      avgOrderValue: 400,
      lastPurchaseDate: '2026-05-28',
      firstPurchaseDate: '2025-11-10',
      preferences: ['groceries', 'household'],
      channels: ['website'],
      churnScore: 0.55,
      engagementScore: 0.42,
      tags: ['discount-seeker'],
      metadata: { city: 'Bangalore' }
    },
    {
      id: 'cust-004',
      name: 'Vikram Singh',
      email: 'vikram.s@email.com',
      phone: '+919876543213',
      segment: 'new',
      lifetimeValue: 8500,
      totalOrders: 3,
      avgOrderValue: 2833,
      lastPurchaseDate: '2026-06-10',
      firstPurchaseDate: '2026-05-15',
      preferences: ['fashion', 'accessories'],
      channels: ['app'],
      churnScore: 0.25,
      engagementScore: 0.78,
      tags: ['new-customer', 'mobile-first'],
      metadata: { referral: 'friend-referral' }
    },
    {
      id: 'cust-005',
      name: 'Meera Patel',
      email: 'meera.p@email.com',
      phone: '+919876543214',
      segment: 'premium',
      lifetimeValue: 89000,
      totalOrders: 38,
      avgOrderValue: 2342,
      lastPurchaseDate: '2026-06-01',
      firstPurchaseDate: '2024-01-10',
      preferences: ['beauty', 'wellness', 'fashion'],
      channels: ['app', 'store', 'website'],
      churnScore: 0.45,
      engagementScore: 0.55,
      tags: ['vip', 'beauty-enthusiast'],
      metadata: { birthday: '1988-09-15', city: 'Chennai' }
    },
    {
      id: 'cust-006',
      name: 'Arjun Nair',
      email: 'arjun.n@email.com',
      phone: '+919876543215',
      segment: 'regular',
      lifetimeValue: 42000,
      totalOrders: 22,
      avgOrderValue: 1909,
      lastPurchaseDate: '2026-04-20',
      firstPurchaseDate: '2024-05-22',
      preferences: ['electronics', 'gaming'],
      channels: ['app', 'website'],
      churnScore: 0.72,
      engagementScore: 0.38,
      tags: ['electronics-fan', 'at-risk'],
      metadata: { city: 'Hyderabad' }
    },
    {
      id: 'cust-007',
      name: 'Kavitha Rao',
      email: 'kavitha.r@email.com',
      phone: '+919876543216',
      segment: 'budget',
      lifetimeValue: 1800,
      totalOrders: 4,
      avgOrderValue: 450,
      lastPurchaseDate: '2026-06-09',
      firstPurchaseDate: '2026-04-05',
      preferences: ['groceries'],
      channels: ['website'],
      churnScore: 0.82,
      engagementScore: 0.22,
      tags: ['one-time-buyer', 'at-risk'],
      metadata: { city: 'Pune' }
    },
    {
      id: 'cust-008',
      name: 'Sanjay Gupta',
      email: 'sanjay.g@email.com',
      phone: '+919876543217',
      segment: 'premium',
      lifetimeValue: 156000,
      totalOrders: 62,
      avgOrderValue: 2516,
      lastPurchaseDate: '2026-06-07',
      firstPurchaseDate: '2023-08-10',
      preferences: ['electronics', 'home', 'fashion', 'sports'],
      channels: ['app', 'store', 'website', 'phone'],
      churnScore: 0.08,
      engagementScore: 0.95,
      tags: ['vip', 'super-buyer', 'brand-loyalist'],
      metadata: { birthday: '1985-12-01', city: 'Mumbai' }
    }
  ];

  seedCustomers.forEach(c => {
    customers.set(c.id, c);
    updateSegmentCounts(c);
  });

  // Generate initial churn risks
  for (const customer of customers.values()) {
    const churnRisk = calculateChurnRisk(customer);
    churnRisks.set(customer.id, churnRisk);
  }

  console.log(`[Mind-Retail] Seeded ${customers.size} customers and ${segments.size} segments`);
}

function updateSegmentCounts(customer: Customer) {
  // Update segment counts based on customer data
  for (const segment of segments.values()) {
    const criteria = segment.criteria;
    let matches = true;

    if (criteria.minLifetimeValue && customer.lifetimeValue < criteria.minLifetimeValue) matches = false;
    if (criteria.maxLifetimeValue && customer.lifetimeValue > criteria.maxLifetimeValue) matches = false;
    if (criteria.minOrders && customer.totalOrders < criteria.minOrders) matches = false;
    if (criteria.maxOrders && customer.totalOrders > criteria.maxOrders) matches = false;

    if (matches) {
      segment.customerCount++;
      segment.totalRevenue += customer.lifetimeValue;
      segment.avgOrderValue = segment.totalRevenue / (segment.customerCount * customer.avgOrderValue);
    }
  }
}

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-service-key'];
  if (key !== SERVICE_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mind-retail',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', (req, res) => {
  res.json({
    status: 'ready',
    customers: customers.size,
    segments: segments.size,
    churnRisks: churnRisks.size
  });
});

// ============================================
// CUSTOMER ENDPOINTS
// ============================================

// Get all customers
app.get('/api/customers', (req, res) => {
  const { segment, minLTV, maxLTV, atRisk, tag } = req.query;

  let result = Array.from(customers.values());

  if (segment) {
    result = result.filter(c => c.segment === segment);
  }
  if (minLTV) {
    result = result.filter(c => c.lifetimeValue >= Number(minLTV));
  }
  if (maxLTV) {
    result = result.filter(c => c.lifetimeValue <= Number(maxLTV));
  }
  if (atRisk === 'true') {
    result = result.filter(c => c.churnScore > 0.5);
  }
  if (tag) {
    result = result.filter(c => c.tags.includes(tag as string));
  }

  res.json({ success: true, data: result, total: result.length });
});

// Get single customer
app.get('/api/customers/:id', (req, res) => {
  const customer = customers.get(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  // Include related data
  const customerPersonalizations = Array.from(personalizations.values())
    .filter(p => p.customerId === customer.id);
  const customerCrossSells = Array.from(crossSells.values())
    .filter(cs => cs.customerId === customer.id);
  const churnRisk = churnRisks.get(customer.id);

  res.json({
    success: true,
    data: {
      ...customer,
      personalizations: customerPersonalizations,
      crossSells: customerCrossSells,
      churnRisk
    }
  });
});

// Create customer
app.post('/api/customers', authMiddleware, (req, res) => {
  const { name, email, phone, segment, preferences, tags, metadata } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: 'Name and email are required' });
  }

  const id = `cust-${Date.now()}`;
  const customer: Customer = {
    id,
    name,
    email,
    phone: phone || '',
    segment: segment || 'new',
    lifetimeValue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    lastPurchaseDate: '',
    firstPurchaseDate: new Date().toISOString().split('T')[0],
    preferences: preferences || [],
    channels: [],
    churnScore: 0.5,
    engagementScore: 0.5,
    tags: tags || ['new-customer'],
    metadata: metadata || {}
  };

  customers.set(id, customer);
  updateSegmentCounts(customer);

  // Calculate initial churn risk
  const churnRisk = calculateChurnRisk(customer);
  churnRisks.set(id, churnRisk);

  res.status(201).json({ success: true, data: customer });
});

// Update customer
app.put('/api/customers/:id', authMiddleware, (req, res) => {
  const customer = customers.get(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  const updated = { ...customer, ...req.body, id: customer.id };
  customers.set(customer.id, updated);

  // Recalculate churn risk if engagement or behavior changed
  if (req.body.engagementScore !== undefined || req.body.totalOrders !== undefined) {
    const churnRisk = calculateChurnRisk(updated);
    churnRisks.set(updated.id, churnRisk);
  }

  res.json({ success: true, data: updated });
});

// Delete customer
app.delete('/api/customers/:id', authMiddleware, (req, res) => {
  if (!customers.has(req.params.id)) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }
  customers.delete(req.params.id);
  res.json({ success: true, message: 'Customer deleted' });
});

// Record purchase
app.post('/api/customers/:id/purchase', authMiddleware, (req, res) => {
  const customer = customers.get(req.params.id);
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  const { amount, products, channel } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid purchase amount' });
  }

  const now = new Date().toISOString().split('T')[0];
  const newLifetimeValue = customer.lifetimeValue + amount;
  const newTotalOrders = customer.totalOrders + 1;
  const newAvgOrderValue = newLifetimeValue / newTotalOrders;

  // Update engagement score (boosted by purchase)
  const newEngagementScore = Math.min(1, customer.engagementScore + 0.05);

  // Update churn score (reduced by purchase)
  const newChurnScore = Math.max(0, customer.churnScore - 0.1);

  const updated: Customer = {
    ...customer,
    lifetimeValue: newLifetimeValue,
    totalOrders: newTotalOrders,
    avgOrderValue: newAvgOrderValue,
    lastPurchaseDate: now,
    engagementScore: newEngagementScore,
    churnScore: newChurnScore,
    channels: channel ? [...new Set([...customer.channels, channel])] : customer.channels
  };

  customers.set(customer.id, updated);

  // Recalculate churn risk
  const churnRisk = calculateChurnRisk(updated);
  churnRisks.set(updated.id, churnRisk);

  // Generate cross-sell recommendations
  generateCrossSells(updated);

  res.json({ success: true, data: updated });
});

// ============================================
// SEGMENTATION
// ============================================

// Get all segments
app.get('/api/segments', (req, res) => {
  res.json({
    success: true,
    data: Array.from(segments.values())
  });
});

// Get segment by ID
app.get('/api/segments/:id', (req, res) => {
  const segment = segments.get(req.params.id);
  if (!segment) {
    return res.status(404).json({ success: false, error: 'Segment not found' });
  }

  // Get customers in this segment
  const segmentCustomers = Array.from(customers.values()).filter(c => {
    const criteria = segment.criteria;
    let matches = true;

    if (criteria.minLifetimeValue && c.lifetimeValue < criteria.minLifetimeValue) matches = false;
    if (criteria.maxLifetimeValue && c.lifetimeValue > criteria.maxLifetimeValue) matches = false;
    if (criteria.minOrders && c.totalOrders < criteria.minOrders) matches = false;
    if (criteria.maxOrders && c.totalOrders > criteria.maxOrders) matches = false;

    return matches;
  });

  res.json({
    success: true,
    data: {
      ...segment,
      customers: segmentCustomers
    }
  });
});

// Create segment
app.post('/api/segments', authMiddleware, (req, res) => {
  const { name, description, criteria } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Segment name is required' });
  }

  const id = `seg-${Date.now()}`;
  const segment: Segment = {
    id,
    name,
    description: description || '',
    criteria: criteria || {},
    customerCount: 0,
    avgOrderValue: 0,
    totalRevenue: 0
  };

  segments.set(id, segment);
  res.status(201).json({ success: true, data: segment });
});

// ============================================
// CHURN PREDICTION
// ============================================

// Get churn risks
app.get('/api/churn', (req, res) => {
  const { level, minScore } = req.query;

  let result = Array.from(churnRisks.values());

  if (level) {
    result = result.filter(c => c.riskLevel === level);
  }
  if (minScore) {
    result = result.filter(c => c.riskScore >= Number(minScore));
  }

  // Sort by risk score (highest first)
  result.sort((a, b) => b.riskScore - a.riskScore);

  res.json({ success: true, data: result });
});

// Get churn risk for customer
app.get('/api/churn/:customerId', (req, res) => {
  const risk = churnRisks.get(req.params.customerId);
  if (!risk) {
    return res.status(404).json({ success: false, error: 'Churn risk not found' });
  }
  res.json({ success: true, data: risk });
});

// Calculate churn risk
function calculateChurnRisk(customer: Customer): ChurnRisk {
  const factors: string[] = [];
  let riskScore = 0.3; // Base score

  // Days since last purchase
  const lastPurchase = new Date(customer.lastPurchaseDate);
  const daysSince = Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince > 60) {
    riskScore += 0.3;
    factors.push(`No purchase in ${daysSince} days`);
  } else if (daysSince > 30) {
    riskScore += 0.15;
    factors.push(`Last purchase ${daysSince} days ago`);
  } else if (daysSince > 14) {
    riskScore += 0.05;
    factors.push('Recent purchase decline');
  }

  // Engagement score
  if (customer.engagementScore < 0.3) {
    riskScore += 0.2;
    factors.push('Low engagement score');
  } else if (customer.engagementScore < 0.5) {
    riskScore += 0.1;
    factors.push('Below average engagement');
  }

  // Order frequency
  const avgDaysBetweenOrders = customer.totalOrders > 1
    ? daysSince / customer.totalOrders
    : 999;

  if (avgDaysBetweenOrders > 90) {
    riskScore += 0.15;
    factors.push('Very low purchase frequency');
  }

  // Lifetime value
  if (customer.lifetimeValue < 1000) {
    riskScore += 0.1;
    factors.push('Low lifetime value');
  }

  // Tags
  if (customer.tags.includes('at-risk')) {
    riskScore += 0.15;
    factors.push('Marked as at-risk');
  }

  // Normalize score
  riskScore = Math.min(1, riskScore);

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore >= 0.7) riskLevel = 'critical';
  else if (riskScore >= 0.5) riskLevel = 'high';
  else if (riskScore >= 0.3) riskLevel = 'medium';

  // Recommended actions
  const recommendedActions: string[] = [];
  if (riskScore >= 0.5) {
    recommendedActions.push('Send personalized re-engagement offer');
    recommendedActions.push('Trigger push notification campaign');
 }
  if (riskScore >= 0.7) {
    recommendedActions.push('Escalate to customer success team');
    recommendedActions.push('Send exclusive discount code');
  }
  if (daysSince > 30) {
    recommendedActions.push('Schedule outbound call');
  }

  // Predict churn date (rough estimate)
  const predictedChurnDate = new Date();
  predictedChurnDate.setDate(predictedChurnDate.getDate() + Math.ceil((1 - riskScore) * 90));

  return {
    customerId: customer.id,
    riskScore,
    riskLevel,
    factors,
    recommendedActions,
    lastActiveDate: customer.lastPurchaseDate,
    predictedChurnDate: predictedChurnDate.toISOString().split('T')[0]
  };
}

// ============================================
// PERSONALIZATION
// ============================================

// Get personalizations for customer
app.get('/api/personalizations/:customerId', (req, res) => {
  const { active } = req.query;

  let result = Array.from(personalizations.values())
    .filter(p => p.customerId === req.params.customerId);

  if (active === 'true') {
    result = result.filter(p => !p.shown && new Date(p.expiresAt) > new Date());
  }

  res.json({ success: true, data: result });
});

// Create personalization
app.post('/api/personalizations', authMiddleware, (req, res) => {
  const { customerId, type, content, score, reason } = req.body;

  if (!customerId || !type || !content) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const customer = customers.get(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  const personalization: Personalization = {
    id: `pers-${Date.now()}`,
    customerId,
    type,
    content,
    score: score || 0.5,
    reason: reason || 'Based on customer behavior',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    shown: false,
    converted: false
  };

  personalizations.set(personalization.id, personalization);
  res.status(201).json({ success: true, data: personalization });
});

// Mark personalization as shown
app.put('/api/personalizations/:id/shown', authMiddleware, (req, res) => {
  const personalization = personalizations.get(req.params.id);
  if (!personalization) {
    return res.status(404).json({ success: false, error: 'Personalization not found' });
  }

  personalizations.set(personalization.id, { ...personalization, shown: true });
  res.json({ success: true, data: personalization });
});

// Mark personalization as converted
app.put('/api/personalizations/:id/converted', authMiddleware, (req, res) => {
  const personalization = personalizations.get(req.params.id);
  if (!personalization) {
    return res.status(404).json({ success: false, error: 'Personalization not found' });
  }

  personalizations.set(personalization.id, { ...personalization, converted: true });
  res.json({ success: true, data: personalization });
});

// ============================================
// CROSS-SELL RECOMMENDATIONS
// ============================================

// Get cross-sell recommendations
app.get('/api/crosssell/:customerId', (req, res) => {
  const result = Array.from(crossSells.values())
    .filter(cs => cs.customerId === req.params.customerId)
    .sort((a, b) => b.score - a.score);

  res.json({ success: true, data: result });
});

// Generate cross-sell recommendations
function generateCrossSells(customer: Customer) {
  // Product category mapping (simplified)
  const categoryMap: Record<string, string[]> = {
    electronics: ['accessories', 'cables', 'cases', 'warranty'],
    fashion: ['accessories', 'footwear', 'jewelry'],
    home: ['decor', 'furniture', 'storage'],
    beauty: ['skincare', 'makeup', 'fragrances'],
    sports: ['equipment', 'apparel', 'nutrition']
  };

  const recommendations: CrossSell[] = [];

  for (const preference of customer.preferences) {
    const relatedCategories = categoryMap[preference] || [];

    for (const related of relatedCategories) {
      recommendations.push({
        id: `xs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customerId: customer.id,
        sourceProductId: preference,
        targetProductId: related,
        score: 0.6 + Math.random() * 0.3,
        reason: `Customers who buy ${preference} often also buy ${related}`,
        conversionProbability: 0.4 + Math.random() * 0.4,
        createdAt: new Date().toISOString()
      });
    }
  }

  recommendations.forEach(r => crossSells.set(r.id, r));
}

// ============================================
// ANALYTICS
// ============================================

// Get analytics dashboard
app.get('/api/analytics/dashboard', (req, res) => {
  const allCustomers = Array.from(customers.values());

  const totalCustomers = allCustomers.length;
  const totalRevenue = allCustomers.reduce((s, c) => s + c.lifetimeValue, 0);
  const avgLTV = totalRevenue / totalCustomers;
  const avgEngagement = allCustomers.reduce((s, c) => s + c.engagementScore, 0) / totalCustomers;

  // Segment breakdown
  const segmentBreakdown = Array.from(segments.values()).map(s => ({
    ...s,
    customerCount: allCustomers.filter(c => {
      const criteria = s.criteria;
      if (criteria.minLifetimeValue && c.lifetimeValue < criteria.minLifetimeValue) return false;
      if (criteria.maxLifetimeValue && c.lifetimeValue > criteria.maxLifetimeValue) return false;
      if (criteria.minOrders && c.totalOrders < criteria.minOrders) return false;
      return true;
    }).length
  }));

  // Churn risk distribution
  const churnDistribution = {
    critical: allCustomers.filter(c => c.churnScore >= 0.7).length,
    high: allCustomers.filter(c => c.churnScore >= 0.5 && c.churnScore < 0.7).length,
    medium: allCustomers.filter(c => c.churnScore >= 0.3 && c.churnScore < 0.5).length,
    low: allCustomers.filter(c => c.churnScore < 0.3).length
  };

  // Personalization stats
  const allPersonalizations = Array.from(personalizations.values());
  const personalizationStats = {
    total: allPersonalizations.length,
    shown: allPersonalizations.filter(p => p.shown).length,
    converted: allPersonalizations.filter(p => p.converted).length,
    conversionRate: allPersonalizations.filter(p => p.shown).length > 0
      ? allPersonalizations.filter(p => p.converted).length / allPersonalizations.filter(p => p.shown).length
      : 0
  };

  res.json({
    success: true,
    data: {
      summary: {
        totalCustomers,
        totalRevenue,
        avgLTV,
        avgEngagement,
        avgOrderValue: allCustomers.reduce((s, c) => s + c.avgOrderValue, 0) / totalCustomers
      },
      segmentBreakdown,
      churnDistribution,
      personalizationStats
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Mind-Retail] Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// ============================================
// SERVER START
// ============================================

function startServer() {
  seedInitialData();

  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║              MIND-RETAIL - Retail Vertical AI ║
╠════════════════════════════════════════════════════════════╣
║  Port:     ${PORT} ║
║  Health:   http://localhost:${PORT}/health ║
║  API:      http://localhost:${PORT}/api                       ║
║  Customers: ${customers.size}                                       ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}

process.on('SIGTERM', () => {
  console.log('[Mind-Retail] SIGTERM received, shutting down...');
  process.exit(0);
});

startServer();

export default app;
