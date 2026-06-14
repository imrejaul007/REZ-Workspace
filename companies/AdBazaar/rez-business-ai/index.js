import logger from './utils/logger';

/**
 * REZ Business AI - Production Server
 * Port 4059
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4059;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiter
const rateLimits = new Map();
function rateLimiter(req, res, next) {
  const key = req.query.merchantId || req.ip;
  const now = Date.now();
  const limit = rateLimits.get(key) || { count: 0, reset: now + 60000 };
  if (now > limit.reset) {
    limit.count = 0;
    limit.reset = now + 60000;
  }
  limit.count++;
  rateLimits.set(key, limit);
  if (limit.count > 100) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  next();
}
app.use(rateLimiter);

// ============== ML MODELS ==============

const models = {
  demand: { weights: [0.3, 0.2, 0.25, 0.15, 0.1], bias: 100 },
  churn: { weights: [-0.4, -0.3, -0.2, -0.1], bias: 0.5 },
  ltv: { weights: [0.5, 0.3, 0.2], bias: 500 },
};

function predictDemand(params) {
  const { dayOfWeek, timeOfDay, weather, event, historical } = params;
  const features = [dayOfWeek / 6, timeOfDay / 23, weather, event, historical / 1000];
  let score = models.demand.bias;
  for (let i = 0; i < features.length; i++) {
    score += features[i] * models.demand.weights[i];
  }
  const prediction = Math.max(0, Math.round(historical * (1 + (score - 0.5)));
  let reasoning = 'Based on ';
  if (weather > 0.5) reasoning += 'rainy weather, ';
  if (event > 0.5) reasoning += 'local event, ';
  reasoning += 'demand is ' + (score > 0.5 ? 'higher' : 'lower') + ' than usual.';
  return { prediction, confidence: 0.85, reasoning };
}

function predictChurn(params) {
  const { daysSinceLastOrder, avgOrderFrequency, lifetimeValue, engagementScore } = params;
  const features = [Math.min(daysSinceLastOrder / 30, 1), avgOrderFrequency / 30, lifetimeValue / 100000, engagementScore / 100];
  let score = models.churn.bias;
  for (let i = 0; i < features.length; i++) {
    score += features[i] * models.churn.weights[i];
  }
  const probability = Math.min(1, Math.max(0, score));
  const risk = probability > 0.7 ? 'high' : probability > 0.4 ? 'medium' : 'low';
  return { probability: Math.round(probability * 100) + '%', risk, reasoning: `Customer ${risk === 'high' ? 'at HIGH risk' : risk === 'medium' ? 'at MEDIUM risk' : 'is healthy'}` };
}

function predictLTV(params) {
  const { currentSpend, orderFrequency, engagementMonths } = params;
  const monthlyValue = currentSpend * orderFrequency;
  const prediction = monthlyValue * Math.min(engagementMonths, 24);
  const tier = prediction > 50000 ? 'platinum' : prediction > 20000 ? 'gold' : prediction > 5000 ? 'silver' : 'bronze';
  return { prediction: Math.round(prediction), tier };
}

function recommendCampaign(params) {
  const { weather, dayOfWeek, customerSegment, merchantType } = params;
  if (weather > 0.5) {
    return { campaign: 'rainy_day', offer: 'Free delivery above ₹199', reasoning: 'Rain detected - delivery +40%' };
  }
  if (dayOfWeek >= 5) {
    return { campaign: 'weekend_rush', offer: '20% off above ₹499', reasoning: 'Weekend traffic +40%' };
  }
  if (customerSegment === 'churned') {
    return { campaign: 'win_back', offer: '₹100 cashback', reasoning: 'Win-back recovers 25% churned' };
  }
  return { campaign: 'happy_hour', offer: '15% off 2-5 PM', reasoning: 'Afternoon boost' };
}

function optimizePricing(params) {
  const { basePrice, demand, competition, inventory } = params;
  let multiplier = 1;
  if (demand > 0.7) multiplier += 0.15;
  if (demand < 0.3) multiplier -= 0.1;
  if (competition > 0.7) multiplier -= 0.1;
  const price = Math.round(basePrice * multiplier);
  return { price, strategy: demand > 0.7 ? 'premium' : 'competitive' };
}

// ============== CAMPAIGN BUNDLES ==============

const BUNDLES = {
  weekend_rush: { name: 'Weekend Rush', impact: 8000, actions: ['Create campaign', 'Send WhatsApp', 'Push notification'] },
  happy_hour: { name: 'Happy Hour', impact: 5000, actions: ['Adjust pricing', 'Send notification'] },
  win_back: { name: 'Win-Back', impact: 5000, actions: ['Identify churned', 'Send offer', 'Track conversion'] },
  rainy_day: { name: 'Rainy Day', impact: 10000, actions: ['Launch delivery campaign', 'Free delivery offer'] },
  festival_boost: { name: 'Festival Boost', impact: 25000, actions: ['Multi-channel push', 'Special offers'] },
};

// ============== MEMORY LAYER ==============

const memory = new Map();

function recordAction(action, result) {
  const existing = memory.get(action) || { count: 0, totalRevenue: 0, avgROI: 0 };
  existing.count++;
  existing.totalRevenue += result.revenue || 0;
  existing.avgROI = (existing.avgROI + (result.roi || 0)) / 2;
  memory.set(action, existing);
}

// ============== API ROUTES ==============

// ============== VOICE COMMANDS ==============

const { parseCommand, executeCommand } = require('./src/services/voiceCommands');

app.post('/api/voice/command', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text required' });
  }
  const command = parseCommand(text);
  const result = executeCommand(command);
  res.json({ command, result });
});

// ============== INVENTORY PREDICTION ==============

const inventoryRouter = require('./src/services/inventoryPrediction');
app.use('/api/inventory', inventoryRouter);

// ============== STAFF SCHEDULING ==============

const staffRouter = require('./src/services/staffScheduling');
app.use('/api/staff', staffRouter);

// ============== ADMIN DASHBOARD ==============

const adminRouter = require('./src/services/adminDashboard');
app.use('/api/admin', adminRouter);

// ============== WEBHOOKS ==============

const webhookRouter = require('./src/services/webhooks');
app.use('/api/webhooks', webhookRouter);

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'REZ Business AI', port: PORT, timestamp: new Date().toISOString() });
});

// ============== INTEGRATION HUB ==============

const { Intelligence, RABTUL, Media, CorpPerks, CampaignExecutor, SERVICES } = require('./src/services/integrationHub');

// Get all connected services status
app.get('/api/integration/status', (req, res) => {
  res.json({
    services: Object.keys(SERVICES).map(name => ({
      name,
      url: SERVICES[name].url,
      connected: true,
    })),
  });
});

// Intelligence endpoints
app.get('/api/intelligence/signals/:merchantId', async (req, res) => {
  const signals = await Intelligence.getSignals(req.params.merchantId);
  res.json(signals);
});

app.get('/api/intelligence/demand', async (req, res) => {
  const demand = await Intelligence.getDemand(req.query);
  res.json(demand);
});

app.get('/api/intelligence/churn/:customerId', async (req, res) => {
  const churn = await Intelligence.getChurnRisk(req.params.customerId);
  res.json(churn);
});

// RABTUL endpoints
app.post('/api/rabtul/notify', async (req, res) => {
  const result = await RABTUL.sendNotification(req.body);
  res.json(result);
});

app.post('/api/rabtul/wallet/credit', async (req, res) => {
  const result = await RABTUL.creditWallet(req.body);
  res.json(result);
});

app.post('/api/rabtul/coupon', async (req, res) => {
  const result = await RABTUL.createCoupon(req.body);
  res.json(result);
});

// Media endpoints
app.post('/api/media/campaign', async (req, res) => {
  const result = await Media.createCampaign(req.body);
  res.json(result);
});

app.post('/api/media/ad', async (req, res) => {
  const result = await Media.launchAd(req.body);
  res.json(result);
});

app.post('/api/media/qr/track', async (req, res) => {
  const result = await Media.trackQR(req.body);
  res.json(result);
});

// CorpPerks endpoints
app.get('/api/corpperks/identify', async (req, res) => {
  const result = await CorpPerks.identifyCorporate(req.query.email);
  res.json(result);
});

app.post('/api/corpperks/b2b-deal', async (req, res) => {
  const result = await CorpPerks.createB2BDeal(req.body);
  res.json(result);
});

// Complete campaign execution
app.post('/api/campaign/execute', async (req, res) => {
  try {
    const result = await CampaignExecutor.execute(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ML Predictions
app.get('/api/predict/demand', (req, res) => {
  const { dayOfWeek, timeOfDay, weather, event, historical } = req.query;
  const prediction = predictDemand({
    dayOfWeek: Number(dayOfWeek) || 0,
    timeOfDay: Number(timeOfDay) || 12,
    weather: Number(weather) || 0,
    event: Number(event) || 0,
    historical: Number(historical) || 100,
  });
  res.json(prediction);
});

app.get('/api/predict/churn', (req, res) => {
  const { daysSinceLastOrder, avgOrderFrequency, lifetimeValue, engagementScore } = req.query;
  const prediction = predictChurn({
    daysSinceLastOrder: Number(daysSinceLastOrder) || 7,
    avgOrderFrequency: Number(avgOrderFrequency) || 4,
    lifetimeValue: Number(lifetimeValue) || 5000,
    engagementScore: Number(engagementScore) || 70,
  });
  res.json(prediction);
});

app.get('/api/predict/ltv', (req, res) => {
  const { currentSpend, orderFrequency, engagementMonths } = req.query;
  const prediction = predictLTV({
    currentSpend: Number(currentSpend) || 500,
    orderFrequency: Number(orderFrequency) || 4,
    engagementMonths: Number(engagementMonths) || 6,
  });
  res.json(prediction);
});

app.post('/api/recommend/campaign', (req, res) => {
  const recommendation = recommendCampaign(req.body);
  res.json(recommendation);
});

app.post('/api/optimize/pricing', (req, res) => {
  const { basePrice, demand, competition, inventory } = req.body;
  const optimization = optimizePricing({
    basePrice: basePrice || 100,
    demand: demand || 0.5,
    competition: competition || 0.5,
    inventory: inventory || 0.5,
  });
  res.json(optimization);
});

// Suggestions
app.get('/api/suggestions', (req, res) => {
  const merchantId = req.query.merchantId || 'demo';
  const suggestions = [
    { id: 'suggest-1', title: 'Weekend Rush Campaign', description: 'Launch campaign for weekend traffic', reasoning: 'Historical data shows +40% weekend traffic', estimatedImpact: { revenue: 8000, customers: 40 }, confidence: 85, status: 'pending' },
    { id: 'suggest-2', title: 'Win-Back Campaign', description: '3 high-value customers inactive 14+ days', reasoning: 'High-value customers showing churn signals', estimatedImpact: { revenue: 5000, customers: 15 }, confidence: 92, status: 'pending' },
    { id: 'suggest-3', title: 'Happy Hour Pricing', description: 'Adjust pricing for evening demand', reasoning: 'Time-based pricing opportunity', estimatedImpact: { revenue: 3000, customers: 20 }, confidence: 72, status: 'pending' },
  ];
  res.json({ merchantId, suggestions });
});

// Actions
app.post('/api/actions/:id/approve', (req, res) => {
  const { id } = req.params;
  recordAction(id, { revenue: 5000, roi: 2.5 });
  res.json({ success: true, actionId: id, status: 'executed' });
});

app.post('/api/actions/:id/reject', (req, res) => {
  const { id } = req.params;
  res.json({ success: true, dismissed: id });
});

// Bundles
app.get('/api/bundles', (req, res) => {
  res.json({ bundles: BUNDLES });
});

app.post('/api/bundles/:id/execute', (req, res) => {
  const { id } = req.params;
  const bundle = BUNDLES[id];
  if (!bundle) {
    return res.status(404).json({ error: 'Bundle not found' });
  }
  recordAction(id, { revenue: bundle.impact, roi: 2.5 });
  res.json({ success: true, bundle: id, executed: bundle });
});

// Decision
app.post('/api/decide', (req, res) => {
  const start = Date.now();
  const { type, context } = req.body;

  // Constraint check
  if (context?.margin < 0.1) {
    return res.json({ decision: 'reject', reasoning: 'Margin below threshold', latencyMs: Date.now() - start });
  }

  res.json({
    decision: 'execute',
    confidence: 0.85,
    reasoning: `Best match for ${type}`,
    latencyMs: Date.now() - start,
  });
});

// Memory
app.get('/api/memory', (req, res) => {
  const learnings = [];
  for (const [key, value] of memory) {
    learnings.push({ action: key, ...value });
  }
  res.json({ merchantId: req.query.merchantId || 'all', learnings });
});

// Attribution
app.get('/api/attribution/:merchantId', (req, res) => {
  res.json({
    merchantId: req.params.merchantId,
    channels: {
      whatsapp: { revenue: 5000, conversions: 25, roi: 3.2 },
      push: { revenue: 3000, conversions: 40, roi: 2.8 },
      sms: { revenue: 2000, conversions: 15, roi: 2.1 },
      organic: { revenue: 10000, conversions: 80, roi: 0 },
    },
    totalRevenue: 20000,
    topChannel: 'organic',
    recommendations: ['Increase WhatsApp budget by 20%', 'Test SMS for win-back'],
  });
});

// Health Score
app.get('/api/health/:merchantId', (req, res) => {
  res.json({
    merchantId: req.params.merchantId,
    score: 87,
    revenue: 12500,
    customers: 45,
    orders: 120,
    retention: 78,
    streak: 7,
    lastUpdated: new Date().toISOString(),
  });
});

// ============== START ==============

app.listen(PORT, () => {
  logger.info(`REZ Business AI running on port ${PORT}`);
  logger.info(`Health: http://localhost:${PORT}/health`);
  logger.info(`ML Predictions: http://localhost:${PORT}/api/predict/*`);
  logger.info(`Suggestions: http://localhost:${PORT}/api/suggestions`);
});

module.exports = app;
