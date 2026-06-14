import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';

import pricingRoutes from './routes/pricing.routes';
import insightsRoutes from './routes/insights.routes';
import {
  requestLogger,
  errorHandler,
  notFoundHandler,
  rateLimiter,
  corsMiddleware,
  internalAuth,
  healthCheck,
} from './middleware';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 4007;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(corsMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter(100, 60000)); // 100 requests per minute

// Health check (no auth required)
app.get('/health', healthCheck);
app.get('/ready', healthCheck);

// Internal API routes (with service authentication)
app.use('/api/internal/pricing', internalAuth, pricingRoutes);
app.use('/api/internal/insights', internalAuth, insightsRoutes);

// Public API routes (for external consumers)
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/insights', insightsRoutes);

// Legacy routes (for backwards compatibility)
app.use('/api/pricing', pricingRoutes);
app.use('/api/insights', insightsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = (signal: string): void => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `${signal} received. Shutting down gracefully...`,
    })
  );

  server.close(() => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'HTTP server closed',
      })
    );
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Forced shutdown after timeout',
      })
    );
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, () => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'rez-mind-restaurant-service',
      message: `Restaurant Mind AI Service started`,
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        health: `http://localhost:${PORT}/health`,
        pricing: `http://localhost:${PORT}/api/v1/pricing`,
        insights: `http://localhost:${PORT}/api/v1/insights`,
        internal: {
          pricing: `http://localhost:${PORT}/api/internal/pricing`,
          insights: `http://localhost:${PORT}/api/internal/insights`,
        },
      },
    })
  );
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      error: 'Uncaught Exception',
      message: error.message,
      stack: error.stack,
    })
  );
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      error: 'Unhandled Rejection',
      reason,
      promise,
    })
  );
});

export default app;
