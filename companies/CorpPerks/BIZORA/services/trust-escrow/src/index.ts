import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import escrowRoutes from './routes/escrow';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4008;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'ok',
    service: 'trust-escrow',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mongodb: mongoStatus
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1;

  if (!mongoStatus) {
    res.status(503).json({
      status: 'not ready',
      mongodb: mongoStatus
    });
    return;
  }

  res.json({
    status: 'ready',
    mongodb: mongoStatus
  });
});

// API routes
app.use('/api/escrow', escrowRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An internal error occurred'
      : err.message
  });
});

// Database connection
const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trust-escrow';

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB', { uri: mongoUri.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('MongoDB connection error', { error });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Trust Escrow Service started`, {
      port: PORT,
      env: process.env.NODE_ENV || 'development'
    });
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API endpoint: http://localhost:${PORT}/api/escrow`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

export default app;
