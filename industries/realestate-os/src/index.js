/**
 * RTMN Real Estate OS - Property Management Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5230;

app.use(cors());
app.use(helmet());
app.use(express.json());

const propertiesRouter = require('./routes/properties');
const buyersRouter = require('./routes/buyers');
const sellersRouter = require('./routes/sellers');
const agentsRouter = require('./routes/agents');
const listingsRouter = require('./routes/listings');
const viewingsRouter = require('./routes/viewings');
const transactionsRouter = require('./routes/transactions');
const twinsRouter = require('./routes/twins');
const analyticsRouter = require('./routes/analytics');

app.use('/api/properties', propertiesRouter);
app.use('/api/buyers', buyersRouter);
app.use('/api/sellers', sellersRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/viewings', viewingsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'Real Estate OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Real Estate OS',
    description: 'Property Management Platform with Digital Twins',
    version: '1.0.0',
    industry: 'Real Estate',
    digitalTwins: ['Property Twin', 'Buyer Twin', 'Agent Twin', 'Market Twin'],
    aiAgents: ['Matching Agent', 'Valuation Agent', 'Negotiation Agent'],
    routes: ['/api/properties', '/api/buyers', '/api/sellers', '/api/agents', '/api/listings', '/api/viewings', '/api/transactions', '/api/twins', '/api/analytics']
  });
});

app.listen(PORT, () => console.log(`🏠 RTMN Real Estate OS running on port ${PORT}`));
module.exports = app;