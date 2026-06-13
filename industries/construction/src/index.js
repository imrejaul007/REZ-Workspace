const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const projectsRoutes = require('./routes/projects');
const contractorsRoutes = require('./routes/contractors');
const workersRoutes = require('./routes/workers');
const materialsRoutes = require('./routes/materials');
const schedulesRoutes = require('./routes/schedules');
const invoicesRoutes = require('./routes/invoices');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
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
  res.json({ status: 'ok', industry: 'Construction OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Construction OS',
    version: '1.0.0',
    description: 'Construction Industry Operating System',
    endpoints: ['/api/projects', '/api/contractors', '/api/workers', '/api/materials', '/api/schedules', '/api/invoices', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5210;
console.log('Construction OS starting on port', PORT);

module.exports = app;