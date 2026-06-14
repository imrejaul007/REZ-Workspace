import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4200', 10),

  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rider_circle',
    dbName: process.env.MONGODB_DB_NAME || 'rider_circle',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Neo4j (Graph)
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    user: process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'ridercircle',
  },

  // RABTUL Integration
  rez: {
    authUrl: process.env.REZ_AUTH_URL || 'http://localhost:4002',
    walletUrl: process.env.REZ_WALLET_URL || 'http://localhost:4004',
    notificationUrl: process.env.REZ_NOTIFICATION_URL || 'http://localhost:4011',
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'internal-token',
  },

  // HOJAI Integration
  hojai: {
    memoryUrl: process.env.HOJAI_MEMORY_URL || 'http://localhost:4015',
    agentUrl: process.env.HOJAI_AGENT_URL || 'http://localhost:4700',
    kgUrl: process.env.HOJAI_KG_URL || 'http://localhost:4786',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // SafeQR
  safeqr: {
    secret: process.env.SAFEQR_SECRET || 'safeqr-secret',
  },

  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || 'rider-circle-media',
    region: process.env.AWS_REGION || 'ap-south-1',
  },

  // CORS
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),
  },

  // Paths
  paths: {
    uploads: path.join(process.cwd(), 'uploads'),
  },
} as const;

export type Config = typeof config;
