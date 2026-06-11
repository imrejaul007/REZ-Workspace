/**
 * FLEETIQ - Configuration Management
 * Environment-based configuration with validation
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================
// CONFIG INTERFACE
// ============================================

export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
    options: {
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
      maxPoolSize: number;
    };
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  security: {
    internalServiceToken: string;
    bcryptRounds: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    authMaxRequests: number;
  };
  cors: {
    origin: string | string[];
    methods: string[];
  };
  logging: {
    level: string;
    dir: string;
  };
  ai: {
    dispatchEndpoint: string;
    routeEndpoint: string;
    fleetEndpoint: string;
    driverEndpoint: string;
    anthropicApiKey?: string;
  };
  integrations: {
    webhookServiceUrl: string;
    hojaiUrl: string;
    notificationServiceUrl: string;
  };
}

// ============================================
// CONFIGURATION
// ============================================

export const config: AppConfig = {
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
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'fleetiq-internal-dev-token',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10)
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOGS_DIR || 'logs'
  },

  ai: {
    dispatchEndpoint: process.env.AI_DISPATCH_ENDPOINT || 'http://localhost:4815',
    routeEndpoint: process.env.AI_ROUTE_ENDPOINT || 'http://localhost:4816',
    fleetEndpoint: process.env.AI_FLEET_ENDPOINT || 'http://localhost:4817',
    driverEndpoint: process.env.AI_DRIVER_ENDPOINT || 'http://localhost:4818',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  },

  integrations: {
    webhookServiceUrl: process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090',
    hojaiUrl: process.env.HOJAI_URL || 'http://localhost:4800',
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095'
  }
};

// ============================================
// VALIDATION
// ============================================

export const validateConfig = (): boolean => {
  const errors: string[] = [];

  if (config.port < 1 || config.port > 65535) {
    errors.push('Invalid PORT configuration');
  }

  if (!config.mongodb.uri) {
    errors.push('MONGODB_URI is required');
  }

  if (!config.jwt.secret || config.jwt.secret.includes('dev-secret')) {
    if (config.nodeEnv === 'production') {
      errors.push('JWT_SECRET must be set in production');
    }
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors);
    return false;
  }

  return true;
};

export default config;
