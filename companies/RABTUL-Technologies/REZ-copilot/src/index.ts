/**
 * REZ Copilot - AI Deal Coaching Service
 * Port 4140
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/services';
import { logger } from './middleware/logger';
import routes from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'REZ Copilot',
    version: '1.0.0',
    description: 'AI Deal Coaching & Revenue Intelligence',
    port: config.port,
    endpoints: {
      chat: 'POST /api/chat',
      sessions: 'GET /api/chat/sessions',
      analyzeDeal: 'POST /api/deals/analyze',
      dealScore: 'GET /api/deals/:dealId/score',
      generateEmail: 'POST /api/email/generate',
      emailTemplates: 'GET /api/email/templates',
      callPrep: 'POST /api/call-prep/generate',
      research: 'POST /api/research/company',
      talkTracks: 'GET /api/talk-tracks/:dealId',
      health: 'GET /api/health',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-copilot',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(config.port, () => {
  logger.info(`REZ Copilot running on port ${config.port}`);
  logger.info(`AI Provider: ${config.ai.defaultProvider}`);
  logger.info(`AI Model: ${config.ai.defaultModel}`);
});

export default app;
