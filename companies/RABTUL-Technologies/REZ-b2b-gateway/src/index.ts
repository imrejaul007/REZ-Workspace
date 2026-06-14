import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import { rateLimit } from 'express-rate-limit';
import gatewayRoutes from './routes/gateway';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// API Routes
app.use('/', gatewayRoutes);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
const PORT = parseInt(process.env.PORT || '4138');

async function start(): Promise<void> {
  try {
    // Redis connection for caching (optional)
    const redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => console.log('Redis error (non-fatal):', err.message));
    await redisClient.connect().catch(() => console.log('Redis not available, continuing without cache'));

    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-b2b-gateway',
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
app.listen(PORT, () => {
      console.log(`REZ B2B Gateway running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Unified endpoints:`);
      console.log(`  GET /api/unified/account/:id - Account view`);
      console.log(`  GET /api/unified/deal/:id - Deal view`);
      console.log(`  GET /api/unified/pipeline - Pipeline overview`);
      console.log(`  GET /api/unified/outreach/:id - Outreach summary`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  process.exit(0);
});

start();

export { app };
