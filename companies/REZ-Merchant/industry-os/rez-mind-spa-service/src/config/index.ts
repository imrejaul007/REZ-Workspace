import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4051').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/rez_spa'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  INTERNAL_TOKEN: z.string().min(32, 'INTERNAL_TOKEN must be at least 32 characters'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  CORS_ORIGINS: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX: z.string().default('30'),
  AI_CONFIDENCE_THRESHOLD: z.string().default('0.6').transform(Number),
  SESSION_TIMEOUT_MS: z.string().default('1800000').transform(Number),
  MAX_RECOMMENDATIONS: z.string().default('10').transform(Number),
});

let envConfig: z.infer<typeof envSchema>;

try {
  envConfig = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Invalid environment configuration:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

export const config = {
  port: envConfig.PORT,
  nodeEnv: envConfig.NODE_ENV,
  mongodbUri: envConfig.MONGODB_URI,
  jwtSecret: envConfig.JWT_SECRET,
  jwtExpiresIn: envConfig.JWT_EXPIRES_IN,
  internalToken: envConfig.INTERNAL_TOKEN,
  logLevel: envConfig.LOG_LEVEL,
  corsOrigins: envConfig.CORS_ORIGINS.split(',').map((s) => s.trim()),
  rateLimit: {
    windowMs: envConfig.RATE_LIMIT_WINDOW_MS,
    max: envConfig.RATE_LIMIT_MAX,
  },
  ai: {
    confidenceThreshold: envConfig.AI_CONFIDENCE_THRESHOLD,
    sessionTimeout: envConfig.SESSION_TIMEOUT_MS,
    maxRecommendations: envConfig.MAX_RECOMMENDATIONS,
  },
  isProduction: envConfig.NODE_ENV === 'production',
  isDevelopment: envConfig.NODE_ENV === 'development',
  isTest: envConfig.NODE_ENV === 'test',
};

export type Config = typeof config;
