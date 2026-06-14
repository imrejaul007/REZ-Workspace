import { logger } from ;
/**
 * REZ Partner Portal - Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';

const app = express();
const PORT = parseInt(process.env.PORT || '4134', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/partner-portal';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
});
app.use('/api/', limiter);

// Routes
app.use('/api', routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`[${new Date().toISOString()}] Connected to MongoDB`);
  } catch (error) {
    logger.error('MongoDB connection error:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start server
async function start(): Promise<void> {
  await connectDatabase();

  

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-partner-portal',
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
    logger.info(`[${new Date().toISOString()}] Partner Portal running on port ${PORT}`);
  });
}

start().catch(console.error);

export default app;
