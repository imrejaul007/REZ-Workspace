import { z } from 'zod';

const configSchema = z.object({
  PORT: z.string().default('4075'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/rez-go'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('rez-go-jwt-secret-change-in-production'),
  INTERNAL_SERVICE_TOKEN: z.string().default('rez-go-internal-token'),

  // RABTUL Service URLs
  WALLET_SERVICE_URL: z.string().default('http://localhost:4004'),
  PAYMENT_SERVICE_URL: z.string().default('http://localhost:4001'),
  AUTH_SERVICE_URL: z.string().default('http://localhost:4002'),

  // REZ Intelligence
  INTENT_SERVICE_URL: z.string().default('http://localhost:4018'),

  // REZ Prive Service (Premium Loyalty)
  PRIVE_SERVICE_URL: z.string().default('http://localhost:4070'),

  // REZ Try Service (Product Trials)
  TRY_SERVICE_URL: z.string().default('http://localhost:3001'),

  // Tax configuration
  GST_PERCENT: z.number().default(18),

  // Session configuration
  SESSION_TIMEOUT_MINUTES: z.number().default(120),
  MAX_ITEMS_PER_SESSION: z.number().default(100),

  // Fraud thresholds
  FRAUD_THRESHOLD_HIGH: z.number().default(75),
  FRAUD_THRESHOLD_MEDIUM: z.number().default(50),

  // Offline sync
  OFFLINE_SYNC_BATCH_SIZE: z.number().default(50),
  OFFLINE_RETRY_ATTEMPTS: z.number().default(3),
  OFFLINE_RETRY_DELAY_MS: z.number().default(5000),
});

const envVars = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI,
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN,
  WALLET_SERVICE_URL: process.env.WALLET_SERVICE_URL,
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
  INTENT_SERVICE_URL: process.env.INTENT_SERVICE_URL,
  PRIVE_SERVICE_URL: process.env.PRIVE_SERVICE_URL,
  TRY_SERVICE_URL: process.env.TRY_SERVICE_URL,
  GST_PERCENT: process.env.GST_PERCENT ? Number(process.env.GST_PERCENT) : undefined,
  SESSION_TIMEOUT_MINUTES: process.env.SESSION_TIMEOUT_MINUTES ? Number(process.env.SESSION_TIMEOUT_MINUTES) : undefined,
  MAX_ITEMS_PER_SESSION: process.env.MAX_ITEMS_PER_SESSION ? Number(process.env.MAX_ITEMS_PER_SESSION) : undefined,
  FRAUD_THRESHOLD_HIGH: process.env.FRAUD_THRESHOLD_HIGH ? Number(process.env.FRAUD_THRESHOLD_HIGH) : undefined,
  FRAUD_THRESHOLD_MEDIUM: process.env.FRAUD_THRESHOLD_MEDIUM ? Number(process.env.FRAUD_THRESHOLD_MEDIUM) : undefined,
  OFFLINE_SYNC_BATCH_SIZE: process.env.OFFLINE_SYNC_BATCH_SIZE ? Number(process.env.OFFLINE_SYNC_BATCH_SIZE) : undefined,
  OFFLINE_RETRY_ATTEMPTS: process.env.OFFLINE_RETRY_ATTEMPTS ? Number(process.env.OFFLINE_RETRY_ATTEMPTS) : undefined,
  OFFLINE_RETRY_DELAY_MS: process.env.OFFLINE_RETRY_DELAY_MS ? Number(process.env.OFFLINE_RETRY_DELAY_MS) : undefined,
};

export const config = configSchema.parse(envVars);

export type Config = z.infer<typeof configSchema>;
