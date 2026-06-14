import dotenv from 'dotenv';

dotenv.config();

export const config = {
 // Service
 nodeEnv: process.env.NODE_ENV || 'development',
 port: parseInt(process.env.PORT || '4000', 10),
 logLevel: process.env.LOG_LEVEL || 'info',

 // Database
 mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-safe-qr',
 mongodbOptions: {
   // FIX: Add authentication options for MongoDB
   ...(process.env.MONGODB_USER && process.env.MONGODB_PASSWORD
     ? {
         auth: {
           username: process.env.MONGODB_USER,
           password: process.env.MONGODB_PASSWORD,
         },
         authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
       }
     : {}),
   // Connection pool settings
   maxPoolSize: 10,
   serverSelectionTimeoutMS: 5000,
   socketTimeoutMS: 45000,
 },
 redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

 // RABTUL Services
 auth: {
   url: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
 },
 notifications: {
   url: process.env.NOTIFICATIONS_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
 },
 whatsapp: {
   url: process.env.WHATSAPP_SERVICE_URL || 'https://reks-whatsapp-commerce.onrender.com',
 },

 // REZ-Intelligence Services
 rezIntelligence: {
   agentOs: {
     url: process.env.REZ_AGENT_OS_URL || 'https://rez-agent-os.onrender.com',
   },
   mind: {
     url: process.env.REZ_MIND_URL || 'https://rez-mind.rezapp.com',
   },
   intentGraph: {
     url: process.env.INTENT_GRAPH_URL || 'https://rez-intent-graph.rezapp.com',
   },
 },

 // Internal Auth
 internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',

 // Security - Allowed CORS Origins
 allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://www.rez.money,https://safe-qr.app').split(','),

 // Webhook Secret for signature verification
 webhookSecret: process.env.WEBHOOK_SECRET || '',

 // QR Config
 qr: {
   baseUrl: process.env.QR_BASE_URL || 'https://rez.app/s',
   secret: process.env.QR_SECRET || '',
 },

 // Session Config
 session: {
   expiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS || '24', 10),
   messageExpiryDays: parseInt(process.env.MESSAGE_EXPIRY_DAYS || '7', 10),
   feedPostExpiryDays: parseInt(process.env.FEED_POST_EXPIRY_DAYS || '7', 10),
 },

 // Rate Limits
 rateLimits: {
   messagesPerHour: parseInt(process.env.MESSAGES_PER_HOUR || '5', 10),
   messagesPerDay: parseInt(process.env.MESSAGES_PER_DAY || '20', 10),
   contactsPerHour: parseInt(process.env.CONTACTS_PER_HOUR || '3', 10),
   scansPerHour: parseInt(process.env.SCANS_PER_HOUR || '10', 10),
 },

 // API Rate Limiting (global)
 apiRateLimit: {
   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
   max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
 },
 authRateLimit: {
   windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
   max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10), // Stricter for auth
 },

 // Optional
 sentryDsn: process.env.SENTRY_DSN,
 awsS3Bucket: process.env.AWS_S3_BUCKET,
} as const;

export type Config = typeof config;
