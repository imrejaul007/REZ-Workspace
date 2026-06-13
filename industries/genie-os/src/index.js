/**
 * RTMN Genie OS - AI Wish Fulfillment Engine
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR, AgentOS
 */

const express = require('express');
const cors = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(helmet());
app.use(express.json());

const wishesRouter = require('./routes/wishes');
const fulfillmentsRouter = require('./routes/fulfillments');
const templatesRouter = require('./routes/templates');
const skillsRouter = require('./routes/skills');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

app.use('/api/wishes', wishesRouter);
app.use('/api/fulfillments', fulfillmentsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'Genie OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Genie OS',
    description: 'AI Wish Fulfillment Engine - Making Your Wishes Come True',
    version: '1.0.0',
    digitalTwins: ['Wish Twin', 'Fulfillment Twin', 'User Twin'],
    aiAgents: ['Wish Parser', 'Fulfillment Agent', 'Quality Agent'],
    routes: ['/api/wishes', '/api/fulfillments', '/api/templates', '/api/skills', '/api/twins', '/api/agents']
  });
});

app.listen(PORT, () => console.log(`🧞 RTMN Genie OS running on port ${PORT}`));
module.exports = app;