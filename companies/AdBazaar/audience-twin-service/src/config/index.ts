import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface Config {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
    options: {
      maxPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
    };
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  hojaiTwin: {
    url: string;
    apiKey: string;
    timeout: number;
  };
  cache: {
    ttl: number;
  };
  log: {
    level: string;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '4805', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/audience-twin',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  hojaiTwin: {
    url: process.env.HOJAI_TWIN_URL || 'http://localhost:4860',
    apiKey: process.env.HOJAI_TWIN_API_KEY || '',
    timeout: 30000,
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
export type { Config };