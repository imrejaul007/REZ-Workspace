import { logger } from '../../shared/logger';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { connectDB } from './config/database.js';
import { errorHandler, notFound } from './middleware/index.js';
import routes from './routes/index.js';

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
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'corp-crm-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', routes);

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
║   🏢 CorpPerks Business CRM                               ║
║                                                           ║
║   Server running on port ${String(config.port).padEnd(35)}║
║   Environment: ${config.nodeEnv.padEnd(39)}║
║   MongoDB: ${config.mongoUri.substring(0, 40).padEnd(40)}║
║                                                           ║
║   Endpoints:                                              ║
║   • POST   /api/clients                                  ║
║   • GET    /api/clients                                  ║
║   • POST   /api/deals                                    ║
║   • GET    /api/deals                                    ║
║   • GET    /api/deals/pipeline                          ║
║   • POST   /api/proposals                                ║
║   • POST   /api/invoices                                 ║
║   • GET    /api/invoices                                ║
║   • GET    /api/analytics/revenue                        ║
║   • GET    /api/analytics/pipeline                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
