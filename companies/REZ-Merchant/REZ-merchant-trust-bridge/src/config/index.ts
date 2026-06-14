import dotenv from 'dotenv';
import { ServiceConfig, TrustSourceConfig, LimitCalculationRule } from '../types';

// Load environment variables
dotenv.config();

// Default trust sources
const defaultTrustSources: TrustSourceConfig[] = [
  {
    id: 'rez-fraud-service',
    name: 'REZ Fraud Service',
    endpoint: process.env.FRAUD_SERVICE_URL || 'http://localhost:4022',
    enabled: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    timeout: 10000,
  },
  {
    id: 'rez-identity-service',
    name: 'REZ Identity Service',
    endpoint: process.env.IDENTITY_SERVICE_URL || 'http://localhost:4001',
    enabled: true,
    syncInterval: 10 * 60 * 1000, // 10 minutes
    timeout: 10000,
  },
  {
    id: 'external-bureau',
    name: 'External Credit Bureau',
    endpoint: process.env.BUREAU_API_URL || '',
    apiKey: process.env.BUREAU_API_KEY,
    enabled: process.env.BUREAU_ENABLED === 'true',
    syncInterval: 60 * 60 * 1000, // 1 hour
    timeout: 30000,
  },
];

// Default limit calculation rules
const defaultLimitRules: LimitCalculationRule[] = [
  {
    minScore: 90,
    maxScore: 100,
    riskLevel: 'LOW',
    baseLimit: 500000, // 5 lakhs
    limitMultiplier: 2.0,
    maxLimit: 10000000, // 1 crore
    minLimit: 100000, // 1 lakh
  },
  {
    minScore: 75,
    maxScore: 89,
    riskLevel: 'LOW',
    baseLimit: 250000, // 2.5 lakhs
    limitMultiplier: 1.5,
    maxLimit: 5000000, // 50 lakhs
    minLimit: 50000, // 50k
  },
  {
    minScore: 60,
    maxScore: 74,
    riskLevel: 'MEDIUM',
    baseLimit: 100000, // 1 lakh
    limitMultiplier: 1.0,
    maxLimit: 2000000, // 20 lakhs
    minLimit: 25000, // 25k
  },
  {
    minScore: 40,
    maxScore: 59,
    riskLevel: 'HIGH',
    baseLimit: 25000, // 25k
    limitMultiplier: 0.5,
    maxLimit: 500000, // 5 lakhs
    minLimit: 10000, // 10k
  },
  {
    minScore: 0,
    maxScore: 39,
    riskLevel: 'CRITICAL',
    baseLimit: 0,
    limitMultiplier: 0,
    maxLimit: 0,
    minLimit: 0,
  },
];

export const config: ServiceConfig = {
  port: parseInt(process.env.PORT || '4041', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-merchant-trust-bridge',
  logLevel: process.env.LOG_LEVEL || 'info',
  trustSources: process.env.TRUST_SOURCES
    ? JSON.parse(process.env.TRUST_SOURCES)
    : defaultTrustSources,
  limitRules: process.env.LIMIT_RULES
    ? JSON.parse(process.env.LIMIT_RULES)
    : defaultLimitRules,
  alertThresholds: {
    trustDropPercent: parseInt(process.env.TRUST_DROP_THRESHOLD || '10', 10),
    riskIncreasePercent: parseInt(process.env.RISK_INCREASE_THRESHOLD || '15', 10),
    criticalScore: parseInt(process.env.CRITICAL_SCORE_THRESHOLD || '40', 10),
  },
  syncInterval: parseInt(process.env.SYNC_INTERVAL || '300000', 10), // 5 minutes default
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per minute
};

// Validation
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.mongodbUri) {
    errors.push('MONGODB_URI is required');
  }

  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }

  if (config.trustSources.length === 0) {
    errors.push('At least one trust source must be configured');
  }

  if (config.limitRules.length === 0) {
    errors.push('At least one limit rule must be configured');
  }

  if (config.alertThresholds.trustDropPercent < 0 || config.alertThresholds.trustDropPercent > 100) {
    errors.push('TRUST_DROP_THRESHOLD must be between 0 and 100');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

export default config;
