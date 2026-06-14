/**
 * BOA Multi-Executive Runtime Service
 * Port: 3017 (sharing with boa-council ecosystem)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { BOACoordinator, CEOEngine, CFOEngine, COOEngine, CMOEngine, CHROEngine, CROEngine } from './multiExecutive.js';

const app = express();
const PORT = process.env.PORT || 3017;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logger
const logger = {
  info: (msg, meta = {}) => console.log(JSON.stringify({ level: 'info', msg, ...meta, timestamp: new Date().toISOString() })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', msg, ...meta, timestamp: new Date().toISOString() }))
};

// Initialize BOA Coordinator
const coordinator = new BOACoordinator();

// In-memory storage
const sessions = new Map();
const insights = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'boa-os', timestamp: new Date().toISOString() });
});

// Session management
app.post('/api/sessions', (req, res) => {
  try {
    const { companyId, context } = req.body;
    const session = {
      id: uuidv4(),
      companyId,
      context: context || {},
      createdAt: new Date().toISOString(),
      executives: { ceo: null, cfo: null, coo: null, cmo: null, chro: null, cro: null }
    };
    sessions.set(session.id, session);
    logger.info('Session created', { sessionId: session.id, companyId });
    res.json({ success: true, session });
  } catch (error) {
    logger.error('Failed to create session', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ session });
});

// Full analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { data, sessionId } = req.body;
    const analysisId = uuidv4();

    logger.info('Starting full analysis', { analysisId, sessionId });

    const analysis = await coordinator.coordinate(data);

    // Store analysis
    insights.set(analysisId, analysis);

    // Update session if provided
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.executives = {
        ceo: analysis.executives.ceo,
        cfo: analysis.executives.cfo,
        coo: analysis.executives.coo,
        cmo: analysis.executives.cmo,
        chro: analysis.executives.chro,
        cro: analysis.executives.cro
      };
      session.lastAnalysis = analysis;
    }

    logger.info('Analysis complete', { analysisId });
    res.json({ success: true, analysisId, analysis });
  } catch (error) {
    logger.error('Analysis failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Individual executive queries
app.post('/api/query/:executive', async (req, res) => {
  try {
    const { executive } = req.params;
    const { data } = req.body;

    const executiveLower = executive.toLowerCase();
    if (!['ceo', 'cfo', 'coo', 'cmo', 'chro', 'cro'].includes(executiveLower)) {
      return res.status(400).json({ error: 'Invalid executive. Use: ceo, cfo, coo, cmo, chro, or cro' });
    }

    logger.info('Querying executive', { executive: executiveLower });
    const result = await coordinator.query(executiveLower, data);

    res.json({ success: true, executive: executiveLower, result });
  } catch (error) {
    logger.error('Executive query failed', { executive: req.params.executive, error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get stored analysis
app.get('/api/insights/:id', (req, res) => {
  const insight = insights.get(req.params.id);
  if (!insight) {
    return res.status(404).json({ error: 'Insight not found' });
  }
  res.json({ insight });
});

// Get all insights for a session
app.get('/api/sessions/:id/insights', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const sessionInsights = [];
  insights.forEach((insight, id) => {
    sessionInsights.push({ id, insight });
  });

  res.json({ insights: sessionInsights, lastAnalysis: session.lastAnalysis });
});

// Priority actions endpoint
app.post('/api/priorities', async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await coordinator.coordinate(data);
    const priorities = coordinator.prioritizeActions(Object.values(analysis.executives));

    res.json({ success: true, priorities });
  } catch (error) {
    logger.error('Priority calculation failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Risk consolidation endpoint
app.post('/api/risks', async (req, res) => {
  try {
    const { data } = req.body;
    const analysis = await coordinator.coordinate(data);
    const risks = coordinator.consolidateRisks(Object.values(analysis.executives));

    res.json({ success: true, risks });
  } catch (error) {
    logger.error('Risk consolidation failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Quick metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json({
    metrics: {
      activeSessions: sessions.size,
      totalInsights: insights.size,
      executives: {
        ceo: { status: 'active', capabilities: ['strategy', 'vision', 'risk'] },
        cfo: { status: 'active', capabilities: ['finance', 'compliance', 'forecast'] },
        coo: { status: 'active', capabilities: ['operations', 'supply_chain', 'efficiency'] },
        cmo: { status: 'active', capabilities: ['marketing', 'brand', 'acquisition'] },
        chro: { status: 'active', capabilities: ['hr', 'talent', 'culture'] },
        cro: { status: 'active', capabilities: ['sales', 'revenue', 'growth'] }
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`BOA Multi-Executive Runtime started`, { port: PORT });
  console.log(`🏢 BOA OS running on port ${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   - GET  /health`);
  console.log(`   - POST /api/sessions`);
  console.log(`   - GET  /api/sessions/:id`);
  console.log(`   - POST /api/analyze`);
  console.log(`   - POST /api/query/:executive`);
  console.log(`   - GET  /api/insights/:id`);
  console.log(`   - GET  /api/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Shutting down BOA OS');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Shutting down BOA OS');
  process.exit(0);
});

export default app;
