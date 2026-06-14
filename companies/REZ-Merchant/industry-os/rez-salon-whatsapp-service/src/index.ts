import express, { Express, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { WhatsAppService } from './services/WhatsAppService';
import { BookingBot } from './services/BookingBot';
import { createWebhookRouter } from './routes/webhook.routes';
import { createBotRouter } from './routes/bot.routes';
import cron from 'node-cron';

dotenv.config();

const app: Express = express();

const PORT = process.env.PORT || 4205;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-salon-whatsapp';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const SALON_SERVICE_URL = process.env.SALON_SERVICE_URL;
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKENS_JSON
  ? JSON.parse(process.env.INTERNAL_SERVICE_TOKENS_JSON)['salon-whatsapp'] '|| '3005'
  : '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-salon-whatsapp-service',
    timestamp: new Date().toISOString()
  });
});

const whatsAppService = new WhatsAppService();
const bookingBot = new BookingBot(whatsAppService, {
  salonServiceUrl: SALON_SERVICE_URL,
  internalServiceToken: INTERNAL_SERVICE_TOKEN,
  redisUrl: REDIS_URL
});

app.use('/api', createWebhookRouter(whatsAppService));
app.use('/api', createBotRouter(whatsAppService, bookingBot));

async function initializeWhatsApp(): Promise<void> {
  try {
    logger.info('Initializing WhatsApp connection...');
    const qrImage = await whatsAppService.initialize();
    logger.info('WhatsApp QR code ready');

    if (process.env.NODE_ENV !== 'production') {
      console.log('Scan QR code at:', qrImage);
    }
  } catch (error) {
    console.error('Failed to initialize WhatsApp:', error);
  }
}

async function startReminderScheduler(): Promise<void> {
  cron.schedule('0 * * * *', async () => {
    logger.info('Running reminder check...');
  });

  cron.schedule('0 9 * * *', async () => {
    logger.info('Sending daily availability notification...');
  });
}

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    await startReminderScheduler();

    await initializeWhatsApp();

    await bookingBot.start();

    app.listen(PORT, () => {
      logger.info(`ReZ Salon WhatsApp Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Bot API: http://localhost:${PORT}/api/bot/status`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await bookingBot.stop();
  await whatsAppService.disconnect();
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await bookingBot.stop();
  await whatsAppService.disconnect();
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

export { app, whatsAppService, bookingBot };
