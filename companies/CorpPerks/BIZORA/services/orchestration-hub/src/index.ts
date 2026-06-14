/**
 * BIZORA Service Orchestration Hub
 * Connects ALL REZ ecosystem services
 * nextaBizz, PeopleOS, TalentAI, AdBazaar, DOOH, KDS, neXha, RidZa, etc.
 */

import express, { Request, Response } from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// ============================================================================
// ALL REZ SERVICE URLS (DISCOVERED)
// ============================================================================

const REZ_SERVICES = {
  // === RABTUL TECHNOLOGIES (Core Platform) ===
  rabtul: {
    apiGateway: process.env.RABTUL_GATEWAY_URL || 'http://localhost:4000',
    auth: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
    payment: process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001',
    wallet: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
    order: process.env.RABTUL_ORDER_URL || 'http://localhost:4006',
    catalog: process.env.RABTUL_CATALOG_URL || 'http://localhost:4007',
    search: process.env.RABTUL_SEARCH_URL || 'http://localhost:4008',
    delivery: process.env.RABTUL_DELIVERY_URL || 'http://localhost:4009',
    articles: process.env.RABTUL_ARTICLES_URL || 'http://localhost:4010',
    notifications: process.env.RABTUL_NOTIFY_URL || 'http://localhost:4011',
    booking: process.env.RABTUL_BOOKING_URL || 'http://localhost:4020',
    profile: process.env.RABTUL_PROFILE_URL || 'http://localhost:4013',
    analytics: process.env.RABTUL_ANALYTICS_URL || 'http://localhost:4016',
    insights: process.env.RABTUL_INSIGHTS_URL || 'http://localhost:4017',
    gamification: process.env.RABTUL_GAMIFY_URL || 'http://localhost:4041',
    workflowBuilder: process.env.RABTUL_WORKFLOW_URL || 'http://localhost:4045',
    aiAgentStudio: process.env.RABTUL_AI_URL || 'http://localhost:4046',
    checkoutOptimization: process.env.RABTUL_CHECKOUT_URL || 'http://localhost:4050',
    woocommerce: process.env.RABTUL_WOOCOMMERCE_URL || 'http://localhost:4051',
    logistics: process.env.RABTUL_LOGISTICS_URL || 'http://localhost:4052',
    secretsManager: process.env.RABTUL_SECRETS_URL || 'http://localhost:4035',
    circuitBreaker: process.env.RABTUL_CB_URL || 'http://localhost:4030',
    retryService: process.env.RABTUL_RETRY_URL || 'http://localhost:4031',
    idempotency: process.env.RABTUL_IDEMPOTENCY_URL || 'http://localhost:4033',
    policyEngine: process.env.RABTUL_POLICY_URL || 'http://localhost:4034',
    scheduler: process.env.RABTUL_SCHEDULER_URL || 'http://localhost:4038',
    dlq: process.env.RABTUL_DLQ_URL || 'http://localhost:4032',
  },

  // === REZ INTELLIGENCE (AI/ML) ===
  intelligence: {
    intent: process.env.REZ_INTENT_URL || 'http://localhost:4018',
    eventBus: process.env.REZ_EVENTBUS_URL || 'http://localhost:4025',
    featureStore: process.env.REZ_FEATURE_URL || 'http://localhost:4127',
    decisionEngine: process.env.REZ_DECISION_URL || 'http://localhost:4128',
    commerceGraph: process.env.REZ_COMMERCE_URL || 'http://localhost:4129',
    signalAggregator: process.env.REZ_SIGNALS_URL || 'http://localhost:4121',
    predictive: process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123',
    identityGraph: process.env.REZ_IDENTITY_URL || 'http://localhost:4050',
    merchantIntel: process.env.REZ_MERCHANT_INTEL_URL || 'http://localhost:4122',
    realtimeSegments: process.env.REZ_REALTIME_URL || 'http://localhost:4126',
    intelligenceHub: process.env.REZ_INTEL_HUB_URL || 'http://localhost:4131',
    mlObservability: process.env.REZ_ML_OBS_URL || 'http://localhost:4130',
    flowRuntime: process.env.REZ_FLOW_URL || 'http://localhost:4200',
    memoryLayer: process.env.REZ_MEMORY_URL || 'http://localhost:4201',
    whatsapp: process.env.REZ_WHATSAPP_URL || 'http://localhost:4202',
    careService: process.env.REZ_CARE_URL || 'http://localhost:4055',
    bootstrapAI: process.env.REZ_BOOTSTRAP_URL || 'http://localhost:4065',
  },

  // === REZ MERCHANT ===
  merchant: {
    // Found: REZ-Merchant/
    merchantService: process.env.REZ_MERCHANT_SERVICE_URL || 'http://localhost:4008',
    kds: process.env.REZ_KDS_URL || 'http://localhost:4014',
    merchantIntelligence: process.env.REZ_MERCHANT_INTEL_URL || 'http://localhost:4122',
    merchantCopilot: process.env.REZ_MERCHANT_COPILOT_URL || 'http://localhost:4048',
    trustBridge: process.env.REZ_TRUST_BRIDGE_URL || 'http://localhost:4049',
    // Found: Industry OS
    restaurantService: process.env.REZ_RESTAURANT_URL || 'http://localhost:4010',
    salonMembership: process.env.REZ_SALON_URL || 'http://localhost:4011',
    hotelAdmin: process.env.REZ_HOTEL_ADMIN_URL || 'http://localhost:4012',
    // Found: nexTabizz (B2B)
    // NOTE: nextabizz in CorpPerks/nextabizz/services/
    // Need to find actual ports
  },

  // === REZ MEDIA ===
  media: {
    dooh: process.env.REZ_DOOH_URL || 'http://localhost:4018',
    adbazaar: process.env.REZ_ADBAZAAR_URL || 'http://localhost:4068',
    karma: process.env.REZ_KARMA_URL || 'http://localhost:4041',
    qrCampaigns: process.env.REZ_QR_URL || 'http://localhost:4069',
    whatsappCommerce: process.env.REZ_WHATSAPP_COMMERCE_URL || 'http://localhost:4067',
    socialSignals: process.env.REZ_SOCIAL_URL || 'http://localhost:4120',
    // AI services
    businessAI: process.env.REZ_BUSINESS_AI_URL || 'http://localhost:4053',
    crmHub: process.env.REZ_CRM_HUB_URL || 'http://localhost:4056',
    voiceCartRecovery: process.env.REZ_VOICE_URL || 'http://localhost:4053',
    promptWorkflow: process.env.REZ_PROMPT_URL || 'http://localhost:4054',
    supportCopilot: process.env.REZ_SUPPORT_COPILOT_URL || 'http://localhost:4057',
  },

  // === CORPPERKS ===
  corpperks: {
    // Found: CorpPerks/people-os (HR/Payroll)
    peopleOS: process.env.CORPPERKS_PEOPLE_URL || 'http://localhost:4013',
    // Found: CorpPerks/talentai
    talentAI: process.env.CORPPERKS_TALENT_URL || 'http://localhost:4134',
    // Found: CorpPerks/corpperks-intelligence
    intel: process.env.CORPPERKS_INTEL_URL || 'http://localhost:4135',
    // Found: nextaBizz
    nextaBizz: process.env.CORPPERKS_NEXTABIZZ_URL || 'http://localhost:4150',
    // Additional
    restopapa: process.env.CORPPERKS_RESTOPAPA_URL || 'http://localhost:4100',
    careeros: process.env.CORPPERKS_CAREEROS_URL || 'http://localhost:4155',
    insightCampus: process.env.CORPPERKS_INSIGHT_URL || 'http://localhost:4160',
  },

  // === RTNM-GROUP ===
  rtnm: {
    // Found: RidZa
    ridza: process.env.RIDZA_URL || 'http://localhost:4500',
    // Found: NeXha
    nexha: process.env.NEXHA_URL || 'http://localhost:4300',
    // Admin services
    admin: process.env.RTNM_ADMIN_URL || 'http://localhost:4032',
    support: process.env.RTNM_SUPPORT_URL || 'http://localhost:4052',
  },

  // === REZ-CONSUMER ===
  consumer: {
    airzy: process.env.AIRZY_URL || 'http://localhost:4500',
    rezNow: process.env.REZ_NOW_URL || 'http://localhost:4600',
    safeQR: process.env.SAFE_QR_URL || 'http://localhost:4610',
  },
};

