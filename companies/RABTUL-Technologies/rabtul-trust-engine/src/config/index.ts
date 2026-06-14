import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4180', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rabtul_trust_engine',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  trust: {
    defaultOverallScore: 50,
    defaultPaymentScore: 50,
    defaultFulfillmentScore: 50,
    defaultDisputeScore: 50,
    defaultVerificationScore: 50,
    maxScore: 100,
    minScore: 0,
    scoreThresholds: {
      excellent: 80,
      good: 60,
      fair: 40,
      poor: 20,
    },
  },

  credit: {
    defaultScore: 500,
    minScore: 300,
    maxScore: 900,
    scoreThresholds: {
      excellent: 750,
      veryGood: 700,
      good: 650,
      fair: 600,
      poor: 500,
    },
    riskLevels: ['low', 'medium', 'high', 'very_high'],
  },

  transactionLimits: {
    defaultMaxAutoApprove: 10000,
    defaultEscrowThreshold: 50000,
    defaultCreditTerms: [7, 14, 30, 60, 90],
  },
};
