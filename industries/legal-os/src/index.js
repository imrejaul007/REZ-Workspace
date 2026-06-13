/**
 * RTMN Legal OS - Complete Legal Industry Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
const casesRouter = require('./routes/cases');
const clientsRouter = require('./routes/clients');
const documentsRouter = require('./routes/documents');
const billingRouter = require('./routes/billing');
const calendarRouter = require('./routes/calendar');
const researchRouter = require('./routes/research');
const contractsRouter = require('./routes/contracts');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

// Mount routes
app.use('/api/cases', casesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/research', researchRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Legal OS',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Legal OS',
    description: 'Legal Industry Platform with Digital Twins & AI Agents',
    version: '1.0.0',
    industry: 'Legal Services',
    digitalTwins: ['Case Twin', 'Client Twin', 'Document Twin', 'Contract Twin', 'Court Twin'],
    aiAgents: ['Case Analysis Agent', 'Research Agent', 'Document Agent', 'Billing Agent'],
    routes: [
      '/api/cases', '/api/clients', '/api/documents', '/api/billing',
      '/api/calendar', '/api/research', '/api/contracts', '/api/twins', '/api/agents'
    ],
    connections: [
      'CorpID', 'MemoryOS', 'KnowledgeGraphOS', 'TwinOS',
      'SimulationOS', 'Business Copilot', 'BOA', 'SUTAR'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Legal OS Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`⚖️  RTMN Legal OS running on port ${PORT}`);
  console.log(`   Digital Twins: Case, Client, Document, Contract, Court`);
  console.log(`   AI Agents: Case Analysis, Research, Document, Billing`);
});

module.exports = app;
