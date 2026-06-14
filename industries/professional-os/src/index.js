/**
 * Professional OS - Industry Operating System
 * Port: 5170
 *
 * Merged from: professional (routes) + professional-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5170;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged professional directory
const consultantsRoutes = require('./routes/consultants');
const clientsRoutes = require('./routes/clients');
const projectsRoutes = require('./routes/projects');
const invoicesRoutes = require('./routes/invoices');
const contractsRoutes = require('./routes/contracts');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { consultants: [], clients: [], projects: [], invoices: [] };

// Mount comprehensive routes
app.use('/api/consultants', consultantsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'professional-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Professional OS',
    version: '1.0.0',
    description: 'Professional Services Industry Operating System',
    twins: ['Consultant', 'Client', 'Project', 'Invoice'],
    agents: ['ProjectMgmt', 'ResourceAlloc', 'ClientOnboard', 'ProposalGen', 'TimeTrack'],
    endpoints: [
      '/api/consultants', '/api/clients', '/api/projects', '/api/invoices',
      '/api/contracts', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'consultant-twin', name: 'Consultant Twin', type: 'consultant' },
      { id: 'client-twin', name: 'Client Twin', type: 'client' },
      { id: 'project-twin', name: 'Project Twin', type: 'project' },
      { id: 'invoice-twin', name: 'Invoice Twin', type: 'invoice' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'project-mgmt', name: 'ProjectMgmt Agent' },
      { id: 'resource-alloc', name: 'ResourceAlloc Agent' },
      { id: 'client-onboard', name: 'ClientOnboard Agent' },
      { id: 'proposal-gen', name: 'ProposalGen Agent' },
      { id: 'time-track', name: 'TimeTrack Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

// Start server
app.listen(PORT, () => console.log(`💼 Professional OS running on port ${PORT}`));

module.exports = app;
