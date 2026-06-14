import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4951'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/privacy-preserving-compute'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  INTERNAL_SERVICE_TOKEN: z.string().default('internal-service-token'),
  JWT_SECRET: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const env = envSchema.parse(process.env);

// Service configuration
export const config = {
  service: {
    name: 'privacy-preserving-compute',
    version: '1.0.0',
    port: parseInt(env.PORT, 10),
  },
  mongodb: {
    uri: env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  redis: {
    url: env.REDIS_URL,
    options: {
      maxRetriesPerRequest: 3,
    },
  },
  security: {
    internalToken: env.INTERNAL_SERVICE_TOKEN,
  },
  privacy: {
    // Differential Privacy defaults
    defaultEpsilon: 1.0,
    defaultDelta: 1e-5,
    defaultSensitivity: 1.0,

    // Federated Learning defaults
    defaultRounds: 10,
    defaultMinParticipants: 3,
    defaultTimeout: 300000, // 5 minutes

    // MPC defaults
    defaultThreshold: 2, // Minimum parties needed for reconstruction
    defaultShares: 3, // Total number of shares
  },
  limits: {
    maxComputationSize: 10 * 1024 * 1024, // 10MB
    maxParticipants: 100,
    maxRounds: 100,
    maxGradientSize: 5 * 1024 * 1024, // 5MB
  },
};

export default config;