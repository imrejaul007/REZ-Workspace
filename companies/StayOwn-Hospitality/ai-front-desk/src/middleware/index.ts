/**
 * Middleware exports for AI Front Desk Service
 */

export { apiKeyAuth, requireRole, requestLogger, corsMiddleware, AuthenticatedRequest } from './auth';
export { rateLimiter, standardLimiter, strictLimiter, authLimiter } from './rateLimiter';
export { helmetMiddleware, sanitizeBody, trustProxy } from './security';

export default {
  apiKeyAuth,
  requireRole,
  requestLogger,
  corsMiddleware,
  rateLimiter,
  standardLimiter,
  strictLimiter,
  authLimiter,
  helmetMiddleware,
  sanitizeBody,
  trustProxy,
};