import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import negotiationRoutes from './routes/negotiations.js';
import rfqRoutes from './routes/rfq.js';
import quoteRoutes from './routes/quotes.js';
import { createLogger } from './utils/logger.js';
import { publishEvent } from './services/eventBus.js';

const logger = createLogger('negotiation-service');
const SERVICE_NAME = 'REZ-negotiation-engine';
const SERVICE_VERSION = '1.0.0';

const app: Express = express();

// Configuration
const PORT = process.env.PORT || 4191;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/REZ-negotiation-engine';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Request-Id']
}));

// JSON body parsing
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || uuid();

  res.on('finish', () => {
    logger.info('request_completed', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startTime
    });
  });

  res.setHeader('X-Request-ID', requestId);
  next();
});

// Health endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const isReady = mongoStatus === 'connected';
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    checks: { mongodb: mongoStatus },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/rfq', rfqRoutes);
app.use('/api/quotes', quoteRoutes);

// Service info
app.get('/api/info', (_req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    description: 'Negotiation Engine - RFQ, Quotes, and Counter-offers',
    endpoints: {
      negotiations: '/api/negotiations',
      rfq: '/api/rfq',
      quotes: '/api/quotes'
    }
  });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('unhandled_error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('mongodb_connected', { uri: MONGODB_URI.replace(/\/\/.*@/, '//****@') });
  } catch (error) {
    logger.error('mongodb_connection_failed', { error: String(error) });
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info('server_started', {
      service: SERVICE_NAME,
      port: PORT,
      env: NODE_ENV
    });
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  ${SERVICE_NAME.padEnd(50)}║
║  Port: ${String(PORT).padEnd(47)}║
║  Version: ${SERVICE_VERSION.padEnd(43)}║
║  Status: RUNNING                                     ║
╚══════════════════════════════════════════════════════════╝
    `);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('shutdown_signal_received', { signal: 'SIGTERM' });
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('shutdown_signal_received', { signal: 'SIGINT' });
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;