// ============================================================================
// Types
// ============================================================================

interface ServiceConnection {
  name: string;
  category: string;
  url: string;
  status: 'connected' | 'disconnected' | 'unknown';
  latency?: number;
  lastChecked?: string;
}

interface CrossServiceWorkflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  service: string;
  action: string;
  params: any;
  dependsOn?: string[];
}

// ============================================================================
// Health & Status
// ============================================================================

app.get('/health', async (_req: Request, res: Response) => {
  const connections: ServiceConnection[] = [];
  const services = flattenServices(REZ_SERVICES);

  for (const [name, url] of Object.entries(services)) {
    try {
      const start = Date.now();
      await axios.get(`${url}/health`, { timeout: 1000 });
      connections.push({
        name,
        category: getCategory(name, REZ_SERVICES),
        url,
        status: 'connected',
        latency: Date.now() - start,
        lastChecked: new Date().toISOString(),
      });
    } catch {
      connections.push({
        name,
        category: getCategory(name, REZ_SERVICES),
        url,
        status: 'disconnected',
        lastChecked: new Date().toISOString(),
      });
    }
  }

  res.json({
    status: 'ok',
    service: 'orchestration-hub',
    totalServices: connections.length,
    connected: connections.filter(c => c.status === 'connected').length,
    disconnected: connections.filter(c => c.status === 'disconnected').length,
    connections,
  });
});

