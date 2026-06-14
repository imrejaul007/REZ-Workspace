// Environment configuration
export const config = {
  // Server
  port: parseInt(process.env.PORT || '5011'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar-clients',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT || '5000'),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000'),
    },
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'adbazaar:clients:',
    ttl: {
      default: 300, // 5 minutes
      short: 60,    // 1 minute
      long: 3600,   // 1 hour
    },
  },

  // Authentication
  auth: {
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token',
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // Service info
  service: {
    name: 'client-management-service',
    version: '1.0.0',
    description: 'AdBazaar Client Management Service - Agency OS',
  },
};

export default config;