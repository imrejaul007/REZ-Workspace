import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define the environment schema with Zod validation
const envSchema = z.object({
  PORT: z.string().default('4071').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/rez-loyalty'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  INTERNAL_TOKEN: z.string().min(16, 'INTERNAL_TOKEN must be at least 16 characters'),
  CORS_ORIGIN: z.string().default('*'),
  RABTUL_ENABLED: z.string().default('true').transform(val => val === 'true'),
  RABTUL_WEBHOOK_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  POINTS_EXPIRATION_DAYS: z.string().default('365').transform(val => parseInt(val, 10)),
  CROSS_INDUSTRY_CONVERSION_RATE: z.string().default('1').transform(val => parseFloat(val))
});

// Parse and validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const config = parseResult.data;

// Export typed config
export interface Config {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  MONGODB_URI: string;
  JWT_SECRET: string;
  INTERNAL_TOKEN: string;
  CORS_ORIGIN: string;
  RABTUL_ENABLED: boolean;
  RABTUL_WEBHOOK_URL?: string;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  POINTS_EXPIRATION_DAYS: number;
  CROSS_INDUSTRY_CONVERSION_RATE: number;
}

export default config;