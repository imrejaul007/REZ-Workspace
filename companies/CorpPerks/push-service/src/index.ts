import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler, notFoundHandler, internalAuth } from './middleware';
import { schedulerService, rabtulNotificationService } from './services';

// ==================== CONFIGURATION ====================

const PORT = process.env.PORT || 4749;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks_push';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || '*';

// ==================== EXPRESS APP ====================

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests' },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== HEALTH CHECK ====================

app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const rabtulStatus = await rabtulNotificationService.healthCheck() ? 'available' : 'unavailable';

  res.json({
    status: 'healthy',
    service: 'push-notification-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      rabtulNotifications: rabtulStatus,
    },
  });
});

// ==================== AUTHENTICATION ====================

// Internal API routes (service-to-service)
app.use('/api/internal', internalAuth, routes);

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
  // This function can be extended for any additional setup
  logger.info('Database indexes ready');
}

// ==================== SCHEDULER ====================

function startScheduler(): void {
  try {
    schedulerService.start();
    logger.info('Notification scheduler started');
  } catch (error) {
    logger.error('Failed to start scheduler:', error);
  }
}

// ==================== SERVER STARTUP ====================

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start the scheduler
    startScheduler();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Push Notification Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API docs: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ==================== GRACEFUL SHUTDOWN ====================

async function shutdown(): Promise<void> {
  logger.info('SIGTERM received, shutting down gracefully...');

  // Stop scheduler
  schedulerService.stop();

  // Close database connection
  await mongoose.connection.close();

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

export default app;
