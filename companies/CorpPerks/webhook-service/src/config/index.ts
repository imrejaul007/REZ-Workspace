import { z } from 'zod';

const configSchema = z.object({
  port: z.number().default(4746),
  env: z.enum(['development', 'production', 'test']).default('development'),
  database: z.object({
    mongoUri: z.string().default('mongodb://localhost:27017/corpperks-webhooks'),
  }),
  webhook: z.object({
    maxRetries: z.number().default(3),
    retryDelayMs: z.number().default(5000),
    timeoutMs: z.number().default(30000),
    signatureHeader: z.string().default('x-webhook-signature'),
    signatureAlgorithm: z.string().default('sha256'),
  }),
  rateLimit: z.object({
    windowMs: z.number().default(60000),
    maxRequests: z.number().default(100),
  }),
});

export const config = configSchema.parse({
  port: parseInt(process.env.WEBHOOK_PORT || '4746', 10),
  env: process.env.NODE_ENV || 'development',
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks-webhooks',
  },
  webhook: {
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.WEBHOOK_RETRY_DELAY_MS || '5000', 10),
    timeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '30000', 10),
    signatureHeader: 'x-webhook-signature',
    signatureAlgorithm: 'sha256',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
});

export type Config = z.infer<typeof configSchema>;
