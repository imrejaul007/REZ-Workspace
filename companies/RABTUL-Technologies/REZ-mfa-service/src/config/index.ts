import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
    options: {
      maxPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
    };
  };
  redis: {
    url: string;
    keyPrefix: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  internalServiceToken: string;
  sms: {
    provider: 'twilio' | 'mock';
    twilio: {
      accountSid: string;
      authToken: string;
      phoneNumber: string;
    };
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  totp: {
    issuer: string;
    window: number;
    step: number;
    algorithm: string;
    digits: number;
  };
  backupCodes: {
    count: number;
    hashRounds: number;
    length: number;
  };
  anomaly: {
    loginWindowHours: number;
    thresholdSameCity: number;
    thresholdSameIp: number;
    thresholdFailedAttempts: number;
  };
  logging: {
    level: string;
    format: 'json' | 'simple';
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '4031', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_mfa',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'rez:mfa:',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',

  sms: {
    provider: (process.env.SMS_PROVIDER as 'twilio' | 'mock') || 'mock',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  totp: {
    issuer: process.env.TOTP_ISSUER || 'REZ',
    window: parseInt(process.env.TOTP_WINDOW || '1', 10),
    step: parseInt(process.env.TOTP_STEP || '30', 10),
    algorithm: 'SHA1',
    digits: 6,
  },

  backupCodes: {
    count: parseInt(process.env.BACKUP_CODES_COUNT || '10', 10),
    hashRounds: parseInt(process.env.BACKUP_CODES_HASH_ROUNDS || '10', 10),
    length: 10,
  },

  anomaly: {
    loginWindowHours: parseInt(process.env.ANOMALY_LOGIN_WINDOW_HOURS || '24', 10),
    thresholdSameCity: parseInt(process.env.ANOMALY_THRESHOLD_SAME_CITY || '5', 10),
    thresholdSameIp: parseInt(process.env.ANOMALY_THRESHOLD_SAME_IP || '10', 10),
    thresholdFailedAttempts: parseInt(process.env.ANOMALY_THRESHOLD_FAILED_ATTEMPTS || '3', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: (process.env.LOG_FORMAT as 'json' | 'simple') || 'json',
  },
};

export default config;
