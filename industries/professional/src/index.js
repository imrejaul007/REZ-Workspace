const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const consultantsRoutes = require('./routes/consultants');
const clientsRoutes = require('./routes/clients');
const projectsRoutes = require('./routes/projects');
const invoicesRoutes = require('./routes/invoices');
const contractsRoutes = require('./routes/contracts');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
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
  res.json({ status: 'ok', industry: 'Professional OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Professional OS',
    version: '1.0.0',
    description: 'Professional Services Industry Operating System',
    endpoints: ['/api/consultants', '/api/clients', '/api/projects', '/api/invoices', '/api/contracts', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5170;
console.log('Professional OS starting on port', PORT);

module.exports = app;