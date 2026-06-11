const { authenticate, optionalAuth, authorize, isAdmin, isAgent, isUser } = require('./auth');
const { standardLimiter, authLimiter, aiAgentLimiter, bookingLimiter, searchLimiter } = require('./rateLimiter');
const { validate, validateBody, validateQuery, validateParams } = require('./validation');
const { errorHandler, notFoundHandler, asyncHandler } = require('./errorHandler');
const { helmetMiddleware } = require('./security');

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  isAdmin,
  isAgent,
  isUser,
  standardLimiter,
  authLimiter,
  aiAgentLimiter,
  bookingLimiter,
  searchLimiter,
  validate,
  validateBody,
  validateQuery,
  validateParams,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  helmetMiddleware
};