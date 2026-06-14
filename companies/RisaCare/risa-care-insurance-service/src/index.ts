import { logger } from '../../shared/logger';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import insuranceRoutes from './routes/insuranceRoutes';

const app: Application = express();
const PORT = process.env.PORT || 4724;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_insurance';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    success: true,
    status: 'healthy',
    service: 'risa-care-insurance',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: dbStates[mongoose.connection.readyState as keyof typeof dbStates] || 'unknown'
  });
});

// API routes
app.use('/api/v1', insuranceRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: 'Please check the API documentation for available endpoints',
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server with MongoDB
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected for Insurance Service');

    app.listen(PORT, () => {
      logger.info(`\n🏥 RisaCare Insurance Service v2.0`);
      logger.info(`   Server running on port ${PORT}`);
      logger.info(`   Health check: http://localhost:${PORT}/health`);
      logger.info(`   API Base: http://localhost:${PORT}/api/v1`);
      logger.info(`   Database: connected`);
      logger.info(`\n`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

startServer();
export default app;