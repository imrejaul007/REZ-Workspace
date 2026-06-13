const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const donorsRoutes = require('./routes/donors');
const beneficiariesRoutes = require('./routes/beneficiaries');
const campaignsRoutes = require('./routes/campaigns');
const donationsRoutes = require('./routes/donations');
const volunteersRoutes = require('./routes/volunteers');
const programsRoutes = require('./routes/programs');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
app.use('/api/donors', donorsRoutes);
app.use('/api/beneficiaries', beneficiariesRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', industry: 'Nonprofit OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Nonprofit OS',
    version: '1.0.0',
    description: 'Nonprofit Industry Operating System',
    endpoints: ['/api/donors', '/api/beneficiaries', '/api/campaigns', '/api/donations', '/api/volunteers', '/api/programs', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5160;
console.log('Nonprofit OS starting on port', PORT);

module.exports = app;