/**
 * Gaming OS - Industry Operating System
 * Port: 5120
 *
 * Merged from: gaming (routes) + gaming-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5120;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged gaming directory
const gamesRoutes = require('./routes/games');
const playersRoutes = require('./routes/players');
const tournamentsRoutes = require('./routes/tournaments');
const matchesRoutes = require('./routes/matches');
const leaderboardsRoutes = require('./routes/leaderboards');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { games: [], players: [], tournaments: [], matches: [] };

// Mount comprehensive routes
app.use('/api/games', gamesRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/leaderboards', leaderboardsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'gaming-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Gaming OS',
    version: '1.0.0',
    description: 'Gaming Industry Operating System',
    twins: ['Game', 'Player', 'Tournament', 'Match'],
    agents: ['Matchmaker', 'AntiCheat', 'Monetization', 'Engagement', 'SupportBot'],
    endpoints: [
      '/api/games', '/api/players', '/api/tournaments', '/api/matches',
      '/api/leaderboards', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'game-twin', name: 'Game Twin' },
      { id: 'player-twin', name: 'Player Twin' },
      { id: 'tournament-twin', name: 'Tournament Twin' },
      { id: 'match-twin', name: 'Match Twin' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'matchmaker', name: 'Matchmaker Agent' },
      { id: 'anti-cheat', name: 'AntiCheat Agent' },
      { id: 'monetization', name: 'Monetization Agent' },
      { id: 'engagement', name: 'Engagement Agent' },
      { id: 'support-bot', name: 'SupportBot Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal error' }));

// Start server
app.listen(PORT, () => console.log(`🎮 Gaming OS running on port ${PORT}`));

module.exports = app;
