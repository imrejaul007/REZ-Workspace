export { authMiddleware, optionalAuthMiddleware, requireRole, generateToken } from './auth.js';
export type { AuthenticatedRequest, JwtPayload } from './auth.js';

export {
  metricsMiddleware,
  getMetrics,
  getContentType,
  updateStreamMetrics,
  updateAdBreakMetrics,
  recordAdServed,
  recordManifestProcessing,
  recordSCTE35Cue,
} from './metrics.js';

export {
  errorHandler,
  notFoundHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from './error.js';