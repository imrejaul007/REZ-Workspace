import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { connectDB } from './config/database.js';
import { errorHandler, notFound } from './middleware/index.js';
import router from './routes/index.js';
import logger from './utils/logger.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'reports-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/reports', router);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📊 Reports Service                                      ║
║   CorpPerks Custom Reports Builder                       ║
║                                                           ║
║   Server running on port ${config.port}                        ║
║   Environment: ${config.nodeEnv.padEnd(20)}                   ║
║   MongoDB: ${config.mongoUri.substring(0, 40).padEnd(40)}   ║
║                                                           ║
║   Endpoints:                                              ║
║   • GET  /api/reports/templates                          ║
║   • POST /api/reports/templates                          ║
║   • POST /api/reports/generate                           ║
║   • GET  /api/reports/:id                                ║
║   • GET  /api/reports/analytics/attendance               ║
║   • GET  /api/reports/analytics/performance              ║
║   • GET  /api/reports/analytics/financial                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
};

startServer();

export default app;
