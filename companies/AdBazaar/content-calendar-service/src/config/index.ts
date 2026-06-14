import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5092'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/content-calendar'),
  INTERNAL_SERVICE_TOKEN: z.string(),
  JWT_SECRET: z.string().default('default-secret-change-in-production'),
  REZ_AUTH_SERVICE_URL: z.string().default('http://localhost:4002'),
  REZ_NOTIFICATION_SERVICE_URL: z.string().default('http://localhost:4011'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  logger.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const config = {
  port: parseInt(parsedEnv.data.PORT, 10),
  nodeEnv: parsedEnv.data.NODE_ENV,
  mongodb: {
    uri: parsedEnv.data.MONGODB_URI,
  },
  auth: {
    internalServiceToken: parsedEnv.data.INTERNAL_SERVICE_TOKEN,
    jwtSecret: parsedEnv.data.JWT_SECRET,
  },
  services: {
    rezAuth: parsedEnv.data.REZ_AUTH_SERVICE_URL,
    rezNotification: parsedEnv.data.REZ_NOTIFICATION_SERVICE_URL,
  },
  logging: {
    level: parsedEnv.data.LOG_LEVEL,
  },
  rateLimit: {
    windowMs: parseInt(parsedEnv.data.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(parsedEnv.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },
};

export const platformColors: Record<string, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  tiktok: '#000000',
  pinterest: '#E60023',
  snapchat: '#FFFC00',
  reddit: '#FF4500',
  default: '#6B7280',
};

export const defaultWorkingHours = {
  start: '09:00',
  end: '18:00',
};
