import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  port: number;
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
  redis: {
    url: string;
    ttl: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  metrics: {
    enabled: boolean;
    prefix: string;
  };
  logging: {
    level: string;
    format: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '4831', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sponsored-products',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000', 10),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000', 10),
    },
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '300', 10), // 5 minutes default
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'sponsored-products-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  cors: {
    origin: (process.env.CORS_ORIGINS || '*').split(',').map(s => s.trim()),
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    prefix: process.env.METRICS_PREFIX || 'sponsored_products',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

// Validate required config
const requiredEnvVars = ['PORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && config.nodeEnv === 'production') {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export default config;
export { Config };