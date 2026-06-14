import dotenv from 'dotenv';

dotenv.config();

// Environment validation for production
function validateEnv(): void {
  if (process.env.NODE_ENV === 'production') {
    const required = ['PORT', 'JWT_SECRET', 'MONGODB_URI', 'CORS_ORIGIN'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
    }
  }
}

validateEnv();

export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '4500', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },

  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/airzy-gateway',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'airzy:gateway:'
  },

  // JWT configuration - FIXED: No hardcoded fallback in production
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
      }
      return secret || 'dev-only-secret-do-not-use-in-production';
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'airzy-api-gateway'
  },

  // Service routes configuration
  routes: {
    flight: {
      baseUrl: process.env.FLIGHT_SERVICE_URL || 'http://localhost:4501',
      healthEndpoint: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5
    },
    lounge: {
      baseUrl: process.env.LOUNGE_SERVICE_URL || 'http://localhost:4502',
      healthEndpoint: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5
    },
    itinerary: {
      baseUrl: process.env.ITINERARY_SERVICE_URL || 'http://localhost:4503',
      healthEndpoint: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5
    },
    wallet: {
      baseUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:4504',
      healthEndpoint: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5
    },
    aiBrain: {
      baseUrl: process.env.AI_BRAIN_SERVICE_URL || 'http://localhost:4505',
      healthEndpoint: '/health',
      timeout: 60000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5
    },
    corp: {
      baseUrl: process.env.CORP_SERVICE_URL || 'http://localhost:4506',
      healthEndpoint: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5
    },
    hotel: {
      baseUrl: process.env.HOTEL_SERVICE_URL || 'http://localhost:4507',
      healthEndpoint: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5
    },
    transfer: {
      baseUrl: process.env.TRANSFER_SERVICE_URL || 'http://localhost:4508',
      healthEndpoint: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5
    },
    dooh: {
      baseUrl: process.env.DOOH_SERVICE_URL || 'http://localhost:4509',
      healthEndpoint: '/health',
      timeout: 30000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5
    }
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    standardWindowMs: 60000,
    premiumWindowMs: 60000,
    enterpriseWindowMs: 60000,
    standardMax: 100,
    premiumMax: 500,
    enterpriseMax: 2000
  },

  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10)
  },

  circuitBreaker: {
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000', 10),
    resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '30000', 10),
    errorThresholdPercentage: 50,
    volumeThreshold: 10
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    destination: process.env.LOG_DESTINATION || 'stdout'
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-User-ID', 'X-Tenant-ID', 'X-Request-ID']
  },

  apiKeys: {
    headerName: 'x-api-key',
    headerTenant: 'x-tenant-id',
    headerUser: 'x-user-id'
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    interval: parseInt(process.env.METRICS_INTERVAL || '60000', 10)
  },

  version: '1.0.0'
};

export default config;
