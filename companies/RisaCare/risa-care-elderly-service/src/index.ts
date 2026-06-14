import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import elderlyRoutes from './routes/elderlyRoutes';
import logger from './utils/logger';

const app: Application = express();
const PORT = process.env.PORT || 4721;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_elderly';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Health check endpoint with database status
app.get('/health', async (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    status: 'healthy',
    service: 'risa-care-elderly',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[mongoose.connection.readyState as keyof typeof dbStates] || 'unknown',
      name: 'risa_care_elderly',
      host: mongoose.connection.host || 'localhost',
    },
  });
});

// API routes
app.use('/api', elderlyRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// MongoDB connection options
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connect to MongoDB and start server
async function startServer() {
  try {
    logger.info('Connecting to MongoDB...', { uri: MONGODB_URI });

    await mongoose.connect(MONGODB_URI, mongoOptions);

    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`Elderly Care Service started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        mongodb: MONGODB_URI,
        endpoints: {
          health: `http://localhost:${PORT}/health`,
          api: `http://localhost:${PORT}/api`,
        },
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');
        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error closing MongoDB connection', { error });
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

startServer();

export default app;