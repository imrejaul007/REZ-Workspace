/**
 * RTMN Beauty OS - Salon & Spa Management Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5090;

app.use(cors());
app.use(helmet());
app.use(express.json());

const appointmentsRouter = require('./routes/appointments');
const clientsRouter = require('./routes/clients');
const servicesRouter = require('./routes/services');
const staffRouter = require('./routes/staff');
const inventoryRouter = require('./routes/inventory');
const productsRouter = require('./routes/products');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

app.use('/api/appointments', appointmentsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/staff', staffRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/products', productsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'Beauty OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Beauty OS',
    description: 'Salon & Spa Management Platform with Digital Twins',
    version: '1.0.0',
    industry: 'Beauty & Wellness',
    digitalTwins: ['Client Twin', 'Service Twin', 'Staff Twin', 'Inventory Twin'],
    aiAgents: ['Booking Agent', 'Recommendation Agent', 'Inventory Agent'],
    routes: ['/api/appointments', '/api/clients', '/api/services', '/api/staff', '/api/inventory', '/api/products', '/api/twins', '/api/agents']
  });
});

app.listen(PORT, () => console.log(`💇 RTMN Beauty OS running on port ${PORT}`));
module.exports = app;