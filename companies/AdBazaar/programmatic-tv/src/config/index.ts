import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4700', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // OpenRTB
  openRtbVersion: process.env.OPENRTB_VERSION || '2.6',
  defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '3000', 10),
  maxBidRequests: parseInt(process.env.MAX_BID_REQUESTS || '100', 10),

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/programmatic-tv',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'ptv:',
    ttl: {
      bidRequest: 300,      // 5 minutes
      dealCache: 60,        // 1 minute
      floorCache: 300,      // 5 minutes
      seatCache: 300,       // 5 minutes
    },
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'adbazaar-programmatic-tv',
  },

  // Rate Limiting
  rateLimit: {
    bidRequests: parseInt(process.env.RATE_LIMIT_BID || '1000', 10),
    deals: parseInt(process.env.RATE_LIMIT_DEALS || '100', 10),
    seats: parseInt(process.env.RATE_LIMIT_SEATS || '100', 10),
    floors: parseInt(process.env.RATE_LIMIT_FLOORS || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
  },

  // Metrics
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    path: process.env.METRICS_PATH || '/metrics',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Forwarded-For'],
  },

  // Default Currency
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',

  // Auction Settings
  auction: {
    defaultAuctionType: parseInt(process.env.DEFAULT_AUCTION_TYPE || '2', 10),
    minBidFloor: parseFloat(process.env.MIN_BID_FLOOR || '0.01'),
    maxBidFloor: parseFloat(process.env.MAX_BID_FLOOR || '1000'),
  },
} as const;

export type Config = typeof config;