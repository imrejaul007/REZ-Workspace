/**
 * REZ Business AI - Admin Dashboard API
 * Manage AI settings, view metrics, configure
 */

const express = require('express');
const router = express.Router();

// In-memory store for demo
const merchants = new Map();
const settings = new Map();

// Default settings
settings.set('default', {
  approvalMode: 'manual', // manual | semi | auto
  maxDiscount: 40,
  maxAdBudget: 50000,
  minMargin: 10,
  channels: ['whatsapp', 'push', 'sms'],
  tone: 'friendly',
  autoRetries: 3,
  riskLevel: 'medium', // low | medium | high
});

// ============== MERCHANTS ==============

router.get('/merchants', (req, res) => {
  const all = Array.from(merchants.values()).map(m => ({
    merchantId: m.id,
    businessName: m.businessName,
    healthScore: m.healthScore || 87,
    activeGoals: m.activeGoals || 3,
    pendingActions: m.pendingActions || 0,
    lastActive: m.lastActive,
  }));
  res.json({ merchants: all, total: all.length });
});

router.get('/merchants/:id', (req, res) => {
  const merchant = merchants.get(req.params.id);
  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }
  res.json(merchant);
});

router.post('/merchants', (req, res) => {
  const { merchantId, businessName, businessType } = req.body;
  const merchant = {
    id: merchantId,
    businessName,
    businessType,
    healthScore: 50,
    activeGoals: 0,
    pendingActions: 0,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  merchants.set(merchantId, merchant);
  res.json({ success: true, merchant });
});

// ============== SETTINGS ==============

router.get('/settings/:merchantId', (req, res) => {
  const merchantId = req.params.merchantId;
  const merchantSettings = settings.get(merchantId) || settings.get('default');
  res.json(merchantSettings);
});

router.put('/settings/:merchantId', (req, res) => {
  const { merchantId } = req.params;
  const updates = req.body;

  const current = settings.get(merchantId) || { ...settings.get('default') };
  settings.set(merchantId, { ...current, ...updates });

  res.json({ success: true, settings: settings.get(merchantId) });
});

// ============== METRICS ==============

router.get('/metrics', (req, res) => {
  res.json({
    totalMerchants: merchants.size,
    activeMerchants: Array.from(merchants.values()).filter(m => m.healthScore > 50).length,
    avgHealthScore: merchants.size > 0
      ? Math.round(Array.from(merchants.values()).reduce((sum, m) => sum + (m.healthScore || 0), 0) / merchants.size)
      : 0,
    totalActions: 0,
    totalRevenue: 0,
    topPerforming: [],
    atRisk: [],
  });
});

router.get('/metrics/merchants/:id', (req, res) => {
  const merchant = merchants.get(req.params.id);
  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }

  res.json({
    merchantId: req.params.id,
    healthScore: merchant.healthScore || 87,
    revenue: {
      current: 12500,
      target: 15000,
      change: 12,
    },
    customers: {
      current: 45,
      target: 50,
      change: 8,
    },
    orders: {
      current: 120,
      target: 150,
      change: 15,
    },
    retention: {
      current: 78,
      target: 85,
      change: 5,
    },
    campaigns: {
      active: 2,
      completed: 15,
      avgROI: 2.5,
    },
    predictions: {
      demand: 85,
      churn: 12,
      ltv: 25000,
    },
  });
});

// ============== ACTIONS ==============

router.get('/actions', (req, res) => {
  const { status, merchantId } = req.query;
  // Mock actions
  const actions = [
    { id: '1', merchantId: 'demo', type: 'campaign', title: 'Weekend Rush', status: 'pending' },
    { id: '2', merchantId: 'demo', type: 'retention', title: 'Win-Back', status: 'pending' },
  ];
  res.json({ actions });
});

router.post('/actions/:id/execute', (req, res) => {
  res.json({ success: true, actionId: req.params.id, status: 'executed' });
});

router.post('/actions/:id/reject', (req, res) => {
  res.json({ success: true, actionId: req.params.id, status: 'rejected' });
});

// ============== CAMPAIGNS ==============

router.get('/campaigns', (req, res) => {
  const campaigns = [
    { id: '1', name: 'Weekend Rush', status: 'active', roi: 2.5, revenue: 8000 },
    { id: '2', name: 'Happy Hour', status: 'paused', roi: 1.8, revenue: 3000 },
    { id: '3', name: 'Win-Back', status: 'active', roi: 3.2, revenue: 5000 },
  ];
  res.json({ campaigns });
});

router.post('/campaigns/:id/toggle', (req, res) => {
  res.json({ success: true, status: 'toggled' });
});

// ============== LEARNINGS ==============

router.get('/learnings', (req, res) => {
  const learnings = [
    { pattern: 'Weekend', action: 'Weekend Rush', success: 85, insight: 'Weekends perform 40% better' },
    { pattern: 'Rain', action: 'Rainy Day Delivery', success: 72, insight: 'Rain = +30% delivery orders' },
    { pattern: 'Churn', action: 'Win-Back', success: 65, insight: '15% win-back rate' },
  ];
  res.json({ learnings });
});

// ============== ALERTS ==============

router.get('/alerts', (req, res) => {
  const alerts = [
    { id: '1', type: 'warning', message: '3 merchants at risk', severity: 'medium' },
    { id: '2', type: 'success', message: 'Campaign ROI improved 25%', severity: 'low' },
  ];
  res.json({ alerts });
});

module.exports = router;
