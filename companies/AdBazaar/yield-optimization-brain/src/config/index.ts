import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Service Configuration
  service: {
    name: 'yield-optimization-brain',
    port: parseInt(process.env.PORT || '4890', 10),
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/yield_optimization',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Redis Configuration (for caching)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // Yield Optimization Configuration
  yield: {
    // Default optimization weights
    defaultWeights: {
      revenue: 0.4,
      conversions: 0.3,
      ltv: 0.2,
      ctr: 0.05,
      brandSafety: 0.05,
    },

    // Floor price thresholds
    floorPrice: {
      minFloor: 0.1,
      maxFloor: 50.0,
      defaultFloor: 0.5,
      dynamicMultiplier: 1.2,
    },

    // Bid thresholds
    bid: {
      minBid: 0.01,
      maxBid: 100.0,
      defaultBid: 1.0,
      increment: 0.01,
    },

    // Time windows for analytics
    timeWindows: {
      short: 60 * 60 * 1000, // 1 hour
      medium: 24 * 60 * 60 * 1000, // 24 hours
      long: 7 * 24 * 60 * 60 * 1000, // 7 days
 },

    // Cache TTL (in seconds)
    cacheTTL: {
      floorPrice: 300, // 5 minutes
      bidLandscape: 900, // 15 minutes
      prediction: 600, // 10 minutes
      metrics: 60, // 1 minute
    },

    // Confidence thresholds
    confidence: {
      minConfidence: 0.5,
      highConfidence: 0.8,
      veryHighConfidence: 0.95,
    },

    // Rate limiting
    rateLimit: {
      windowMs: 60000, // 1 minute
      maxRequests: 1000,
    },
  },

  // Integration Configuration
  integrations: {
    // REZ Ad Service
    rezAdService: {
      url: process.env.REZ_AD_SERVICE_URL || 'http://localhost:4100',
      timeout: 5000,
    },

    // Intent Signal Aggregator
    intentSignalAggregator: {
      url: process.env.INTENT_SIGNAL_URL || 'http://localhost:4300',
      timeout: 3000,
    },

    // Intent Prediction Engine
    intentPredictionEngine: {
      url: process.env.INTENT_PREDICTION_URL || 'http://localhost:4310',
      timeout: 3000,
    },

    // REZ Programmatic Bidding
    rezProgrammaticBidding: {
      url: process.env.REZ_PROGRAMMATIC_URL || 'http://localhost:4320',
      timeout: 5000,
    },
  },

  // Metrics Configuration
  metrics: {
    enabled: process.env.ENABLE_METRICS === 'true',
    port: parseInt(process.env.METRICS_PORT || '4891', 10),
  },

  // Internal Service Token
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'yield-brain-internal-token',

  // Request timeout
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '10000', 10),
};

export type Config = typeof config;
