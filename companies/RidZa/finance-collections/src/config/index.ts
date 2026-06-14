import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().optional(),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),

  // RABTUL Service URLs
  RABTUL_AUTH_URL: z.string().url().default('http://localhost:4002'),
  RABTUL_PAYMENT_URL: z.string().url().default('http://localhost:4001'),
  RABTUL_WALLET_URL: z.string().url().default('http://localhost:4004'),
  RABTUL_NOTIFICATION_URL: z.string().url().default('http://localhost:4005'),
  RABTUL_ANALYTICS_URL: z.string().url().default('http://localhost:4016'),
  RABTUL_EVENT_BUS_URL: z.string().url().default('http://localhost:4025'),
});

type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Invalid environment configuration:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
  throw new Error('Environment configuration validation failed');
}

export const appConfig = {
  nodeEnv: config.NODE_ENV,
  port: config.PORT,
  mongodbUri: config.MONGODB_URI,
  jwtSecret: config.JWT_SECRET,
  redisUrl: config.REDIS_URL,
  internalServiceToken: config.INTERNAL_SERVICE_TOKEN,
  services: {
    auth: config.RABTUL_AUTH_URL,
    payment: config.RABTUL_PAYMENT_URL,
    wallet: config.RABTUL_WALLET_URL,
    notification: config.RABTUL_NOTIFICATION_URL,
    analytics: config.RABTUL_ANALYTICS_URL,
    eventBus: config.RABTUL_EVENT_BUS_URL,
  },
  isProduction: config.NODE_ENV === 'production',
  isDevelopment: config.NODE_ENV === 'development',
};

export default appConfig;