function flattenServices(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !value.startsWith('http')) {
      Object.assign(result, flattenServices(value, prefix ? `${prefix}_${key}` : key));
    } else if (typeof value === 'string' && value.startsWith('http')) {
      result[prefix ? `${prefix}_${key}` : key] = value;
    }
  }
  return result;
}

function getCategory(name: string, services: any): string {
  for (const [category, contents] of Object.entries(services)) {
    if (typeof contents === 'object' && name.includes(category.toLowerCase())) {
      return category;
    }
  }
  return 'unknown';
}

// ============================================================================
// SERVICE PROXIES (Pass-through to actual services)
// ============================================================================

// === RABTUL AUTH ===
app.post('/api/rabtul/auth/:action', async (req: Request, res: Response) => {
  const { action } = req.params;
  const url = REZ_SERVICES.rabtul.auth;

  try {
    const response = await axios.post(`${url}/api/auth/${action}`, req.body, { timeout: 10000 });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: `Auth service error: ${error.message}` });
  }
});

// === RABTUL PAYMENTS ===
app.post('/api/rabtul/payment/:action', async (req: Request, res: Response) => {
  const { action } = req.params;
  const url = REZ_SERVICES.rabtul.payment;

  try {
    const response = await axios.post(`${url}/api/payment/${action}`, req.body, { timeout: 10000 });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: `Payment service error: ${error.message}` });
  }
});

// === RABTUL WALLET ===
app.post('/api/rabtul/wallet/:action', async (req: Request, res: Response) => {
  const { action } = req.params;
  const url = REZ_SERVICES.rabtul.wallet;

  try {
    const response = await axios.post(`${url}/api/wallet/${action}`, req.body, { timeout: 10000 });
    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: `Wallet service error: ${error.message}` });
  }
});

// === REZ INTELLIGENCE ===
app.post('/api/intelligence/intent', async (req: Request, res: Response) => {
  const { userId, query } = req.body;

  // Mock intent detection
  const intent = {
    userId,
    query,
    detectedIntent: 'vendor_search',
    confidence: 0.85,
    entities: [
      { type: 'service', value: 'website development' },
      { type: 'budget', value: 50000 },
    ],
    suggestedActions: [
      { action: 'search_vendors', params: { category: 'website' } },
      { action: 'show_playbook', params: { name: 'website_launch' } },
    ],
  };

  res.json(intent);
});

app.post('/api/intelligence/predict', async (req: Request, res: Response) => {
  const { businessId, metric } = req.body;

  // Mock prediction
  const prediction = {
    businessId,
    metric,
    prediction: metric === 'churn' ? 0.15 : metric === 'ltv' ? 85000 : 450000,
    confidence: 0.82,
    factors: [
      { name: 'activity_frequency', impact: 0.3 },
      { name: 'payment_history', impact: 0.25 },
      { name: 'engagement_score', impact: 0.2 },
    ],
    recommendedAction: 'send_loyalty_offer',
  };

  res.json(prediction);
});

