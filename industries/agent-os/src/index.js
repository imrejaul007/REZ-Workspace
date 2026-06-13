/**
 * RTMN Agent OS - Universal Agent Orchestration Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR, Genie
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(helmet());
app.use(express.json());

const agentsRouter = require('./routes/agents');
const tasksRouter = require('./routes/tasks');
const workflowsRouter = require('./routes/workflows');
const capabilitiesRouter = require('./routes/capabilities');
const twinsRouter = require('./routes/twins');

app.use('/api/agents', agentsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/capabilities', capabilitiesRouter);
app.use('/api/twins', twinsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'Agent OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Agent OS',
    description: 'Universal Agent Orchestration Platform',
    version: '1.0.0',
    digitalTwins: ['Agent Twin', 'Task Twin', 'Workflow Twin', 'Capability Twin'],
    routes: ['/api/agents', '/api/tasks', '/api/workflows', '/api/capabilities', '/api/twins']
  });
});

app.listen(PORT, () => console.log(`🤖 RTMN Agent OS running on port ${PORT}`));
module.exports = app;