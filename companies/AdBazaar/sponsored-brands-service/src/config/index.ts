import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  serviceName: string;
  mongodb: {
    uri: string;
    user: string;
    password: string;
  };
  logging: {
    level: string;
    dir: string;
  };
  metrics: {
    enabled: boolean;
    port: number;
  };
  retailMediaHub: {
    url: string;
  };
  retailMediaOs: {
    url: string;
  };
  sponsoredProducts: {
    url: string;
  };
  redis: {
    url: string;
    enabled: boolean;
  };
  internalServiceToken: string;
  jwtSecret: string;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  campaignDefaults: {
    defaultBudget: number;
    maxBudget: number;
    minDurationDays: number;
    maxDurationDays: number;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '4991', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'sponsored-brands-service',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sponsored_brands_db',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || '',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    port: parseInt(process.env.METRICS_PORT || '4992', 10),
  },

  retailMediaHub: {
    url: process.env.RETAIL_MEDIA_HUB_URL || 'http://localhost:4830',
  },

  retailMediaOs: {
    url: process.env.RETAIL_MEDIA_OS_URL || 'http://localhost:4990',
  },

  sponsoredProducts: {
    url: process.env.SPONSORED_PRODUCTS_URL || 'http://localhost:4831',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enabled: process.env.REDIS_ENABLED === 'true',
  },

  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
  jwtSecret: process.env.JWT_SECRET || '',

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  campaignDefaults: {
    defaultBudget: parseInt(process.env.DEFAULT_CAMPAIGN_BUDGET || '1000', 10),
    maxBudget: parseInt(process.env.MAX_CAMPAIGN_BUDGET || '1000000', 10),
    minDurationDays: parseInt(process.env.MIN_CAMPAIGN_DURATION_DAYS || '1', 10),
    maxDurationDays: parseInt(process.env.MAX_CAMPAIGN_DURATION_DAYS || '365', 10),
  },
};

export default config;