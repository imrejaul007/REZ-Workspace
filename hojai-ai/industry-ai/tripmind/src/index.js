require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');

const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/database');
const {
  helmetMiddleware,
  standardLimiter,
  errorHandler,
  notFoundHandler,
  asyncHandler
} = require('./middleware');
const {
  authRoutes,
  bookingRoutes,
  destinationRoutes,
  itineraryRoutes,
  analyticsRoutes,
  aiRoutes,
  brainRoutes
} = require('./routes');

// ExpertOS Integration - Clone your profession for online services
const { registerExpertOS } = require('../../../hojai-expert-os/src/expertOS-integration');

const app = express();

app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    time: req.requestTime
  });
  next();
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(helmetMiddleware);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.get('/', (req, res) => {
  res.json({
    name: 'TRIPMIND - Travel AI Operating System',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      ai: '/ai/status',
      auth: '/api/auth',
      bookings: '/api/bookings',
      destinations: '/api/destinations',
      itineraries: '/api/itineraries',
      analytics: '/api/analytics'
    },
    agents: [
      'Trip Planner Agent',
      'Booking Agent',
      'Visa Agent',
      'Airport Agent',
      'ExpertOS'
    ]
  });
});

app.get('/health', asyncHandler(async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      api: 'operational',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  };

  const isHealthy = healthCheck.services.database === 'connected' &&
    process.uptime() > 0;

  res.status(isHealthy ? 200 : 503).json({
    ...healthCheck,
    status: isHealthy ? 'healthy' : 'unhealthy'
  });
}));

app.get('/ready', asyncHandler(async (req, res) => {
  const isReady = mongoose.connection.readyState === 1;

  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    timestamp: new Date().toISOString(),
    checks: {
      database: isReady ? 'connected' : 'not connected'
    }
  });
}));

app.use('/ai', standardLimiter, aiRoutes);

app.use('/api/brain', standardLimiter, brainRoutes);

app.use('/api/auth', standardLimiter, authRoutes);

app.use('/api/bookings', standardLimiter, bookingRoutes);

app.use('/api/destinations', standardLimiter, destinationRoutes);

app.use('/api/itineraries', standardLimiter, itineraryRoutes);

app.use('/api/analytics', standardLimiter, analyticsRoutes);

// ============================================
// EXPERTOS - Professional AI Twin for Travel Agents
// ============================================

const expertOSRouter = registerExpertOS('tripmind');
app.use('/api/expert-os', expertOSRouter);

app.use(notFoundHandler);

app.use(errorHandler);

let server;

const startServer = async () => {
  try {
    await connectDB();

    const port = process.env.PORT || 4809;
    const mode = process.env.NODE_ENV || 'development';

    server = app.listen(port, () => {
      logger.info(`🚀 TRIPMIND Server running on port ${port}`);
      logger.info(`📊 Environment: ${mode}`);
      logger.info(`🔗 URL: http://localhost:${port}`);
      logger.info(`❤️  Health: http://localhost:${port}/health`);
      logger.info(`✅ Ready: http://localhost:${port}/ready`);
      logger.info('');
      logger.info('Available endpoints:');
      logger.info('  GET  /ai/status - AI agents status');
      logger.info('  POST /api/ai/trip/plan - Plan trip');
      logger.info('  POST /api/ai/booking/search - Search bookings');
      logger.info('  POST /api/ai/visa/check - Check visa requirements');
      logger.info('  POST /api/ai/airport/assist - Airport assistance');
      logger.info('  GET  /api/brain/status - AI Brain status');
      logger.info('  POST /api/brain/trip/plan - AI trip planning');
      logger.info('  POST /api/brain/route/optimize - Route optimization');
      logger.info('  POST /api/brain/advisory - Travel advisory');
      logger.info('  POST /api/brain/budget/plan - Budget planning');
      logger.info('  POST /api/brain/packing/list - Packing suggestions');
      logger.info('  POST /api/brain/query - Natural language query');
      logger.info('');
      logger.info('AI Employees:');
      logger.info('  🎯 Trip Planner Agent');
      logger.info('  📋 Booking Agent');
      logger.info('  🛂 Visa Agent');
      logger.info('  ✈️  Airport Agent');
      logger.info('  🧠 AI Brain (Trip, Route, Budget, Advisory)');
    });

    server.keepAliveTimeout = 120000;
    server.headersTimeout = 120000;

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);

  try {
    if (server) {
      logger.info('Closing HTTP server...');
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('HTTP server closed');
    }

    logger.info('Closing MongoDB connection...');
    await disconnectDB();

    clearTimeout(shutdownTimeout);
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('warning', (warning) => {
  logger.warn('Process Warning:', warning.name, warning.message);
});

startServer();

module.exports = app;