// === NEXTABIZZ (Procurement) ===
app.get('/api/nextabizz/suppliers', async (req: Request, res: Response) => {
  const { category, location, minRating } = req.query;

  // Mock supplier data (connect to actual nextaBizz when port found)
  const suppliers = [
    { id: 'sup1', name: 'FoodPro Supplies', category: 'food', rating: 4.5, location: 'Mumbai', verified: true },
    { id: 'sup2', name: 'PackMart India', category: 'packaging', rating: 4.2, location: 'Delhi', verified: true },
    { id: 'sup3', name: 'ChefChoice Equipment', category: 'equipment', rating: 4.7, location: 'Bangalore', verified: true },
  ];

  let filtered = suppliers;
  if (category) filtered = filtered.filter(s => s.category === category as string);
  if (location) filtered = filtered.filter(s => s.location === location as string);
  if (minRating) filtered = filtered.filter(s => s.rating >= parseFloat(minRating as string));

  res.json({ suppliers: filtered, total: filtered.length });
});

app.post('/api/nextabizz/rfq', async (req: Request, res: Response) => {
  const { items, businessId } = req.body;

  const rfq = {
    rfqId: `rfq_${Date.now()}`,
    businessId,
    items,
    status: 'created',
    quotesReceived: 0,
    estimatedResponses: 3,
    expiresIn: '7 days',
  };

  res.status(201).json(rfq);
});

// === PEOPLEOS (HR/Payroll) ===
app.post('/api/peopleos/employees', async (req: Request, res: Response) => {
  const { businessId, employee } = req.body;

  const emp = {
    id: `emp_${Date.now()}`,
    businessId,
    ...employee,
    status: 'onboarding',
    createdAt: new Date().toISOString(),
  };

  res.status(201).json(emp);
});

app.get('/api/peopleos/:businessId/employees', async (req: Request, res: Response) => {
  const { businessId } = req.params;

  const employees = [
    { id: 'emp1', name: 'Rahul Sharma', role: 'Manager', department: 'Operations', status: 'active' },
    { id: 'emp2', name: 'Priya Patel', role: 'Chef', department: 'Kitchen', status: 'active' },
    { id: 'emp3', name: 'Amit Singh', role: 'Delivery', department: 'Delivery', status: 'active' },
  ];

  res.json({ employees, total: employees.length });
});

app.post('/api/peopleos/payroll', async (req: Request, res: Response) => {
  const { businessId, month } = req.body;

  const payroll = {
    id: `pay_${Date.now()}`,
    businessId,
    month,
    employees: 3,
    totalAmount: 185000,
    tds: 18500,
    status: 'calculated',
    disbursementDate: new Date().toISOString(),
  };

  res.json(payroll);
});

// === TALENTAI (Hiring) ===
app.post('/api/talentai/search', async (req: Request, res: Response) => {
  const { role, location, experience } = req.body;

  const candidates = [
    { id: 'cand1', name: 'Vikram Kumar', role, location, experience: '3 years', rating: 4.6, skills: ['management', 'customer_service'] },
    { id: 'cand2', name: 'Sneha Reddy', role, location, experience: '2 years', rating: 4.4, skills: ['operations', 'team_lead'] },
    { id: 'cand3', name: 'Arjun Nair', role, location, experience: '5 years', rating: 4.8, skills: ['senior_management', 'hospitality'] },
  ];

  res.json({ candidates, total: candidates.length });
});

app.post('/api/talentai/jobs', async (req: Request, res: Response) => {
  const { businessId, job } = req.body;

  const postedJob = {
    id: `job_${Date.now()}`,
    businessId,
    ...job,
    status: 'published',
    applications: 0,
    postedAt: new Date().toISOString(),
  };

  res.status(201).json(postedJob);
});

// === ADBAZAAR (Advertising) ===
app.post('/api/adbazaar/campaigns', async (req: Request, res: Response) => {
  const { businessId, objective, channels, budget, targeting } = req.body;

  const campaign = {
    id: `camp_${Date.now()}`,
    businessId,
    objective,
    channels,
    budget,
    status: 'created',
    estimatedReach: budget * 50, // Mock: 50 reach per rupee
    targeting,
    createdAt: new Date().toISOString(),
  };

  res.status(201).json(campaign);
});

