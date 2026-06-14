/**
 * Financial OS - Industry Operating System
 * Port: 5220
 *
 * Merged from: financial (routes) + financial-os (twin services)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5220;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Import route modules from merged financial directory
const accountsRoutes = require('./routes/accounts');
const transactionsRoutes = require('./routes/transactions');
const customersRoutes = require('./routes/customers');
const loansRoutes = require('./routes/loans');
const cardsRoutes = require('./routes/cards');
const analyticsRoutes = require('./routes/analytics');
const twinsRoutes = require('./routes/twins');
const agentsRoutes = require('./routes/agents');

// In-memory data stores
const data = { accounts: [], transactions: [], customers: [], loans: [] };

// Mount comprehensive routes
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/twins', twinsRoutes);
app.use('/api/agents', agentsRoutes);

// Health and root endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'financial-os', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Financial OS',
    version: '1.0.0',
    description: 'Financial Services Industry Operating System',
    twins: ['Account', 'Transaction', 'Customer', 'Loan'],
    agents: ['FraudDetect', 'CreditAssess', 'InvestmentAdvisor', 'ComplianceCheck', 'KYC'],
    endpoints: [
      '/api/accounts', '/api/transactions', '/api/customers', '/api/loans',
      '/api/cards', '/api/analytics', '/api/twins', '/api/agents'
    ]
  });
});

// Twin service endpoints
app.get('/api/twins', (req, res) => {
  res.json({
    twins: [
      { id: 'account-twin', name: 'Account Twin', type: 'account' },
      { id: 'transaction-twin', name: 'Transaction Twin', type: 'transaction' },
      { id: 'customer-twin', name: 'Customer Twin', type: 'customer' },
      { id: 'loan-twin', name: 'Loan Twin', type: 'loan' }
    ]
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { id: 'fraud-detect', name: 'FraudDetect Agent' },
      { id: 'credit-assess', name: 'CreditAssess Agent' },
      { id: 'investment-advisor', name: 'InvestmentAdvisor Agent' },
      { id: 'compliance-check', name: 'ComplianceCheck Agent' },
      { id: 'kyc', name: 'KYC Agent' }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

// Start server
app.listen(PORT, () => console.log(`💰 Financial OS running on port ${PORT}`));

module.exports = app;
