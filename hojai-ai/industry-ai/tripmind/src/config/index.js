module.exports = {
  development: {
    port: process.env.PORT || 4809,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tripmind_dev',
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    logging: {
      level: process.env.LOG_LEVEL || 'debug'
    }
  },
  production: {
    port: process.env.PORT || 4809,
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info'
    }
  },
  test: {
    port: 4809,
    mongodbUri: 'mongodb://localhost:27017/tripmind_test',
    jwtSecret: 'test_secret_key',
    jwtExpiresIn: '1h',
    jwtRefreshExpiresIn: '1d',
    rateLimit: {
      windowMs: 60000,
      maxRequests: 1000
    },
    logging: {
      level: 'error'
    }
  }
};