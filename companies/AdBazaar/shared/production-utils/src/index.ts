/**
 * @adbazaar/shared-utils
 * Shared production utilities for AdBazaar microservices
 *
 * Usage:
 * ```typescript
 * import { createLogger, loadConfig, healthCheckMiddleware } from '@adbazaar/shared-utils';
 *
 * const logger = createLogger('my-service');
 * const config = loadConfig();
 *
 * app.use(healthCheckMiddleware());
 * ```
 */

// Logger
export { createLogger, logger } from './logger';

// Configuration
export { loadConfig, getMongoURI, getRedisURL, getServiceUrl, clearConfigCache, ConfigSchema, Config } from './config';

// Health checks
export {
  registerHealthCheck,
  createMongoHealthCheck,
  createRedisHealthCheck,
  createHttpHealthCheck,
  runHealthChecks,
  healthCheckMiddleware,
  metricsMiddleware,
  HealthCheckResult,
  HealthCheckStatus,
  HealthCheck,
} from './health';

// Error handling
export { errorHandler, asyncHandler, AppError, NotFoundError, ValidationError } from './errors';

// Security utilities
export {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  sanitizeInput,
  rateLimiter,
} from './security';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'production-utils',
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
