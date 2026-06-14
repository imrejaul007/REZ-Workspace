import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '4203', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-salon',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET!,
  INTERNAL_SERVICE_TOKENS_JSON: process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}',
  SERVICE_NAME: 'rez-salon-membership-service',
};

export interface ServiceToken {
  [serviceName: string]: string;
}

export function getServiceTokens(): ServiceToken {
  try {
    return JSON.parse(config.INTERNAL_SERVICE_TOKENS_JSON);
  } catch {
    return {};
  }
}

export function verifyInternalToken(token: string): boolean {
  const tokens = getServiceTokens();
  return Object.values(tokens).includes(token);
}
