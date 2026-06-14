/**
 * CRM Service
 *
 * Customer relationship management with contacts, companies, deals.
 *
 * Port: 5033
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import crypto from 'crypto';
import winston from 'winston';
import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { z } from 'zod';

// ============================================================================
// LOGGING
// ============================================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================================================
// METRICS
// ============================================================================

const register = new Registry();
register.setDefaultLabels({ service: 'crm-service' });

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const crmOperationsTotal = new Counter({
  name: 'crm_operations_total',
  help: 'Total CRM operations',
  labelNames: ['operation', 'entity'],
  registers: [register]
});

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: req.method, path: req.path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: req.path }, duration);
  });
  next();
});

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '5033', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

// ============================================================================
// MONGODB MODELS
// ============================================================================

// Contact Model
const ContactSchema = new mongoose.Schema({
  contactId: { type: String, required: true, unique: true, index: true },
  advertiserId: { type: String, required: true, index: true },
  firstName: { type: String, required: true },
  lastName: String,
  email: { type: String, index: true },
  phone: String,
  companyId: String,
  status: { type: String, enum: ['lead', 'prospect', 'customer', 'churned'], default: 'lead' },
  source: String,
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Contact = mongoose.model('Contact', ContactSchema);

// Company Model
const CompanySchema = new mongoose.Schema({
  companyId: { type: String, required: true, unique: true, index: true },
  advertiserId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  industry: String,
  website: String,
  size: String,
  revenue: Number,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Company = mongoose.model('Company', CompanySchema);

// Deal Model
const DealSchema = new mongoose.Schema({
  dealId: { type: String, required: true, unique: true, index: true },
  advertiserId: { type: String, required: true, index: true },
  contactId: String,
  companyId: String,
  title: { type: String, required: true },
  value: { type: Number, default: 0 },
  stage: {
    type: String,
    enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'lead'
  },
  probability: { type: Number, default: 0 },
  expectedCloseDate: Date,
  closedAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Deal = mongoose.model('Deal', DealSchema);

// Activity Model
const ActivitySchema = new mongoose.Schema({
  activityId: { type: String, required: true, unique: true, index: true },
  contactId: String,
  companyId: String,
  dealId: String,
  type: { type: String, enum: ['call', 'email', 'meeting', 'note', 'task'], required: true },
  subject: { type: String, required: true },
  description: String,
  userId: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Activity = mongoose.model('Activity', ActivitySchema);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createContactSchema = z.object({
  advertiserId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  companyId: z.string().optional(),
  status: z.enum(['lead', 'prospect', 'customer', 'churned']).optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

const createCompanySchema = z.object({
  advertiserId: z.string(),
  name: z.string().min(1),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  size: z.string().optional(),
  revenue: z.number().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  metadata: z.record(z.any()).optional()
});

const createDealSchema = z.object({
  advertiserId: z.string(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  title: z.string().min(1),
  value: z.number().optional(),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

const createActivitySchema = z.object({
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  type: z.enum(['call', 'email', 'meeting', 'note', 'task']),
  subject: z.string().min(1),
  description: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// ============================================================================
// HEALTH
// ============================================================================

app.get('/health', (_: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'crm-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (_: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ready', mongodb: mongoStatus });
});

app.get('/metrics', async (_: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// ============================================================================
// CONTACTS
// ============================================================================

app.post('/api/contacts', async (req: Request, res: Response) => {
  try {
    const validated = createContactSchema.parse(req.body);

    const contact = await Contact.create({
      contactId: generateId('CNT'),
      ...validated
    });

    logger.info('Contact created', { contactId: contact.contactId });
    crmOperationsTotal.inc({ operation: 'create', entity: 'contact' });
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create contact error', { error });
    res.status(500).json({ success: false, error: 'Failed to create contact' });
  }
});

app.get('/api/contacts', async (req: Request, res: Response) => {
  try {
    const { advertiserId, status, search } = req.query;
    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;
    if (status) filter.status = status;

    let contacts = await Contact.find(filter).sort({ createdAt: -1 }).limit(100);

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      contacts = contacts.filter(c =>
        searchRegex.test(c.firstName) ||
        searchRegex.test(c.lastName || '') ||
        searchRegex.test(c.email || '')
      );
    }

    res.json({ success: true, data: contacts, count: contacts.length });
  } catch (error) {
    logger.error('List contacts error', { error });
    res.status(500).json({ success: false, error: 'Failed to list contacts' });
  }
});

app.get('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    const contact = await Contact.findOne({ contactId: req.params.id });
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    // Get related company
    let company = null;
    if (contact.companyId) {
      company = await Company.findOne({ companyId: contact.companyId });
    }

    // Get related deals
    const deals = await Deal.find({ contactId: contact.contactId });

    res.json({ success: true, data: { ...contact.toObject(), company, deals } });
  } catch (error) {
    logger.error('Get contact error', { error });
    res.status(500).json({ success: false, error: 'Failed to get contact' });
  }
});

app.put('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, companyId, status, source, tags } = req.body;
    const contact = await Contact.findOneAndUpdate(
      { contactId: req.params.id },
      { firstName, lastName, email, phone, companyId, status, source, tags },
      { new: true }
    );
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    crmOperationsTotal.inc({ operation: 'update', entity: 'contact' });
    res.json({ success: true, data: contact });
  } catch (error) {
    logger.error('Update contact error', { error });
    res.status(500).json({ success: false, error: 'Failed to update contact' });
  }
});

app.delete('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    await Contact.findOneAndDelete({ contactId: req.params.id });
    crmOperationsTotal.inc({ operation: 'delete', entity: 'contact' });
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    logger.error('Delete contact error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete contact' });
  }
});

app.get('/api/contacts/:id/timeline', async (req: Request, res: Response) => {
  try {
    const contactId = req.params.id;

    // Get contact activities
    const activities = await Activity.find({ contactId }).sort({ createdAt: -1 }).limit(50);

    // Get deal activities
    const deals = await Deal.find({ contactId });
    const dealIds = deals.map(d => d.dealId);
    const dealActivities = await Activity.find({ dealId: { $in: dealIds } }).sort({ createdAt: -1 }).limit(50);

    // Merge and sort
    const timeline = [...activities, ...dealActivities].sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    res.json({ success: true, data: timeline });
  } catch (error) {
    logger.error('Get timeline error', { error });
    res.status(500).json({ success: false, error: 'Failed to get timeline' });
  }
});

app.post('/api/contacts/:id/activities', async (req: Request, res: Response) => {
  try {
    const validated = createActivitySchema.parse(req.body);

    const activity = await Activity.create({
      activityId: generateId('ACT'),
      contactId: req.params.id,
      ...validated
    });

    crmOperationsTotal.inc({ operation: 'create', entity: 'activity' });
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create activity error', { error });
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
});

// ============================================================================
// COMPANIES
// ============================================================================

app.post('/api/companies', async (req: Request, res: Response) => {
  try {
    const validated = createCompanySchema.parse(req.body);

    const company = await Company.create({
      companyId: generateId('CO'),
      ...validated
    });

    logger.info('Company created', { companyId: company.companyId });
    crmOperationsTotal.inc({ operation: 'create', entity: 'company' });
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create company error', { error });
    res.status(500).json({ success: false, error: 'Failed to create company' });
  }
});

app.get('/api/companies', async (req: Request, res: Response) => {
  try {
    const { advertiserId, industry, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;
    if (industry) filter.industry = industry;
    if (status) filter.status = status;

    const companies = await Company.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: companies, count: companies.length });
  } catch (error) {
    logger.error('List companies error', { error });
    res.status(500).json({ success: false, error: 'Failed to list companies' });
  }
});

app.get('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const company = await Company.findOne({ companyId: req.params.id });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    // Get related contacts
    const contacts = await Contact.find({ companyId: company.companyId });

    // Get related deals
    const deals = await Deal.find({ companyId: company.companyId });

    res.json({ success: true, data: { ...company.toObject(), contacts, deals } });
  } catch (error) {
    logger.error('Get company error', { error });
    res.status(500).json({ success: false, error: 'Failed to get company' });
  }
});

app.put('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const { name, industry, website, size, revenue, status } = req.body;
    const company = await Company.findOneAndUpdate(
      { companyId: req.params.id },
      { name, industry, website, size, revenue, status },
      { new: true }
    );
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    crmOperationsTotal.inc({ operation: 'update', entity: 'company' });
    res.json({ success: true, data: company });
  } catch (error) {
    logger.error('Update company error', { error });
    res.status(500).json({ success: false, error: 'Failed to update company' });
  }
});

app.delete('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    await Company.findOneAndDelete({ companyId: req.params.id });
    crmOperationsTotal.inc({ operation: 'delete', entity: 'company' });
    res.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    logger.error('Delete company error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete company' });
  }
});

// ============================================================================
// DEALS
// ============================================================================

app.post('/api/deals', async (req: Request, res: Response) => {
  try {
    const validated = createDealSchema.parse(req.body);

    const deal = await Deal.create({
      dealId: generateId('DEAL'),
      ...validated,
      expectedCloseDate: validated.expectedCloseDate ? new Date(validated.expectedCloseDate) : undefined
    });

    logger.info('Deal created', { dealId: deal.dealId });
    crmOperationsTotal.inc({ operation: 'create', entity: 'deal' });
    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create deal error', { error });
    res.status(500).json({ success: false, error: 'Failed to create deal' });
  }
});

app.get('/api/deals', async (req: Request, res: Response) => {
  try {
    const { advertiserId, stage, contactId, companyId } = req.query;
    const filter: Record<string, unknown> = {};
    if (advertiserId) filter.advertiserId = advertiserId;
    if (stage) filter.stage = stage;
    if (contactId) filter.contactId = contactId;
    if (companyId) filter.companyId = companyId;

    const deals = await Deal.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: deals, count: deals.length });
  } catch (error) {
    logger.error('List deals error', { error });
    res.status(500).json({ success: false, error: 'Failed to list deals' });
  }
});

app.get('/api/deals/:id', async (req: Request, res: Response) => {
  try {
    const deal = await Deal.findOne({ dealId: req.params.id });
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    // Get related activities
    const activities = await Activity.find({ dealId: deal.dealId }).sort({ createdAt: -1 }).limit(20);

    res.json({ success: true, data: { ...deal.toObject(), activities } });
  } catch (error) {
    logger.error('Get deal error', { error });
    res.status(500).json({ success: false, error: 'Failed to get deal' });
  }
});

app.put('/api/deals/:id', async (req: Request, res: Response) => {
  try {
    const { title, value, stage, probability, expectedCloseDate } = req.body;
    const deal = await Deal.findOneAndUpdate(
      { dealId: req.params.id },
      {
        title,
        value,
        stage,
        probability,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        closedAt: ['closed_won', 'closed_lost'].includes(stage) ? new Date() : undefined
      },
      { new: true }
    );
    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }
    crmOperationsTotal.inc({ operation: 'update', entity: 'deal' });
    res.json({ success: true, data: deal });
  } catch (error) {
    logger.error('Update deal error', { error });
    res.status(500).json({ success: false, error: 'Failed to update deal' });
  }
});

app.post('/api/deals/:id/stage', async (req: Request, res: Response) => {
  try {
    const { stage, probability } = req.body;

    if (!stage) {
      return res.status(400).json({ success: false, error: 'Stage required' });
    }

    const deal = await Deal.findOneAndUpdate(
      { dealId: req.params.id },
      {
        stage,
        probability: probability || getStageProbability(stage),
        closedAt: ['closed_won', 'closed_lost'].includes(stage) ? new Date() : undefined
      },
      { new: true }
    );

    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    logger.info('Deal stage updated', { dealId: deal.dealId, stage });
    crmOperationsTotal.inc({ operation: 'stage_change', entity: 'deal' });
    res.json({ success: true, data: deal });
  } catch (error) {
    logger.error('Update deal stage error', { error });
    res.status(500).json({ success: false, error: 'Failed to update deal stage' });
  }
});

app.delete('/api/deals/:id', async (req: Request, res: Response) => {
  try {
    await Deal.findOneAndDelete({ dealId: req.params.id });
    crmOperationsTotal.inc({ operation: 'delete', entity: 'deal' });
    res.json({ success: true, message: 'Deal deleted' });
  } catch (error) {
    logger.error('Delete deal error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete deal' });
  }
});

function getStageProbability(stage: string): number {
  const probabilities: Record<string, number> = {
    lead: 10,
    qualified: 25,
    proposal: 50,
    negotiation: 75,
    closed_won: 100,
    closed_lost: 0
  };
  return probabilities[stage] || 0;
}

// ============================================================================
// ACTIVITIES
// ============================================================================

app.post('/api/activities', async (req: Request, res: Response) => {
  try {
    const validated = createActivitySchema.parse(req.body);

    const activity = await Activity.create({
      activityId: generateId('ACT'),
      ...validated
    });

    crmOperationsTotal.inc({ operation: 'create', entity: 'activity' });
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Create activity error', { error });
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
});

app.get('/api/activities', async (req: Request, res: Response) => {
  try {
    const { contactId, companyId, dealId, type } = req.query;
    const filter: Record<string, unknown> = {};
    if (contactId) filter.contactId = contactId;
    if (companyId) filter.companyId = companyId;
    if (dealId) filter.dealId = dealId;
    if (type) filter.type = type;

    const activities = await Activity.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: activities, count: activities.length });
  } catch (error) {
    logger.error('List activities error', { error });
    res.status(500).json({ success: false, error: 'Failed to list activities' });
  }
});

app.get('/api/activities/:id', async (req: Request, res: Response) => {
  try {
    const activity = await Activity.findOne({ activityId: req.params.id });
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    res.json({ success: true, data: activity });
  } catch (error) {
    logger.error('Get activity error', { error });
    res.status(500).json({ success: false, error: 'Failed to get activity' });
  }
});

// ============================================================================
// STARTUP
// ============================================================================

async function start() {
  logger.info('Starting CRM Service', { port: PORT });

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected');

    app.listen(PORT, () => {
      logger.info(`CRM Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Startup failed', { error });
    process.exit(1);
  }
}

start();

export default app;