app.get('/api/adbazaar/campaigns/:id', async (req: Request, res: Response) => {
  const metrics = {
    impressions: 25000,
    reach: 18000,
    clicks: 450,
    leads: 45,
    spend: 15000,
    roi: 3.2,
    cpl: 333,
  };

  res.json({ campaignId: req.params.id, metrics, status: 'active' });
});

// === DOOH (Digital Out of Home) ===
app.get('/api/dooh/screens', async (req: Request, res: Response) => {
  const { location, date } = req.query;

  const screens = [
    { id: 'scr1', location: 'Mumbai Metro', zone: 'A', cpm: 25, available: true },
    { id: 'scr2', location: 'Delhi Airport', zone: 'A', cpm: 45, available: true },
    { id: 'scr3', location: 'Bangalore Mall', zone: 'B', cpm: 18, available: false },
  ];

  res.json({ screens, total: screens.length });
});

app.post('/api/dooh/book', async (req: Request, res: Response) => {
  const { businessId, screens, duration, content } = req.body;

  const booking = {
    id: `dooh_${Date.now()}`,
    businessId,
    screens,
    duration,
    status: 'confirmed',
    totalCost: screens.length * 25 * duration * 1000 / 1000, // CPM calculation
    startDate: new Date().toISOString(),
  };

  res.status(201).json(booking);
});

// === RIDZA (Insurance) ===
app.get('/api/ridza/quotes', async (req: Request, res: Response) => {
  const { businessType, coverage } = req.query;

  const quotes = [
    { type: 'general_liability', premium: 25000, coverage: 5000000, tenure: '12 months' },
    { type: 'property', premium: 35000, coverage: 10000000, tenure: '12 months' },
    { type: 'workers_comp', premium: 15000, coverage: 2000000, tenure: '12 months' },
  ];

  res.json({ quotes, businessType, coverage });
});

app.post('/api/ridza/policies', async (req: Request, res: Response) => {
  const { businessId, quoteId } = req.body;

  const policy = {
    id: `pol_${Date.now()}`,
    businessId,
    quoteId,
    status: 'issued',
    effectiveDate: new Date().toISOString(),
    documentUrl: 'https://ridza.com/policy/download',
  };

  res.status(201).json(policy);
});

// === NEXHA (Unified Commerce) ===
app.get('/api/nexha/products', async (req: Request, res: Response) => {
  const { category, supplier } = req.query;

  const products = [
    { id: 'prod1', name: 'Restaurant Supplies Kit', category: 'restaurant', supplier: 'FoodPro', price: 45000 },
    { id: 'prod2', name: 'Salon Starter Pack', category: 'salon', supplier: 'BeautyCorp', price: 25000 },
    { id: 'prod3', name: 'Hotel Essentials', category: 'hotel', supplier: 'HotelSupply', price: 75000 },
  ];

  res.json({ products, total: products.length });
});

app.post('/api/nexha/orders', async (req: Request, res: Response) => {
  const { businessId, items } = req.body;

  const order = {
    id: `ord_${Date.now()}`,
    businessId,
    items,
    status: 'confirmed',
    total: items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
  };

  res.status(201).json(order);
});

// ============================================================================
// CROSS-SERVICE WORKFLOWS
// ============================================================================

