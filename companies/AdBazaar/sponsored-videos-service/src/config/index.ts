export const config = {
  // Server
  port: parseInt(process.env.PORT || '4992', 10),
  env: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sponsored_videos',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // Internal Service Auth
  auth: {
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'sponsored-videos-service-token',
  },

  // Prometheus Metrics
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    path: '/metrics',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Video Service Config
  video: {
    maxFileSize: parseInt(process.env.MAX_VIDEO_SIZE || '524288000', 10), // 500MB
    allowedFormats: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
    thumbnailFormats: ['jpg', 'jpeg', 'png', 'webp'],
  },

  // Analytics Config
  analytics: {
    aggregationInterval: process.env.ANALYTICS_INTERVAL || '1h',
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10),
  },

  // Campaign Config
  campaign: {
    minBudget: parseFloat(process.env.MIN_CAMPAIGN_BUDGET || '100', 10),
    maxBudget: parseFloat(process.env.MAX_CAMPAIGN_BUDGET || '10000000', 10),
    defaultPriority: 5,
  },
};

export type Config = typeof config;
