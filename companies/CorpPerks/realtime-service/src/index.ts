import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler, notFoundHandler, requestLogger } from './middleware';
import { webSocketService } from './services';

// ==================== CONFIGURATION ====================

const PORT = parseInt(process.env.PORT || '4748', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks_realtime';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:4749'];
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== EXPRESS APP ====================

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests' },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== HTTP SERVER (for WebSocket) ====================

const server = createServer(app);

// ==================== WEBSOCKET INITIALIZATION ====================

webSocketService.initialize(server);

// ==================== HEALTH CHECK ====================

app.get('/health', async (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const wsStats = webSocketService.getStats();

  res.json({
    status: 'healthy',
    service: 'realtime-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    dependencies: {
      mongodb: mongoStatus,
      websocket: {
        status: 'active',
        ...wsStats,
      },
    },
  });
});

// ==================== ROUTES ====================

// Internal API routes (service-to-service)
app.use('/api/internal', routes);

// Public API routes
app.use('/api', routes);

// ==================== ERROR HANDLING ====================

app.use(notFoundHandler);
app.use(errorHandler);

// ==================== DATABASE CONNECTION ====================

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Create indexes
    await createIndexes();
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function createIndexes(): Promise<void> {
  // Indexes are handled by Mongoose schemas
  logger.info('Database indexes ready');
}

// ==================== SERVER STARTUP ====================

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP/WebSocket server
    server.listen(PORT, () => {
      logger.info(`========================================`);
      logger.info(`CorpPerks Real-time Service`);
      logger.info(`========================================`);
      logger.info(`HTTP/REST API: http://localhost:${PORT}`);
      logger.info(`WebSocket:     ws://localhost:${PORT}`);
      logger.info(`Health check:  http://localhost:${PORT}/health`);
      logger.info(`Stats:         http://localhost:${PORT}/api/stats`);
      logger.info(`========================================`);
      logger.info(`Environment:   ${NODE_ENV}`);
      logger.info(`MongoDB:       ${MONGODB_URI}`);
      logger.info(`========================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ==================== GRACEFUL SHUTDOWN ====================

async function shutdown(): Promise<void> {
  logger.info('\nSIGTERM received, shutting down gracefully...');

  // Shutdown WebSocket service
  webSocketService.shutdown();

  // Close database connection
  await mongoose.connection.close();

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ==================== START ====================

startServer();

export { app, server };
