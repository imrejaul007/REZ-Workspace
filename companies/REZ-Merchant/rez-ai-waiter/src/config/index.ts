import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3024', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_ai_waiter',
  jwtSecret: process.env.JWT_SECRET || 'ai-waiter-secret-key-change-in-production',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  whatsappWebhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET || 'whatsapp-webhook-secret',
};

export type Config = typeof config;
