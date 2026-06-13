const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import routes
const accountsRoutes = require('./routes/accounts');
const transactionsRoutes = require('./routes/transactions');
const customersRoutes = require('./routes/customers');
const cardsRoutes = require('./routes/cards');
const loansRoutes = require('./routes/loans');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// Mount routes
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', industry: 'Financial OS', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Financial OS',
    version: '1.0.0',
    description: 'Financial Industry Operating System',
    endpoints: ['/api/accounts', '/api/transactions', '/api/customers', '/api/cards', '/api/loans', '/api/analytics', '/api/twins', '/api/agents']
  });
});

const PORT = 5220;
console.log('Financial OS starting on port', PORT);

module.exports = app;