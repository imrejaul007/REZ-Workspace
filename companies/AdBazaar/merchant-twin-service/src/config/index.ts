/**
 * Configuration for merchant-twin-service
 */

export const config = {
  port: parseInt(process.env.PORT || '4807', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/merchant-twin',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://ads.rez.money').split(','),
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
};

export default config;