/**
 * KHAIRMOVE Shared Utilities
 *
 * Central export point for all shared utilities
 */

// Logger
export { logger, default } from './logger';

// Auth Middleware
export {
  authenticate,
  optionalAuth,
  requireRole,
  requirePermission,
  internalOnly,
  verifyJWT,
  validateAuthEnv,
  getUserId,
  isAdmin,
  isDriver,
  isUser,
  getUserIdentifier,
  type JWTPayload,
  type AuthRequest,
  type AuthConfig,
} from './middleware/auth';

// Environment Validator
export {
  validateRequiredEnvVars,
  validateOrThrow,
  getRequiredEnvVars,
  type EnvValidationResult,
} from './envValidator';

// Rate Limiters
export {
  createGlobalLimiter,
  createAuthLimiter,
  createOTPLimiter,
  createSensitiveLimiter,
  createSearchLimiter,
  createWriteLimiter,
  skipInTest,
} from './rateLimiter';

// CORS
export {
  corsMiddleware,
  apiCorsMiddleware,
  publicCorsMiddleware,
  socketCorsOptions,
  createCorsOptions,
} from './cors';

// Request ID / Correlation ID
export {
  requestIdMiddleware,
  generateRequestId,
  createRequestLogger,
  logRequest,
  requestLoggingMiddleware,
} from './requestId';

// Types
export * from './types';

// Schemas
export * from './schemas';

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
