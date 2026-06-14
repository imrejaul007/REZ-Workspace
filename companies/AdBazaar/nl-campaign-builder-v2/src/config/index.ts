import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4822', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nl-campaign-builder',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'nl-campaign:'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.7
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // Build Configuration
  build: {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 60000, // 1 minute
    confidenceThreshold: 0.7
  },

  // Session Configuration
  session: {
    ttl: 3600, // 1 hour in seconds
    maxBuildsPerSession: 10
  }
};

// Validate required environment variables in production
if (config.nodeEnv === 'production') {
  const required = ['JWT_SECRET', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

export default config;