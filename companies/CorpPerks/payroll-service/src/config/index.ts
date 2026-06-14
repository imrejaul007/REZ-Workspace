import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4738', 10),

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks_payroll',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  // Internal Service Token (for service-to-service auth)
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token',

  // Tax Configuration (India FY 2024-25)
  tax: {
    standardDeduction: 75000,
    professionalTax: 2500,
    employerPF: 1800,
    esicLimit: 21000,
    esicRate: 0.0325,
    pfRate: 0.12,
    ptRate: {
      upTo15000: 0,
      upTo20000: 150,
      upTo25000: 175,
      above25000: 200,
    },
  },

  // Payroll Configuration
  payroll: {
    standardWorkingDays: 22,
    maxAdvancePercentage: 0.4, // 40% of gross salary
    reimbursementLimit: 50000,
    tdsRate: 0.1, // Default TDS rate
  },
};

export default config;
