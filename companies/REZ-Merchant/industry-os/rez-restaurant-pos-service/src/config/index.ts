import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-restaurant-pos',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
  },

  internalServiceTokens: JSON.parse(
    process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}'
  ),

  gst: {
    businessName: process.env.GST_BUSINESS_NAME || 'ReZ Restaurant',
    businessAddress: process.env.GST_BUSINESS_ADDRESS || 'Default Address',
    gstin: process.env.GST_GSTIN || 'XXAAAAA0000A1Z5',
  },

  invoice: {
    invoicePrefix: process.env.INVOICE_PREFIX || 'INV',
    invoiceSuffix: process.env.INVOICE_SUFFIX || 'REST',
  },
};
