/**
 * RTMN Workforce OS
 *
 * AI workforce management across industries.
 * Manages agents, skills, teams, and performance across all 24 industries.
 *
 * Port: 3021
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

import agentsRoutes from './routes/agents.js';
import teamsRoutes from './routes/teams.js';
import skillsRoutes from './routes/skills.js';
import performanceRoutes from './routes/performance.js';

const app = express();
const PORT = process.env.PORT || 3021;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Agent States
export const AGENT_STATES = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
  TRAINING: 'training',
  MAINTENANCE: 'maintenance'
};

// Agent Roles
export const AGENT_ROLES = {
  COORDINATOR: 'coordinator',
  SPECIALIST: 'specialist',
  ANALYST: 'analyst',
  EXECUTOR: 'executor',
  MONITOR: 'monitor'
};

// Industry Coverage
export const INDUSTRIES = [
  'fitness', 'gaming', 'government', 'homeServices', 'manufacturing',
  'nonprofit', 'professional', 'sports', 'travel', 'construction',
  'entertainment', 'financial', 'healthcare', 'education', 'retail',
  'technology', 'food', 'automotive', 'realestate', 'media',
  'legal', 'agriculture', 'energy', 'logistics'
];

// Agent Registry
export const agentRegistry = new Map();

// Team Registry
export const teamRegistry = new Map();

// Skills Library
export const skillsLibrary = new Map();

export { logger };

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'workforce-os',
    version: '1.0.0',
    port: PORT,
    agents: agentRegistry.size,
    teams: teamRegistry.size,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Workforce OS',
    version: '1.0.0',
    description: 'AI workforce management across industries',
    port: PORT,
    capabilities: [
      'AI agent management',
      'Team orchestration',
      'Skills management',
      'Performance tracking'
    ],
    endpoints: [
      'GET /api/agents',
      'POST /api/agents',
      'GET /api/teams',
      'GET /api/skills',
      'GET /api/performance'
    ]
  });
});

// Routes
app.use('/api/agents', agentsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/performance', performanceRoutes);

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  logger.info(`Workforce OS running on port ${PORT}`);
  logger.info(`Industry coverage: ${INDUSTRIES.length} industries`);
});

export { app };
