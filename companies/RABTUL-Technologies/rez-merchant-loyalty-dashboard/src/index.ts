/**
 * REZ Merchant Loyalty Dashboard
 *
 * Gives merchants insights into their customer loyalty program
 * with retention analytics and campaign management.
 */

import express, { Request, Response } from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';

const app = express();
const PORT = parseInt(process.env.PORT || '4090', 10);

app.use(express.json());

// ============================================
// SERVICE URLs
// ============================================

const SERVICES = {
  loyalty: process.env.LOYALTY_URL || 'http://localhost:4097',
  analytics: process.env.ANALYTICS_URL || 'http://localhost:4016',
  ecosystem: process.env.ECOSYSTEM_URL || 'http://localhost:4105',
  intelligence: process.env.INTELLIGENCE_URL || 'http://localhost:4123',
};

// ============================================
// TYPES
// ============================================

interface Merchant {
  id: string;
  name: string;
  category: string;
  earningRate: number;
  redemptionEnabled: boolean;
  tierEnabled: boolean;
  campaigns: string[];
}

interface Customer {
  id: string;
  merchantId: string;
  visits: number;
  spend: number;
  lastVisit: Date;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  churnRisk: 'low' | 'medium' | 'high';
  predictedLTV: number;
}

interface Campaign {
  id: string;
  merchantId: string;
  name: string;
  type: 'acquisition' | 'retention' | 'reactivation';
  target: 'all' | 'tier' | 'churned';
  status: 'active' | 'paused' | 'ended';
  budget: number;
  spent: number;
  results: {
    newCustomers: number;
    retained: number;
    revenue: number;
  };
}

// In-memory stores (use MongoDB in production)
const merchants = new Map<string, Merchant>();
const customers = new Map<string, Customer>();
const campaigns = new Map<string, Campaign>();

// ============================================
// ANALYTICS CALCULATIONS
// ============================================

function calculateRetentionRate(merchantId: string): number {
  const merchantCustomers = Array.from(customers.values())
    .filter(c => c.merchantId === merchantId);

  if (merchantCustomers.length === 0) return 0;

  const returning = merchantCustomers.filter(c => c.visits > 1).length;
  return (returning / merchantCustomers.length) * 100;
}

function calculateChurnRate(merchantId: string): number {
  const merchantCustomers = Array.from(customers.values())
    .filter(c => c.merchantId === merchantId);

  if (merchantCustomers.length === 0) return 0;

  const churned = merchantCustomers.filter(c => c.churnRisk === 'high').length;
  return (churned / merchantCustomers.length) * 100;
}

function calculateAverageLTV(merchantId: string): number {
  const merchantCustomers = Array.from(customers.values())
    .filter(c => c.merchantId === merchantId);

  if (merchantCustomers.length === 0) return 0;

  const total = merchantCustomers.reduce((sum, c) => sum + c.spend, 0);
  return total / merchantCustomers.length;
}

// ============================================
// API ENDPOINTS
// ============================================

// Health
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'merchant-loyalty-dashboard',
    merchants: merchants.size,
    customers: customers.size,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// MERCHANT MANAGEMENT
// ============================================

// Register merchant
app.post('/api/v1/merchants', (req: Request, res: Response) => {
  const { name, category, earningRate } = req.body;

  const merchant: Merchant = {
    id: `m_${Date.now()}`,
    name,
    category: category || 'general',
    earningRate: earningRate || 0.05,
    redemptionEnabled: true,
    tierEnabled: true,
    campaigns: []
  };

  merchants.set(merchant.id, merchant);

  res.status(201).json({
    success: true,
    merchant
  });
});

// Get merchant
app.get('/api/v1/merchants/:id', (req: Request, res: Response) => {
  const merchant = merchants.get(req.params.id);

  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }

  res.json({ merchant });
});

