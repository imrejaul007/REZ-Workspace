const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const gamesRoutes = require('./routes/games');
const playersRoutes = require('./routes/players');
const tournamentsRoutes = require('./routes/tournaments');
const leaderboardsRoutes = require('./routes/leaderboards');
const matchesRoutes = require('./routes/matches');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
app.use('/api/games', gamesRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.use('/api/leaderboards', leaderboardsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', industry: 'Gaming OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Gaming OS',
    version: '1.0.0',
    description: 'Gaming Industry Operating System',
    endpoints: ['/api/games', '/api/players', '/api/tournaments', '/api/leaderboards', '/api/matches', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5120;
console.log('Gaming OS starting on port', PORT);

module.exports = app;