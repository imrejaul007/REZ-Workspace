import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4703', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ott-streaming-sdk',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: '24h',
  },
  cdn: {
    baseUrl: process.env.CDN_BASE_URL || 'https://cdn.adbazaar.com',
  },
  drm: {
    licenseUrl: process.env.DRM_LICENSE_URL || 'https://drm.adbazaar.com',
    fairplayCertificateUrl: process.env.FAIRPLAY_CERTIFICATE_URL || 'https://drm.adbazaar.com/fairplay/certificate',
  },
  ad: {
    serverUrl: process.env.AD_SERVER_URL || 'https://ads.adbazaar.com',
  },
  analytics: {
    heartbeatInterval: 5000,
    batchSize: 50,
    flushInterval: 10000,
  },
  streaming: {
    defaultBitrate: 5000000,
    maxBitrate: 15000000,
    minBitrate: 500000,
    manifestTTL: 3600,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

export type Config = typeof config;
