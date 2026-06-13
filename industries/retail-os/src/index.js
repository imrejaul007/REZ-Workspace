/**
 * RTMN Retail OS - Complete Retail Industry Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5030;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
const productsRouter = require('./routes/products');
const customersRouter = require('./routes/customers');
const ordersRouter = require('./routes/orders');
const inventoryRouter = require('./routes/inventory');
const analyticsRouter = require('./routes/analytics');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

// Mount routes
app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Retail OS',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Retail OS',
    description: 'Retail Industry Platform with Digital Twins & AI Agents',
    version: '1.0.0',
    industry: 'Retail',
    digitalTwins: ['Customer Twin', 'Product Twin', 'Inventory Twin', 'Order Twin', 'Revenue Twin'],
    aiAgents: ['Pricing Agent', 'Inventory Agent', 'Customer Agent', 'Recommendation Agent'],
    routes: [
      '/api/products', '/api/customers', '/api/orders', '/api/inventory',
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
  console.error('Retail OS Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🏪 RTMN Retail OS running on port ${PORT}`);
  console.log(`   Digital Twins: Customer, Product, Inventory, Order, Revenue`);
  console.log(`   AI Agents: Pricing, Inventory, Customer, Recommendation`);
});

module.exports = app;
