const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const teamsRoutes = require('./routes/teams');
const playersRoutes = require('./routes/players');
const matchesRoutes = require('./routes/matches');
const statisticsRoutes = require('./routes/statistics');
const venuesRoutes = require('./routes/venues');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
app.use('/api/teams', teamsRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/venues', venuesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', industry: 'Sports OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Sports OS',
    version: '1.0.0',
    description: 'Sports Industry Operating System',
    endpoints: ['/api/teams', '/api/players', '/api/matches', '/api/statistics', '/api/venues', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5180;
console.log('Sports OS starting on port', PORT);

module.exports = app;