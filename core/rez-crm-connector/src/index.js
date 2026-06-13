const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const CRMProviders = require('./providers');
const SyncService = require('./services/sync-service');
const ContactService = require('./services/contact-service');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
}));

// Initialize CRM Provider
const crmProvider = process.env.CRM_PROVIDER || 'hubspot';
const Provider = CRMProviders[crmProvider];

if (!Provider) {
  logger.error(`Unknown CRM provider: ${crmProvider}`);
  process.exit(1);
}

const provider = new Provider({
  apiKey: process.env[`${crmProvider.toUpperCase()}_API_KEY`],
  secret: process.env[`${crmProvider.toUpperCase()}_SECRET`],
  redirectUri: process.env.REDIRECT_URI,
  environment: process.env.NODE_ENV || 'development'
});

const syncService = new SyncService(provider, mongoose.connection);
const contactService = new ContactService(provider);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    provider: crmProvider,
    timestamp: new Date().toISOString()
  });
});

// CRM Sync endpoints
app.post('/api/crm/sync', async (req, res) => {
  try {
    const { direction = 'bidirectional', entityTypes = ['contacts'] } = req.body;
    const result = await syncService.sync({ direction, entityTypes });
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/crm/status', async (req, res) => {
  try {
    const status = await syncService.getSyncStatus();
    res.json({ success: true, status });
  } catch (error) {
    logger.error('Status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Contact endpoints
app.get('/api/contacts', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const contacts = await contactService.getContacts({ limit, offset });
    res.json({ success: true, contacts });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await contactService.getContactById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    res.json({ success: true, contact });
  } catch (error) {
    logger.error('Get contact error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const contact = await contactService.createContact(req.body);
    res.status(201).json({ success: true, contact });
  } catch (error) {
    logger.error('Create contact error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await contactService.updateContact(req.params.id, req.body);
    res.json({ success: true, contact });
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  try {
    await contactService.deleteContact(req.params.id);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    logger.error('Delete contact error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Search endpoint
app.get('/api/crm/search', async (req, res) => {
  try {
    const { query, type = 'contacts' } = req.query;
    const results = await contactService.search(query, type);
    res.json({ success: true, results });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook endpoint for CRM events
app.post('/api/webhooks/crm', async (req, res) => {
  try {
    const { event, data } = req.body;
    await syncService.handleWebhook(event, data);
    res.json({ success: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 3090;

async function start() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_crm';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // Initialize provider
    await provider.initialize();
    logger.info(`REZ CRM Connector initialized with provider: ${crmProvider}`);

    // Start server
    app.listen(PORT, () => {
      logger.info(`REZ CRM Connector running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

module.exports = app;
