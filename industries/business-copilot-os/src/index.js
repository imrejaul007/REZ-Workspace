/**
 * RTMN Business Copilot OS - AI-Powered Business Intelligence
 * 6 Interfaces: Memory, Twin, Intelligence, Workflow, Agent, Execution
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(helmet());
app.use(express.json());

const memoryRouter = require('./routes/memory');
const twinRouter = require('./routes/twin');
const intelligenceRouter = require('./routes/intelligence');
const workflowRouter = require('./routes/workflow');
const agentRouter = require('./routes/agent');
const executionRouter = require('./routes/execution');
const twinsRouter = require('./routes/twins');

app.use('/api/memory', memoryRouter);
app.use('/api/twin', twinRouter);
app.use('/api/intelligence', intelligenceRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/agent', agentRouter);
app.use('/api/execution', executionRouter);
app.use('/api/twins', twinsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'Business Copilot OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Business Copilot OS',
    description: 'AI-Powered Business Intelligence Platform',
    version: '1.0.0',
    interfaces: ['Memory', 'Twin', 'Intelligence', 'Workflow', 'Agent', 'Execution'],
    digitalTwins: ['Business Twin', 'Financial Twin', 'Operational Twin', 'Market Twin'],
    aiAgents: ['Insight Agent', 'Automation Agent', 'Planning Agent'],
    routes: ['/api/memory', '/api/twin', '/api/intelligence', '/api/workflow', '/api/agent', '/api/execution', '/api/twins']
  });
});

app.listen(PORT, () => {
  console.log(`🤖 RTMN Business Copilot OS running on port ${PORT}`);
  console.log(`   Interfaces: Memory, Twin, Intelligence, Workflow, Agent, Execution`);
});

module.exports = app;