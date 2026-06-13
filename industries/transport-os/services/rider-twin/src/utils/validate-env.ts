/**
 * Environment Validation
 *
 * Validates required environment variables for the Rider Twin service
 */

export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGINS: string;
  LOG_LEVEL: string;
  EVENT_BUS_URL?: string;
  JWT_SECRET?: string;
  TWINOS_URL?: string;
}

const REQUIRED: (keyof EnvConfig)[] = ['PORT', 'NODE_ENV'];
const OPTIONAL: (keyof EnvConfig)[] = ['CORS_ORIGINS', 'LOG_LEVEL', 'EVENT_BUS_URL', 'JWT_SECRET', 'TWINOS_URL'];

const DEFAULTS: Partial<EnvConfig> = {
  PORT: 9050,
  NODE_ENV: 'development',
  CORS_ORIGINS: '*',
  LOG_LEVEL: 'info',
};

export function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Check required variables
  for (const key of REQUIRED) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  // Build config with defaults
  const config: EnvConfig = {
    PORT: parseInt(process.env.PORT || String(DEFAULTS.PORT), 10),
    NODE_ENV: process.env.NODE_ENV || DEFAULTS.NODE_ENV!,
    CORS_ORIGINS: process.env.CORS_ORIGINS || DEFAULTS.CORS_ORIGINS!,
    LOG_LEVEL: process.env.LOG_LEVEL || DEFAULTS.LOG_LEVEL!,
    EVENT_BUS_URL: process.env.EVENT_BUS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    TWINOS_URL: process.env.TWINOS_URL,
  };

  // Validate port
  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }

  return config;
}

// Re-export singleton instance
let envConfig: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnv();
  }
  return envConfig;
}
