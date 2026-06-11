/**
 * PROPFLOW - Real Estate AI Operating System
 * Middleware Index
 */

export * from './auth';
export * from './validation';
export * from './errorHandler';
export * from './rateLimit';

import { authenticate, optionalAuth, authorize, generateToken } from './auth';
import { validate, validateBody, validateQuery } from './validation';
import { errorHandler, notFoundHandler, asyncHandler, AppError, Errors } from './errorHandler';
import { requestId, apiLimiter, authLimiter, aiLimiter } from './rateLimit';

export default {
  authenticate,
  optionalAuth,
  authorize,
  generateToken,
  validate,
  validateBody,
  validateQuery,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  Errors,
  requestId,
  apiLimiter,
  authLimiter,
  aiLimiter
};