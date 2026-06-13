const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const eventsRoutes = require('./routes/events');
const venuesRoutes = require('./routes/venues');
const ticketsRoutes = require('./routes/tickets');
const artistsRoutes = require('./routes/artists');
const schedulesRoutes = require('./routes/schedules');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
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
  res.json({ status: 'ok', industry: 'Entertainment OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Entertainment OS',
    version: '1.0.0',
    description: 'Entertainment Industry Operating System',
    endpoints: ['/api/events', '/api/venues', '/api/tickets', '/api/artists', '/api/schedules', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5200;
console.log('Entertainment OS starting on port', PORT);

module.exports = app;