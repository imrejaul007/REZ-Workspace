import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'INTERNAL_SERVICE_TOKEN',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export const config = {
  // Service Configuration
  port: parseInt(process.env.PORT || '4096', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'rez-merchant-corpperks-bridge',
  version: '1.0.0',

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks-bridge',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // REZ Merchant Configuration
  merchant: {
    baseUrl: process.env.REZ_MERCHANT_BASE_URL || 'http://localhost:4000',
    apiKey: process.env.REZ_MERCHANT_API_KEY || '',
    timeout: 30000,
  },

  // CorpPerks Configuration
  corpPerks: {
    apiUrl: process.env.CORPPERKS_API_URL || 'https://api.corpperks.com',
    apiKey: process.env.CORPPERKS_API_KEY || '',
    timeout: 30000,
  },

  // Internal Service Token
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',

  // HRIS Provider Configuration
  hris: {
    bambooHR: {
      apiKey: process.env.BAMBOOHR_API_KEY || '',
      companyDomain: process.env.BAMBOOHR_COMPANY_DOMAIN || '',
      baseUrl: 'https://api.bamboohr.com/api/gateway.php',
    },
    greytHR: {
      apiKey: process.env.GREYTHR_API_KEY || '',
      companyId: process.env.GREYTHR_COMPANY_ID || '',
      baseUrl: 'https://example.greythr.com/api',
    },
    zohoPeople: {
      apiKey: process.env.ZOHO_PEOPLE_API_KEY || '',
      orgId: process.env.ZOHO_PEOPLE_ORG_ID || '',
      baseUrl: 'https://people.zoho.com/api',
    },
  },

  // GST Configuration
  gst: {
    apiUrl: process.env.GST_API_URL || 'https://api.gst.gov.in',
    username: process.env.GST_USERNAME || '',
    password: process.env.GST_PASSWORD || '',
    clientId: process.env.GST_CLIENT_ID || '',
    clientSecret: process.env.GST_CLIENT_SECRET || '',
    timeout: 60000,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'simple',
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS Configuration
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-Id'],
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
    expiresIn: '24h',
  },

  // Encryption Configuration
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key',
    algorithm: 'aes-256-gcm',
  },
};

export default config;