// Update merchant
app.put('/api/v1/merchants/:id', (req: Request, res: Response) => {
  const merchant = merchants.get(req.params.id);

  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }

  const updated = { ...merchant, ...req.body };
  merchants.set(req.params.id, updated);

  res.json({ success: true, merchant: updated });
});

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

// Get merchant customers
app.get('/api/v1/merchants/:merchantId/customers', (req: Request, res: Response) => {
  const merchantCustomers = Array.from(customers.values())
    .filter(c => c.merchantId === req.params.merchantId);

  res.json({
    merchantId: req.params.merchantId,
    customers: merchantCustomers,
    total: merchantCustomers.length
  });
});

// Get at-risk customers
app.get('/api/v1/merchants/:merchantId/at-risk', (req: Request, res: Response) => {
  const merchantCustomers = Array.from(customers.values())
    .filter(c => c.merchantId === req.params.merchantId && c.churnRisk === 'high');

  res.json({
    merchantId: req.params.merchantId,
    customers: merchantCustomers,
    count: merchantCustomers.length,
    recommendation: 'Send retention offer or bonus coins'
  });
});

// Get VIP customers (high LTV)
app.get('/api/v1/merchants/:merchantId/vip', (req: Request, res: Response) => {
  const vipCustomers = Array.from(customers.values())
    .filter(c =>
      c.merchantId === req.params.merchantId &&
      (c.tier === 'GOLD' || c.tier === 'PLATINUM')
    )
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  res.json({
    merchantId: req.params.merchantId,
    vipCustomers: vipCustomers.map(c => ({
      id: c.id,
      spend: c.spend,
      tier: c.tier,
      predictedLTV: c.predictedLTV
    })),
    count: vipCustomers.length
  });
});

// ============================================
// ANALYTICS
// ============================================

// Get merchant dashboard
app.get('/api/v1/merchants/:merchantId/dashboard', (req: Request, res: Response) => {
  const merchant = merchants.get(req.params.merchantId);

  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }

  const merchantCustomers = Array.from(customers.values())
    .filter(c => c.merchantId === req.params.merchantId);

  const retentionRate = calculateRetentionRate(req.params.merchantId);
  const churnRate = calculateChurnRate(req.params.merchantId);
  const avgLTV = calculateAverageLTV(req.params.merchantId);

  res.json({
    merchantId: req.params.merchantId,
    merchantName: merchant.name,
    summary: {
      totalCustomers: merchantCustomers.length,
      newThisMonth: merchantCustomers.filter(c =>
        c.lastVisit > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      activeCustomers: merchantCustomers.filter(c => c.visits >= 3).length,
      retentionRate: retentionRate.toFixed(1) + '%',
      churnRate: churnRate.toFixed(1) + '%',
      avgCustomerLTV: avgLTV.toFixed(2),
      totalRevenue: merchantCustomers.reduce((sum, c) => sum + c.spend, 0)
    },
    alerts: generateAlerts(merchantCustomers, retentionRate, churnRate)
  });
});

function generateAlerts(
  customers: Customer[],
  retentionRate: number,
  churnRate: number
): string[] {
  const alerts: string[] = [];

  if (churnRate > 20) {
    alerts.push(`High churn rate: ${churnRate.toFixed(1)}%`);
  }

  if (retentionRate < 50) {
    alerts.push(`Low retention: ${retentionRate.toFixed(1)}%`);
  }

  const atRisk = customers.filter(c => c.churnRisk === 'high').length;
  if (atRisk > 10) {
    alerts.push(`${atRisk} customers at high risk of churning`);
  }

  return alerts;
}

