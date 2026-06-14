/**
 * REZ Atlas v2 - Email Service
 * Email Sequences & Campaign Management
 * Production-ready with MongoDB, Winston logging, and security middleware
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { connectDatabase, disconnectDatabase, logger } from './database.js';
import { securityMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler, asyncHandler, NotFoundError, sendSuccess, ValidationError } from './middleware/errorHandler.js';
import { EmailTemplate, EmailSequence, Email, IEmailStep } from './models/Email.js';

const app = express();
const PORT = process.env.PORT || 5161;

// Default templates
const defaultTemplates = [
  {
    name: 'Initial Outreach',
    subject: 'Quick question about {{company}}',
    body: `Hi {{firstName}},

I noticed {{company}} is doing some great work in {{location}}.

We help businesses like yours increase customer retention by 30% with our loyalty program.

Would you be open to a quick 15-minute call this week?

Best,
{{senderName}}`,
    variables: ['firstName', 'company', 'location', 'senderName'],
    category: 'outreach'
  },
  {
    name: 'Follow Up 1',
    subject: 'Re: Quick question about {{company}}',
    body: `Hi {{firstName}},

Just following up on my previous email.

Did you get a chance to review the loyalty program demo I mentioned?

Happy to share some case studies from similar businesses in {{location}}.

Let me know!

Best,
{{senderName}}`,
    variables: ['firstName', 'company', 'location', 'senderName'],
    category: 'follow-up'
  },
  {
    name: 'Value Add',
    subject: 'Quick tip for {{company}}',
    body: `Hi {{firstName}},

I came across an interesting article about customer retention in the {{industry}} industry.

Thought you might find it useful: [link]

Would love to hear your thoughts!

Best,
{{senderName}}`,
    variables: ['firstName', 'company', 'industry', 'senderName'],
    category: 'value-add'
  }
];

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
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'atlas-email-service', version: '2.0.0', timestamp: new Date().toISOString() }));
app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req, res) => {
  try {
    const count = await Email.countDocuments().maxTimeMS(2000);
    res.json({ status: 'ready', database: 'connected', documents: count });
  } catch (error) {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// ================================================
// Templates API
// ================================================
app.get('/api/templates', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const query = category ? { category } : {};
  const templates = await EmailTemplate.find(query);
  sendSuccess(res, { templates, count: templates.length }, 'Templates retrieved');
}));

app.post('/api/templates', asyncHandler(async (req, res) => {
  const { name, subject, body, category } = req.body;
  if (!name || !subject || !body) throw new ValidationError('name, subject, and body are required');

  const template = new EmailTemplate({
    name, subject, body,
    variables: extractVariables(body),
    category: category || 'general'
  });
  await template.save();
  logger.info('Template created', { templateId: template._id, name });
  res.status(201).json({ success: true, data: template });
}));

// ================================================
// Sequences API
// ================================================
app.get('/api/sequences', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};
  const sequences = await EmailSequence.find(query).sort({ createdAt: -1 });
  sendSuccess(res, { sequences, count: sequences.length }, 'Sequences retrieved');
}));

app.post('/api/sequences', asyncHandler(async (req, res) => {
  const { name, description, steps } = req.body;
  if (!name) throw new ValidationError('name is required');

  const sequence = new EmailSequence({
    name, description: description || '',
    steps: steps || [],
    status: 'draft',
    stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 }
  });
  await sequence.save();
  logger.info('Sequence created', { sequenceId: sequence._id, name });
  res.status(201).json({ success: true, data: sequence });
}));

app.post('/api/sequences/:id/steps', asyncHandler(async (req, res) => {
  const sequence = await EmailSequence.findById(req.params.id);
  if (!sequence) throw new NotFoundError('Sequence');

  const { delayDays, templateId, subject, body } = req.body;
  const step: IEmailStep = {
    step: sequence.steps.length + 1,
    delayDays: delayDays || 1,
    templateId,
    subject,
    body
  };
  sequence.steps.push(step);
  await sequence.save();

  sendSuccess(res, { step, sequence }, 'Step added to sequence');
}));

app.patch('/api/sequences/:id', asyncHandler(async (req, res) => {
  const sequence = await EmailSequence.findById(req.params.id);
  if (!sequence) throw new NotFoundError('Sequence');

  if (req.body.status) sequence.status = req.body.status;
  if (req.body.name) sequence.name = req.body.name;
  if (req.body.description !== undefined) sequence.description = req.body.description;

  await sequence.save();
  sendSuccess(res, sequence, 'Sequence updated');
}));

// ================================================
// Emails API
// ================================================
app.post('/api/emails/send', asyncHandler(async (req, res) => {
  const { sequenceId, contactId, contactEmail, contactName, subject, body, variables } = req.body;
  if (!contactId || !contactEmail || !subject || !body) {
    throw new ValidationError('contactId, contactEmail, subject, and body are required');
  }

  const email = new Email({
    sequenceId: sequenceId || '',
    contactId, contactEmail, contactName,
    subject: replaceVariables(subject, variables || {}),
    body: replaceVariables(body, variables || {}),
    status: 'queued'
  });
  await email.save();

  // Simulate async sending
  setTimeout(async () => {
    try {
      email.status = 'sent';
      email.sentAt = new Date();
      await email.save();

      setTimeout(async () => {
        email.status = 'delivered';
        email.deliveredAt = new Date();
        await email.save();
      }, 2000);
    } catch (e) {
      logger.error('Email send simulation failed', { emailId: email._id, error: e });
    }
  }, 1000);

  logger.info('Email queued', { emailId: email._id, contactEmail });
  res.status(201).json({ success: true, emailId: email._id, status: 'queued' });
}));

app.get('/api/emails/:id', asyncHandler(async (req, res) => {
  const email = await Email.findById(req.params.id);
  if (!email) throw new NotFoundError('Email');
  sendSuccess(res, email, 'Email retrieved');
}));

app.post('/api/emails/:id/track', asyncHandler(async (req, res) => {
  const email = await Email.findById(req.params.id);
  if (!email) throw new NotFoundError('Email');

  const { action } = req.body;
  const now = new Date();

  if (action === 'open') { email.status = 'opened'; email.openedAt = now; }
  else if (action === 'click') { email.status = 'clicked'; email.clickedAt = now; }
  else if (action === 'reply') { email.status = 'replied'; email.repliedAt = now; }

  await email.save();
  sendSuccess(res, email, 'Email tracking updated');
}));

// ================================================
// Analytics API
// ================================================
app.get('/api/analytics/campaigns', asyncHandler(async (req, res) => {
  const stats = await Email.aggregate([
    {
      $group: {
        _id: null,
        totalEmails: { $sum: 1 },
        sent: { $sum: { $cond: [{ $in: ['$status', ['sent', 'delivered', 'opened', 'clicked', 'replied']] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'opened', 'clicked', 'replied']] }, 1, 0] } },
        opened: { $sum: { $cond: [{ $in: ['$status', ['opened', 'clicked', 'replied']] }, 1, 0] } },
        clicked: { $sum: { $cond: [{ $in: ['$status', ['clicked', 'replied']] }, 1, 0] } },
        replied: { $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] } },
        bounced: { $sum: { $cond: [{ $eq: ['$status', 'bounced'] }, 1, 0] } },
      }
    }
  ]);

  const result = stats[0] || { totalEmails: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, bounced: 0 };
  const sequences = await EmailSequence.find().select('name status stats');

  res.json({
    success: true,
    data: {
      totalEmails: result.totalEmails,
      byStatus: { sent: result.sent, delivered: result.delivered, opened: result.opened, clicked: result.clicked, replied: result.replied, bounced: result.bounced },
      sequences,
      avgOpenRate: result.sent > 0 ? ((result.opened / result.sent) * 100).toFixed(1) + '%' : '0%',
      avgClickRate: result.sent > 0 ? ((result.clicked / result.sent) * 100).toFixed(1) + '%' : '0%',
      avgReplyRate: result.sent > 0 ? ((result.replied / result.sent) * 100).toFixed(1) + '%' : '0%',
    }
  });
}));

// Helper functions
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
}

function replaceVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
}

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ================================================
// Server Start
// ================================================
async function startServer() {
  try {
    await connectDatabase();

    // Seed default templates
    for (const template of defaultTemplates) {
      const exists = await EmailTemplate.findOne({ name: template.name });
      if (!exists) {
        const newTemplate = new EmailTemplate(template);
        await newTemplate.save();
        logger.info('Seeded default template', { name: template.name });
      }
    }

    logger.info('Database connected, starting server...');

    app.listen(PORT, () => {
      logger.info(`📧 Atlas Email Service running on port ${PORT}`, {
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