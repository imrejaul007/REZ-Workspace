/**
 * RTMN Transport OS - Transportation & Logistics Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5240;

app.use(cors());
app.use(helmet());
app.use(express.json());

const vehiclesRouter = require('./routes/vehicles');
const driversRouter = require('./routes/drivers');
const ridersRouter = require('./routes/riders');
const tripsRouter = require('./routes/trips');
const routesRouter = require('./routes/routes');
const maintenanceRouter = require('./routes/maintenance');
const analyticsRouter = require('./routes/analytics');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/riders', ridersRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/routes', routesRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'Transport OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Transport OS',
    description: 'Transportation & Logistics Platform with Digital Twins',
    version: '1.0.0',
    industry: 'Transportation',
    digitalTwins: ['Vehicle Twin', 'Driver Twin', 'Rider Twin', 'Route Twin'],
    aiAgents: ['Dispatch Agent', 'Route Optimization Agent', 'Safety Agent'],
    routes: ['/api/vehicles', '/api/drivers', '/api/riders', '/api/trips', '/api/routes', '/api/maintenance', '/api/twins', '/api/agents']
  });
});

app.listen(PORT, () => console.log(`🚕 RTMN Transport OS running on port ${PORT}`));
module.exports = app;