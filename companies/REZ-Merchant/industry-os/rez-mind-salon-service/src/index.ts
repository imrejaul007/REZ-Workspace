import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PricingEngine } from './services/PricingEngine';
import { RecommendationEngine } from './services/RecommendationEngine';
import { DemandForecast } from './services/DemandForecast';
import { CustomerInsights } from './services/CustomerInsights';
import { pricingRoutes } from './routes/pricing.routes';
import { insightsRoutes } from './routes/insights.routes';
import { logger } from './utils/logger';

const app: Express = express();
const PORT = process.env.PORT || 4010;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// CORS configuration - CRITICAL FIX: Never allow '*' in production
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

if (IS_PRODUCTION && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: IS_PRODUCTION ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000', 'http://localhost:8080']),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter);

// Initialize services
const pricingEngine = new PricingEngine();
const recommendationEngine = new RecommendationEngine();
const demandForecast = new DemandForecast();
const customerInsights = new CustomerInsights();

// Health check (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-mind-salon-service',
    timestamp: new Date().toISOString()
  });
});

// Routes with rate limiting
app.use('/api/pricing', authLimiter, pricingRoutes(pricingEngine));
app.use('/api/insights', authLimiter, insightsRoutes(customerInsights, recommendationEngine));
app.use('/api/forecast', demandForecast.getRouter());

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Salon Mind AI Service running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`CORS origins: ${corsOrigins.length > 0 ? corsOrigins.join(', ') : 'development defaults'}`);
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export { app, pricingEngine, recommendationEngine, demandForecast, customerInsights };
