/**
 * FLEETIQ - Configuration Management
 * Centralized configuration with environment variable support
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ============================================
// CONFIG INTERFACE
// ============================================

interface MongoDBConfig {
  uri: string;
  options: {
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    maxPoolSize: number;
  };
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

interface SecurityConfig {
  bcryptRounds: number;
  internalServiceToken: string;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  authMaxRequests: number;
}

interface CORSConfig {
  origin: string | string[];
  methods: string[];
}

interface Config {
  port: number;
  nodeEnv: string;
  mongodb: MongoDBConfig;
  jwt: JWTConfig;
  security: SecurityConfig;
  cors: CORSConfig;
  rateLimit: RateLimitConfig;
  logs: {
    level: string;
    dir: string;
  };
  hojai: {
    coreUrl: string;
    memoryUrl: string;
    intentGraphUrl: string;
  };
  merchantOs: {
    url: string;
  };
}

// ============================================
// DEFAULT CONFIG
// ============================================

const defaults: Config = {
  port: parseInt(process.env.PORT || '4814', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetiq',
    options: {
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT || '5000', 10),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000', 10),
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10)
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fleetiq-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'fleetiq-internal-dev-token'
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10)
  },

  logs: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOGS_DIR || 'logs'
  },

  hojai: {
    coreUrl: process.env.HOJAI_CORE_URL || 'http://localhost:4100',
    memoryUrl: process.env.HOJAI_MEMORY_URL || 'http://localhost:4540',
    intentGraphUrl: process.env.HOJAI_INTENT_GRAPH_URL || 'http://localhost:4110'
  },

  merchantOs: {
    url: process.env.MERCHANT_OS_URL || 'http://localhost:4000'
  }
};

// ============================================
// CONFIG OBJECT
// ============================================

export const config: Config = defaults;

// ============================================
// VALIDATION
// ============================================

export const validateConfig = (): boolean => {
  const errors: string[] = [];

  // Validate port
  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  // Validate MongoDB URI
  if (!config.mongodb.uri.startsWith('mongodb')) {
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  }

  // Validate JWT secret
  if (config.nodeEnv === 'production' && config.jwt.secret.includes('dev')) {
    errors.push('JWT_SECRET must be changed from default in production');
  }

  // Validate internal service token
  if (config.security.internalServiceToken.includes('dev') && config.nodeEnv === 'production') {
    errors.push('INTERNAL_SERVICE_TOKEN must be changed from default in production');
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    return false;
  }

  return true;
};

// ============================================
// ENVIRONMENT HELPERS
// ============================================

export const isProduction = (): boolean => config.nodeEnv === 'production';
export const isDevelopment = (): boolean => config.nodeEnv === 'development';
export const isTest = (): boolean => config.nodeEnv === 'test';

export default config;