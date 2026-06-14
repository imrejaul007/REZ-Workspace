/**
 * Configuration for brand-partnership-portal service
 */

// Service
export const PORT = parseInt(process.env.PORT || '5112', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';

// MongoDB
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/brand-partnership-portal';

// RABTUL Integration
export const RABTUL = {
  AUTH_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  WALLET_URL: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || ''
};

// External Services
export const EXTERNAL_SERVICES = {
  REZ_API_URL: process.env.REZ_API_URL || 'https://api.rez.money',
  HOJAI_API_URL: process.env.HOJAI_API_URL || 'http://localhost:4800'
};

// CORS
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://adbazaar.rez.money').split(',');

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
};

// Logging
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';