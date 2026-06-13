/**
 * RTMN Hotel OS - Unified Hotel Management Hub
 * Connects: Guest Twin Service (8447), Room Twin Service (8444), Property Twin Service (8448)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5025;

// Twin service URLs
const GUEST_TWIN_URL = process.env.GUEST_TWIN_URL || 'http://localhost:8447';
const ROOM_TWIN_URL = process.env.ROOM_TWIN_URL || 'http://localhost:8444';
const PROPERTY_TWIN_URL = process.env.PROPERTY_TWIN_URL || 'http://localhost:8448';

app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
const roomsRouter = require('./routes/rooms');
const reservationsRouter = require('./routes/reservations');
const guestsRouter = require('./routes/guests');
const amenitiesRouter = require('./routes/amenities');
const housekeepingRouter = require('./routes/housekeeping');
const billingRouter = require('./routes/billing');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

// Mount routes
app.use('/api/rooms', roomsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/guests', guestsRouter);
app.use('/api/amenities', amenitiesRouter);
app.use('/api/housekeeping', housekeepingRouter);
app.use('/api/billing', billingRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

// Twin Service Proxy Routes
app.use('/api/twin/guest', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${GUEST_TWIN_URL}${req.originalUrl.replace('/api/twin/guest', '/api/twins/guest')}`,
      data: req.body,
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Guest Twin unavailable' });
  }
});

app.use('/api/twin/room', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${ROOM_TWIN_URL}${req.originalUrl.replace('/api/twin/room', '/api')}`,
      data: req.body,
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Room Twin unavailable' });
  }
});

app.use('/api/twin/property', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${PROPERTY_TWIN_URL}${req.originalUrl.replace('/api/twin/property', '/api/twins/property')}`,
      data: req.body,
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Property Twin unavailable' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Hotel OS',
    version: '1.0.0',
    port: PORT,
    twinServices: {
      guest: GUEST_TWIN_URL,
      room: ROOM_TWIN_URL,
      property: PROPERTY_TWIN_URL
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Hotel OS',
    description: 'Hotel Management Platform with Digital Twins',
    version: '1.0.0',
    industry: 'Hospitality - Hotels',
    digitalTwins: ['Guest Twin (8447)', 'Room Twin (8444)', 'Property Twin (8448)'],
    aiAgents: ['AI Concierge', 'Upsell Engine', 'Predictive Housekeeping'],
    routes: ['/api/rooms', '/api/reservations', '/api/guests', '/api/amenities', '/api/housekeeping', '/api/billing', '/api/twins', '/api/agents'],
    twinServices: ['Guest Twin', 'Room Twin', 'Property Twin']
  });
});

app.listen(PORT, () => {
  console.log(`🏨 RTMN Hotel OS running on port ${PORT}`);
  console.log(`   Twin Services: Guest(8447), Room(8444), Property(8448)`);
});

module.exports = app;
