/**
 * Travel OS - Industry Operating System
 * Port: 5190
 *
 * Merged from: travel (routes) + travel-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5190;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged travel directory
const destinationsRoutes = require('./routes/destinations');
const packagesRoutes = require('./routes/packages');
const bookingsRoutes = require('./routes/bookings');
const travelersRoutes = require('./routes/travelers');
const itinerariesRoutes = require('./routes/itineraries');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { destinations: [], packages: [], bookings: [], travelers: [] };

// Mount comprehensive routes
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
  res.json({ status: 'healthy', service: 'travel-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Travel OS',
    version: '1.0.0',
    description: 'Travel & Tourism Industry Operating System',
    twins: ['Destination', 'Package', 'Booking', 'Traveler'],
    agents: ['TripPlanner', 'Booking', 'Concierge', 'ExpenseTrack', 'TravelPolicy'],
    endpoints: [
      '/api/destinations', '/api/packages', '/api/bookings', '/api/travelers',
      '/api/itineraries', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'destination-twin', name: 'Destination Twin', type: 'destination' },
      { id: 'package-twin', name: 'Package Twin', type: 'package' },
      { id: 'booking-twin', name: 'Booking Twin', type: 'booking' },
      { id: 'traveler-twin', name: 'Traveler Twin', type: 'traveler' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'trip-planner', name: 'TripPlanner Agent' },
      { id: 'booking', name: 'Booking Agent' },
      { id: 'concierge', name: 'Concierge Agent' },
      { id: 'expense-track', name: 'ExpenseTrack Agent' },
      { id: 'travel-policy', name: 'TravelPolicy Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

// Start server
app.listen(PORT, () => console.log(`✈️ Travel OS running on port ${PORT}`));

module.exports = app;
