import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4811', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecosystem-transaction-hub',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'txn:',
    ttl: {
      transaction: 3600, // 1 hour
      analytics: 300, // 5 minutes
    },
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    expiresIn: '24h',
    algorithm: 'HS256',
  },

  // RABTUL Integration
  rabtul: {
    walletUrl: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
    paymentUrl: process.env.RABTUL_PAYMENT_URL || 'http://localhost:4008',
    timeout: 10000, // 10 seconds
    retries: 3,
  },

  // Transaction Settings
  transaction: {
    maxAmount: 1000000, // 10L INR max
    minAmount: 1, // 1 INR min
    currencies: ['INR', 'USD'],
    defaultCurrency: 'INR',
    statusFlow: {
      initiated: ['pending_payment', 'completed', 'failed', 'cancelled'],
      pending_payment: ['completed', 'failed', 'cancelled'],
      completed: ['refunded'],
      failed: [],
      cancelled: [],
      refunded: [],
    } as Record<string, string[]>,
  },

  // Logging
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Metrics
  metrics: {
    enabled: true,
    prefix: 'ecosystem_transaction_hub',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
};

// Validate required environment variables
export function validateConfig(): void {
  const required = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate JWT secret in production
  if (config.nodeEnv === 'production' && config.jwt.secret.includes('change-in-production')) {
    throw new Error('JWT_SECRET must be changed from default value in production');
  }
}

export default config;