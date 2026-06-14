/**
 * Sports OS - Industry Operating System
 * Port: 5180
 *
 * Merged from: sports (routes) + sports-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5180;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged sports directory
const teamsRoutes = require('./routes/teams');
const playersRoutes = require('./routes/players');
const matchesRoutes = require('./routes/matches');
const venuesRoutes = require('./routes/venues');
const statisticsRoutes = require('./routes/statistics');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { teams: [], players: [], matches: [], venues: [] };

// Mount comprehensive routes
app.use('/api/teams', teamsRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/venues', venuesRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'sports-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Sports OS',
    version: '1.0.0',
    description: 'Sports Industry Operating System',
    twins: ['Team', 'Player', 'Match', 'Venue'],
    agents: ['Scout', 'FanEngage', 'TicketMgmt', 'ScheduleOpt', 'MediaManage'],
    endpoints: [
      '/api/teams', '/api/players', '/api/matches', '/api/venues',
      '/api/statistics', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'team-twin', name: 'Team Twin', type: 'team' },
      { id: 'player-twin', name: 'Player Twin', type: 'player' },
      { id: 'match-twin', name: 'Match Twin', type: 'match' },
      { id: 'venue-twin', name: 'Venue Twin', type: 'venue' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'scout', name: 'Scout Agent' },
      { id: 'fan-engage', name: 'FanEngage Agent' },
      { id: 'ticket-mgmt', name: 'TicketMgmt Agent' },
      { id: 'schedule-opt', name: 'ScheduleOpt Agent' },
      { id: 'media-manage', name: 'MediaManage Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

// Start server
app.listen(PORT, () => console.log(`⚽ Sports OS running on port ${PORT}`));

module.exports = app;
