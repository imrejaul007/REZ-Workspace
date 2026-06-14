// ============================================================================
// Role AI Agents - Configuration
// ============================================================================

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4751', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/role-ai-agents',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
  },

  // AI Configuration (placeholder for external AI service)
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  },

  // Session
  session: {
    maxMessages: 50,
    timeoutMinutes: 60,
  },

  // Security
  security: {
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
    enableAuth: process.env.ENABLE_AUTH === 'true',
  },
};

export default config;
