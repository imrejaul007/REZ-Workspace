/**
 * NonProfit OS - Industry Operating System
 * Port: 5160
 *
 * Merged from: nonprofit (routes) + nonprofit-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5160;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged nonprofit directory
const donorsRoutes = require('./routes/donors');
const campaignsRoutes = require('./routes/campaigns');
const beneficiariesRoutes = require('./routes/beneficiaries');
const volunteersRoutes = require('./routes/volunteers');
const donationsRoutes = require('./routes/donations');
const programsRoutes = require('./routes/programs');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { donors: [], campaigns: [], beneficiaries: [], volunteers: [] };

// Mount comprehensive routes
app.use('/api/donors', donorsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/beneficiaries', beneficiariesRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'nonprofit-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'NonProfit OS',
    version: '1.0.0',
    description: 'NonProfit Industry Operating System',
    twins: ['Donor', 'Campaign', 'Beneficiary', 'Volunteer'],
    agents: ['Fundraising', 'VolunteerMatch', 'ImpactReport', 'DonorRel', 'GrantWriter'],
    endpoints: [
      '/api/donors', '/api/campaigns', '/api/beneficiaries', '/api/volunteers',
      '/api/donations', '/api/programs', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'donor-twin', name: 'Donor Twin', type: 'donor' },
      { id: 'campaign-twin', name: 'Campaign Twin', type: 'campaign' },
      { id: 'beneficiary-twin', name: 'Beneficiary Twin', type: 'beneficiary' },
      { id: 'volunteer-twin', name: 'Volunteer Twin', type: 'volunteer' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'fundraising', name: 'Fundraising Agent' },
      { id: 'volunteer-match', name: 'VolunteerMatch Agent' },
      { id: 'impact-report', name: 'ImpactReport Agent' },
      { id: 'donor-rel', name: 'DonorRel Agent' },
      { id: 'grant-writer', name: 'GrantWriter Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

// Start server
app.listen(PORT, () => console.log(`❤️ NonProfit OS running on port ${PORT}`));

module.exports = app;
