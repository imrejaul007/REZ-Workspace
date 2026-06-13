const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const destinationsRoutes = require('./routes/destinations');
const packagesRoutes = require('./routes/packages');
const bookingsRoutes = require('./routes/bookings');
const travelersRoutes = require('./routes/travelers');
const itinerariesRoutes = require('./routes/itineraries');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
app.use('/api/destinations', destinationsRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/travelers', travelersRoutes);
app.use('/api/itineraries', itinerariesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', industry: 'Travel OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Travel OS',
    version: '1.0.0',
    description: 'Travel Industry Operating System',
    endpoints: ['/api/destinations', '/api/packages', '/api/bookings', '/api/travelers', '/api/itineraries', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5190;
console.log('Travel OS starting on port', PORT);

module.exports = app;