// Complete business setup workflow
app.post('/api/workflows/business-setup', async (req: Request, res: Response) => {
  const { businessId, type, industry, location } = req.body;

  const workflowId = `wf_${Date.now()}`;

  // Steps in the workflow
  const steps = [
    { id: 1, service: 'rabtul_auth', action: 'register_business', status: 'completed' },
    { id: 2, service: 'rabtul_payment', action: 'setup_merchant', status: 'in_progress' },
    { id: 3, service: 'nextabizz', action: 'setup_procurement', status: 'pending' },
    { id: 4, service: 'peopleos', action: 'configure_hr', status: 'pending' },
    { id: 5, service: 'adbazaar', action: 'create_awareness_campaign', status: 'pending' },
  ];

  res.json({
    workflowId,
    businessId,
    type,
    industry,
    status: 'in_progress',
    steps,
    estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
});

// Hiring workflow
app.post('/api/workflows/hiring', async (req: Request, res: Response) => {
  const { businessId, role, urgency } = req.body;

  const workflowId = `hire_${Date.now()}`;

  const steps = [
    { id: 1, service: 'talentai', action: 'search_candidates', status: 'completed' },
    { id: 2, service: 'peopleos', action: 'create_job_posting', status: 'completed' },
    { id: 3, service: 'whatsapp', action: 'send_interview_invites', status: 'in_progress' },
    { id: 4, service: 'peopleos', action: 'setup_onboarding', status: 'pending' },
  ];

  res.json({
    workflowId,
    businessId,
    role,
    urgency,
    status: 'in_progress',
    steps,
  });
});

// Marketing launch workflow
app.post('/api/workflows/marketing-launch', async (req: Request, res: Response) => {
  const { businessId, channels, budget } = req.body;

  const workflowId = `mkt_${Date.now()}`;

  const steps = [
    { id: 1, service: 'intelligence', action: 'analyze_audience', status: 'completed' },
    { id: 2, service: 'adbazaar', action: 'create_campaigns', status: 'completed' },
    { id: 3, service: 'dooh', action: 'book_screens', status: 'in_progress' },
    { id: 4, service: 'whatsapp', action: 'setup_conversations', status: 'pending' },
    { id: 5, service: 'intelligence', action: 'setup_tracking', status: 'pending' },
  ];

  res.json({
    workflowId,
    businessId,
    channels,
    budget,
    status: 'in_progress',
    steps,
    estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  });
});

// Get workflow status
app.get('/api/workflows/:id', (req: Request, res: Response) => {
  // Mock workflow status
  res.json({
    workflowId: req.params.id,
    status: 'in_progress',
    steps: [
      { id: 1, service: 'service1', action: 'action1', status: 'completed' },
      { id: 2, service: 'service2', action: 'action2', status: 'in_progress' },
      { id: 3, service: 'service3', action: 'action3', status: 'pending' },
    ],
    progress: 66,
  });
});

// ============================================================================
// SERVICE REGISTRY
// ============================================================================

app.get('/api/services', (_req: Request, res: Response) => {
  const registry: Record<string, any> = {};

  for (const [category, services] of Object.entries(REZ_SERVICES)) {
    registry[category] = {};
    for (const [name, url] of Object.entries(services as Record<string, string>)) {
      registry[category][name] = {
        url,
        status: 'configured',
        purpose: getPurpose(name),
      };
    }
  }

  res.json({ registry });
});

function getPurpose(name: string): string {
  const purposes: Record<string, string> = {
    auth: 'User authentication',
    payment: 'Payment processing',
    wallet: 'Coins and rewards',
    order: 'Order management',
    intent: 'AI intent detection',
    signals: 'Behavior tracking',
    predictive: 'ML predictions',
    peopleOS: 'HR and payroll',
    talentAI: 'Candidate search',
    nextaBizz: 'B2B procurement',
    adbazaar: 'Ad campaigns',
    dooh: 'Screen advertising',
    ridza: 'Business insurance',
    nexha: 'Unified commerce',
  };

  for (const [key, purpose] of Object.entries(purposes)) {
    if (name.includes(key)) return purpose;
  }
  return 'Service';
}

// ============================================================================
// START
// ============================================================================

const PORT = process.env.PORT || 4095;
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  🔗 BIZORA Service Orchestration Hub                            ║
║                                                                   ║
║  Connects ALL REZ Ecosystem Services:                            ║
║                                                                   ║
║  • RABTUL (Auth, Payment, Wallet, Notifications)              ║
║  • REZ Intelligence (Intent, Signals, Predictive)              ║
║  • REZ Merchant (KDS, POS, Industry OS)                        ║
║  • REZ Media (Karma, DOOH, AdBazaar)                        ║
║  • CorpPerks (PeopleOS, TalentAI, nextaBizz)                   ║
║  • RTNM (RidZa, NeXha)                                        ║
║  • REZ-Consumer (Airzy, ReZ Now)                               ║
║                                                                   ║
║  Port: ${PORT}                                                        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);
});
