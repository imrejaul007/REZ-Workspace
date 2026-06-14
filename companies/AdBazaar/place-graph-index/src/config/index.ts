import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
    options: Record<string, unknown>;
  };
  redis: {
    url: string;
    maxRetries: number;
    retryDelay: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    issuer: string;
  };
  metrics: {
    enabled: boolean;
    prefix: string;
  };
  cache: {
    ttl: number;
    placesTtl: number;
    searchTtl: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '4816', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/place-graph-index',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetries: 3,
    retryDelay: 1000,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
    expiresIn: '24h',
    issuer: 'place-graph-index',
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    prefix: 'place_graph_',
  },

  cache: {
    ttl: 300, // 5 minutes default
    placesTtl: 600, // 10 minutes for places
    searchTtl: 180, // 3 minutes for search
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
    credentials: true,
  },
};

// Validate required config
const requiredEnvVars = ['MONGODB_URI', 'REDIS_URL', 'JWT_SECRET'];

export function validateConfig(): void {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar] && process.env.NODE_ENV === 'production') {
      logger.warn(`Warning: ${envVar} not set in production environment`);
    }
  }
}

export default config;
