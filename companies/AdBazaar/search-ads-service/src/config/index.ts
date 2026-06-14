/**
 * Configuration for Search Ads Service
 */

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4993', 10),
  env: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/search-ads',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Redis (for caching and real-time bidding)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // CORS
  cors: {
    origins: (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://ads.rez.money').split(','),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // max requests per window
    searchMax: 100, // max search requests
    bidMax: 50, // max bidding requests
  },

  // Search Ads Configuration
  searchAds: {
    // Maximum ads per search result page
    maxAdsPerPage: 5,
    // Minimum bid amount in cents
    minBidCents: 10,
    // Maximum bid amount in cents
    maxBidCents: 10000,
    // Default quality score weight
    qualityScoreWeight: 0.4,
    // Default bid weight
    bidWeight: 0.6,
    // Ad relevance threshold (0-1)
    relevanceThreshold: 0.3,
    // Cache TTL for search results (seconds)
    cacheTtlSeconds: 60,
  },

  // Intent Categories
  intentCategories: [
    'informational',
    'navigational',
    'transactional',
    'commercial',
    'local',
  ],

  // Quality Score Factors
  qualityScoreFactors: {
    ctr: 0.3,           // Click-through rate
    relevance: 0.25,    // Keyword relevance
    landingPage: 0.2,   // Landing page quality
    adCopy: 0.15,       // Ad copy quality
    historical: 0.1,     // Historical performance
  },

  // External Services
  services: {
    retailMediaOs: process.env.RETAIL_MEDIA_OS_URL || 'http://localhost:4990',
    sponsoredProducts: process.env.SPONSORED_PRODUCTS_URL || 'http://localhost:4831',
    discoveryPlatform: process.env.DISCOVERY_PLATFORM_URL || 'http://localhost:4000',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Metrics
  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    prefix: 'search_ads_',
  },
};