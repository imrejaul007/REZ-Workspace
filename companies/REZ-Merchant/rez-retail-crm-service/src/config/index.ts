import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4101', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-retail-crm',
  jwt: {
    secret: process.env.JWT_SECRET || 'rez-crm-secret-key',
  },
  integrations: {
    retail: process.env.RETAIL_SERVICE_URL || 'http://localhost:4100',
    loyalty: process.env.LOYALTY_SERVICE_URL || 'http://localhost:4102',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4105',
    shopflow: process.env.SHOPFLOW_URL || 'http://localhost:4830',
  },
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'rez-crm-internal-token',
};