import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '4133'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-meeting-notes-service',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  SERVICE_TOKENS: {
    conversation: process.env.CONVERSATION_TOKEN || 'conversation-token-xxx',
    deal: process.env.DEAL_TOKEN || 'deal-token-xxx',
  },
};

export default config;
