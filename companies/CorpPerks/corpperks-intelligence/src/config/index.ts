import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4135', 10),
  serviceName: 'corpperks-intelligence',

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // CorpPerks Backend
  corpperksApi: {
    url: process.env.CORPPERKS_API_URL || 'http://localhost:4006/api/v1',
    timeout: 10000,
  },

  // REZ Intelligence Services
  rezIntelligence: {
    signalAggregator: process.env.REZ_SIGNAL_AGGREGATOR_URL || 'http://localhost:4121',
    predictiveEngine: process.env.REZ_PREDICTIVE_ENGINE_URL || 'http://localhost:4123',
    intentGraph: process.env.REZ_INTENT_GRAPH_URL || 'http://localhost:4018',
  },

  // AI Settings
  ai: {
    defaultConfidence: 0.75,
    minConfidenceThreshold: 0.6,
    maxCardsPerRequest: 10,
    cardExpirationHours: 24,
  },

  // Decision Card Settings
  decisionCards: {
    attritionRiskThreshold: 0.7,
    attendanceAnomalyThreshold: 0.3, // 30% deviation
    overtimeSurgeThreshold: 0.5, // 50% increase
    engagementDropThreshold: 0.2, // 20% drop
  },

  // Health Score Weights
  healthScore: {
    engagement: 0.25,
    attendance: 0.25,
    productivity: 0.25,
    sentiment: 0.25,
  },

  // Anomaly Detection
  anomaly: {
    zScoreThreshold: 2.0, // Standard deviations
    minDataPoints: 7, // Minimum days of data
    alertWindowHours: 24,
  },
};

export default config;
