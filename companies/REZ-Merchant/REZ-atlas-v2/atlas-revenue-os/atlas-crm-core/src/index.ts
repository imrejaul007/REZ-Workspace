/**
 * REZ Atlas v2 - CRM Core
 * Complete CRM with Lead, Account, Contact, Opportunity, Activity
 * Production-ready with MongoDB, Winston logging, and security middleware
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { connectDatabase, disconnectDatabase, logger } from './database.js';
import { securityMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler, asyncHandler, NotFoundError, sendSuccess, ValidationError } from './middleware/errorHandler.js';
import { Account, Contact, Opportunity, Activity } from './models/CRM.js';

const app = express();
const PORT = process.env.PORT || 5183;

// Stage probabilities
const stageProbabilities: Record<string, number> = {
  discovery: 20, qualification: 40, proposal: 60, negotiation: 80, closed_won: 100, closed_lost: 0
};

// Middleware
app.use(express.json());
app.use(securityMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request completed', { method: req.method, path: req.path, statusCode: res.statusCode, duration: Date.now() - start, requestId: (req as any).requestId });
  });
  next();
});

// ================================================
// Health Check Endpoints
// ================================================
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'atlas-crm-core', version: '2.0.0', timestamp: new Date().toISOString() }));
app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req, res) => {
  try {
    const count = await Account.countDocuments().maxTimeMS(2000);
    res.json({ status: 'ready', database: 'connected', accounts: count });
  } catch (error) {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// ================================================
// Accounts API
// ================================================
app.get('/api/accounts', asyncHandler(async (req, res) => {
  const { status, industry, ownerId, limit = 50 } = req.query;
  const query: any = {};
  if (status) query.status = status;
  if (industry) query.industry = industry;
  if (ownerId) query.ownerId = ownerId;

  const accounts = await Account.find(query).sort({ createdAt: -1 }).limit(Number(limit));
  const count = await Account.countDocuments(query);
  sendSuccess(res, { accounts, count }, 'Accounts retrieved');
}));

app.get('/api/accounts/:id', asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);
  if (!account) throw new NotFoundError('Account');

  const contacts = await Contact.find({ accountId: account._id.toString() });
  const opportunities = await Opportunity.find({ accountId: account._id.toString() });
  const activities = await Activity.find({ accountId: account._id.toString() }).sort({ createdAt: -1 }).limit(20);

  sendSuccess(res, { account, contacts, opportunities, activities }, 'Account retrieved');
}));

app.post('/api/accounts', asyncHandler(async (req, res) => {
  const { name, domain, industry, size, phone, address, city, ownerId, territoryId } = req.body;
  if (!name) throw new ValidationError('name is required');

  const account = new Account({
    name, domain, industry, size, phone, address, city,
    ownerId: ownerId || 'system',
    territoryId: territoryId || '',
    status: 'prospect',
    lifetimeValue: 0,
    lastActivity: new Date()
  });
  await account.save();
  logger.info('Account created', { accountId: account._id, name });

  res.status(201).json({ success: true, data: account });
}));

app.patch('/api/accounts/:id', asyncHandler(async (req, res) => {
  const account = await Account.findById(req.params.id);
  if (!account) throw new NotFoundError('Account');

  Object.assign(account, req.body, { lastActivity: new Date() });
  await account.save();
  sendSuccess(res, account, 'Account updated');
}));

// ================================================
// Contacts API
// ================================================
app.get('/api/contacts', asyncHandler(async (req, res) => {
  const { accountId, limit = 50 } = req.query;
  const query: any = {};
  if (accountId) query.accountId = accountId;

  const contacts = await Contact.find(query).sort({ createdAt: -1 }).limit(Number(limit));
  sendSuccess(res, { contacts, count: contacts.length }, 'Contacts retrieved');
}));

app.post('/api/contacts', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, title, seniority, accountId } = req.body;
  if (!firstName || !lastName || !email) throw new ValidationError('firstName, lastName, and email are required');

  const contact = new Contact({
    firstName, lastName, email, phone, title, seniority,
    accountId: accountId || '',
    isPrimary: false
  });
  await contact.save();

  if (accountId) {
    const account = await Account.findById(accountId);
    if (account) {
      const existingContacts = await Contact.countDocuments({ accountId });
      if (existingContacts === 1) contact.isPrimary = true;
      await contact.save();
    }
  }

  logger.info('Contact created', { contactId: contact._id, email });
  res.status(201).json({ success: true, data: contact });
}));

// ================================================
// Opportunities API
// ================================================
app.get('/api/opportunities', asyncHandler(async (req, res) => {
  const { stage, accountId, ownerId, limit = 50 } = req.query;
  const query: any = {};
  if (stage) query.stage = stage;
  if (accountId) query.accountId = accountId;
  if (ownerId) query.ownerId = ownerId;

  const opportunities = await Opportunity.find(query).sort({ value: -1 }).limit(Number(limit));
  sendSuccess(res, { opportunities, count: opportunities.length }, 'Opportunities retrieved');
}));

app.post('/api/opportunities', asyncHandler(async (req, res) => {
  const { name, accountId, contactId, productId, productName, value, stage, expectedCloseDate, ownerId } = req.body;
  if (!name || !accountId) throw new ValidationError('name and accountId are required');

  const opportunity = new Opportunity({
    name, accountId, contactId, productId, productName,
    stage: stage || 'discovery',
    value: value || 0,
    probability: stageProbabilities[stage || 'discovery'],
    expectedCloseDate: expectedCloseDate || '',
    nextAction: '',
    aiScore: 50,
    notes: '',
    ownerId: ownerId || 'system'
  });
  await opportunity.save();
  logger.info('Opportunity created', { opportunityId: opportunity._id, name, value });

  res.status(201).json({ success: true, data: opportunity });
}));

app.patch('/api/opportunities/:id', asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) throw new NotFoundError('Opportunity');

  if (req.body.stage) {
    req.body.probability = stageProbabilities[req.body.stage];
  }

  Object.assign(opp, req.body);
  await opp.save();
  sendSuccess(res, opp, 'Opportunity updated');
}));

app.post('/api/opportunities/:id/stage', asyncHandler(async (req, res) => {
  const opp = await Opportunity.findById(req.params.id);
  if (!opp) throw new NotFoundError('Opportunity');

  const { stage, notes } = req.body;
  if (!stage) throw new ValidationError('stage is required');

  opp.stage = stage;
  opp.probability = stageProbabilities[stage];
  if (notes) opp.notes = notes;
  await opp.save();

  if (stage === 'closed_won') {
    const account = await Account.findById(opp.accountId);
    if (account) {
      account.lifetimeValue += opp.value;
      account.status = 'active';
      await account.save();
    }
  }

  logger.info('Opportunity stage changed', { opportunityId: opp._id, newStage: stage });
  sendSuccess(res, opp, 'Stage updated');
}));

// ================================================
// Activities API
// ================================================
app.get('/api/activities', asyncHandler(async (req, res) => {
  const { accountId, contactId, type, completed, limit = 50 } = req.query;
  const query: any = {};
  if (accountId) query.accountId = accountId;
  if (contactId) query.contactId = contactId;
  if (type) query.type = type;
  if (completed !== undefined) query.completed = completed === 'true';

  const activities = await Activity.find(query).sort({ createdAt: -1 }).limit(Number(limit));
  sendSuccess(res, { activities, count: activities.length }, 'Activities retrieved');
}));

app.post('/api/activities', asyncHandler(async (req, res) => {
  const { type, accountId, contactId, opportunityId, subject, description, dueDate, ownerId } = req.body;
  if (!type || !accountId || !subject) throw new ValidationError('type, accountId, and subject are required');

  const activity = new Activity({
    type, accountId, contactId: contactId || '',
    opportunityId: opportunityId || null,
    subject, description,
    completed: false,
    dueDate: dueDate ? new Date(dueDate) : null,
    ownerId: ownerId || 'system'
  });
  await activity.save();
  logger.info('Activity created', { activityId: activity._id, type, subject });

  res.status(201).json({ success: true, data: activity });
}));

app.patch('/api/activities/:id', asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) throw new NotFoundError('Activity');

  Object.assign(activity, req.body);
  await activity.save();
  sendSuccess(res, activity, 'Activity updated');
}));

// ================================================
// Analytics API
// ================================================
app.get('/api/analytics', asyncHandler(async (req, res) => {
  const [accountStats, oppStats, activityStats] = await Promise.all([
    Account.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Opportunity.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$value' } } }
    ]),
    Activity.aggregate([
      { $group: { _id: null, total: { $sum: 1 }, pending: { $sum: { $cond: ['$completed', 0, 1] } } } }
    ])
  ]);

  const accountsByStatus: Record<string, number> = {};
  accountStats.forEach(s => { accountsByStatus[s._id] = s.count; });

  const opportunitiesByStage: Record<string, { count: number; value: number }> = {};
  let pipelineValue = 0;
  let closedValue = 0;
  oppStats.forEach(s => {
    opportunitiesByStage[s._id] = { count: s.count, value: s.totalValue };
    if (!['closed_won', 'closed_lost'].includes(s._id)) pipelineValue += s.totalValue;
    if (s._id === 'closed_won') closedValue += s.totalValue;
  });

  const totalOpps = oppStats.reduce((sum, s) => sum + s.count, 0);
  const activeOpps = totalOpps - (opportunitiesByStage['closed_lost']?.count || 0) - (opportunitiesByStage['closed_won']?.count || 0);

  res.json({
    success: true,
    data: {
      accounts: { total: accountStats.reduce((sum, s) => sum + s.count, 0), byStatus: accountsByStatus },
      contacts: { total: await Contact.countDocuments() },
      opportunities: {
        total: totalOpps,
        byStage: opportunitiesByStage,
        pipelineValue,
        closedValue,
        avgDealSize: activeOpps > 0 ? Math.round(pipelineValue / activeOpps) : 0
      },
      activities: { total: activityStats[0]?.total || 0, pending: activityStats[0]?.pending || 0 }
    }
  });
}));

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ================================================
// Server Start
// ================================================
async function startServer() {
  try {
    await connectDatabase();
    logger.info('Database connected, starting server...');

    app.listen(PORT, () => {
      logger.info(`🏢 Atlas CRM Core running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        mongodb: process.env.MONGODB_URI ? 'connected' : 'not configured'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => { logger.info('SIGTERM received, shutting down'); await disconnectDatabase(); process.exit(0); });
process.on('SIGINT', async () => { logger.info('SIGINT received, shutting down'); await disconnectDatabase(); process.exit(0); });

startServer();

export default app;