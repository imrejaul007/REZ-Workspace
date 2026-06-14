import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['PORT', 'NODE_ENV', 'MONGODB_URI'];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4200', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nextabizz',

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined
  },

  // RABTUL Integration
  rabtul: {
    authServiceUrl: process.env.RABTUL_AUTH_SERVICE_URL || 'http://localhost:3001',
    walletServiceUrl: process.env.RABTUL_WALLET_SERVICE_URL || 'http://localhost:3002',
    paymentServiceUrl: process.env.RABTUL_PAYMENT_SERVICE_URL || 'http://localhost:3003'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Service Info
  service: {
    name: 'nexTabizz-service',
    version: '1.0.0',
    description: 'NexTaBizz Universal Business OS - Backend Service'
  }
};

export default config;
