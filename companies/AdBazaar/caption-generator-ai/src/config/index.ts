/**
 * Service Configuration
 */

export const config = {
  // Server
  port: parseInt(process.env.PORT || '5091', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/caption-generator',
  },

  // AI Providers
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10),
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
  },

  // RABTUL Integration
  rabtul: {
    authUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS
  cors: {
    origins: (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://ads.rez.money').split(','),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;