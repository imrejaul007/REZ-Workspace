/**
 * Government OS - Industry Operating System
 * Port: 5130
 *
 * Merged from: government (routes) + government-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5130;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged government directory
const citizensRoutes = require('./routes/citizens');
const departmentsRoutes = require('./routes/departments');
const servicesRoutes = require('./routes/services');
const permitsRoutes = require('./routes/permits');
const complaintsRoutes = require('./routes/complaints');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { citizens: [], departments: [], services: [], permits: [], complaints: [] };

// Mount comprehensive routes
app.use('/api/citizens', citizensRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/permits', permitsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'government-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Government OS',
    version: '1.0.0',
    description: 'Government Industry Operating System',
    twins: ['Citizen', 'Department', 'Service', 'Permit', 'Complaint'],
    agents: ['ServiceNavigator', 'Notification', 'ComplianceChecker', 'ApplicationProcessor', 'PermitReview'],
    endpoints: [
      '/api/citizens', '/api/departments', '/api/services', '/api/permits',
      '/api/complaints', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'citizen-twin', name: 'Citizen Twin' },
      { id: 'department-twin', name: 'Department Twin' },
      { id: 'service-twin', name: 'Service Twin' },
      { id: 'permit-twin', name: 'Permit Twin' },
      { id: 'complaint-twin', name: 'Complaint Twin' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'service-navigator', name: 'ServiceNavigator Agent' },
      { id: 'notification', name: 'Notification Agent' },
      { id: 'compliance-checker', name: 'ComplianceChecker Agent' },
      { id: 'application-processor', name: 'ApplicationProcessor Agent' },
      { id: 'permit-review', name: 'PermitReview Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

// Start server
app.listen(PORT, () => console.log(`🏛️ Government OS running on port ${PORT}`));

module.exports = app;
