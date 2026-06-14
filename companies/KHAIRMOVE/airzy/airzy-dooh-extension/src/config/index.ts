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
  server: {
    port: parseInt(process.env.PORT || '4509', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/airzy-dooh',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'airzy:dooh:'
  },
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
      }
      return secret || 'dev-only-secret-do-not-use-in-production';
    })()
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  version: '1.0.0'
};

export default config;
