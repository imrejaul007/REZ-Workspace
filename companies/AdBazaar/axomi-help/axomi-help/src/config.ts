import { z } from "zod";

/**
 * Zod schema for environment variable validation.
 * Throws at startup if required variables are missing or malformed.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4081),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z.string().url().default("mongodb://localhost:27017/axomi-help"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),
});

/**
 * Validated and typed environment configuration.
 */
export const env = envSchema.parse(process.env);

/** Whether the application is running in production mode */
export const isProduction = env.NODE_ENV === "production";

/** Whether the application is running in test mode */
export const isTest = env.NODE_ENV === "test";
