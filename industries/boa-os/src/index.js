/**
 * RTMN BOA OS - Business Operating Assistant
 * Multi-Executive Runtime: CEO, CFO, COO, CMO, CHRO, CRO
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(helmet());
app.use(express.json());

const executivesRouter = require('./routes/executives');
const strategyRouter = require('./routes/strategy');
const decisionsRouter = require('./routes/decisions');
const reportsRouter = require('./routes/reports');
const tasksRouter = require('./routes/tasks');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

app.use('/api/executives', executivesRouter);
app.use('/api/strategy', strategyRouter);
app.use('/api/decisions', decisionsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'BOA OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN BOA OS',
    description: 'Business Operating Assistant - Multi-Executive Platform',
    version: '1.0.0',
    executives: ['CEO', 'CFO', 'COO', 'CMO', 'CHRO', 'CRO'],
    digitalTwins: ['Strategy Twin', 'Finance Twin', 'Operations Twin', 'HR Twin', 'Marketing Twin', 'Revenue Twin'],
    aiAgents: ['Decision Agent', 'Analysis Agent', 'Planning Agent', 'Coordination Agent'],
    routes: ['/api/executives', '/api/strategy', '/api/decisions', '/api/reports', '/api/tasks', '/api/twins', '/api/agents']
  });
});

app.listen(PORT, () => {
  console.log(`🎯 RTMN BOA OS running on port ${PORT}`);
  console.log(`   Executives: CEO, CFO, COO, CMO, CHRO, CRO`);
});

module.exports = app;