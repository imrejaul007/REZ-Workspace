/**
 * Entertainment OS - Industry Operating System
 * Port: 5200
 *
 * Merged from: entertainment (routes) + entertainment-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5200;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged entertainment directory
const eventsRoutes = require('./routes/events');
const venuesRoutes = require('./routes/venues');
const ticketsRoutes = require('./routes/tickets');
const artistsRoutes = require('./routes/artists');
const schedulesRoutes = require('./routes/schedules');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { events: [], venues: [], tickets: [], artists: [] };

// Mount comprehensive routes
app.use('/api/events', eventsRoutes);
app.use('/api/venues', venuesRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/artists', artistsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'entertainment-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Entertainment OS',
    version: '1.0.0',
    description: 'Entertainment Industry Operating System',
    twins: ['Event', 'Venue', 'Ticket', 'Artist'],
    agents: ['TalentMgmt', 'EventCoord', 'TicketSales', 'Marketing', 'FanEngage'],
    endpoints: [
      '/api/events', '/api/venues', '/api/tickets', '/api/artists',
      '/api/schedules', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'event-twin', name: 'Event Twin', type: 'event' },
      { id: 'venue-twin', name: 'Venue Twin', type: 'venue' },
      { id: 'ticket-twin', name: 'Ticket Twin', type: 'ticket' },
      { id: 'artist-twin', name: 'Artist Twin', type: 'artist' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'talent-mgmt', name: 'TalentMgmt Agent' },
      { id: 'event-coord', name: 'EventCoord Agent' },
      { id: 'ticket-sales', name: 'TicketSales Agent' },
      { id: 'marketing', name: 'Marketing Agent' },
      { id: 'fan-engage', name: 'FanEngage Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

// Start server
app.listen(PORT, () => console.log(`🎭 Entertainment OS running on port ${PORT}`));

module.exports = app;
