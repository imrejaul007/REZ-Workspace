// Core utilities
export { createAuthMiddleware, createInternalAuthMiddleware, createOptionalAuthMiddleware } from './auth';
export type { AuthOptions, AuthRequest, TokenPayload } from './auth';

export { createDatabaseConnection, closeDatabaseConnection, isDatabaseConnected, getDatabaseStats } from './database';

export { createLogger, defaultLogger } from './logger';
export type { LoggerOptions } from './logger';

export { createHealthCheck, createLivenessProbe, createReadinessProbe } from './health';
export type { HealthCheckOptions } from './health';

export { createErrorHandler, createNotFoundHandler, asyncHandler, standardizeResponse, standardizeError } from './response';
export type { ErrorResponse } from './response';
export { NotFoundError, ValidationError, UnauthorizedError } from './response';

export { createValidationMiddleware, commonSchemas } from './validation';

export { createRateLimiter, createAuthRateLimiter, createReadRateLimiter, createWriteRateLimiter, createInternalRateLimiter } from './rateLimiter';

export { createMiddlewareStack, createShutdownHandler } from './middleware';

// Common patterns
export { createService } from './service';

/**
 * Create a complete REZ service with all standard middleware and configuration
 */
export function createRezService(options: {
  name: string;
  port: number;
  mongoUrl?: string;
  authServiceUrl?: string;
  internalToken?: string;
}) {
  const { name, port, mongoUrl, authServiceUrl, internalToken } = options;

  return {
    name,
    port,
    mongoUrl,
    authServiceUrl,
    internalToken,
  };
}
