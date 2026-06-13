import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routes from './routes';
import { internalAuthMiddleware, loggingMiddleware, errorHandlerMiddleware } from './middleware/auth.middleware';
import { logger } from './utils/logger';
import { iotService } from './services/iot-integration.service';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8444;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// Routes
app.use('/api', internalAuthMiddleware, routes);

// Error handling
app.use(errorHandlerMiddleware);

// Database connection
async function connectToDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/room-twin?authSource=admin';

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// MQTT connection
async function connectToMQTT(): Promise<void> {
  try {
    await iotService.connect();
    logger.info('Connected to MQTT broker');
  } catch (error) {
    logger.warn('Failed to connect to MQTT broker - IoT features will be disabled', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Graceful shutdown
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    try {
      iotService.disconnect();
      await mongoose.disconnect();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start server
async function startServer(): Promise<void> {
  try {
    await connectToDatabase();
    await connectToMQTT();
    setupGracefulShutdown();

    app.listen(PORT, () => {
      logger.info(`Room Twin Service is running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export default app;
