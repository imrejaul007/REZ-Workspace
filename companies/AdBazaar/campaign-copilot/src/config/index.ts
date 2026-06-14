import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4823').transform(Number),
  MONGODB_URI: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  REZ_ADS_SERVICE_URL: z.string().default('http://localhost:4007'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  logger.error('Invalid environment variables:', parseResult.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parseResult.data.PORT,
  mongodb: {
    uri: parseResult.data.MONGODB_URI,
  },
  redis: {
    url: parseResult.data.REDIS_URL,
  },
  jwt: {
    secret: parseResult.data.JWT_SECRET,
  },
  openai: {
    apiKey: parseResult.data.OPENAI_API_KEY || '',
  },
  rezAdsService: {
    url: parseResult.data.REZ_ADS_SERVICE_URL,
  },
  nodeEnv: parseResult.data.NODE_ENV,
  logLevel: parseResult.data.LOG_LEVEL,
} as const;

export type Config = typeof config;