import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { connectRedis } from './utils/redis';

// Import routes
import publicRoutes from './routes/index';
import authenticatedRoutes from './routes/authenticated';
import karmaRoutes from './routes/karma';
import modeRoutes from './routes/modes';
import sessionRoutes from './routes/sessions';
import qrGeneratorRoutes from './routes/qrGenerator';
import adminRoutes from './routes/admin';
import blockRoutes from './routes/blocks';
import printRoutes from './routes/print';
import dashboardRoutes from './routes/dashboard';
import webViewerRoutes from './routes/webViewer';
import webDashboardRoutes from './routes/webDashboard';
import landingRoutes from './routes/landing';
import authRoutes from './routes/auth';
import karmaFeedRoutes from './routes/karmaFeed';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// HTTPS redirect in production
app.use((req, res, next) => {
 if (config.nodeEnv === 'production' && req.protocol !== 'https') {
   return res.redirect(`https://${req.hostname}${req.url}`);
 }
 next();
});

// Helmet security headers
app.use(helmet({
 contentSecurityPolicy: {
   directives: {
     defaultSrc: ["'self'"],
     styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
     fontSrc: ["'self'", 'https://fonts.gstatic.com'],
     imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
     scriptSrc: ["'self'"],
     connectSrc: ["'self'", 'https://rez-auth-service.onrender.com'],
     frameAncestors: ["'none'"],
     upgradeInsecureRequests: [],
   },
 },
 hsts: {
   maxAge: 31536000,
   includeSubDomains: true,
   preload: true,
 },
 frameguard: { action: 'deny' },
 xssFilter: true,
 noSniff: true,
 referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS configuration - FIX: Restrict to allowed origins only
app.use(cors({
 origin: config.allowedOrigins,
 credentials: true,
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
 allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'x-app-source', 'x-request-id'],
 exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// Rate limiting - FIX: Global API rate limiting
const apiLimiter = rateLimit({
 windowMs: config.apiRateLimit.windowMs,
 max: config.apiRateLimit.max,
 standardHeaders: true,
 legacyHeaders: false,
 message: {
   error: 'Too many requests',
   message: 'Please try again later',
   retryAfter: Math.ceil(config.apiRateLimit.windowMs / 1000),
 },
 keyGenerator: (req) => {
   // Use X-Forwarded-For if behind proxy, otherwise use IP
   return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
          || req.ip
          || req.socket.remoteAddress
          || 'unknown';
 },
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
 windowMs: config.authRateLimit.windowMs,
 max: config.authRateLimit.max,
 standardHeaders: true,
 legacyHeaders: false,
 message: {
   error: 'Too many authentication attempts',
   message: 'Please try again later',
   retryAfter: Math.ceil(config.authRateLimit.windowMs / 1000),
 },
 keyGenerator: (req) => {
   return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
          || req.ip
          || req.socket.remoteAddress
          || 'unknown';
 },
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// Compression
app.use(compression());

// Logging with custom format (exclude sensitive data)
app.use(morgan('combined'));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// ROUTES
// ==========================================

// Public routes (no auth required)
app.use('/api', publicRoutes);

// Auth routes (with stricter rate limiting)
app.use('/api/auth', authRoutes);

// Authenticated routes
app.use('/api', authenticatedRoutes);

// Karma routes
app.use('/api/karma', karmaRoutes);

// Karma Feed (public - for karma app integration)
app.use('/api/karma', karmaFeedRoutes);

// Mode routes
app.use('/api/modes', modeRoutes);

// Session routes
app.use('/api/sessions', sessionRoutes);

// QR Generator routes
app.use('/api/qr', qrGeneratorRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Block/Report routes
app.use('/api/blocks', blockRoutes);

// Print routes (public - anyone can view)
app.use('/print', printRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Web viewer (public - for scanning without app)
app.use('/qr', webViewerRoutes);

// Web dashboard (authenticated)
app.use('/dashboard', webDashboardRoutes);

// Landing pages
app.use('/', landingRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// ==========================================
// DATABASE CONNECTION
// ==========================================

async function connectDB() {
 try {
   // MongoDB connection with authentication options
   await mongoose.connect(config.mongodbUri, {
     ...config.mongodbOptions,
   });
   logger.info('Connected to MongoDB');
 } catch (error) {
   logger.error('MongoDB connection failed:', error);
   process.exit(1);
 }
}

async function connectRedisClient() {
 try {
   await connectRedis();
   logger.info('Connected to Redis');
 } catch (error) {
   logger.error('Redis connection failed:', error);
   // Redis is optional - service can run without it
   logger.warn('Running without Redis - OTP/session storage will use memory fallback');
 }
}

// ==========================================
// SERVER STARTUP
// ==========================================

async function start() {
 await connectDB();
 await connectRedisClient();

 const port = config.port;
 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'safe-qr-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(port, () => {
   logger.info(`ReZ Safe QR Service running on port ${port}`);
   logger.info(`Environment: ${config.nodeEnv}`);
   logger.info(`Health check: http://localhost:${port}/api/health`);
   logger.info(`Rate limit: ${config.apiRateLimit.max} requests per ${config.apiRateLimit.windowMs / 1000}s`);
   logger.info(`Allowed CORS origins: ${config.allowedOrigins.join(', ')}`);
 });
}

start().catch(console.error);

export default app;
