/**
 * Database Configuration
 */
export const config = {
  port: parseInt(process.env.PORT || '4701', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'corpid-jwt-secret-dev',
    expiresIn: '24h',
  },

  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'corpid-internal-token',

  // Service URLs for proxy
  services: {
    identity: process.env.IDENTITY_SERVICE_URL || 'http://localhost:4702',
    verification: process.env.VERIFICATION_SERVICE_URL || 'http://localhost:4703',
    ciScore: process.env.CI_SCORE_SERVICE_URL || 'http://localhost:4704',
    passport: process.env.PASSPORT_SERVICE_URL || 'http://localhost:4705',
    trustGraph: process.env.TRUST_GRAPH_SERVICE_URL || 'http://localhost:4706',
    monitor: process.env.MONITOR_SERVICE_URL || 'http://localhost:4707',
    risk: process.env.RISK_SERVICE_URL || 'http://localhost:4708',
    document: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:4709',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4710',
    partner: process.env.PARTNER_SERVICE_URL || 'http://localhost:4711',
    admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:4712',
  },

  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
};

export default config;
