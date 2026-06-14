export interface AppConfig {
  env: string;
  name: string;
  version: string;
  port: number;
  host: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

export const getAppConfig = (): AppConfig => ({
  env: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'instagram-insights-service',
  version: process.env.APP_VERSION || '1.0.0',
  port: parseInt(process.env.PORT || '5082', 10),
  host: process.env.HOST || '0.0.0.0',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
});

export interface InstagramConfig {
  businessAccountId: string;
  accessToken: string;
  apiVersion: string;
  baseUrl: string;
}

export const getInstagramConfig = (): InstagramConfig => ({
  businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
  apiVersion: process.env.INSTAGRAM_API_VERSION || 'v18.0',
  baseUrl: 'https://graph.facebook.com',
});

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  ttl: number;
}

export const getRedisConfig = (): RedisConfig => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
});

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const getRateLimitConfig = (): RateLimitConfig => ({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
});