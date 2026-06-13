const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const machinesRoutes = require('./routes/machines');
const productionRoutes = require('./routes/production');
const qualityRoutes = require('./routes/quality');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', industry: 'Manufacturing OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Manufacturing OS',
    version: '1.0.0',
    description: 'Manufacturing Industry Operating System',
    endpoints: ['/api/products', '/api/orders', '/api/inventory', '/api/machines', '/api/production', '/api/quality', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5150;
console.log('Manufacturing OS starting on port', PORT);

module.exports = app;