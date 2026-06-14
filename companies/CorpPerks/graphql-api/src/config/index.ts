import { z } from 'zod';

const configSchema = z.object({
  port: z.number().default(4747),
  env: z.enum(['development', 'production', 'test']).default('development'),
  database: z.object({
    mongoUri: z.string().default('mongodb://localhost:27017/corpperks'),
  }),
  jwt: z.object({
    secret: z.string().default('dev-secret-change-in-production'),
    expiresIn: z.string().default('7d'),
  }),
  rateLimit: z.object({
    windowMs: z.number().default(60000),
    maxRequests: z.number().default(100),
  }),
  cors: z.object({
    origin: z.string().or(z.array(z.string())).default('*'),
  }),
});

export const config = configSchema.parse({
  port: parseInt(process.env.GRAPHQL_PORT || '4747', 10),
  env: process.env.NODE_ENV || 'development',
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});

export type Config = z.infer<typeof configSchema>;
