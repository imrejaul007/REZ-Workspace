/**
 * REZ Atlas GTM - Autonomous Go-To-Market Agent System
 *
 * This is the "AI Revenue Engine" layer that competes directly with Explee.
 * Modules:
 * - Company Understanding
 * - Competitor Discovery
 * - Segment Building
 * - Buyer Persona Generation
 * - Prospect Intelligence
 * - Outreach Intelligence
 * - Message Factory (with AI generation)
 * - Sequence Builder (multi-step automation)
 * - Email Sender (with SendGrid)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Import modules
const aiGenerator = require('../modules/ai-message-generator');
const sequenceBuilder = require('../modules/sequence-builder');
const emailSender = require('../modules/email-sender');
const calendarIntegration = require('../modules/calendar-integration');
const whatsappIntegration = require('../modules/whatsapp-integration');
const linkedinIntegration = require('../modules/linkedin-integration');
const dataEnrichment = require('../modules/data-enrichment');
const prospectDatabase = require('../modules/prospect-database');
const crmIntegration = require('../modules/crm-integration');
const smsIntegration = require('../modules/sms-integration');
const aiScoring = require('../modules/ai-scoring');
const analyticsDashboard = require('../modules/analytics-dashboard');
const workflowAutomation = require('../modules/workflow-automation');
const abTesting = require('../modules/ab-testing');
const territoryManagement = require('../modules/territory-management');
const adbazaarIntegration = require('../modules/adbazaar-integration');
const rabtulIntegration = require('../modules/rabtul-integration');
const database = require('../modules/database');
const mapIntelligence = require('../modules/map-intelligence');
const apiAuth = require('../modules/api-auth');
const scheduledJobs = require('../modules/scheduled-jobs');
const redisCache = require('../modules/redis-cache');
const pdfReports = require('../modules/pdf-reports');

const app = express();
const PORT = 5200;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Request ID middleware
app.use(apiAuth.requestIdMiddleware);

// Rate limiting (100 requests per minute per IP)
const rateLimiter = apiAuth.createRateLimiter({
  windowMs: 60000,
  maxRequests: 100
});
app.use('/api/', rateLimiter);

// ============================================
// IN-MEMORY STORAGE
// ============================================

const storage = {
  companies: new Map(),
  competitors: new Map(),
  segments: new Map(),
  personas: new Map(),
  prospects: new Map(),
  campaigns: new Map(),
  workspaces: new Map(),
  aiGeneratedMessages: new Map()
};

// Seed data
const seedData = () => {
  storage.campaigns.set('campaign_1', {
    id: 'campaign_1',
    name: 'REZ Money - Loyalty Platform',
    domain: 'rez.money',
    status: 'active',
    createdAt: new Date().toISOString(),
    companyInsight: {
      summary: 'Cashback and loyalty coin platform',
      industry: 'Fintech / Loyalty',
      valueProps: ['Cashback rewards', 'Gamified loyalty', 'Retention engine'],
      painPoints: ['Customer churn', 'Low engagement', 'No loyalty program'],
      useCases: ['E-commerce retention', 'Subscription boxes', 'D2C brands'],
      keywords: ['cashback', 'loyalty', 'coins', 'rewards', 'retention', 'gamification'],
      differentiators: ['Real-time rewards', 'Multi-brand coins', 'Game mechanics']
    },
    competitors: [
      { name: 'Yotpo', type: 'direct', confidence: 95 },
      { name: 'Smile.io', type: 'direct', confidence: 92 },
      { name: 'Loyalty Lion', type: 'direct', confidence: 88 },
      { name: 'Snipp', type: 'indirect', confidence: 85 },
      { name: 'Annex Cloud', type: 'indirect', confidence: 82 },
      { name: 'Capillary', type: 'indirect', confidence: 80 }
    ],
    segments: [
      { name: 'Shopify Brands', count: 45, icp: 'SMB e-commerce using Shopify' },
      { name: 'D2C Brands', count: 38, icp: 'Direct-to-consumer companies' },
      { name: 'Subscription Services', count: 25, icp: 'Monthly subscription businesses' },
      { name: 'Marketplace Sellers', count: 32, icp: 'Amazon, Flipkart sellers' }
    ],
    personas: [
      { title: 'Head of Marketing', seniority: 'VP/Director', painPoints: ['Low repeat purchase rate'] },
      { title: 'Founder/CEO', seniority: 'C-level', painPoints: ['High CAC', 'Customer churn'] },
      { title: 'CRM Manager', seniority: 'Manager', painPoints: ['Fragmented customer data'] },
      { title: 'Head of Growth', seniority: 'VP', painPoints: ['Retention metrics', 'LTV improvement'] }
    ],
    stats: {
      prospectsFound: 200,
      contactsFound: 228,
      companiesTargeted: 99,
      emailsGenerated: 0,
      campaignsCreated: 0
    }
  });
};

seedData();

// ============================================
// GTM AGENTS (Simplified - Core Logic)
// ============================================

const companyUnderstandingAgent = async (domain) => {
  const company = {
    id: uuidv4(),
    domain,
    analyzedAt: new Date().toISOString(),
    company: {
      name: extractCompanyName(domain),
      industry: inferIndustry(domain),
      size: randomChoice(['startup', 'smb', 'mid-market', 'enterprise']),
      location: 'India'
    },
    valueProposition: ['Automated loyalty rewards', 'Real-time cashback', 'Gamified engagement'],
    painPoints: ['High customer acquisition cost', 'Low repeat purchase rate', 'No loyalty program'],
    useCases: ['E-commerce customer retention', 'Subscription box loyalty', 'D2C brand engagement'],
    keywords: ['loyalty', 'cashback', 'rewards', 'retention', 'engagement'],
    differentiators: ['Real-time cashback', 'Multi-brand coin system', 'Shopify integration'],
    confidence: 85 + Math.floor(Math.random() * 10)
  };
  storage.companies.set(company.id, company);
  return company;
};

const competitorDiscoveryAgent = async (companyId) => {
  const company = storage.companies.get(companyId);
  const competitors = {
    id: uuidv4(),
    companyId,
    analyzedAt: new Date().toISOString(),
    direct: [
      { name: 'Yotpo', score: 95, reason: 'Leading loyalty platform' },
      { name: 'Smile.io', score: 92, reason: 'Shopify-focused loyalty' }
    ],
    indirect: [
      { name: 'Klaviyo', score: 75, reason: 'Email marketing with loyalty features' }
    ],
    emerging: [
      { name: 'Loyaltyup', score: 45, reason: 'AI-powered loyalty' }
    ]
  };
  storage.competitors.set(competitors.id, competitors);
  return competitors;
};

const segmentBuilderAgent = async (companyId) => {
  const segments = {
    id: uuidv4(),
    companyId,
    createdAt: new Date().toISOString(),
    segments: [
      { name: 'Shopify Brands', icp: 'SMB e-commerce', count: 45, priority: 'high' },
      { name: 'D2C Brands', icp: 'Direct-to-consumer', count: 38, priority: 'high' },
      { name: 'Subscription Services', icp: 'Monthly subscriptions', count: 25, priority: 'high' },
      { name: 'Marketplace Sellers', icp: 'Amazon sellers', count: 32, priority: 'medium' }
    ]
  };

  segments.segments.forEach(seg => {
    seg.prospects = generateProspects(seg);
    seg.prospects.forEach(p => storage.prospects.set(p.id, p));
  });

  storage.segments.set(segments.id, segments);
  return segments;
};

const prospectIntelligenceAgent = async (segmentId) => {
  const segment = storage.segments.get(segmentId);
  const prospects = {
    id: uuidv4(),
    segmentId,
    createdAt: new Date().toISOString(),
    prospects: []
  };

  segment.segments.forEach(seg => {
    seg.prospects.forEach(prospect => {
      prospect.scores = {
        opportunity: Math.floor(Math.random() * 40 + 60),
        pain: Math.floor(Math.random() * 40 + 50),
        intent: Math.floor(Math.random() * 40 + 50),
        urgency: Math.floor(Math.random() * 40 + 40),
        revenue: Math.floor(Math.random() * 30 + 50),
        overall: 0
      };
      prospect.scores.overall = Object.values(prospect.scores)
        .slice(0, -1).reduce((a, b) => a + b, 0) / 5;
      prospects.prospects.push(prospect);
    });
  });

  prospects.prospects.sort((a, b) => b.scores.overall - a.scores.overall);
  return prospects;
};

const campaignGeneratorAgent = async (domain) => {
  const workspace = {
    id: uuidv4(),
    domain,
    status: 'generating',
    createdAt: new Date().toISOString(),
    steps: []
  };

  try {
    workspace.steps.push({ step: 'company_understanding', status: 'running' });
    const company = await companyUnderstandingAgent(domain);
    workspace.companyId = company.id;
    workspace.steps.push({ step: 'company_understanding', status: 'completed' });

    workspace.steps.push({ step: 'competitor_discovery', status: 'running' });
    const competitors = await competitorDiscoveryAgent(company.id);
    workspace.steps.push({ step: 'competitor_discovery', status: 'completed' });

    workspace.steps.push({ step: 'segment_building', status: 'running' });
    const segments = await segmentBuilderAgent(company.id);
    workspace.segmentId = segments.id;
    workspace.steps.push({ step: 'segment_building', status: 'completed' });

    workspace.steps.push({ step: 'prospect_intelligence', status: 'running' });
    const prospects = await prospectIntelligenceAgent(segments.id);
    workspace.prospectId = prospects.id;
    workspace.steps.push({ step: 'prospect_intelligence', status: 'completed' });

    workspace.status = 'completed';
    workspace.summary = {
      companyFound: company.company.name,
      competitorsFound: 5,
      segmentsCreated: segments.segments.length,
      prospectsFound: prospects.prospects.length
    };
  } catch (error) {
    workspace.status = 'failed';
    workspace.error = error.message;
  }

  storage.workspaces.set(workspace.id, workspace);
  return workspace;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractCompanyName(domain) {
  const name = domain.split('.')[0];
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function inferIndustry(domain) {
  const d = domain.toLowerCase();
  if (d.includes('pay') || d.includes('bank')) return 'Fintech';
  if (d.includes('shop') || d.includes('mart')) return 'E-commerce';
  return 'Technology';
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProspects(segment) {
  const prospects = [];
  const names = ['TechMart', 'Urban Style', 'FitLife', 'GlowUp', 'HomeChef', 'PetParadise'];
  const titles = ['Head of Marketing', 'Founder', 'VP Marketing', 'CRM Manager'];

  for (let i = 0; i < 5; i++) {
    prospects.push({
      id: uuidv4(),
      firstName: names[i % names.length].split(' ')[0],
      lastName: 'Last',
      company: names[i % names.length],
      domain: names[i % names.length].toLowerCase() + '.com',
      persona: titles[i % titles.length],
      seniority: titles[i].includes('Founder') ? 'C-level' : titles[i].includes('VP') ? 'VP' : 'Manager',
      painPoints: ['Low repeat purchase', 'No loyalty'],
      competitorUsing: Math.random() > 0.5 ? 'Yotpo' : null,
      budget: Math.floor(Math.random() * 5 + 1) * 1000
    });
  }
  return prospects;
}

// ============================================
// API ROUTES
// ============================================

// Health
app.get('/health', async (req, res) => {
  const cacheHealth = await redisCache.getHealth().catch(() => ({ status: 'unknown' }));
  const jobsHealth = scheduledJobs.getHealth();

  res.json({
    status: 'ok',
    service: 'atlas-gtm',
    version: '3.5.0',
    modules: [
      'ai-generator',
      'sequence-builder',
      'email-sender',
      'calendar-integration',
      'whatsapp-integration',
      'linkedin-integration',
      'data-enrichment',
      'prospect-database',
      'crm-integration',
      'sms-integration',
      'ai-scoring',
      'analytics-dashboard',
      'workflow-automation',
      'ab-testing',
      'territory-management',
      'adbazaar-integration',
      'rabtul-integration',
      'map-intelligence',
      'database',
      'api-auth',
      'scheduled-jobs',
      'redis-cache',
      'pdf-reports'
    ],
    integrations: {
      adbazaar: { status: 'connected', services: ['adsqr', 'creator-qr', 'dooh', 'retail-media'] },
      rabtul: { status: 'connected', services: ['auth', 'wallet', 'payment', 'notification', 'qr-cloud', 'karma'] },
      crm: { status: 'connected', port: 4210 },
      mongodb: { status: 'optional', uri: 'MONGODB_URI env var' },
      redis: cacheHealth,
      scheduler: jobsHealth
    }
  });
});

// GTM Campaign Routes
app.post('/api/gtm/campaign', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain required' });
    const campaign = await campaignGeneratorAgent(domain);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/campaigns', (req, res) => {
  const campaigns = Array.from(storage.workspaces.values());
  res.json({ success: true, data: campaigns });
});

app.get('/api/gtm/campaign/:id', (req, res) => {
  const campaign = storage.workspaces.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: campaign });
});

// AI Message Generation Routes
app.post('/api/gtm/messages/generate', async (req, res) => {
  try {
    const { prospectId, campaignId, channel } = req.body;
    const prospect = storage.prospects.get(prospectId);
    const campaign = storage.campaigns.get(campaignId) || { domain: 'company.com', companyInsight: {} };

    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    let messages;
    if (channel === 'email') {
      messages = await aiGenerator.generateEmail(prospect, campaign);
    } else if (channel === 'linkedin') {
      messages = await aiGenerator.generateLinkedIn(prospect, campaign);
    } else if (channel === 'whatsapp') {
      messages = await aiGenerator.generateWhatsApp(prospect, campaign);
    } else if (channel === 'call') {
      messages = await aiGenerator.generateCallScript(prospect, campaign);
    } else {
      messages = await aiGenerator.generateAllMessages(prospect, campaign);
    }

    storage.aiGeneratedMessages.set(prospectId, messages);
    res.json({ success: true, data: { prospectId, messages } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/messages/:prospectId', (req, res) => {
  const messages = storage.aiGeneratedMessages.get(req.params.prospectId);
  if (!messages) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: messages });
});

// Sequence Builder Routes
app.post('/api/gtm/sequences', (req, res) => {
  try {
    const sequence = sequenceBuilder.createSequence(req.body);
    res.json({ success: true, data: sequence });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/sequences', (req, res) => {
  const sequences = sequenceBuilder.getAllSequences();
  res.json({ success: true, data: sequences });
});

app.get('/api/gtm/sequences/:id', (req, res) => {
  const sequence = sequenceBuilder.getSequence(req.params.id);
  if (!sequence) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: sequence });
});

app.put('/api/gtm/sequences/:id', (req, res) => {
  const sequence = sequenceBuilder.updateSequence(req.params.id, req.body);
  if (!sequence) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: sequence });
});

app.delete('/api/gtm/sequences/:id', (req, res) => {
  const deleted = sequenceBuilder.deleteSequence(req.params.id);
  res.json({ success: deleted });
});

app.post('/api/gtm/sequences/:id/steps', (req, res) => {
  const step = sequenceBuilder.addStep(req.params.id, req.body);
  if (!step) return res.status(404).json({ error: 'Sequence not found' });
  res.json({ success: true, data: step });
});

app.get('/api/gtm/sequences/:id/stats', (req, res) => {
  const stats = sequenceBuilder.getSequenceStats(req.params.id);
  if (!stats) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: stats });
});

// Enrollment Routes
app.post('/api/gtm/enroll', (req, res) => {
  try {
    const { contactId, sequenceId, prospectData } = req.body;
    const enrollment = sequenceBuilder.enrollContact(contactId, sequenceId, prospectData);
    if (!enrollment) return res.status(404).json({ error: 'Sequence not found' });
    res.json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/enrollments/:id/next-step', (req, res) => {
  const nextStep = sequenceBuilder.getNextStep(req.params.id);
  if (!nextStep) return res.status(404).json({ error: 'Enrollment not found' });
  res.json({ success: true, data: nextStep });
});

app.post('/api/gtm/enrollments/:id/sent', (req, res) => {
  const { stepId } = req.body;
  const enrollment = sequenceBuilder.markStepSent(req.params.id, stepId);
  res.json({ success: true, data: enrollment });
});

app.post('/api/gtm/enrollments/:id/replied', (req, res) => {
  const { stepId, replyData } = req.body;
  const enrollment = sequenceBuilder.markStepReplied(req.params.id, stepId, replyData);
  res.json({ success: true, data: enrollment });
});

// Email Routes
app.post('/api/gtm/email/send', async (req, res) => {
  try {
    const result = await emailSender.sendEmail(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/email/bulk', async (req, res) => {
  try {
    const { campaign, prospects, templates } = req.body;
    const results = await emailSender.sendBulkEmails(campaign, prospects, templates);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/email/stats', (req, res) => {
  const stats = emailSender.getEmailStats(req.query.campaignId);
  res.json({ success: true, data: stats });
});

app.get('/api/gtm/email/log', (req, res) => {
  const log = emailSender.getEmailLog(parseInt(req.query.limit) || 100);
  res.json({ success: true, data: log });
});

app.get('/api/gtm/email/warmup', (req, res) => {
  const accounts = emailSender.getWarmupAccounts();
  res.json({ success: true, data: accounts });
});

app.get('/api/gtm/email/next-sender', (req, res) => {
  const sender = emailSender.getNextWarmupSender();
  res.json({ success: true, data: { sender } });
});

// Email Webhooks
app.post('/api/gtm/webhook/email/open', async (req, res) => {
  const { emailId, recipientIp } = req.body;
  const log = await emailSender.trackOpen(emailId, recipientIp);
  res.json({ success: true });
});

app.post('/api/gtm/webhook/email/click', async (req, res) => {
  const { emailId, url, recipientIp } = req.body;
  const log = await emailSender.trackClick(emailId, url, recipientIp);
  res.json({ success: true });
});

app.post('/api/gtm/webhook/email/bounce', async (req, res) => {
  const { emailId, bounceType, bounceReason } = req.body;
  await emailSender.trackBounce(emailId, bounceType, bounceReason);
  res.json({ success: true });
});

app.post('/api/gtm/webhook/email/delivery', async (req, res) => {
  const { emailId } = req.body;
  await emailSender.trackDelivery(emailId);
  res.json({ success: true });
});

app.post('/api/gtm/webhook/email/reply', async (req, res) => {
  const { emailId, replyText } = req.body;
  await emailSender.trackReply(emailId, replyText);
  res.json({ success: true });
});

// Prospect Routes
app.get('/api/gtm/prospects', (req, res) => {
  const prospects = Array.from(storage.prospects.values());
  res.json({ success: true, data: prospects });
});

app.get('/api/gtm/prospects/top', (req, res) => {
  const prospects = Array.from(storage.prospects.values())
    .sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0))
    .slice(0, 20);
  res.json({ success: true, data: prospects });
});

// ============================================
// CALENDAR & MEETING ROUTES
// ============================================

app.post('/api/gtm/calendar/booking-link', (req, res) => {
  try {
    const link = calendarIntegration.createBookingLink(req.body);
    res.json({ success: true, data: link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/calendar/booking-link/:linkId/slots', (req, res) => {
  const { date } = req.query;
  const slots = calendarIntegration.getAvailableSlots(req.params.linkId, date || new Date().toISOString().split('T')[0]);
  if (!slots) return res.status(404).json({ error: 'Booking link not found' });
  res.json({ success: true, data: slots });
});

app.post('/api/gtm/calendar/book', async (req, res) => {
  try {
    const meeting = await calendarIntegration.bookMeeting(req.body);
    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/calendar/meetings', (req, res) => {
  const meetings = Array.from(calendarIntegration.meetings.values());
  res.json({ success: true, data: meetings });
});

app.post('/api/gtm/calendar/meetings/:id/reschedule', async (req, res) => {
  try {
    const { newDate, newTime } = req.body;
    const meeting = await calendarIntegration.rescheduleMeeting(req.params.id, newDate, newTime);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/calendar/meetings/:id/cancel', (req, res) => {
  const { reason } = req.body;
  const meeting = calendarIntegration.cancelMeeting(req.params.id, reason);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
  res.json({ success: true, data: meeting });
});

app.post('/api/gtm/calendar/meetings/:id/reminder', async (req, res) => {
  try {
    const { type } = req.body;
    const reminder = await calendarIntegration.sendReminder(req.params.id, type || '24h');
    if (!reminder) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/calendar/analytics', (req, res) => {
  const { range } = req.query;
  const analytics = calendarIntegration.getMeetingAnalytics(range || '30d');
  res.json({ success: true, data: analytics });
});

// ============================================
// WHATSAPP ROUTES
// ============================================

app.post('/api/gtm/whatsapp/send', async (req, res) => {
  try {
    const result = await whatsappIntegration.sendMessage(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/whatsapp/send-template', async (req, res) => {
  try {
    const { to, templateId, templateData } = req.body;
    const result = await whatsappIntegration.sendTemplate(to, templateId, templateData);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/whatsapp/bulk', async (req, res) => {
  try {
    const { recipients, templateId, templateDataFn } = req.body;
    const result = await whatsappIntegration.sendBulkMessages(recipients, templateId, templateDataFn);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/whatsapp/opt-in', (req, res) => {
  const { phone } = req.body;
  whatsappIntegration.addOptIn(phone);
  res.json({ success: true });
});

app.post('/api/gtm/whatsapp/opt-out', (req, res) => {
  const { phone } = req.body;
  whatsappIntegration.removeOptIn(phone);
  res.json({ success: true });
});

app.get('/api/gtm/whatsapp/templates', (req, res) => {
  const templates = whatsappIntegration.getTemplates();
  res.json({ success: true, data: templates });
});

app.get('/api/gtm/whatsapp/analytics', (req, res) => {
  const { range } = req.query;
  const analytics = whatsappIntegration.getAnalytics(range || '30d');
  res.json({ success: true, data: analytics });
});

app.get('/api/gtm/whatsapp/messages/:phone', (req, res) => {
  const messages = whatsappIntegration.getContactMessages(req.params.phone);
  res.json({ success: true, data: messages });
});

app.post('/api/gtm/whatsapp/webhook', async (req, res) => {
  try {
    const events = await whatsappIntegration.handleWebhook(req.body);
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp Campaigns
app.post('/api/gtm/whatsapp/campaigns', (req, res) => {
  try {
    const campaign = whatsappIntegration.createCampaign(req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/whatsapp/campaigns/:id/execute', async (req, res) => {
  try {
    const { recipients } = req.body;
    const result = await whatsappIntegration.executeCampaign(req.params.id, recipients);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// LINKEDIN ROUTES
// ============================================

app.get('/api/gtm/linkedin/search', async (req, res) => {
  try {
    const prospects = await linkedinIntegration.searchProspects(req.query);
    res.json({ success: true, data: prospects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/linkedin/profile/:id', async (req, res) => {
  try {
    const profile = await linkedinIntegration.getProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/linkedin/profile/:id/engagement', async (req, res) => {
  try {
    const insights = await linkedinIntegration.getEngagementInsights(req.params.id);
    if (!insights) return res.status(404).json({ error: 'Profile not found' });
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/linkedin/connect', async (req, res) => {
  try {
    const result = await linkedinIntegration.sendConnectionRequest(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/linkedin/inmail', async (req, res) => {
  try {
    const result = await linkedinIntegration.sendInMail(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/linkedin/post', async (req, res) => {
  try {
    const result = await linkedinIntegration.postUpdate(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LinkedIn Campaigns
app.post('/api/gtm/linkedin/campaigns', (req, res) => {
  try {
    const campaign = linkedinIntegration.createCampaign(req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/linkedin/campaigns/:id/execute', async (req, res) => {
  try {
    const { prospects } = req.body;
    const result = await linkedinIntegration.executeCampaign(req.params.id, prospects);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/linkedin/campaigns/:id/analytics', (req, res) => {
  const analytics = linkedinIntegration.getCampaignAnalytics(req.params.id);
  res.json({ success: true, data: analytics });
});

app.get('/api/gtm/linkedin/analytics', (req, res) => {
  const analytics = linkedinIntegration.getCampaignAnalytics();
  res.json({ success: true, data: analytics });
});

// ============================================
// DATA ENRICHMENT ROUTES
// ============================================

app.post('/api/gtm/enrich/company', async (req, res) => {
  try {
    const { domain, sources } = req.body;
    const enriched = await dataEnrichment.enrichCompany(domain, { sources });
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/enrich/person', async (req, res) => {
  try {
    const enriched = await dataEnrichment.enrichPerson(req.body);
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/enrich/find-email', async (req, res) => {
  try {
    const result = await dataEnrichment.findEmail(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/enrich/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await dataEnrichment.verifyEmail(email);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk Enrichment
app.post('/api/gtm/enrich/bulk', (req, res) => {
  try {
    const job = dataEnrichment.createBulkJob(req.body);
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/enrich/bulk/:jobId/execute', async (req, res) => {
  try {
    const job = await dataEnrichment.executeBulkJob(req.params.jobId, req.body);
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/enrich/bulk/:jobId', (req, res) => {
  const job = dataEnrichment.getJobStatus(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ success: true, data: job });
});

app.get('/api/gtm/enrich/cache-stats', (req, res) => {
  const stats = dataEnrichment.getCacheStats();
  res.json({ success: true, data: stats });
});

app.delete('/api/gtm/enrich/cache', (req, res) => {
  const { pattern } = req.query;
  const result = dataEnrichment.clearCache(pattern);
  res.json({ success: true, data: result });
});

// ============================================
// PROSPECT DATABASE ROUTES
// ============================================

// CRUD
app.post('/api/gtm/prospects', (req, res) => {
  try {
    const prospect = prospectDatabase.create(req.body);
    res.json({ success: true, data: prospect });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/prospects', (req, res) => {
  const { query, status, stage, seniority, tags, minScore, maxScore, page, limit } = req.query;

  const filters = {};
  if (status) filters.status = status.split(',');
  if (stage) filters.stage = stage.split(',');
  if (seniority) filters.seniority = seniority.split(',');
  if (tags) filters.tags = tags.split(',');
  if (minScore) filters.minScore = parseInt(minScore);
  if (maxScore) filters.maxScore = parseInt(maxScore);

  const result = prospectDatabase.search({
    query: query || '',
    filters,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50
  });

  res.json({ success: true, ...result });
});

app.get('/api/gtm/prospects/:id', (req, res) => {
  const prospect = prospectDatabase.get(req.params.id);
  if (!prospect) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: prospect });
});

app.put('/api/gtm/prospects/:id', (req, res) => {
  try {
    const prospect = prospectDatabase.update(req.params.id, req.body);
    if (!prospect) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: prospect });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/gtm/prospects/:id', (req, res) => {
  const deleted = prospectDatabase.delete(req.params.id);
  res.json({ success: deleted });
});

// Bulk operations
app.post('/api/gtm/prospects/bulk', (req, res) => {
  try {
    const { prospects } = req.body;
    const result = prospectDatabase.createBulk(prospects);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/gtm/prospects/bulk', (req, res) => {
  try {
    const { ids, updates } = req.body;
    const result = prospectDatabase.updateBulk(ids, updates);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/gtm/prospects/bulk', (req, res) => {
  try {
    const { ids } = req.body;
    const result = prospectDatabase.deleteBulk(ids);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tags
app.post('/api/gtm/prospects/:id/tags', (req, res) => {
  const { tag } = req.body;
  const prospect = prospectDatabase.addTag(req.params.id, tag);
  if (!prospect) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: prospect });
});

app.delete('/api/gtm/prospects/:id/tags/:tag', (req, res) => {
  const prospect = prospectDatabase.removeTag(req.params.id, req.params.tag);
  if (!prospect) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, data: prospect });
});

app.get('/api/gtm/tags', (req, res) => {
  const tags = prospectDatabase.getAllTags();
  res.json({ success: true, data: tags });
});

// Engagement
app.post('/api/gtm/prospects/:id/engagement', (req, res) => {
  try {
    const { type, data } = req.body;
    const prospect = prospectDatabase.recordEngagement(req.params.id, type, data);
    if (!prospect) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: prospect });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activities
app.get('/api/gtm/prospects/:id/activities', (req, res) => {
  const { type, limit } = req.query;
  const activities = prospectDatabase.getActivities(req.params.id, {
    type,
    limit: parseInt(limit) || 50
  });
  res.json({ success: true, data: activities });
});

// Import/Export
app.get('/api/gtm/prospects/export/csv', (req, res) => {
  try {
    const { fields } = req.query;
    const csv = prospectDatabase.exportCSV({
      fields: fields ? fields.split(',') : []
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=prospects.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/prospects/export/json', (req, res) => {
  try {
    const { fields } = req.query;
    const json = prospectDatabase.exportJSON({
      fields: fields ? fields.split(',') : []
    });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=prospects.json');
    res.send(json);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/prospects/import/csv', (req, res) => {
  try {
    const { csv } = req.body;
    const result = prospectDatabase.importCSV(csv);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats
app.get('/api/gtm/prospects/stats', (req, res) => {
  const stats = prospectDatabase.getStats();
  res.json({ success: true, data: stats });
});

// Segments
app.post('/api/gtm/segments', (req, res) => {
  try {
    const { name, query } = req.body;
    const segment = prospectDatabase.createSegment(name, query);
    res.json({ success: true, data: segment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/segments/:id/prospects', (req, res) => {
  const prospects = prospectDatabase.getSegmentProspects(req.params.id);
  res.json({ success: true, data: prospects });
});

// Views
app.post('/api/gtm/views', (req, res) => {
  try {
    const { name, query, filters } = req.body;
    const view = prospectDatabase.createView(name, query, filters);
    res.json({ success: true, data: view });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/views', (req, res) => {
  const views = prospectDatabase.getViews();
  res.json({ success: true, data: views });
});

// ============================================
// REZ CRM INTEGRATION ROUTES
// ============================================

// Sync prospect to CRM
app.post('/api/gtm/crm/sync/prospect/:id', async (req, res) => {
  try {
    const prospect = prospectDatabase.get(req.params.id);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    const crmContact = await crmIntegration.syncProspectToCRM(prospect);
    res.json({ success: true, data: crmContact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync all prospects to CRM
app.post('/api/gtm/crm/sync/all', async (req, res) => {
  try {
    const { batchSize } = req.body;
    const result = await crmIntegration.fullSync({ direction: 'gtm_to_crm', batchSize });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Full bidirectional sync
app.post('/api/gtm/crm/sync/full', async (req, res) => {
  try {
    const result = await crmIntegration.fullSync({ direction: 'both' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create deal in CRM from prospect
app.post('/api/gtm/crm/deal/prospect/:id', async (req, res) => {
  try {
    const prospect = prospectDatabase.get(req.params.id);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    const deal = await crmIntegration.createCRMDeal(prospect, req.body);
    res.json({ success: true, data: deal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log engagement to CRM
app.post('/api/gtm/crm/engagement/:prospectId', async (req, res) => {
  try {
    const { type, data } = req.body;
    const result = await crmIntegration.logEngagementToCRM(req.params.prospectId, type, data);
    res.json({ success: !!result, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sync status
app.get('/api/gtm/crm/sync/status', (req, res) => {
  const status = crmIntegration.getSyncState();
  res.json({ success: true, data: status });
});

// CRM Webhook (from REZ CRM)
app.post('/api/gtm/crm/webhook', async (req, res) => {
  try {
    const result = await crmIntegration.handleCRMWebhook(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CRM Contacts (proxy to CRM)
app.get('/api/gtm/crm/contacts', async (req, res) => {
  try {
    const contacts = await crmIntegration.client.getContacts(req.query);
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CRM Deals (proxy to CRM)
app.get('/api/gtm/crm/deals', async (req, res) => {
  try {
    const deals = await crmIntegration.client.getDeals(req.query);
    res.json({ success: true, data: deals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task in CRM
app.post('/api/gtm/crm/tasks', async (req, res) => {
  try {
    const task = await crmIntegration.client.createTask(req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset sync state
app.post('/api/gtm/crm/sync/reset', (req, res) => {
  const state = crmIntegration.resetSyncState();
  res.json({ success: true, data: state });
});

// ============================================
// SMS INTEGRATION ROUTES
// ============================================

app.post('/api/gtm/sms/send', async (req, res) => {
  try {
    const result = await smsIntegration.sendSMS(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/sms/bulk', async (req, res) => {
  try {
    const { recipients, message, campaignId } = req.body;
    const results = await smsIntegration.sendBulkSMS({ recipients, message, campaignId });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/sms/templates', (req, res) => {
  const templates = smsIntegration.getTemplates();
  res.json({ success: true, data: templates });
});

app.post('/api/gtm/sms/templates', (req, res) => {
  const template = smsIntegration.createTemplate(req.body);
  res.json({ success: true, data: template });
});

app.get('/api/gtm/sms/campaigns', (req, res) => {
  const campaigns = smsIntegration.getCampaigns();
  res.json({ success: true, data: campaigns });
});

app.post('/api/gtm/sms/campaigns', (req, res) => {
  const campaign = smsIntegration.createCampaign(req.body);
  res.json({ success: true, data: campaign });
});

app.post('/api/gtm/sms/campaigns/:id/execute', async (req, res) => {
  try {
    const result = await smsIntegration.executeCampaign(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/sms/analytics', (req, res) => {
  const { range } = req.query;
  const analytics = smsIntegration.getAnalytics(range || '30d');
  res.json({ success: true, data: analytics });
});

app.get('/api/gtm/sms/log', (req, res) => {
  const { limit } = req.query;
  const log = smsIntegration.getLog(parseInt(limit) || 100);
  res.json({ success: true, data: log });
});

// ============================================
// AI SCORING ROUTES
// ============================================

app.post('/api/gtm/scoring/prospect/:id', async (req, res) => {
  try {
    const prospect = prospectDatabase.get(req.params.id);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    const score = await aiScoring.scoreProspect(prospect);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/scoring/batch', async (req, res) => {
  try {
    const { prospectIds } = req.body;
    const scores = await aiScoring.batchScoreProspects(prospectIds);
    res.json({ success: true, data: scores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/scoring/segments', (req, res) => {
  const segments = aiScoring.getScoredSegments();
  res.json({ success: true, data: segments });
});

app.get('/api/gtm/scoring/segments/:segment/priorities', (req, res) => {
  const priorities = aiScoring.getPriorityList(req.params.segment);
  res.json({ success: true, data: priorities });
});

app.post('/api/gtm/scoring/features', (req, res) => {
  const feature = aiScoring.addFeature(req.body);
  res.json({ success: true, data: feature });
});

app.get('/api/gtm/scoring/features', (req, res) => {
  const features = aiScoring.getFeatures();
  res.json({ success: true, data: features });
});

app.post('/api/gtm/scoring/retrain', async (req, res) => {
  try {
    const result = await aiScoring.retrainModel(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/scoring/weights', (req, res) => {
  const weights = aiScoring.getWeights();
  res.json({ success: true, data: weights });
});

app.post('/api/gtm/scoring/weights', (req, res) => {
  const weights = aiScoring.updateWeights(req.body);
  res.json({ success: true, data: weights });
});

// ============================================
// ANALYTICS DASHBOARD ROUTES
// ============================================

app.get('/api/gtm/analytics/dashboard', (req, res) => {
  const { range, campaignId } = req.query;
  const dashboard = analyticsDashboard.getDashboard({
    range: range || '30d',
    campaignId
  });
  res.json({ success: true, data: dashboard });
});

app.get('/api/gtm/analytics/funnel', (req, res) => {
  const { range, campaignId } = req.query;
  const funnel = analyticsDashboard.getFunnelAnalysis({
    range: range || '30d',
    campaignId
  });
  res.json({ success: true, data: funnel });
});

app.get('/api/gtm/analytics/attribution', (req, res) => {
  const { range, model } = req.query;
  const attribution = analyticsDashboard.getMultiTouchAttribution({
    range: range || '30d',
    model: model || 'linear'
  });
  res.json({ success: true, data: attribution });
});

app.get('/api/gtm/analytics/cohort', (req, res) => {
  const { cohortType, metric } = req.query;
  const cohort = analyticsDashboard.getCohortAnalysis({
    cohortType: cohortType || 'weekly',
    metric: metric || 'conversion'
  });
  res.json({ success: true, data: cohort });
});

app.get('/api/gtm/analytics/engagement', (req, res) => {
  const { range, segment } = req.query;
  const engagement = analyticsDashboard.getEngagementMetrics({
    range: range || '30d',
    segment
  });
  res.json({ success: true, data: engagement });
});

app.get('/api/gtm/analytics/channel', (req, res) => {
  const { range } = req.query;
  const channel = analyticsDashboard.getChannelPerformance({
    range: range || '30d'
  });
  res.json({ success: true, data: channel });
});

app.get('/api/gtm/analytics/comparison', (req, res) => {
  const { period1, period2 } = req.query;
  const comparison = analyticsDashboard.comparePeriods(period1, period2);
  res.json({ success: true, data: comparison });
});

app.get('/api/gtm/analytics/forecasting', (req, res) => {
  const { metric, horizon } = req.query;
  const forecast = analyticsDashboard.getForecast(metric || 'revenue', parseInt(horizon) || 30);
  res.json({ success: true, data: forecast });
});

app.get('/api/gtm/analytics/custom/:reportId', (req, res) => {
  const report = analyticsDashboard.getCustomReport(req.params.reportId);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json({ success: true, data: report });
});

app.post('/api/gtm/analytics/custom', (req, res) => {
  const report = analyticsDashboard.createCustomReport(req.body);
  res.json({ success: true, data: report });
});

app.get('/api/gtm/analytics/trends', (req, res) => {
  const { range, metric } = req.query;
  const trends = analyticsDashboard.getTrends(range || '30d', metric || 'revenue');
  res.json({ success: true, data: trends });
});

// ============================================
// WORKFLOW AUTOMATION ROUTES
// ============================================

app.get('/api/gtm/workflows', (req, res) => {
  const { status, trigger } = req.query;
  const workflows = workflowAutomation.getWorkflows({ status, trigger });
  res.json({ success: true, data: workflows });
});

app.post('/api/gtm/workflows', (req, res) => {
  try {
    const workflow = workflowAutomation.createWorkflow(req.body);
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/workflows/:id', (req, res) => {
  const workflow = workflowAutomation.getWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  res.json({ success: true, data: workflow });
});

app.put('/api/gtm/workflows/:id', (req, res) => {
  const workflow = workflowAutomation.updateWorkflow(req.params.id, req.body);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  res.json({ success: true, data: workflow });
});

app.delete('/api/gtm/workflows/:id', (req, res) => {
  const deleted = workflowAutomation.deleteWorkflow(req.params.id);
  res.json({ success: deleted });
});

app.post('/api/gtm/workflows/:id/steps', (req, res) => {
  const step = workflowAutomation.addStep(req.params.id, req.body);
  if (!step) return res.status(404).json({ error: 'Workflow not found' });
  res.json({ success: true, data: step });
});

app.put('/api/gtm/workflows/:id/steps/:stepId', (req, res) => {
  const step = workflowAutomation.updateStep(req.params.id, req.params.stepId, req.body);
  if (!step) return res.status(404).json({ error: 'Step not found' });
  res.json({ success: true, data: step });
});

app.delete('/api/gtm/workflows/:id/steps/:stepId', (req, res) => {
  const deleted = workflowAutomation.deleteStep(req.params.id, req.params.stepId);
  res.json({ success: deleted });
});

app.post('/api/gtm/workflows/:id/execute', async (req, res) => {
  try {
    const { prospectId, context } = req.body;
    const result = await workflowAutomation.executeWorkflow(req.params.id, prospectId, context);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/workflows/:id/activate', (req, res) => {
  const workflow = workflowAutomation.activateWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  res.json({ success: true, data: workflow });
});

app.post('/api/gtm/workflows/:id/deactivate', (req, res) => {
  const workflow = workflowAutomation.deactivateWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  res.json({ success: true, data: workflow });
});

app.get('/api/gtm/workflows/:id/executions', (req, res) => {
  const { status, limit } = req.query;
  const executions = workflowAutomation.getExecutions(req.params.id, {
    status,
    limit: parseInt(limit) || 50
  });
  res.json({ success: true, data: executions });
});

app.get('/api/gtm/workflows/:id/analytics', (req, res) => {
  const analytics = workflowAutomation.getWorkflowAnalytics(req.params.id);
  if (!analytics) return res.status(404).json({ error: 'Workflow not found' });
  res.json({ success: true, data: analytics });
});

app.get('/api/gtm/workflows/templates', (req, res) => {
  const templates = workflowAutomation.getTemplates();
  res.json({ success: true, data: templates });
});

app.post('/api/gtm/workflows/templates', (req, res) => {
  const template = workflowAutomation.createFromTemplate(req.body);
  res.json({ success: true, data: template });
});

// ============================================
// A/B TESTING ROUTES
// ============================================

app.get('/api/gtm/experiments', (req, res) => {
  const { status, type } = req.query;
  const experiments = abTesting.getExperiments({ status, type });
  res.json({ success: true, data: experiments });
});

app.post('/api/gtm/experiments', (req, res) => {
  try {
    const experiment = abTesting.createExperiment(req.body);
    res.json({ success: true, data: experiment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/experiments/:id', (req, res) => {
  const experiment = abTesting.getExperiment(req.params.id);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  res.json({ success: true, data: experiment });
});

app.put('/api/gtm/experiments/:id', (req, res) => {
  const experiment = abTesting.updateExperiment(req.params.id, req.body);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  res.json({ success: true, data: experiment });
});

app.delete('/api/gtm/experiments/:id', (req, res) => {
  const deleted = abTesting.deleteExperiment(req.params.id);
  res.json({ success: deleted });
});

app.post('/api/gtm/experiments/:id/start', (req, res) => {
  const experiment = abTesting.startExperiment(req.params.id);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  res.json({ success: true, data: experiment });
});

app.post('/api/gtm/experiments/:id/pause', (req, res) => {
  const experiment = abTesting.pauseExperiment(req.params.id);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  res.json({ success: true, data: experiment });
});

app.post('/api/gtm/experiments/:id/stop', (req, res) => {
  const experiment = abTesting.stopExperiment(req.params.id);
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  res.json({ success: true, data: experiment });
});

app.post('/api/gtm/experiments/:id/winner', (req, res) => {
  const result = abTesting.selectWinner(req.params.id);
  if (!result) return res.status(404).json({ error: 'Experiment not found' });
  res.json({ success: true, data: result });
});

app.get('/api/gtm/experiments/:id/variants', (req, res) => {
  const variants = abTesting.getVariants(req.params.id);
  if (!variants) return res.status(404).json({ error: 'Experiment not found' });
  res.json({ success: true, data: variants });
});

app.post('/api/gtm/experiments/:id/variants', (req, res) => {
  const variant = abTesting.addVariant(req.params.id, req.body);
  if (!variant) return res.status(404).json({ error: 'Experiment not found' });
  res.json({ success: true, data: variant });
});

app.get('/api/gtm/experiments/:id/analyze', (req, res) => {
  try {
    const analysis = abTesting.analyzeExperiment(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Experiment not found' });
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/experiments/:id/stats', (req, res) => {
  const stats = abTesting.getExperimentStats(req.params.id);
  if (!stats) return res.status(404).json({ error: 'Experiment not found' });
  res.json({ success: true, data: stats });
});

app.get('/api/gtm/experiments/templates', (req, res) => {
  const templates = abTesting.getTemplates();
  res.json({ success: true, data: templates });
});

app.post('/api/gtm/experiments/:id/clone', (req, res) => {
  const clone = abTesting.cloneExperiment(req.params.id);
  if (!clone) return res.status(404).json({ error: 'Experiment not found' });
  res.json({ success: true, data: clone });
});

// ============================================
// TERRITORY MANAGEMENT ROUTES
// ============================================

app.get('/api/gtm/territories', (req, res) => {
  const territories = territoryManagement.getTerritories();
  res.json({ success: true, data: territories });
});

app.post('/api/gtm/territories', (req, res) => {
  const territory = territoryManagement.createTerritory(req.body);
  res.json({ success: true, data: territory });
});

app.get('/api/gtm/territories/:id', (req, res) => {
  const territory = territoryManagement.getTerritory(req.params.id);
  if (!territory) return res.status(404).json({ error: 'Territory not found' });
  res.json({ success: true, data: territory });
});

app.put('/api/gtm/territories/:id', (req, res) => {
  const territory = territoryManagement.updateTerritory(req.params.id, req.body);
  if (!territory) return res.status(404).json({ error: 'Territory not found' });
  res.json({ success: true, data: territory });
});

app.delete('/api/gtm/territories/:id', (req, res) => {
  const deleted = territoryManagement.deleteTerritory(req.params.id);
  res.json({ success: deleted });
});

app.get('/api/gtm/territories/:id/prospects', (req, res) => {
  const prospects = territoryManagement.getTerritoryProspects(req.params.id);
  res.json({ success: true, data: prospects });
});

app.post('/api/gtm/territories/:id/assign', (req, res) => {
  const { prospectIds, repId } = req.body;
  const result = territoryManagement.assignProspects(req.params.id, prospectIds, repId);
  res.json({ success: true, data: result });
});

app.get('/api/gtm/territories/:id/performance', (req, res) => {
  const performance = territoryManagement.getTerritoryPerformance(req.params.id);
  res.json({ success: true, data: performance });
});

app.post('/api/gtm/territories/:id/boundary', (req, res) => {
  const boundary = territoryManagement.updateBoundary(req.params.id, req.body);
  res.json({ success: true, data: boundary });
});

app.get('/api/gtm/territories/:id/balance', (req, res) => {
  const balance = territoryManagement.getTerritoryBalance(req.params.id);
  res.json({ success: true, data: balance });
});

app.post('/api/gtm/territories/balance', (req, res) => {
  const { method } = req.body;
  const balance = territoryManagement.balanceAllTerritories(method || 'even');
  res.json({ success: true, data: balance });
});

// Rep Routes
app.get('/api/gtm/reps', (req, res) => {
  const reps = territoryManagement.getReps();
  res.json({ success: true, data: reps });
});

app.post('/api/gtm/reps', (req, res) => {
  const rep = territoryManagement.createRep(req.body);
  res.json({ success: true, data: rep });
});

app.get('/api/gtm/reps/:id', (req, res) => {
  const rep = territoryManagement.getRep(req.params.id);
  if (!rep) return res.status(404).json({ error: 'Rep not found' });
  res.json({ success: true, data: rep });
});

app.put('/api/gtm/reps/:id', (req, res) => {
  const rep = territoryManagement.updateRep(req.params.id, req.body);
  if (!rep) return res.status(404).json({ error: 'Rep not found' });
  res.json({ success: true, data: rep });
});

app.get('/api/gtm/reps/:id/territories', (req, res) => {
  const territories = territoryManagement.getRepTerritories(req.params.id);
  res.json({ success: true, data: territories });
});

app.get('/api/gtm/reps/:id/performance', (req, res) => {
  const performance = territoryManagement.getRepPerformance(req.params.id);
  res.json({ success: true, data: performance });
});

app.post('/api/gtm/reps/:id/territories', (req, res) => {
  const { territoryId } = req.body;
  const result = territoryManagement.assignTerritory(req.params.id, territoryId);
  res.json({ success: true, data: result });
});

app.delete('/api/gtm/reps/:id/territories/:territoryId', (req, res) => {
  const result = territoryManagement.removeTerritory(req.params.id, req.params.territoryId);
  res.json({ success: true, data: result });
});

// Rule-based Assignment
app.get('/api/gtm/assignment/rules', (req, res) => {
  const rules = territoryManagement.getAssignmentRules();
  res.json({ success: true, data: rules });
});

app.post('/api/gtm/assignment/rules', (req, res) => {
  const rule = territoryManagement.createAssignmentRule(req.body);
  res.json({ success: true, data: rule });
});

app.put('/api/gtm/assignment/rules/:id', (req, res) => {
  const rule = territoryManagement.updateAssignmentRule(req.params.id, req.body);
  res.json({ success: true, data: rule });
});

app.delete('/api/gtm/assignment/rules/:id', (req, res) => {
  const deleted = territoryManagement.deleteAssignmentRule(req.params.id);
  res.json({ success: deleted });
});

app.post('/api/gtm/assignment/evaluate', (req, res) => {
  const { prospectId } = req.body;
  const result = territoryManagement.evaluateAssignment(prospectId);
  res.json({ success: true, data: result });
});

app.post('/api/gtm/assignment/auto', (req, res) => {
  const { territoryId } = req.body;
  const result = territoryManagement.autoAssignProspects(territoryId);
  res.json({ success: true, data: result });
});

// ============================================
// ADBAZAAR INTEGRATION ROUTES
// ============================================

// Ad Campaigns
app.post('/api/gtm/adbazaar/campaigns', async (req, res) => {
  try {
    const campaign = await adbazaarIntegration.createCampaign(req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/adbazaar/campaigns', (req, res) => {
  const { type, status } = req.query;
  const campaigns = adbazaarIntegration.getCampaigns({ type, status });
  res.json({ success: true, data: campaigns });
});

app.get('/api/gtm/adbazaar/campaigns/:id', (req, res) => {
  const campaign = adbazaarIntegration.getCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json({ success: true, data: campaign });
});

app.put('/api/gtm/adbazaar/campaigns/:id', (req, res) => {
  const campaign = adbazaarIntegration.updateCampaign(req.params.id, req.body);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json({ success: true, data: campaign });
});

app.delete('/api/gtm/adbazaar/campaigns/:id', (req, res) => {
  const deleted = adbazaarIntegration.deleteCampaign(req.params.id);
  res.json({ success: deleted });
});

app.get('/api/gtm/adbazaar/campaigns/:id/analytics', async (req, res) => {
  try {
    const analytics = await adbazaarIntegration.getCampaignAnalytics(req.params.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// QR Code Campaigns
app.post('/api/gtm/adbazaar/qr-campaigns', async (req, res) => {
  try {
    const campaign = await adbazaarIntegration.createQRCampaign(req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/adbazaar/qr-campaigns/:id/analytics', async (req, res) => {
  try {
    const analytics = await adbazaarIntegration.getQRScanAnalytics(req.params.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DOOH Campaigns
app.post('/api/gtm/adbazaar/dooh-campaigns', async (req, res) => {
  try {
    const campaign = await adbazaarIntegration.createDOOHCampaign(req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/adbazaar/dooh-campaigns/:id/analytics', async (req, res) => {
  try {
    const analytics = await adbazaarIntegration.getDOOHAnalytics(req.params.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retail Media
app.post('/api/gtm/adbazaar/retail-media', async (req, res) => {
  try {
    const campaign = await adbazaarIntegration.createRetailMediaCampaign(req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audience Segments
app.post('/api/gtm/adbazaar/audiences', (req, res) => {
  const segment = adbazaarIntegration.createAudienceSegment(req.body);
  res.json({ success: true, data: segment });
});

app.get('/api/gtm/adbazaar/audiences', (req, res) => {
  const segments = adbazaarIntegration.getAudienceSegments();
  res.json({ success: true, data: segments });
});

app.post('/api/gtm/adbazaar/audiences/:id/sync', async (req, res) => {
  try {
    const { prospectIds } = req.body;
    const result = await adbazaarIntegration.syncProspectsToAudience(prospectIds, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Conversion Tracking
app.post('/api/gtm/adbazaar/track', async (req, res) => {
  try {
    const event = await adbazaarIntegration.trackConversion(req.body);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/adbazaar/conversions', (req, res) => {
  const { campaignId, prospectId, type } = req.query;
  const events = adbazaarIntegration.getConversionEvents({ campaignId, prospectId, type });
  res.json({ success: true, data: events });
});

// Creator Rewards
app.post('/api/gtm/adbazaar/creator-rewards', async (req, res) => {
  try {
    const { prospectId, campaignId, rewards } = req.body;
    const result = await adbazaarIntegration.syncCreatorRewards(prospectId, campaignId, rewards);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RABTUL INTEGRATION ROUTES
// ============================================

// Auth
app.post('/api/gtm/rabtul/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const result = await rabtulIntegration.verifyToken(token);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/rabtul/auth/token', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await rabtulIntegration.createServiceToken(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Wallet
app.get('/api/gtm/rabtul/wallet/:userId/balance', async (req, res) => {
  try {
    const balance = await rabtulIntegration.getWalletBalance(req.params.userId);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/rabtul/wallet/coins/add', async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const transaction = await rabtulIntegration.addCoins(userId, amount, reason);
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/rabtul/wallet/coins/deduct', async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const transaction = await rabtulIntegration.deductCoins(userId, amount, reason);
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/rabtul/wallet/:userId/transactions', (req, res) => {
  const { type, from, to } = req.query;
  const transactions = rabtulIntegration.getTransactions(req.params.userId, { type, from, to });
  res.json({ success: true, data: transactions });
});

// Payment Links
app.post('/api/gtm/rabtul/payments/link', async (req, res) => {
  try {
    const link = await rabtulIntegration.createPaymentLink(req.body);
    res.json({ success: true, data: link });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/rabtul/payments/:paymentId/status', async (req, res) => {
  try {
    const status = await rabtulIntegration.getPaymentStatus(req.params.paymentId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/rabtul/payments/intent', async (req, res) => {
  try {
    const intent = await rabtulIntegration.createPaymentIntent(req.body);
    res.json({ success: true, data: intent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications
app.post('/api/gtm/rabtul/notifications/send', async (req, res) => {
  try {
    const notification = await rabtulIntegration.sendNotification(req.body);
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/rabtul/notifications/bulk', async (req, res) => {
  try {
    const { recipients, notification } = req.body;
    const result = await rabtulIntegration.sendBulkNotifications(recipients, notification);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/rabtul/notifications/campaign', async (req, res) => {
  try {
    const { campaignId, message } = req.body;
    const result = await rabtulIntegration.sendCampaignNotification(campaignId, message);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/rabtul/notifications/templates', async (req, res) => {
  try {
    const templates = await rabtulIntegration.getNotificationTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/rabtul/notifications/:userId/history', (req, res) => {
  const { channel, status } = req.query;
  const history = rabtulIntegration.getNotificationHistory(req.params.userId, { channel, status });
  res.json({ success: true, data: history });
});

// QR Cloud
app.post('/api/gtm/rabtul/qr/generate', async (req, res) => {
  try {
    const qrCodes = await rabtulIntegration.generateQRCodes(req.body);
    res.json({ success: true, data: qrCodes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gtm/rabtul/qr/track', async (req, res) => {
  try {
    const { qrId, scanData } = req.body;
    const scan = await rabtulIntegration.trackQRScan(qrId, scanData);
    res.json({ success: true, data: scan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/rabtul/qr/:qrId/analytics', async (req, res) => {
  try {
    const analytics = await rabtulIntegration.getQRAnalytics(req.params.qrId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Karma & Loyalty
app.post('/api/gtm/rabtul/karma/award', async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const karma = await rabtulIntegration.awardKarma(userId, amount, reason);
    res.json({ success: true, data: karma });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/rabtul/karma/:userId/balance', async (req, res) => {
  try {
    const balance = await rabtulIntegration.getKarmaBalance(req.params.userId);
    res.json({ success: true, data: balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BNPL & Capital
app.post('/api/gtm/rabtul/bnpl/apply', async (req, res) => {
  try {
    const application = await rabtulIntegration.createBNPLApplication(req.body);
    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gtm/rabtul/bnpl/:applicationId/status', async (req, res) => {
  try {
    const status = await rabtulIntegration.getBNPLStatus(req.params.applicationId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MAP INTELLIGENCE ROUTES
// ============================================

// Geocoding
app.post('/api/gtm/geo/geocode', async (req, res) => {
  try {
    const { address, domain } = req.body;
    let result;
    if (domain) {
      result = await mapIntelligence.geocodeDomain(domain);
    } else if (address) {
      result = await mapIntelligence.geocodeAddress(address);
    } else {
      return res.status(400).json({ error: 'Address or domain required' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enrich prospects with geo data
app.post('/api/gtm/geo/enrich', async (req, res) => {
  try {
    const { prospects } = req.body;
    const enriched = await mapIntelligence.enrichWithGeo(prospects);
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find nearby prospects
app.post('/api/gtm/geo/nearby', (req, res) => {
  try {
    const { center, prospects, radius } = req.body;
    const nearby = mapIntelligence.findNearbyProspects(center, prospects, radius);
    res.json({ success: true, data: nearby });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create territory polygon
app.post('/api/gtm/geo/territory-polygon', (req, res) => {
  try {
    const { territoryId, points } = req.body;
    const polygon = mapIntelligence.createTerritoryPolygon(territoryId, points);
    res.json({ success: true, data: polygon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate heatmap
app.post('/api/gtm/geo/heatmap', (req, res) => {
  try {
    const { prospects, options } = req.body;
    const heatmap = mapIntelligence.generateHeatmap(prospects, options);
    res.json({ success: true, data: heatmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Optimize route
app.post('/api/gtm/geo/route/optimize', (req, res) => {
  try {
    const { stops, options } = req.body;
    const route = mapIntelligence.optimizeRoute(stops, options);
    res.json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate optimal territories
app.post('/api/gtm/geo/territories/calculate', (req, res) => {
  try {
    const { prospects, numTerritories } = req.body;
    const territories = mapIntelligence.calculateOptimalBoundaries(prospects, numTerritories);
    res.json({ success: true, data: territories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate GeoJSON
app.post('/api/gtm/geo/geojson', (req, res) => {
  try {
    const { data, type } = req.body;
    const geojson = mapIntelligence.toGeoJSON(data, type);
    res.json({ success: true, data: geojson });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Distance calculation
app.get('/api/gtm/geo/distance', (req, res) => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.query;
    const distance = mapIntelligence.calculateDistance(
      { lat: parseFloat(lat1), lng: parseFloat(lng1) },
      { lat: parseFloat(lat2), lng: parseFloat(lng2) }
    );
    res.json({ success: true, data: { distance: distance.toFixed(2) + ' km' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DATABASE ROUTES
// ============================================

// Connect to MongoDB
app.post('/api/gtm/db/connect', async (req, res) => {
  try {
    await database.connect();
    await database.ensureIndexes();
    res.json({ success: true, data: database.getStatus() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect
app.post('/api/gtm/db/disconnect', async (req, res) => {
  try {
    await database.disconnect();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DB Status
app.get('/api/gtm/db/status', (req, res) => {
  res.json({ success: true, data: database.getStatus() });
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Generate JWT token
app.post('/api/gtm/auth/token', (req, res) => {
  try {
    const { userId, role, scopes } = req.body;
    const token = apiAuth.generateToken({ userId, role, scopes });
    res.json({ success: true, data: { token, expiresIn: '24h' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token
app.post('/api/gtm/auth/verify', (req, res) => {
  try {
    const { token } = req.body;
    const payload = apiAuth.verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });
    res.json({ success: true, data: payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate API key
app.post('/api/gtm/auth/api-key', (req, res) => {
  try {
    const { name, scopes } = req.body;
    const result = apiAuth.generateApiKey(name, scopes || ['read']);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List API keys
app.get('/api/gtm/auth/api-keys', (req, res) => {
  const keys = apiAuth.listApiKeys();
  res.json({ success: true, data: keys });
});

// Revoke API key
app.delete('/api/gtm/auth/api-key/:key', (req, res) => {
  const revoked = apiAuth.revokeApiKey(req.params.key);
  res.json({ success: revoked });
});

// Rate limit status
app.get('/api/gtm/auth/rate-limit', (req, res) => {
  const status = apiAuth.getRateLimitStatus(req.ip);
  res.json({ success: true, data: status });
});

// ============================================
// SCHEDULED JOBS ROUTES
// ============================================

// List all scheduled tasks
app.get('/api/gtm/jobs', (req, res) => {
  const jobs = scheduledJobs.getAllJobs();
  res.json({ success: true, data: jobs });
});

// Get job stats
app.get('/api/gtm/jobs/stats', (req, res) => {
  const stats = scheduledJobs.getStats();
  res.json({ success: true, data: stats });
});

// Get job health
app.get('/api/gtm/jobs/health', (req, res) => {
  const health = scheduledJobs.getHealth();
  res.json({ success: true, data: health });
});

// Get execution history
app.get('/api/gtm/jobs/executions', (req, res) => {
  const { taskId, status, limit } = req.query;
  const history = scheduledJobs.getExecutionHistory({ taskId, status, limit: parseInt(limit) || 100 });
  res.json({ success: true, data: history });
});

// Trigger task manually
app.post('/api/gtm/jobs/:taskId/trigger', async (req, res) => {
  try {
    const result = await scheduledJobs.triggerTask(req.params.taskId);
    if (!result) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start/stop task
app.post('/api/gtm/jobs/:taskId/start', (req, res) => {
  const task = scheduledJobs.startTask(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true, data: task });
});

app.post('/api/gtm/jobs/:taskId/stop', (req, res) => {
  const task = scheduledJobs.stopTask(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ success: true, data: task });
});

// Create custom job
app.post('/api/gtm/jobs', (req, res) => {
  try {
    const job = scheduledJobs.createJob(req.body);
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CACHE ROUTES
// ============================================

// Get cache stats
app.get('/api/gtm/cache/stats', async (req, res) => {
  try {
    const stats = await redisCache.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cache health
app.get('/api/gtm/cache/health', async (req, res) => {
  try {
    const health = await redisCache.getHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cache key
app.get('/api/gtm/cache/:key', async (req, res) => {
  try {
    const value = await redisCache.get(req.params.key);
    if (value === null) return res.status(404).json({ error: 'Key not found' });
    res.json({ success: true, data: value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set cache key
app.post('/api/gtm/cache', async (req, res) => {
  try {
    const { key, value, ttl } = req.body;
    await redisCache.set(key, value, { ttl: ttl || 3600 });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete cache key
app.delete('/api/gtm/cache/:key', async (req, res) => {
  try {
    await redisCache.del(req.params.key);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all cache
app.post('/api/gtm/cache/clear', async (req, res) => {
  try {
    await redisCache.clearAll();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cache keys by pattern
app.get('/api/gtm/cache/keys/:pattern', async (req, res) => {
  try {
    const keys = await redisCache.keys(req.params.pattern);
    res.json({ success: true, data: keys });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PDF REPORTS ROUTES
// ============================================

// Generate report
app.post('/api/gtm/reports/generate', async (req, res) => {
  try {
    const report = await pdfReports.generateReport(req.body);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get report
app.get('/api/gtm/reports/:id', (req, res) => {
  const report = pdfReports.getReport(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json({ success: true, data: report });
});

// List reports
app.get('/api/gtm/reports', (req, res) => {
  const { type, from, to } = req.query;
  const reports = pdfReports.listReports({ type, from, to });
  res.json({ success: true, data: reports });
});

// Export report
app.get('/api/gtm/reports/:id/export/:format', (req, res) => {
  try {
    const exportData = pdfReports.exportReport(req.params.id, req.params.format);
    if (!exportData) return res.status(404).json({ error: 'Report not found' });
    res.setHeader('Content-Type', exportData.type);
    res.send(exportData.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete report
app.delete('/api/gtm/reports/:id', (req, res) => {
  const deleted = pdfReports.deleteReport(req.params.id);
  res.json({ success: deleted });
});

// List templates
app.get('/api/gtm/reports/templates', (req, res) => {
  const templates = pdfReports.listTemplates();
  res.json({ success: true, data: templates });
});

// Schedule report
app.post('/api/gtm/reports/schedule', (req, res) => {
  try {
    const scheduled = pdfReports.scheduleReport(req.body);
    res.json({ success: true, data: scheduled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scheduled reports
app.get('/api/gtm/reports/scheduled', (req, res) => {
  const reports = pdfReports.getScheduledReports();
  res.json({ success: true, data: reports });
});

// ============================================
// INITIALIZE SERVICES
// ============================================

// Initialize scheduled jobs
scheduledJobs.initializeTasks({
  emailSender: null,
  sequenceBuilder: null,
  crmIntegration: null,
  whatsappIntegration: null
});

// Connect to Redis (if available)
redisCache.connectRedis().catch(err => {
  console.log('[CACHE] Using in-memory fallback');
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 REZ Atlas GTM v3.5.0 running on port ${PORT}`);
  console.log(`
  ╔════════════════════════════════════════════════════════════════════════╗
  ║              REZ ATLAS GTM v3.5 - AUTONOMOUS GTM SYSTEM             ║
  ╠════════════════════════════════════════════════════════════════════════╣
  ║  CORE AGENTS                                                         ║
  ║  ├── Company Understanding      ✅                                  ║
  ║  ├── Competitor Discovery       ✅                                  ║
  ║  ├── Segment Builder           ✅                                  ║
  ║  ├── Buyer Personas            ✅                                  ║
  ║  └── Prospect Intelligence     ✅                                  ║
  ║                                                                      ║
  ║  AI OUTREACH MODULES (23 Total)                                     ║
  ║  ├── AI Message Generator (OpenAI)  ✅                              ║
  ║  ├── Sequence Builder           ✅                                  ║
  ║  ├── Email Sender (SendGrid)   ✅                                  ║
  ║  ├── SMS Integration           ✅                                  ║
  ║  ├── Calendar/Meeting Booking ✅                                  ║
  ║  ├── WhatsApp Business        ✅                                  ║
  ║  ├── LinkedIn Sales Navigator ✅                                  ║
  ║  ├── Data Enrichment APIs     ✅                                  ║
  ║  ├── Prospect Database        ✅                                  ║
  ║  ├── AI Scoring               ✅                                  ║
  ║  ├── Analytics Dashboard ✅                                  ║
  ║  ├── Workflow Automation      ✅                                  ║
  ║  ├── A/B Testing              ✅                                  ║
  ║  ├── Territory Management     ✅                                  ║
  ║  ├── Map Intelligence        ✅                                  ║
  ║  ├── Database (MongoDB)       ✅                                  ║
  ║  ├── API Authentication      ✅ 🆕                               ║
  ║  ├── Scheduled Jobs (Cron)   ✅ 🆕                               ║
  ║  ├── Redis Cache              ✅ 🆕                               ║
  ║  └── PDF Reports             ✅ 🆕                               ║
  ║                                                                      ║
  ║  ECOSYSTEM INTEGRATIONS                                              ║
  ║  ├── REZ CRM (Port 4210)       ✅                                  ║
  ║  ├── AdBazaar Marketing ✅                                  ║
 ║  │   ├── Ad Campaigns ✅                                  ║
  ║  │   ├── QR Campaigns ✅                                  ║
  ║  │   ├── DOOH                 ✅                                  ║
  ║  │   ├── Retail Media         ✅ ║
 ║  │   └── Creator Rewards      ✅                                  ║
  ║  └── RABTUL Financial ✅                                  ║
  ║      ├── Auth                 ✅                                  ║
  ║      ├── Wallet/Coins        ✅                                  ║
  ║      ├── Payment Links       ✅                                  ║
  ║      ├── Notifications ✅                                  ║
  ║      ├── QR Cloud ✅                                  ║
  ║      ├── Karma& Loyalty     ✅                                  ║
  ║      └── BNPL/Capital        ✅                                  ║
  ╚════════════════════════════════════════════════════════════════════════╝

  ADBAZAAR ENDPOINTS:
  ───────────────────────────────────────────────────────────────────────
  POST /api/gtm/adbazaar/campaigns          - Create ad campaign
  GET  /api/gtm/adbazaar/campaigns          - List campaigns
  POST /api/gtm/adbazaar/qr-campaigns       - QR code campaigns
  POST /api/gtm/adbazaar/dooh-campaigns     - DOOH campaigns
  POST /api/gtm/adbazaar/retail-media       - Retail media
  POST /api/gtm/adbazaar/audiences         - Audience segments
  POST /api/gtm/adbazaar/track             - Conversion tracking

  RABTUL ENDPOINTS:
  ───────────────────────────────────────────────────────────────────────
  POST /api/gtm/rabtul/auth/verify          - Verify token
  GET  /api/gtm/rabtul/wallet/:id/balance  - Wallet balance
  POST /api/gtm/rabtul/wallet/coins/add    - Add coins
  POST /api/gtm/rabtul/payments/link      - Create payment link
  POST /api/gtm/rabtul/notifications/send - Send notification
  POST /api/gtm/rabtul/qr/generate         - Generate QR codes
  POST /api/gtm/rabtul/karma/award         - Award karma
  POST /api/gtm/rabtul/bnpl/apply          - BNPL application
  `);
});
