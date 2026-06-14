export const config = {
  port: parseInt(process.env.PORT || '4861', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_campaigns',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'whatsapp-campaign-secret-key-change-in-production',
    expiresIn: '24h',
  },

  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://ads.rez.money').split(','),
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },

  campaign: {
    maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '1000', 10),
    sendIntervalMs: parseInt(process.env.SEND_INTERVAL_MS || '1000', 10),
    optimalTimeWindowStart: 9,
    optimalTimeWindowEnd: 21,
  },
};