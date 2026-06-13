/**
 * RTMN Automotive OS - Vehicle Management Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5080;

app.use(cors());
app.use(helmet());
app.use(express.json());

const vehiclesRouter = require('./routes/vehicles');
const customersRouter = require('./routes/customers');
const serviceRouter = require('./routes/service');
const inventoryRouter = require('./routes/inventory');
const salesRouter = require('./routes/sales');
const analyticsRouter = require('./routes/analytics');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

app.use('/api/vehicles', vehiclesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/service', serviceRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/sales', salesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'Automotive OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Automotive OS',
    description: 'Vehicle Management Platform with Digital Twins',
    version: '1.0.0',
    industry: 'Automotive',
    digitalTwins: ['Vehicle Twin', 'Engine Twin', 'Customer Twin', 'Service Twin'],
    aiAgents: ['Service Advisor', 'Inventory Agent', 'Sales Agent'],
    routes: ['/api/vehicles', '/api/customers', '/api/service', '/api/inventory', '/api/sales', '/api/twins', '/api/agents']
  });
});

app.listen(PORT, () => console.log(`🚗 RTMN Automotive OS running on port ${PORT}`));
module.exports = app;