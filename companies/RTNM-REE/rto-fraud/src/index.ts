/**
 * RTO-FRAUD Service - Return-to-Origin Fraud Detection
 *
 * REE Service for RTO fraud detection:
 * - Return-to-origin fraud detection
 * - Pattern recognition
 * - Risk scoring
 * - Fraud investigation
 *
 * Port: 3010
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3010;
const SERVICE_KEY = process.env.SERVICE_KEY || 'ree-rto-fraud-key';

// ============================================
// IN-MEMORY STORAGE
// ============================================

interface Order {
  id: string;
  userId: string;
  merchantId: string;
  amount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'return_initiated' | 'return_completed' | 'rto';
  createdAt: string;
  deliveredAt?: string;
  returnInitiatedAt?: string;
  returnCompletedAt?: string;
  address: string;
  pincode: string;
  deliveryAttempts: number;
  reason?: string;
}

interface FraudCase {
  id: string;
  orderId: string;
  userId: string;
  merchantId: string;
  type: 'rto_fraud' | 'fake_return' | 'address_mismatch' | '多次return' | 'coordinated_fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'escalated' | 'dismissed';
  riskScore: number;
  riskFactors: string[];
  evidence: string[];
  investigator?: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
}

interface FraudPattern {
  id: string;
  name: string;
  description: string;
  type: 'user_behavior' | 'merchant_behavior' | 'address_pattern' | 'order_pattern';
  indicators: string[];
  weight: number;
  detectionCount: number;
  accuracy: number;
  active: boolean;
}

interface BlacklistEntry {
  id: string;
  type: 'user' | 'merchant' | 'address' | 'pincode';
  entityId: string;
  reason: string;
  addedBy: string;
  addedAt: string;
  expiresAt?: string;
  active: boolean;
}

interface Investigation {
  id: string;
  caseId: string;
  investigator: string;
  status: 'pending' | 'in_progress' | 'completed';
  findings: string[];
  recommendations: string[];
  createdAt: string;
  completedAt?: string;
}

// Storage
const orders: Map<string, Order> = new Map();
const fraudCases: Map<string, FraudCase> = new Map();
const patterns: Map<string, FraudPattern> = new Map();
const blacklist: Map<string, BlacklistEntry> = new Map();
const investigations: Map<string, Investigation> = new Map();

// ============================================
// SEED DATA
// ============================================

function seedInitialData() {
  // Seed fraud patterns
  const seedPatterns: FraudPattern[] = [
    {
      id: 'pat-001',
      name: 'Multiple RTO History',
      description: 'User has multiple RTO deliveries in history',
      type: 'user_behavior',
      indicators: ['rto_count > 3', 'rto_rate > 0.3'],
      weight: 0.85,
      detectionCount: 245,
      accuracy: 0.78,
      active: true
    },
    {
      id: 'pat-002',
      name: 'Address Pincode Mismatch',
      description: 'Delivery address differs from registered address',
      type: 'address_pattern',
      indicators: ['address != registered_address', 'pincode != usual_pincode'],
      weight: 0.65,
      detectionCount: 189,
      accuracy: 0.72,
      active: true
    },
    {
      id: 'pat-003',
      name: 'High Value Order RTO',
      description: 'High value orders more likely to be returned fraudulently',
      type: 'order_pattern',
      indicators: ['order_value > 5000', 'is_rto = true'],
      weight: 0.55,
      detectionCount: 156,
      accuracy: 0.68,
      active: true
    },
    {
      id: 'pat-004',
      name: 'New User First Order RTO',
      description: 'New users with RTO on first order',
      type: 'user_behavior',
      indicators: ['account_age < 30 days', 'order_count = 1', 'is_rto = true'],
      weight: 0.70,
      detectionCount: 312,
      accuracy: 0.75,
      active: true
    },
    {
      id: 'pat-005',
      name: 'Repeated Return Pattern',
      description: 'User returns orders repeatedly across merchants',
      type: 'user_behavior',
      indicators: ['return_count > 5', 'different_merchants > 3'],
      weight: 0.80,
      detectionCount: 178,
      accuracy: 0.82,
      active: true
    },
    {
      id: 'pat-006',
      name: 'Same Address Different Users',
      description: 'Multiple users sharing same delivery address',
      type: 'address_pattern',
      indicators: ['shared_address', 'different_user_ids'],
      weight: 0.75,
      detectionCount: 89,
      accuracy: 0.70,
      active: true
    },
    {
      id: 'pat-007',
      name: 'Late Night Order Pattern',
      description: 'Orders placed at unusual hours more likely to be fraudulent',
      type: 'order_pattern',
      indicators: ['order_hour< 5 OR order_hour > 23'],
      weight: 0.40,
      detectionCount: 67,
      accuracy: 0.55,
      active: true
    },
    {
      id: 'pat-008',
      name: 'Coordinated Merchant Fraud',
      description: 'Multiple merchants with suspicious return patterns',
      type: 'merchant_behavior',
      indicators: ['merchant_group', 'similar_returns', 'same_location'],
      weight: 0.90,
      detectionCount: 34,
      accuracy: 0.88,
      active: true
    }
  ];

  seedPatterns.forEach(p => patterns.set(p.id, p));

  // Seed sample orders
  const seedOrders: Order[] = [
    {
      id: 'ord-001',
      userId: 'user-001',
      merchantId: 'merch-001',
      amount: 2500,
      status: 'delivered',
      createdAt: '2026-06-01T10:30:00Z',
      deliveredAt: '2026-06-03T14:20:00Z',
      address: '123 MG Road, Mumbai400001',
      pincode: '400001',
      deliveryAttempts: 1
    },
    {
      id: 'ord-002',
      userId: 'user-002',
      merchantId: 'merch-002',
      amount: 8500,
      status: 'rto',
      createdAt: '2026-06-02T22:45:00Z',
      deliveredAt: '2026-06-05T11:00:00Z',
      returnInitiatedAt: '2026-06-06T09:30:00Z',
      address: '456 Park Street, Kolkata 700001',
      pincode: '700001',
      deliveryAttempts: 2,
      reason: 'Customer not available'
    },
    {
      id: 'ord-003',
      userId: 'user-003',
      merchantId: 'merch-001',
      amount: 1200,
      status: 'return_completed',
      createdAt: '2026-06-03T14:00:00Z',
      deliveredAt: '2026-06-05T16:30:00Z',
      returnInitiatedAt: '2026-06-07T10:00:00Z',
      returnCompletedAt: '2026-06-10T12:00:00Z',
      address: '789 Brigade Road, Bangalore 560001',
      pincode: '560001',
      deliveryAttempts: 1,
      reason: 'Product damaged'
    },
    {
      id: 'ord-004',
      userId: 'user-004',
      merchantId: 'merch-003',
      amount: 15000,
      status: 'rto',
      createdAt: '2026-06-04T23:15:00Z',
      deliveredAt: '2026-06-07T10:00:00Z',
      returnInitiatedAt: '2026-06-08T08:00:00Z',
      address: '321 Model Town, Delhi 110009',
      pincode: '110009',
      deliveryAttempts: 3,
      reason: 'Wrong address'
    },
    {
      id: 'ord-005',
      userId: 'user-005',
      merchantId: 'merch-002',
      amount: 3200,
      status: 'shipped',
      createdAt: '2026-06-10T11:00:00Z',
      address: '555 Link Road, Chennai 600001',
      pincode: '600001',
      deliveryAttempts: 0
    }
  ];

  seedOrders.forEach(o => orders.set(o.id, o));

  // Seed sample fraud cases
  const seedCases: FraudCase[] = [
    {
      id: 'case-001',
      orderId: 'ord-002',
      userId: 'user-002',
      merchantId: 'merch-002',
      type: 'rto_fraud',
      severity: 'high',
      status: 'investigating',
      riskScore: 0.78,
      riskFactors: [
        'High value order (8500)',
        'Late night order placement',
        'Multiple delivery attempts',
        'RTO after short delivery period'
      ],
      evidence: [
        'Order placed at 10:45 PM',
        'First delivery attempt failed',
        'Return initiated within 24 hours',
        'User has2 previous RTO orders'
      ],
      investigator: 'agent-001',
      notes: ['Pattern match: Multiple RTO History', 'Escalated for review'],
      createdAt: '2026-06-06T10:00:00Z',
      updatedAt: '2026-06-10T14:30:00Z'
    },
    {
      id: 'case-002',
      orderId: 'ord-004',
      userId: 'user-004',
      merchantId: 'merch-003',
      type: 'address_mismatch',
      severity: 'critical',
      status: 'open',
      riskScore: 0.92,
      riskFactors: [
        'Address marked as incorrect',
        '3 delivery attempts',
        'High value electronics order',
        'New user with first order'
      ],
      evidence: [
        'Address does not exist',
        'Contact number not reachable',
        'Similar pattern with other orders',
        'PIN code mismatch detected'
      ],
      notes: ['Requires immediate investigation', 'Potential address fraud ring'],
      createdAt: '2026-06-08T09:00:00Z',
      updatedAt: '2026-06-08T09:00:00Z'
    }
  ];

  seedCases.forEach(c => fraudCases.set(c.id, c));

  // Seed blacklist entries
  const seedBlacklist: BlacklistEntry[] = [
    {
      id: 'bl-001',
      type: 'user',
      entityId: 'user-006',
      reason: 'Confirmed RTO fraud - 5 cases',
      addedBy: 'system',
      addedAt: '2026-05-15T10:00:00Z',
      active: true
    },
    {
      id: 'bl-002',
      type: 'address',
      entityId: 'addr-fake-123',
      reason: 'Fake address used in fraud',
      addedBy: 'investigator-001',
      addedAt: '2026-05-20T14:30:00Z',
      active: true
    },
    {
      id: 'bl-003',
      type: 'pincode',
      entityId: '110099',
      reason: 'High fraud rate area -45% RTO',
      addedBy: 'system',
      addedAt: '2026-06-01T08:00:00Z',
      active: true
    }
  ];

  seedBlacklist.forEach(b => blacklist.set(b.id, b));

  console.log(`[RTO-Fraud] Seeded ${orders.size} orders, ${fraudCases.size} cases, ${patterns.size} patterns`);
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
    service: 'rto-fraud',
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
    orders: orders.size,
    fraudCases: fraudCases.size,
    patterns: patterns.size,
    blacklist: blacklist.size
  });
});

// ============================================
// FRAUD SCORING
// ============================================

// Calculate fraud score for order/user
app.post('/api/score', (req, res) => {
  const { orderId, userId, merchantId, amount, address, pincode } = req.body;

  const riskFactors: string[] = [];
  let riskScore = 0.2; // Base risk

  // Check user history
  const userOrders = Array.from(orders.values()).filter(o => o.userId === userId);
  const userRTOOrders = userOrders.filter(o => o.status === 'rto');
  const rtoRate = userOrders.length > 0 ? userRTOOrders.length / userOrders.length : 0;

  if (rtoRate > 0.5) {
    riskScore += 0.3;
    riskFactors.push(`High RTO rate: ${(rtoRate * 100).toFixed(0)}%`);
  } else if (rtoRate > 0.3) {
    riskScore += 0.15;
    riskFactors.push(`Elevated RTO rate: ${(rtoRate * 100).toFixed(0)}%`);
  }

  // Check order amount
  if (amount > 10000) {
    riskScore += 0.15;
    riskFactors.push('High value order (>10000)');
  } else if (amount > 5000) {
    riskScore += 0.08;
    riskFactors.push('Medium-high value order (>5000)');
  }

  // Check address patterns
  const sameAddressOrders = userOrders.filter(o => o.address === address);
  if (sameAddressOrders.length === 0 && userOrders.length > 0) {
    riskScore += 0.1;
    riskFactors.push('New delivery address');
  }

  // Check PIN code fraud rate
  const pincodeRTORate = calculatePincodeRTORate(pincode);
  if (pincodeRTORate > 0.4) {
    riskScore += 0.2;
    riskFactors.push(`High RTO PIN code area: ${(pincodeRTORate * 100).toFixed(0)}%`);
  }

  // Check blacklist
  const isBlacklisted = checkBlacklist(userId, address, pincode);
  if (isBlacklisted) {
    riskScore = 0.95;
    riskFactors.push('User/address on blacklist');
  }

  // Normalize score
  riskScore = Math.min(1, riskScore);

  res.json({
    success: true,
    data: {
      score: riskScore,
      riskLevel: riskScore < 0.3 ? 'low' : riskScore < 0.5 ? 'medium' : riskScore < 0.7 ? 'high' : 'critical',
      riskFactors,
      recommendations: generateRecommendations(riskScore, riskFactors)
    }
  });
});

function calculatePincodeRTORate(pincode: string): number {
  const pincodeOrders = Array.from(orders.values()).filter(o => o.pincode === pincode);
  if (pincodeOrders.length === 0) return 0;

  const rtoOrders = pincodeOrders.filter(o => o.status === 'rto');
  return rtoOrders.length / pincodeOrders.length;
}

function checkBlacklist(userId?: string, address?: string, pincode?: string): boolean {
  for (const entry of blacklist.values()) {
    if (!entry.active) continue;
    if (entry.type === 'user' && entry.entityId === userId) return true;
    if (entry.type === 'address' && entry.entityId === address) return true;
    if (entry.type === 'pincode' && entry.entityId === pincode) return true;
  }
  return false;
}

function generateRecommendations(score: number, factors: string[]): string[] {
  const recommendations: string[] = [];

  if (score >= 0.7) {
    recommendations.push('Block order - high fraud risk');
    recommendations.push('Flag for manual review');
    recommendations.push('Enable OTP verification at delivery');
  } else if (score >= 0.5) {
    recommendations.push('Require additional verification');
    recommendations.push('Enable COD restrictions');
    recommendations.push('Monitor closely');
  } else if (score >= 0.3) {
    recommendations.push('Standard verification');
    recommendations.push('Track delivery attempts');
  }

  if (factors.includes('High RTO rate')) {
    recommendations.push('Consider pre-paid only for this user');
  }

  if (factors.includes('New delivery address')) {
    recommendations.push('Send verification SMS to registered number');
  }

  return recommendations;
}

// ============================================
// FRAUD CASE MANAGEMENT
// ============================================

// Get all fraud cases
app.get('/api/cases', (req, res) => {
  const { status, severity, type, minScore } = req.query;

  let result = Array.from(fraudCases.values());

  if (status) {
    result = result.filter(c => c.status === status);
  }
  if (severity) {
    result = result.filter(c => c.severity === severity);
  }
  if (type) {
    result = result.filter(c => c.type === type);
  }
  if (minScore) {
    result = result.filter(c => c.riskScore >= Number(minScore));
  }

  // Sort by risk score (highest first)
  result.sort((a, b) => b.riskScore - a.riskScore);

  res.json({ success: true, data: result, total: result.length });
});

// Get single fraud case
app.get('/api/cases/:id', (req, res) => {
  const fraudCase = fraudCases.get(req.params.id);
  if (!fraudCase) {
    return res.status(404).json({ success: false, error: 'Fraud case not found' });
  }

  // Get related investigation
  const caseInvestigation = Array.from(investigations.values())
    .find(i => i.caseId === fraudCase.id);

  res.json({
    success: true,
    data: {
      ...fraudCase,
      investigation: caseInvestigation
    }
  });
});

// Create fraud case
app.post('/api/cases', authMiddleware, (req, res) => {
  const { orderId, userId, merchantId, type, severity, riskScore, riskFactors, evidence } = req.body;

  if (!orderId || !userId) {
    return res.status(400).json({ success: false, error: 'Order ID and User ID are required' });
  }

  const id = `case-${Date.now()}`;
  const now = new Date().toISOString();

  const fraudCase: FraudCase = {
    id,
    orderId,
    userId,
    merchantId: merchantId || '',
    type: type || 'rto_fraud',
    severity: severity || 'medium',
    status: 'open',
    riskScore: riskScore || 0.5,
    riskFactors: riskFactors || [],
    evidence: evidence || [],
    notes: [],
    createdAt: now,
    updatedAt: now
  };

  fraudCases.set(id, fraudCase);
  res.status(201).json({ success: true, data: fraudCase });
});

// Update fraud case
app.put('/api/cases/:id', authMiddleware, (req, res) => {
  const fraudCase = fraudCases.get(req.params.id);
  if (!fraudCase) {
    return res.status(404).json({ success: false, error: 'Fraud case not found' });
  }

  const updated: FraudCase = {
    ...fraudCase,
    ...req.body,
    id: fraudCase.id,
    updatedAt: new Date().toISOString()
  };

  fraudCases.set(fraudCase.id, updated);
  res.json({ success: true, data: updated });
});

// Add note to fraud case
app.post('/api/cases/:id/notes', authMiddleware, (req, res) => {
  const fraudCase = fraudCases.get(req.params.id);
  if (!fraudCase) {
    return res.status(404).json({ success: false, error: 'Fraud case not found' });
  }

  const { note, investigator } = req.body;
  if (!note) {
    return res.status(400).json({ success: false, error: 'Note content is required' });
  }

  fraudCase.notes.push(`[${new Date().toISOString()}] ${investigator || 'System'}: ${note}`);
  fraudCase.updatedAt = new Date().toISOString();

  fraudCases.set(fraudCase.id, fraudCase);
  res.json({ success: true, data: fraudCase });
});

// Resolve fraud case
app.post('/api/cases/:id/resolve', authMiddleware, (req, res) => {
  const fraudCase = fraudCases.get(req.params.id);
  if (!fraudCase) {
    return res.status(404).json({ success: false, error: 'Fraud case not found' });
  }

  const { resolution, addToBlacklist, blacklistType } = req.body;

  fraudCase.status = 'resolved';
  fraudCase.resolvedAt = new Date().toISOString();
  fraudCase.resolution = resolution || 'Case resolved';

  // Add to blacklist if requested
  if (addToBlacklist) {
    const entry: BlacklistEntry = {
      id: `bl-${Date.now()}`,
      type: blacklistType || 'user',
      entityId: fraudCase.userId,
      reason: `Fraud case resolved: ${fraudCase.resolution}`,
      addedBy: 'investigator',
      addedAt: new Date().toISOString(),
      active: true
    };
    blacklist.set(entry.id, entry);
  }

  fraudCases.set(fraudCase.id, fraudCase);
  res.json({ success: true, data: fraudCase });
});

// ============================================
// PATTERN MANAGEMENT
// ============================================

// Get all patterns
app.get('/api/patterns', (req, res) => {
  const { type, active } = req.query;

  let result = Array.from(patterns.values());

  if (type) {
    result = result.filter(p => p.type === type);
  }
  if (active !== undefined) {
    result = result.filter(p => p.active === (active === 'true'));
  }

  res.json({ success: true, data: result });
});

// Create pattern
app.post('/api/patterns', authMiddleware, (req, res) => {
  const { name, description, type, indicators, weight } = req.body;

  if (!name || !type) {
    return res.status(400).json({ success: false, error: 'Name and type are required' });
  }

  const pattern: FraudPattern = {
    id: `pat-${Date.now()}`,
    name,
    description: description || '',
    type,
    indicators: indicators || [],
    weight: weight || 0.5,
    detectionCount: 0,
    accuracy: 0,
    active: true
  };

  patterns.set(pattern.id, pattern);
  res.status(201).json({ success: true, data: pattern });
});

// Update pattern
app.put('/api/patterns/:id', authMiddleware, (req, res) => {
  const pattern = patterns.get(req.params.id);
  if (!pattern) {
    return res.status(404).json({ success: false, error: 'Pattern not found' });
  }

  const updated = { ...pattern, ...req.body, id: pattern.id };
  patterns.set(pattern.id, updated);
  res.json({ success: true, data: updated });
});

// ============================================
// BLACKLIST MANAGEMENT
// ============================================

// Get blacklist
app.get('/api/blacklist', (req, res) => {
  const { type, active } = req.query;

  let result = Array.from(blacklist.values());

  if (type) {
    result = result.filter(b => b.type === type);
  }
  if (active !== undefined) {
    result = result.filter(b => b.active === (active === 'true'));
  }

  res.json({ success: true, data: result });
});

// Add to blacklist
app.post('/api/blacklist', authMiddleware, (req, res) => {
  const { type, entityId, reason, expiresAt } = req.body;

  if (!type || !entityId || !reason) {
    return res.status(400).json({ success: false, error: 'Type, entity ID, and reason are required' });
  }

  const entry: BlacklistEntry = {
    id: `bl-${Date.now()}`,
    type,
    entityId,
    reason,
    addedBy: 'investigator',
    addedAt: new Date().toISOString(),
    expiresAt,
    active: true
  };

  blacklist.set(entry.id, entry);
  res.status(201).json({ success: true, data: entry });
});

// Remove from blacklist
app.delete('/api/blacklist/:id', authMiddleware, (req, res) => {
  const entry = blacklist.get(req.params.id);
  if (!entry) {
    return res.status(404).json({ success: false, error: 'Blacklist entry not found' });
  }

  entry.active = false;
  blacklist.set(entry.id, entry);
  res.json({ success: true, message: 'Entry deactivated' });
});

// ============================================
// ORDER MANAGEMENT
// ============================================

// Get orders
app.get('/api/orders', (req, res) => {
  const { status, userId, merchantId } = req.query;

  let result = Array.from(orders.values());

  if (status) {
    result = result.filter(o => o.status === status);
  }
  if (userId) {
    result = result.filter(o => o.userId === userId);
  }
  if (merchantId) {
    result = result.filter(o => o.merchantId === merchantId);
  }

  res.json({ success: true, data: result, total: result.length });
});

// Create order
app.post('/api/orders', authMiddleware, (req, res) => {
  const { userId, merchantId, amount, address, pincode } = req.body;

  if (!userId || !merchantId || !amount) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const order: Order = {
    id: `ord-${Date.now()}`,
    userId,
    merchantId,
    amount,
    status: 'pending',
    createdAt: new Date().toISOString(),
    address: address || '',
    pincode: pincode || '',
    deliveryAttempts: 0
  };

  orders.set(order.id, order);
  res.status(201).json({ success: true, data: order });
});

// Update order status
app.put('/api/orders/:id/status', authMiddleware, (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const { status, reason } = req.body;
  const now = new Date().toISOString();

  order.status = status;
  order.reason = reason;

  if (status === 'delivered') {
    order.deliveredAt = now;
  } else if (status === 'return_initiated') {
    order.returnInitiatedAt = now;
  } else if (status === 'return_completed') {
    order.returnCompletedAt = now;
  }

  orders.set(order.id, order);
  res.json({ success: true, data: order });
});

// ============================================
// INVESTIGATION
// ============================================

// Get investigations
app.get('/api/investigations', (req, res) => {
  const { status, caseId } = req.query;

  let result = Array.from(investigations.values());

  if (status) {
    result = result.filter(i => i.status === status);
  }
  if (caseId) {
    result = result.filter(i => i.caseId === caseId);
  }

  res.json({ success: true, data: result });
});

// Create investigation
app.post('/api/investigations', authMiddleware, (req, res) => {
  const { caseId, investigator } = req.body;

  if (!caseId) {
    return res.status(400).json({ success: false, error: 'Case ID is required' });
  }

  const fraudCase = fraudCases.get(caseId);
  if (!fraudCase) {
    return res.status(404).json({ success: false, error: 'Fraud case not found' });
  }

  const investigation: Investigation = {
    id: `inv-${Date.now()}`,
    caseId,
    investigator: investigator || 'unknown',
    status: 'pending',
    findings: [],
    recommendations: [],
    createdAt: new Date().toISOString()
  };

  investigations.set(investigation.id, investigation);

  // Update case status
  fraudCase.status = 'investigating';
  fraudCase.investigator = investigator;
  fraudCases.set(fraudCase.id, fraudCase);

  res.status(201).json({ success: true, data: investigation });
});

// Update investigation
app.put('/api/investigations/:id', authMiddleware, (req, res) => {
  const investigation = investigations.get(req.params.id);
  if (!investigation) {
    return res.status(404).json({ success: false, error: 'Investigation not found' });
  }

  const { findings, recommendations, status } = req.body;

  if (findings) {
    investigation.findings = [...investigation.findings, ...findings];
  }
  if (recommendations) {
    investigation.recommendations = [...investigation.recommendations, ...recommendations];
  }
  if (status) {
    investigation.status = status;
    if (status === 'completed') {
      investigation.completedAt = new Date().toISOString();
    }
  }

  investigations.set(investigation.id, investigation);
  res.json({ success: true, data: investigation });
});

// ============================================
// ANALYTICS
// ============================================

// Get fraud analytics
app.get('/api/analytics/dashboard', (req, res) => {
  const allCases = Array.from(fraudCases.values());
  const allOrders = Array.from(orders.values());

  // Case statistics
  const caseStats = {
    total: allCases.length,
    open: allCases.filter(c => c.status === 'open').length,
    investigating: allCases.filter(c => c.status === 'investigating').length,
    resolved: allCases.filter(c => c.status === 'resolved').length,
    escalated: allCases.filter(c => c.status === 'escalated').length
  };

  // Severity distribution
  const severityDistribution = {
    critical: allCases.filter(c => c.severity === 'critical').length,
    high: allCases.filter(c => c.severity === 'high').length,
    medium: allCases.filter(c => c.severity === 'medium').length,
    low: allCases.filter(c => c.severity === 'low').length
  };

  // Fraud type distribution
  const typeDistribution: Record<string, number> = {};
  allCases.forEach(c => {
    typeDistribution[c.type] = (typeDistribution[c.type] || 0) + 1;
  });

  // Order statistics
  const orderStats = {
    total: allOrders.length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
    rto: allOrders.filter(o => o.status === 'rto').length,
    returnCompleted: allOrders.filter(o => o.status === 'return_completed').length
  };

  // RTO rate
  const rtoRate = allOrders.length > 0
    ? allOrders.filter(o => o.status === 'rto').length / allOrders.length
    : 0;

  // Pattern performance
  const patternPerformance = Array.from(patterns.values())
    .map(p => ({
      name: p.name,
      detections: p.detectionCount,
      accuracy: p.accuracy
    }))
    .sort((a, b) => b.detections - a.detections);

  res.json({
    success: true,
    data: {
      caseStats,
      severityDistribution,
      typeDistribution,
      orderStats,
      rtoRate,
      patternPerformance,
      blacklistSize: Array.from(blacklist.values()).filter(b => b.active).length
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[RTO-Fraud] Error:', err);
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
║           RTO-FRAUD - Return-to-Origin Fraud Detection   ║
╠════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                          ║
║  Health:   http://localhost:${PORT}/health ║
║  API:      http://localhost:${PORT}/api                       ║
║  Cases:    ${fraudCases.size}                                       ║
║  Patterns: ${patterns.size}                                       ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}

process.on('SIGTERM', () => {
  console.log('[RTO-Fraud] SIGTERM received, shutting down...');
  process.exit(0);
});

startServer();

export default app;
