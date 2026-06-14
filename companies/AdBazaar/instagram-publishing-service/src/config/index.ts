import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation
const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.warn(`Warning: ${envVar} is not set. Using default value.`);
  }
}

// Configuration interface
export interface Config {
  app: {
    port: number;
    nodeEnv: string;
    serviceName: string;
  };
  instagram: {
    appId: string;
    appSecret: string;
    accessToken: string;
    businessAccountId: string;
    apiBaseUrl: string;
    graphApiVersion: string;
  };
  database: {
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
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  publishing: {
    maxMediaSizeMb: number;
    maxAlbumImages: number;
    supportedImageFormats: string[];
    supportedVideoFormats: string[];
  };
  scheduler: {
    intervalMs: number;
    enabled: boolean;
  };
  webhook: {
    verifyToken: string;
    callbackUrl: string;
  };
  metrics: {
    enabled: boolean;
    prefix: string;
  };
}

// Configuration object
export const config: Config = {
  app: {
    port: parseInt(process.env.PORT || '5081', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    serviceName: 'instagram-publishing-service',
  },
  instagram: {
    appId: process.env.INSTAGRAM_APP_ID || '',
    appSecret: process.env.INSTAGRAM_APP_SECRET || '',
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
    apiBaseUrl: 'https://graph.facebook.com',
    graphApiVersion: 'v18.0',
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram_publishing',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  publishing: {
    maxMediaSizeMb: parseInt(process.env.MAX_MEDIA_SIZE_MB || '100', 10),
    maxAlbumImages: parseInt(process.env.MAX_ALBUM_IMAGES || '10', 10),
    supportedImageFormats: (process.env.SUPPORTED_IMAGE_FORMATS || 'image/jpeg,image/png,image/webp').split(','),
    supportedVideoFormats: (process.env.SUPPORTED_VIDEO_FORMATS || 'video/mp4,video/quicktime').split(','),
  },
  scheduler: {
    intervalMs: parseInt(process.env.SCHEDULER_INTERVAL_MS || '60000', 10),
    enabled: process.env.SCHEDULER_ENABLED !== 'false',
  },
  webhook: {
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || '',
    callbackUrl: process.env.WEBHOOK_CALLBACK_URL || '',
  },
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    prefix: process.env.METRICS_PREFIX || 'instagram_publishing',
  },
};

export default config;