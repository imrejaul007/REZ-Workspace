import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import webhookRoutes from './routes/webhookRoutes.js';
import { webhookService } from './services/webhookService.js';
import { registerWebhookHandler } from './services/eventBus.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.env === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',')
    : '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'webhook-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/webhooks', webhookRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Register webhook delivery handler
registerWebhookHandler(async (data) => {
  await webhookService.processWebhook(data);
});

// Start server
async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      logger.info(`Webhook service started on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });

    // Start retry scheduler
    setInterval(
      () => webhookService.retryFailedWebhooks(),
      config.webhook.retryDelayMs
    );
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;
