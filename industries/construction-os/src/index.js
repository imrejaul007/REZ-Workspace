/**
 * Construction OS - Industry Operating System
 * Port: 5210
 *
 * Merged from: construction (routes) + construction-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5210;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged construction directory
const projectsRoutes = require('./routes/projects');
const contractorsRoutes = require('./routes/contractors');
const workersRoutes = require('./routes/workers');
const materialsRoutes = require('./routes/materials');
const schedulesRoutes = require('./routes/schedules');
const invoicesRoutes = require('./routes/invoices');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { projects: [], contractors: [], workers: [], materials: [] };

// Mount comprehensive routes
app.use('/api/projects', projectsRoutes);
app.use('/api/contractors', contractorsRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'construction-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Construction OS',
    version: '1.0.0',
    description: 'Construction Industry Operating System',
    twins: ['Project', 'Contractor', 'Worker', 'Material'],
    agents: ['ProjectMgmt', 'SafetyInsp', 'ResourceAlloc', 'ProgressTrack', 'CostEst'],
    endpoints: [
      '/api/projects', '/api/contractors', '/api/workers', '/api/materials',
      '/api/schedules', '/api/invoices', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'project-twin', name: 'Project Twin', type: 'project' },
      { id: 'contractor-twin', name: 'Contractor Twin', type: 'contractor' },
      { id: 'worker-twin', name: 'Worker Twin', type: 'worker' },
      { id: 'material-twin', name: 'Material Twin', type: 'material' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'project-mgmt', name: 'ProjectMgmt Agent' },
      { id: 'safety-insp', name: 'SafetyInsp Agent' },
      { id: 'resource-alloc', name: 'ResourceAlloc Agent' },
      { id: 'progress-track', name: 'ProgressTrack Agent' },
      { id: 'cost-est', name: 'CostEst Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

// Start server
app.listen(PORT, () => console.log(`🏗️ Construction OS running on port ${PORT}`));

module.exports = app;
