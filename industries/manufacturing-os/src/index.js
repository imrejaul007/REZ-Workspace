/**
 * Manufacturing OS - Industry Operating System
 * Port: 5150
 *
 * Merged from: manufacturing (routes) + manufacturing-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5150;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged manufacturing directory
const productsRoutes = require('./routes/products');
const machinesRoutes = require('./routes/machines');
const productionRoutes = require('./routes/production');
const inventoryRoutes = require('./routes/inventory');
const ordersRoutes = require('./routes/orders');
const qualityRoutes = require('./routes/quality');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { products: [], machines: [], productions: [], inventory: [] };

// Mount comprehensive routes
app.use('/api/products', productsRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'manufacturing-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Manufacturing OS',
    version: '1.0.0',
    description: 'Manufacturing Industry Operating System',
    twins: ['Product', 'Machine', 'Production', 'Inventory'],
    agents: ['ProductionSched', 'QualityCtrl', 'MaintenancePred', 'SupplyChain', 'SafetyInsp'],
    endpoints: [
      '/api/products', '/api/machines', '/api/production', '/api/inventory',
      '/api/orders', '/api/quality', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'product-twin', name: 'Product Twin', type: 'product' },
      { id: 'machine-twin', name: 'Machine Twin', type: 'machine' },
      { id: 'production-twin', name: 'Production Twin', type: 'production' },
      { id: 'inventory-twin', name: 'Inventory Twin', type: 'inventory' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'production-sched', name: 'ProductionSched Agent' },
      { id: 'quality-ctrl', name: 'QualityCtrl Agent' },
      { id: 'maintenance-pred', name: 'MaintenancePred Agent' },
      { id: 'supply-chain', name: 'SupplyChain Agent' },
      { id: 'safety-insp', name: 'SafetyInsp Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

// Start server
app.listen(PORT, () => console.log(`🏭 Manufacturing OS running on port ${PORT}`));

module.exports = app;
