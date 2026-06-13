const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const servicesRoutes = require('./routes/services');
const providersRoutes = require('./routes/providers');
const customersRoutes = require('./routes/customers');
const bookingsRoutes = require('./routes/bookings');
const reviewsRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
app.use('/api/services', servicesRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', industry: 'Home Services OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Home Services OS',
    version: '1.0.0',
    description: 'Home Services Industry Operating System',
    endpoints: ['/api/services', '/api/providers', '/api/customers', '/api/bookings', '/api/reviews', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5140;
console.log('Home Services OS starting on port', PORT);

module.exports = app;