// Get cohort analysis
app.get('/api/v1/merchants/:merchantId/cohorts', (req: Request, res: Response) => {
  const merchantCustomers = Array.from(customers.values())
    .filter(c => c.merchantId === req.params.merchantId);

  // Simple cohort by tier
  const cohorts = {
    BRONZE: merchantCustomers.filter(c => c.tier === 'BRONZE').length,
    SILVER: merchantCustomers.filter(c => c.tier === 'SILVER').length,
    GOLD: merchantCustomers.filter(c => c.tier === 'GOLD').length,
    PLATINUM: merchantCustomers.filter(c => c.tier === 'PLATINUM').length
  };

  res.json({
    merchantId: req.params.merchantId,
    cohorts,
    distribution: Object.entries(cohorts).map(([tier, count]) => ({
      tier,
      count,
      percentage: merchantCustomers.length > 0
        ? ((count / merchantCustomers.length) * 100).toFixed(1) + '%'
        : '0%'
    }))
  });
});

// ============================================
// CAMPAIGNS
// ============================================

// Create campaign
app.post('/api/v1/campaigns', (req: Request, res: Response) => {
  const { merchantId, name, type, target, budget } = req.body;

  const campaign: Campaign = {
    id: `camp_${Date.now()}`,
    merchantId,
    name,
    type: type || 'retention',
    target: target || 'all',
    status: 'active',
    budget: budget || 10000,
    spent: 0,
    results: {
      newCustomers: 0,
      retained: 0,
      revenue: 0
    }
  };

  campaigns.set(campaign.id, campaign);

  // Link to merchant
  const merchant = merchants.get(merchantId);
  if (merchant) {
    merchant.campaigns.push(campaign.id);
    merchants.set(merchantId, merchant);
  }

  res.status(201).json({ success: true, campaign });
});

// Get merchant campaigns
app.get('/api/v1/merchants/:merchantId/campaigns', (req: Request, res: Response) => {
  const merchant = merchants.get(req.params.merchantId);

  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }

  const merchantCampaigns = merchant.campaigns
    .map(id => campaigns.get(id))
    .filter(Boolean) as Campaign[];

  res.json({
    merchantId: req.params.merchantId,
    campaigns: merchantCampaigns
  });
});

// Update campaign
app.put('/api/v1/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const updated = { ...campaign, ...req.body };
  campaigns.set(req.params.id, updated);

  res.json({ success: true, campaign: updated });
});

// Pause campaign
app.post('/api/v1/campaigns/:id/pause', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  campaign.status = 'paused';
  campaigns.set(req.params.id, campaign);

  res.json({ success: true, campaign });
});

// ============================================
// RECOMMENDATIONS
// ============================================

// AI recommendations for merchant
app.get('/api/v1/merchants/:merchantId/recommendations', (req: Request, res: Response) => {
  const merchant = merchants.get(req.params.merchantId);

  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }

  const recommendations: { category: string; recommendation: string; impact: string }[] = [];

  // Retention recommendations
  const retentionRate = calculateRetentionRate(req.params.merchantId);
  if (retentionRate < 70) {
    recommendations.push({
      category: 'retention',
      recommendation: 'Launch a loyalty campaign for repeat customers',
      impact: 'Expected +15% retention'
    });
  }

  // Churn recommendations
  const churnRate = calculateChurnRate(req.params.merchantId);
  if (churnRate > 15) {
    recommendations.push({
      category: 'retention',
      recommendation: 'Create win-back campaign for at-risk customers',
      impact: 'Expected -20% churn'
    });
  }

  // Tier recommendations
  recommendations.push({
    category: 'engagement',
    recommendation: 'Add tier benefits (free delivery, priority access)',
    impact: 'Expected +25% engagement'
  });

  // Campaign recommendations
  recommendations.push({
    category: 'acquisition',
    recommendation: 'Run referral campaign for top customers',
    impact: 'Expected 3x customer acquisition'
  });

  res.json({
    merchantId: req.params.merchantId,
    recommendations
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`Merchant Loyalty Dashboard running on port ${PORT}`);
  logger.info('');
  logger.info('Features:');
  logger.info('  • Customer analytics');
  logger.info('  • Retention metrics');
  logger.info('  • Churn predictions');
  logger.info('  • Campaign management');
  logger.info('  • AI recommendations');
});

export { app };
