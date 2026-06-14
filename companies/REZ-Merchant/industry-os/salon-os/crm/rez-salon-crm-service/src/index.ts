import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import { logger } from './utils/logger';
import customersRouter from './routes/customers.routes';
import campaignsRouter from './routes/campaigns.routes';
import { campaignService } from './services/CampaignService';
import { notificationService } from './services/NotificationService';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 4204;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-salon-crm-service',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// API Routes
app.use('/api/customers', customersRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/notifications', campaignsRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Database connection
const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-salon-crm';

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB', { uri: mongoUri });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    process.exit(1);
  }
};

// Scheduled jobs for automated campaigns
const setupScheduledJobs = (): void => {
  // Run birthday reminders daily at 9 AM
  const birthdayInterval = setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 9 && now.getMinutes() === 0) {
      logger.info('Running scheduled birthday reminders');
      await notificationService.processBirthdayReminders();
    }
  }, 60000); // Check every minute

  // Run anniversary reminders daily at 9 AM
  const anniversaryInterval = setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 9 && now.getMinutes() === 5) {
      logger.info('Running scheduled anniversary reminders');
      await notificationService.processAnniversaryReminders();
    }
  }, 60000);

  // Run re-engagement reminders weekly
  const reengagementInterval = setInterval(async () => {
    const now = new Date();
    if (now.getDay() === 1 && now.getHours() === 10 && now.getMinutes() === 0) {
      logger.info('Running scheduled re-engagement reminders');
      await notificationService.processReengagementReminders(60);
    }
  }, 60000);

  logger.info('Scheduled jobs configured');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    clearInterval(birthdayInterval);
    clearInterval(anniversaryInterval);
    clearInterval(reengagementInterval);
  });
};

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();
  setupScheduledJobs();

  app.listen(PORT, () => {
    logger.info(`Salon CRM Service running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
    });
  });
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

startServer();

export default app;
