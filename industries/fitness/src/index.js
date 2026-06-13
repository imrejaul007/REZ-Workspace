const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const membershipsRoutes = require('./routes/memberships');
const classesRoutes = require('./routes/classes');
const trainersRoutes = require('./routes/trainers');
const facilitiesRoutes = require('./routes/facilities');
const bookingsRoutes = require('./routes/bookings');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
app.use('/api/memberships', membershipsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/trainers', trainersRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', industry: 'Fitness OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Fitness OS',
    version: '1.0.0',
    description: 'Fitness Industry Operating System',
    endpoints: ['/api/memberships', '/api/classes', '/api/trainers', '/api/facilities', '/api/bookings', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5110;
console.log('Fitness OS starting on port', PORT);

module.exports = app;
