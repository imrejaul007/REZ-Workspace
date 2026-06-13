/**
 * RTMN Hospitality OS - Complete Hospitality Industry Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5040;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
const roomsRouter = require('./routes/rooms');
const bookingsRouter = require('./routes/bookings');
const guestsRouter = require('./routes/guests');
const servicesRouter = require('./routes/services');
const analyticsRouter = require('./routes/analytics');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

// Mount routes
app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/guests', guestsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Hospitality OS',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Hospitality OS',
    description: 'Hospitality Industry Platform with Digital Twins & AI Agents',
    version: '1.0.0',
    industry: 'Hospitality',
    digitalTwins: ['Guest Twin', 'Room Twin', 'Booking Twin', 'Revenue Twin', 'Service Twin'],
    aiAgents: ['Booking Agent', 'Revenue Agent', 'Guest Experience Agent', 'Housekeeping Agent'],
    routes: [
      '/api/rooms', '/api/bookings', '/api/guests', '/api/services',
      '/api/analytics', '/api/twins', '/api/agents'
    ],
    connections: [
      'CorpID', 'MemoryOS', 'KnowledgeGraphOS', 'TwinOS',
      'SimulationOS', 'Business Copilot', 'BOA', 'SUTAR'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Hospitality OS Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🏨 RTMN Hospitality OS running on port ${PORT}`);
  console.log(`   Digital Twins: Guest, Room, Booking, Revenue, Service`);
  console.log(`   AI Agents: Booking, Revenue, Guest Experience, Housekeeping`);
});

module.exports = app;
