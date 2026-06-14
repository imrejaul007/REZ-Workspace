/**
 * REZ Talent Platform
 * Shared talent infrastructure - Jobs, Applications, ATS, AI Matching
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

// Routes
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import employerRoutes from './routes/employer.js';
import candidateRoutes from './routes/candidates.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'talent-platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Readiness check
app.get('/ready', async (_req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;
  const ready = mongoOk;

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not ready',
    checks: {
      mongodb: mongoOk ? 'ok' : 'disconnected',
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/candidates', candidateRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-talent';

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✓ Connected to MongoDB');
  } catch (error) {
    logger.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 4020;

async function startServer(): Promise<void> {
  await connectDatabase();

  app.listen(PORT, () => {
    logger.info('');
    logger.info('╔═══════════════════════════════════════════════════╗');
    logger.info('║   REZ TALENT PLATFORM                          ║');
    logger.info('╠═══════════════════════════════════════════════════╣');
    logger.info(`║   Running on port ${PORT}                           ║`);
    logger.info(`║   Health: http://localhost:${PORT}/health           ║`);
    logger.info('╠═══════════════════════════════════════════════════╣');
    logger.info('║   API Endpoints:                               ║');
    logger.info('║   • GET  /api/jobs          - List jobs        ║');
    logger.info('║   • POST /api/jobs          - Create job      ║');
    logger.info('║   • POST /api/applications  - Apply           ║');
    logger.info('║   • GET  /api/employer      - Employer       ║');
    logger.info('╚═══════════════════════════════════════════════════╝');
    logger.info('');
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});

startServer();
