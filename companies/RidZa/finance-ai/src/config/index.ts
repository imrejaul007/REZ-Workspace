import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-ai'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_ME'
  },
  services: {
    auth: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
    payment: process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001',
    wallet: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
    notification: process.env.RABTUL_NOTIFICATION_URL || 'http://localhost:4005'
  },
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || ''
};

export function validateConfig(): void {
  if (!config.mongodb.uri) {
    throw new Error('Missing required config: MONGODB_URI');
  }
}
