import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(4060),
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  INTERNAL_TOKEN: z.string().min(16, 'Internal token must be at least 16 characters'),
  RABTUL_API_KEY: z.string().optional(),
  RABTUL_BASE_URL: z.string().url().optional().default('https://api.rabtul.io'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_READ: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_MAX_WRITE: z.coerce.number().int().positive().default(50),
});

export type EnvConfig = z.infer<typeof envSchema>;

let envConfig: EnvConfig;

try {
  envConfig = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export const config = {
  env: envConfig.NODE_ENV,
  port: envConfig.PORT,
  mongodb: {
    uri: envConfig.MONGODB_URI,
  },
  auth: {
    jwtSecret: envConfig.JWT_SECRET,
    internalToken: envConfig.INTERNAL_TOKEN,
  },
  rabtul: {
    apiKey: envConfig.RABTUL_API_KEY || '',
    baseUrl: envConfig.RABTUL_BASE_URL,
  },
  rateLimit: {
    windowMs: envConfig.RATE_LIMIT_WINDOW_MS,
    maxRead: envConfig.RATE_LIMIT_MAX_READ,
    maxWrite: envConfig.RATE_LIMIT_MAX_WRITE,
  },
  isProduction: envConfig.NODE_ENV === 'production',
  isDevelopment: envConfig.NODE_ENV === 'development',
  isTest: envConfig.NODE_ENV === 'test',
};

export default config;
