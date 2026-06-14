import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-accountant',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'CHANGE_ME_in_production'
  },
  services: {
    auth: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
    payment: process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001',
    wallet: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
    notification: process.env.RABTUL_NOTIFICATION_URL || 'http://localhost:4005'
  },
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || ''
};

// Validate required config
export function validateConfig(): void {
  const required = ['mongodb.uri', 'jwt.secret'];
  for (const key of required) {
    const value = key.split('.').reduce((obj: Record<string, unknown>, k) =>
      obj?.[k] as Record<string, unknown>, config as unknown as Record<string, unknown>);
    if (!value) {
      throw new Error(`Missing required config: ${key}`);
    }
  }
}
