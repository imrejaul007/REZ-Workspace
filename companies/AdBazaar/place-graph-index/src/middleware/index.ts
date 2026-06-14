export {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  apiKeyMiddleware,
  generateToken,
  verifyToken,
} from './auth.middleware.js';

export {
  metricsMiddleware,
  getMetrics,
  getRegistry,
  resetMetrics,
  updatePlaceMetrics,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  activeConnections,
  placesTotal,
  cacheOperations,
  searchQueriesTotal,
  audienceEstimatesTotal,
} from './metrics.middleware.js';

export {
  validateBody,
  validateQuery,
  validateParams,
  asyncHandler,
} from './validation.middleware.js';

export {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from './error.middleware.js';