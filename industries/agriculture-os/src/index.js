/**
 * RTMN Agriculture OS - Smart Farming Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5070;

app.use(cors());
app.use(helmet());
app.use(express.json());

const farmsRouter = require('./routes/farms');
const cropsRouter = require('./routes/crops');
const livestockRouter = require('./routes/livestock');
const irrigationRouter = require('./routes/irrigation');
const harvestRouter = require('./routes/harvest');
const analyticsRouter = require('./routes/analytics');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

app.use('/api/farms', farmsRouter);
app.use('/api/crops', cropsRouter);
app.use('/api/livestock', livestockRouter);
app.use('/api/irrigation', irrigationRouter);
app.use('/api/harvest', harvestRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'Agriculture OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Agriculture OS',
    description: 'Smart Farming Platform with Digital Twins',
    version: '1.0.0',
    industry: 'Agriculture',
    digitalTwins: ['Farm Twin', 'Crop Twin', 'Livestock Twin', 'Weather Twin', 'Soil Twin'],
    aiAgents: ['Crop Advisor', 'Irrigation Agent', 'Harvest Predictor'],
    routes: ['/api/farms', '/api/crops', '/api/livestock', '/api/irrigation', '/api/harvest', '/api/twins', '/api/agents']
  });
});

app.listen(PORT, () => console.log(`🌾 RTMN Agriculture OS running on port ${PORT}`));
module.exports = app;
