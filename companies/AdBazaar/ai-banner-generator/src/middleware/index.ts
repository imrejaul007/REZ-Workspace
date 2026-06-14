/**
 * Middleware Index - Export all middleware
 */

export { authMiddleware, optionalAuthMiddleware, adminOnlyMiddleware, generateToken } from './auth';
export { validateBody, validateQuery, validateParams, schemas } from './validation';
export {
  metricsMiddleware,
  metricsHandler,
  recordBannerGeneration,
  recordTemplateUsage,
  recordCacheHit,
  recordCacheMiss,
  getMetrics,
  register,
} from './metrics';
export { errorHandler, notFoundHandler, createError, asyncHandler, AppError } from './errorHandler';

export default {
  auth: authMiddleware,
  optionalAuth: optionalAuthMiddleware,
  adminOnly: adminOnlyMiddleware,
  validateBody,
  validateQuery,
  validateParams,
  schemas,
  metricsMiddleware,
  metricsHandler,
  errorHandler,
  notFoundHandler,
  createError,
  asyncHandler,
};