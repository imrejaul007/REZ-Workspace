import logger from './utils/logger';

/**
 * rez-corpperks-service
 * CorpPerks API Gateway - Enterprise Benefits Platform
 */

require('dotenv').config();

// Sentry initialization
const Sentry = require('@sentry/node');
const { expressIntegration, setupExpressErrorHandler } = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [expressIntegration()],
  environment: process.env.NODE_ENV || 'development',
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');

// Import routes
const corpPerksRoutes = require('./routes/corpPerksRoutes');
const corpGSTRoutes = require('./routes/corpGSTRoutes');
const corpRewardsRoutes = require('./routes/corpRewardsRoutes');
const corpCampaignsRoutes = require('./routes/corpCampaignsRoutes');
const corpIntegrationRoutes = require('./routes/corpIntegrationRoutes');
const corpHRISRoutes = require('./routes/corpHRISRoutes');
const rtmnFinanceRoutes = require('./routes/finance/rtmnFinanceRoutes');
const corpAnalyticsRoutes = require('./routes/corpAnalyticsRoutes');
const corpWalletRoutes = require('./routes/corpWalletRoutes');
const corpRestaurantRoutes = require('./modules/restaurant/restaurantController');

const app = express();

// Security middleware
app.set('trust proxy', 1);
app.use(helmet());

// CORS configuration - strict origin validation
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN;

if (!corsOrigin && isProduction) {
  logger.error('[FATAL] CORS_ORIGIN environment variable is required in production');
  process.exit(1);
}

if (!corsOrigin) {
  logger.warn('[WARNING] CORS_ORIGIN not set. Running in permissive mode. Set explicit origins for production.');
}

app.use(cors({
  origin: corsOrigin ? corsOrigin.split(',').map(o => o.trim()) : undefined,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Rate limiting - general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limit - stricter
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: { error: 'Too many attempts, try again later' },
  standardHeaders: true,
});

// Apply rate limiting
app.use('/api/', limiter);
app.use('/auth/', authLimiter);

// Logging
app.use((req, res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health endpoints
app.get('/health/live', (req, res) => res.json({ status: 'ok', service: 'rez-corpperks-service' }));
app.get('/health/ready', (req, res) => res.json({ status: 'ready', service: 'rez-corpperks-service' }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'rez-corpperks-service', version: '1.0.0' }));

// CorpPerks Routes
app.use('/api/corp', corpPerksRoutes);           // Benefits, Employees
app.use('/api/gst', corpGSTRoutes);              // GST Invoices
app.use('/api/rewards', corpRewardsRoutes);       // ReZ Coins
app.use('/api/campaigns', corpCampaignsRoutes);   // Campaigns
app.use('/api/integrations', corpIntegrationRoutes); // Integration health
app.use('/api/hris', corpHRISRoutes);            // HRIS Integration
app.use('/api/finance', rtmnFinanceRoutes);     // RTMN Finance (Wallet, Cards, BNPL)
app.use('/api/analytics', corpAnalyticsRoutes);   // Analytics & Reports
app.use('/api/wallet', corpWalletRoutes);        // Multi-Category Benefit Wallet
app.use('/api/benefits-config', require('./routes/corpBenefitsConfigRoutes')); // Benefits Configuration
app.use('/api/corp/restaurants', corpRestaurantRoutes); // Restaurant Partner Module

// Error handler
app.use((err, req, res, next) => {
  Sentry.captureException(err);
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

const PORT = parseInt(process.env.PORT || '4013', 10);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`rez-corpperks-service running on :${PORT}`);
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
