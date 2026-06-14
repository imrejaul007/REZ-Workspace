import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Environment validation
const requiredEnvVars = ['PORT', 'MONGODB_URI', 'SERVICE_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.warn(`Warning: ${envVar} is not set in environment variables`);
  }
}

// Configuration interface
export interface Config {
  port: number;
  serviceName: string;
  nodeEnv: string;
  mongodb: {
    uri: string;
    options: {
      maxPoolSize: number;
      minPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
    };
  };
  logging: {
    level: string;
    format: string;
  };
  metrics: {
    enabled: boolean;
    path: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  services: {
    buzzLocal: string;
    airzy: string;
    apartmentTargeting: string;
    placeGraph: string;
  };
  business: {
    defaultRadius: number;
    maxRadius: number;
    footfallMultiplier: Record<string, number>;
    adBudgetMultiplier: number;
  };
}

// Load configuration from environment
const config: Config = {
  port: parseInt(process.env.PORT || '4880', 10),
  serviceName: process.env.SERVICE_NAME || 'event-graph-service',
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/event_graph',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL || '2', 10),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT || '5000', 10),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000', 10)
    }
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    path: process.env.METRICS_PATH || '/metrics'
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  },

  services: {
    buzzLocal: process.env.BUZZLOCAL_SERVICE_URL || 'http://localhost:3000',
    airzy: process.env.AIRZY_SERVICE_URL || 'http://localhost:4500',
    apartmentTargeting: process.env.APARTMENT_TARGETING_URL || 'http://localhost:4000',
    placeGraph: process.env.PLACE_GRAPH_URL || 'http://localhost:4100'
  },

  business: {
    defaultRadius: parseInt(process.env.DEFAULT_RADIUS || '5000', 10),
    maxRadius: parseInt(process.env.MAX_RADIUS || '50000', 10),
    footfallMultiplier: {
      wedding: 1.2,
      festival: 1.5,
      conference: 1.0,
      sports: 2.0,
      religious: 1.3,
      community: 0.8,
      corporate: 0.9,
      entertainment: 1.4,
      political: 1.1,
      other: 1.0
    },
    adBudgetMultiplier: parseFloat(process.env.AD_BUDGET_MULTIPLIER || '0.4')
  }
};

export default config;