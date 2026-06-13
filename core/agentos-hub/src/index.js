/**
 * AgentOS Hub - Central registry for all AI agents
 * Manages 121+ agents across 24 industries
 */
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import Redis from 'ioredis';

import { AgentRegistry } from './services/agentRegistry.js';
import { AgentOrchestrator } from './services/agentOrchestrator.js';
import { AgentMetrics } from './services/agentMetrics.js';
import agentRoutes from './routes/agents.js';
import industryAgentRoutes from './routes/industryAgents.js';

const app = express();
const PORT = process.env.PORT || 4001;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

// Redis for state
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize services
const agentRegistry = new AgentRegistry({ redis, logger });
const orchestrator = new AgentOrchestrator({ redis, logger });
const metrics = new AgentMetrics({ redis, logger });

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      duration: Date.now() - start,
      status: res.statusCode
    });
  });
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const agentCount = agentRegistry.getTotalCount();
  const industryCount = agentRegistry.getIndustryCount();
  
  res.json({
    status: 'healthy',
    service: 'agentos-hub',
    version: '1.0.0',
    agents: agentCount,
    industries: industryCount,
    timestamp: new Date().toISOString()
  });
});

// Statistics
app.get('/stats', async (req, res) => {
  res.json({
    totalAgents: agentRegistry.getTotalCount(),
    byIndustry: agentRegistry.getCountByIndustry(),
    byRole: agentRegistry.getCountByRole(),
    activeAgents: await agentRegistry.getActiveCount(),
    metrics: await metrics.getMetrics()
  });
});

// Catalog
app.get('/catalog', async (req, res) => {
  res.json(agentRegistry.getCatalog());
});

// Routes
app.use('/agents', agentRoutes);
app.use('/industries', industryAgentRoutes);

// Orchestration endpoints
app.post('/orchestrate', async (req, res) => {
  try {
    const { agents, task, strategy } = req.body;
    const result = await orchestrator.execute(agents, task, strategy);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Orchestration failed' });
  }
});

// Initialize and start
async function initialize() {
  await agentRegistry.initialize();
  logger.info(`AgentOS Hub initialized with ${agentRegistry.getTotalCount()} agents across ${agentRegistry.getIndustryCount()} industries`);
}

app.listen(PORT, async () => {
  await initialize();
  logger.info(`AgentOS Hub running on port ${PORT}`);
});

export default app;
