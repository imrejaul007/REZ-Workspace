/**
 * Fitness OS - Industry Operating System
 * Port: 5110
 *
 * Merged from: fitness (routes) + fitness-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5110;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged fitness directory
const membershipsRoutes = require('./routes/memberships');
const classesRoutes = require('./routes/classes');
const trainersRoutes = require('./routes/trainers');
const facilitiesRoutes = require('./routes/facilities');
const bookingsRoutes = require('./routes/bookings');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { members: [], trainers: [], equipment: [], classes: [] };

// Mount comprehensive routes
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
  res.json({ status: 'healthy', service: 'fitness-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Fitness OS',
    version: '1.0.0',
    description: 'Fitness Industry Operating System',
    twins: ['Member', 'Trainer', 'Equipment', 'Class'],
    agents: ['Membership', 'ClassBooking', 'FitnessCoach', 'CheckIn', 'Retention'],
    endpoints: [
      '/api/memberships', '/api/classes', '/api/trainers', '/api/facilities',
      '/api/bookings', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'member-twin', name: 'Member Twin' },
      { id: 'trainer-twin', name: 'Trainer Twin' },
      { id: 'equipment-twin', name: 'Equipment Twin' },
      { id: 'class-twin', name: 'Class Twin' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'membership', name: 'Membership Agent' },
      { id: 'class-booking', name: 'ClassBooking Agent' },
      { id: 'fitness-coach', name: 'FitnessCoach Agent' },
      { id: 'check-in', name: 'CheckIn Agent' },
      { id: 'retention', name: 'Retention Agent' }
    ]
  });
});

// Member endpoints
app.get('/api/members', (req, res) => res.json({ members: data.members }));
app.post('/api/members', (req, res) => {
  const item = { id: `mem_${Date.now()}`, ...req.body };
  data.members.push(item);
  res.status(201).json(item);
});

// Trainer endpoints
app.get('/api/trainers', (req, res) => res.json({ trainers: data.trainers }));
app.post('/api/trainers', (req, res) => {
  const item = { id: `tr_${Date.now()}`, ...req.body };
  data.trainers.push(item);
  res.status(201).json(item);
});

// Equipment endpoints
app.get('/api/equipment', (req, res) => res.json({ equipment: data.equipment }));
app.post('/api/equipment', (req, res) => {
  const item = { id: `eq_${Date.now()}`, ...req.body };
  data.equipment.push(item);
  res.status(201).json(item);
});

// Class endpoints
app.get('/api/classes', (req, res) => res.json({ classes: data.classes }));
app.post('/api/classes', (req, res) => {
  const item = { id: `cls_${Date.now()}`, ...req.body };
  data.classes.push(item);
  res.status(201).json(item);
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal error' }));

// Start server
app.listen(PORT, () => console.log(`💪 Fitness OS running on port ${PORT}`));

module.exports = app;
