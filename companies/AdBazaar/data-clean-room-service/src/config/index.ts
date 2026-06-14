import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4950', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/data_clean_room',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Internal Service Token
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token',

  // HOJAI AI
  hojai: {
    apiUrl: process.env.HOJAI_API_URL || 'http://localhost:4800',
    apiKey: process.env.HOJAI_API_KEY || '',
  },

  // Customer Graph 360
  customerGraph: {
    url: process.env.CUSTOMER_GRAPH_URL || 'http://localhost:4808',
    token: process.env.CUSTOMER_GRAPH_TOKEN || '',
  },

  // Identity Cloud Service
  identityCloud: {
    url: process.env.IDENTITY_CLOUD_URL || 'http://localhost:4996',
    token: process.env.IDENTITY_CLOUD_TOKEN || '',
  },

  // Privacy Settings
  privacy: {
    minMatchThreshold: parseFloat(process.env.MIN_MATCH_THRESHOLD || '0.7'),
    kAnonymityThreshold: parseInt(process.env.K_ANONYMITY_THRESHOLD || '5', 10),
    differentialPrivacyEpsilon: parseFloat(process.env.DIFFERENTIAL_PRIVACY_EPSILON || '1.0'),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

export type Config = typeof config;