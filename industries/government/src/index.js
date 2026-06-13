const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const servicesRoutes = require('./routes/services');
const citizensRoutes = require('./routes/citizens');
const permitsRoutes = require('./routes/permits');
const departmentsRoutes = require('./routes/departments');
const complaintsRoutes = require('./routes/complaints');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
app.use('/api/services', servicesRoutes);
app.use('/api/citizens', citizensRoutes);
app.use('/api/permits', permitsRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', industry: 'Government OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Government OS',
    version: '1.0.0',
    description: 'Government Industry Operating System',
    endpoints: ['/api/services', '/api/citizens', '/api/permits', '/api/departments', '/api/complaints', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5130;
console.log('Government OS starting on port', PORT);

module.exports = app;