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
    port: parseInt(process.env.PORT || '4501', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/airzy-flight',
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
    keyPrefix: 'airzy:flight:'
  },
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
      }
      return secret || 'dev-only-secret-do-not-use-in-production';
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  flight: {
    searchTimeout: parseInt(process.env.FLIGHT_SEARCH_TIMEOUT || '30000', 10),
    cacheTTL: parseInt(process.env.FLIGHT_CACHE_TTL || '300', 10),
    maxResults: parseInt(process.env.FLIGHT_MAX_RESULTS || '100', 10),
    priceAlertInterval: parseInt(process.env.PRICE_ALERT_INTERVAL || '60', 10)
  },
  external: {
    apiUrl: process.env.FLIGHT_API_URL || 'https://api.flights.example.com',
    apiKey: process.env.FLIGHT_API_KEY,
    apiTimeout: parseInt(process.env.FLIGHT_API_TIMEOUT || '10000', 10)
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.EMAIL_FROM || 'flights@airzy.com'
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
