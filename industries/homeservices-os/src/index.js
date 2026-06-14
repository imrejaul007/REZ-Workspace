/**
 * HomeServices OS - Industry Operating System
 * Port: 5140
 *
 * Merged from: home-services (routes) + homeservices-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5140;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged home-services directory
const providersRoutes = require('./routes/providers');
const customersRoutes = require('./routes/customers');
const bookingsRoutes = require('./routes/bookings');
const servicesRoutes = require('./routes/services');
const reviewsRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { providers: [], customers: [], bookings: [], services: [] };

// Mount comprehensive routes
app.use('/api/providers', providersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'homeservices-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'HomeServices OS',
    version: '1.0.0',
    description: 'Home Services Industry Operating System',
    twins: ['Provider', 'Customer', 'Booking', 'Service'],
    agents: ['Dispatcher', 'QuoteGen', 'Scheduling', 'CustomerRet', 'InventoryMgmt'],
    endpoints: [
      '/api/providers', '/api/customers', '/api/bookings', '/api/services',
      '/api/reviews', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'provider-twin', name: 'Provider Twin' },
      { id: 'customer-twin', name: 'Customer Twin' },
      { id: 'booking-twin', name: 'Booking Twin' },
      { id: 'service-twin', name: 'Service Twin' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'dispatcher', name: 'Dispatcher Agent' },
      { id: 'quote-gen', name: 'QuoteGen Agent' },
      { id: 'scheduling', name: 'Scheduling Agent' },
      { id: 'customer-ret', name: 'CustomerRet Agent' },
      { id: 'inventory-mgmt', name: 'InventoryMgmt Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal error' }));

// Start server
app.listen(PORT, () => console.log(`🔧 HomeServices OS running on port ${PORT}`));

module.exports = app;
