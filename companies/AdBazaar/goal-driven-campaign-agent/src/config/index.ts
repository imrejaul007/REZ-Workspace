import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4821', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/goal-driven-campaign-agent',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'goal-agent:',
    retryDelayMs: 1000,
    maxRetries: 3
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: '24h',
    algorithm: 'HS256'
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4-turbo-preview',
    maxTokens: 2000,
    temperature: 0.7
  },

  // External Services
  services: {
    adsServiceUrl: process.env.REZ_ADS_SERVICE_URL || 'http://localhost:4007'
  },

  // Agent Configuration
  agent: {
    // Decision loop interval in milliseconds
    decisionLoopIntervalMs: parseInt(process.env.AGENT_DECISION_INTERVAL || '60000', 10),
    // Maximum actions per decision cycle
    maxActionsPerCycle: 3,
    // Minimum budget threshold for optimization
    minBudgetThreshold: 10,
    // Performance thresholds
    performanceThresholds: {
      minRois: 1.5,
      maxCpaIncreasePercent: 20,
      minProgressPercentPerHour: 2
    },
    // Audience discovery settings
    audienceDiscovery: {
      minSampleSize: 1000,
      confidenceThreshold: 0.8,
      testDurationHours: 24
    },
    // Creative testing settings
    creativeTesting: {
      minVariants: 2,
      maxVariants: 5,
      testDurationHours: 12,
      winnerThreshold: 0.15
    }
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    outputDirectory: './logs'
  },

  // Rate limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },

  // Prometheus metrics
  metrics: {
    enabled: true,
    defaultLabels: {
      service: 'goal-driven-campaign-agent',
      version: '1.0.0'
    }
  }
};

// Validate required configuration
export function validateConfig(): void {
  const required = ['jwt.secret'];

  for (const key of required) {
    const value = key.split('.').reduce((obj: any, k) => obj?.[k], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }

  // Warn about OpenAI key in production
  if (config.nodeEnv === 'production' && !config.openai.apiKey) {
    logger.warn('WARNING: OPENAI_API_KEY not set in production!');
  }
}

export default config;