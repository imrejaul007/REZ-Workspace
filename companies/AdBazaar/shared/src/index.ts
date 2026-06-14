// ReZ Shared Utilities
// Common middleware, validators, and utilities for all ReZ services

export { authMiddleware, optionalAuthMiddleware } from './middleware/auth.js';
export { rateLimitMiddleware } from './middleware/rateLimit.js';
export { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
export { requestIdMiddleware, requestLoggerMiddleware } from './middleware/requestLogger.js';
export { validateBody, validateQuery, validateParams } from './middleware/validation.js';
export { createSuccessResponse, createErrorResponse } from './utils/response.js';
export { AppError } from './utils/errors.js';
export { logger, createServiceLogger } from 'utils/logger.js';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'shared',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
