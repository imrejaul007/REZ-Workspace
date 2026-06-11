const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../utils/errors');

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: new RateLimitError(message),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req, res, next, options) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message,
          retryAfter: Math.ceil(options.windowMs / 1000)
        }
      });
    }
  });
};

const standardLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again after 15 minutes'
});

const aiAgentLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many AI requests, please try again in a minute'
});

const bookingLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many booking requests, please try again in a minute'
});

const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many search requests, please try again in a minute'
});

module.exports = {
  createRateLimiter,
  standardLimiter,
  authLimiter,
  aiAgentLimiter,
  bookingLimiter,
  searchLimiter
};