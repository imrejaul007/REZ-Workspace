/**
 * RTMN Fashion OS - Fashion Retail Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5100;

app.use(cors());
app.use(helmet());
app.use(express.json());

const productsRouter = require('./routes/products');
const collectionsRouter = require('./routes/collections');
const ordersRouter = require('./routes/orders');
const inventoryRouter = require('./routes/inventory');
const trendsRouter = require('./routes/trends');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

app.use('/api/products', productsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'Fashion OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Fashion OS',
    description: 'Fashion Retail Platform with Digital Twins',
    version: '1.0.0',
    industry: 'Fashion & Apparel',
    digitalTwins: ['Product Twin', 'Collection Twin', 'Inventory Twin', 'Trend Twin'],
    aiAgents: ['Style Advisor', 'Trend Agent', 'Inventory Agent'],
    routes: ['/api/products', '/api/collections', '/api/orders', '/api/inventory', '/api/trends', '/api/twins', '/api/agents']
  });
});

app.listen(PORT, () => console.log(`👗 RTMN Fashion OS running on port ${PORT}`));
module.exports = app;