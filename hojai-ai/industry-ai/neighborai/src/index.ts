/**
 * NEIGHBORAI - Residential Society AI Operating System
 * Main Server Entry Point
 * Port: 4806
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// Load environment variables
dotenv.config();

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 4806;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neighborai';
const JWT_SECRET = process.env.JWT_SECRET || 'neighborai-super-secret-2024';
const NODE_ENV = process.env.NODE_ENV || 'development';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token';
const INTERNAL_TOKEN = INTERNAL_SERVICE_TOKEN;

// SDK & Webhook Service URLs
const WEBHOOK_SERVICE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090';
const HOJAI_URL = process.env.HOJAI_URL || 'http://localhost:4800';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095';

// ============================================
// LOGGER SETUP
// ============================================

import winston from 'winston';

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'NEIGHBORAI', version: '1.0.0', port: PORT },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// ============================================
// SDK & WEBHOOK HELPERS
// ============================================

async function triggerWebhook(event: string, payload: any) {
  try {
    await axios.post(
      `${WEBHOOK_SERVICE_URL}/api/events`,
      { event, payload, source: 'neighborai' },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Webhook triggered: ${event}`);
  } catch (error: any) {
    logger.error(`Webhook error (${event}):`, error.message);
  }
}

async function syncToHOJAI(entityType: string, action: string, data: any) {
  try {
    await axios.post(
      `${HOJAI_URL}/api/sync`,
      { entityType, action, source: 'neighborai', data, timestamp: new Date().toISOString() },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
    logger.info(`Synced to HOJAI: ${entityType}/${action}`);
  } catch (error: any) {
    if (error.response?.status !== 404) {
      logger.error(`HOJAI sync error:`, error.message);
    }
  }
}

async function sendNotification(phone: string, message: string, channel: 'sms' | 'whatsapp' = 'sms') {
  try {
    const endpoint = channel === 'whatsapp' ? '/api/whatsapp/send' : '/api/sms/send';
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}${endpoint}`,
      channel === 'whatsapp' ? { to: phone, template: 'notification', variables: { message } } : { to: phone, message },
      { headers: { 'X-Internal-Token': INTERNAL_TOKEN, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logger.error(`Notification error:`, error.message);
  }
}

// Export webhook functions for use in routes
export { triggerWebhook, syncToHOJAI, sendNotification };

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();
app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health/live'
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================
// BODY PARSING
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// REQUEST LOGGING
// ============================================

// Morgan HTTP logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Custom request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || `req-${Date.now()}`;
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  next();
});

// ============================================
// ERROR HANDLING
// ============================================

interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Request error', {
    error: err.message || 'Unknown error',
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

app.use(errorHandler);

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const { Resident, Visitor, Complaint, Maintenance, Event } = await import('./models');

  const [
    residentCount,
    visitorToday,
    openComplaints,
    pendingMaintenance
  ] = await Promise.all([
    Resident.countDocuments().catch(() => 0),
    Visitor.countDocuments({ checkIn: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }).catch(() => 0),
    Complaint.countDocuments({ status: 'open' }).catch(() => 0),
    Maintenance.countDocuments({ status: 'pending' }).catch(() => 0)
  ]);

  res.json({
    status: 'healthy',
    service: 'NEIGHBORAI',
    version: '1.0.0',
    port: PORT,
    environment: NODE_ENV,
    uptime: Math.floor(process.uptime()),
    mongo: mongoStatus,
    aiEmployees: [
      { name: 'Society Manager AI', status: 'active' },
      { name: 'Visitor Agent AI', status: 'active' },
      { name: 'Complaint Agent AI', status: 'active' },
      { name: 'Community Agent AI', status: 'active' },
      { name: 'ExpertOS', status: 'active', description: 'Professional AI Twin for society managers' }
    ],
    stats: {
      totalResidents: residentCount,
      visitorsToday: visitorToday,
      openComplaints,
      pendingMaintenance
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  const mongoReady = mongoose.connection.readyState === 1;

  if (!mongoReady) {
    return res.status(503).json({
      status: 'not ready',
      checks: { mongodb: 'not ready' },
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    status: 'ready',
    checks: { mongodb: 'ready' },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES
// ============================================

// Import routes
import residentsRouter from './routes/residents';
import visitorsRouter from './routes/visitors';
import complaintsRouter from './routes/complaints';
import maintenanceRouter from './routes/maintenance';
import eventsRouter from './routes/events';
import aiRouter from './routes/ai';
import analyticsRouter from './routes/analytics';
import authRouter from './routes/auth';

// ExpertOS Integration - Clone your profession for online services
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

// Mount routes
app.use('/api/residents', residentsRouter);
app.use('/api/visitors', visitorsRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/events', eventsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth', authRouter);
app.use('/', aiRouter); // AI routes include /ai/status

// ============================================
// EXPERTOS - Professional AI Twin for Society Managers
// ============================================

const expertOSRouter = registerExpertOS('neighborai');
app.use('/api/expert-os', expertOSRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method,
    suggestion: 'Check the API documentation for available endpoints',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2
    });

    logger.info('MongoDB connected successfully', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

    // Create indexes
    const { Resident, Visitor, Complaint, Maintenance, Event } = await import('./models');
    await Promise.all([
      Resident.createIndexes(),
      Visitor.createIndexes(),
      Complaint.createIndexes(),
      Maintenance.createIndexes(),
      Event.createIndexes()
    ]);
    logger.info('Database indexes created');

    // Seed default data if empty
    if (await Resident.countDocuments() === 0) {
      logger.info('Seeding default data...');
      await seedDefaultData();
    }

  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
};

// ============================================
// DEFAULT DATA SEEDING
// ============================================

const seedDefaultData = async () => {
  const { Resident, User, Maintenance } = await import('./models');
  const bcrypt = await import('bcryptjs');

  // Create sample residents
  const sampleResidents = [
    { name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@society.com', flatNumber: '101', wing: 'A', status: 'owner', familyMembers: ['Sunita Kumar', 'Amit Kumar'], vehicleNumbers: ['MH12AB1234'] },
    { name: 'Priya Sharma', phone: '9876543211', email: 'priya@society.com', flatNumber: '102', wing: 'A', status: 'owner', familyMembers: ['Vikram Sharma'], vehicleNumbers: ['MH12CD5678'] },
    { name: 'Amit Patel', phone: '9876543212', email: 'amit@society.com', flatNumber: '103', wing: 'A', status: 'tenant', familyMembers: ['Neha Patel'] },
    { name: 'Sunita Verma', phone: '9876543213', email: 'sunita@society.com', flatNumber: '201', wing: 'B', status: 'owner', familyMembers: ['Ravi Verma', 'Kavya Verma'], vehicleNumbers: ['MH12EF9012'] },
    { name: 'Vikram Singh', phone: '9876543214', email: 'vikram@society.com', flatNumber: '202', wing: 'B', status: 'owner', familyMembers: ['Meera Singh'], vehicleNumbers: [] },
  ];

  await Resident.insertMany(sampleResidents);
  logger.info('Sample residents created');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await User.create({
    email: 'admin@neighborai.com',
    password: hashedPassword,
    name: 'Society Admin',
    role: 'admin',
    flatNumber: 'ADMIN'
  });
  logger.info('Admin user created');

  // Create sample maintenance records
  const residents = await Resident.find();
  const currentDate = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June'];

  for (const resident of residents) {
    for (let i = 0; i < 3; i++) {
      const monthIndex = (currentDate.getMonth() - i + 12) % 12;
      await Maintenance.create({
        residentId: resident._id.toString(),
        flatNumber: resident.flatNumber,
        wing: resident.wing,
        category: 'monthly-maintenance',
        description: `Monthly maintenance for ${monthNames[monthIndex]}`,
        amount: 3500,
        dueDate: new Date(currentDate.getFullYear(), monthIndex + 1, 10),
        status: i === 0 ? 'pending' : 'paid',
        paidAt: i === 0 ? undefined : new Date(currentDate.getFullYear(), monthIndex, 15),
        month: `${monthNames[monthIndex]} ${currentDate.getFullYear()}`
      });
    }
  }
  logger.info('Sample maintenance records created');
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let server: ReturnType<typeof app.listen>;

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  // Close database connection
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection', { error });
  }

  // Exit process
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info('');
      logger.info('╔══════════════════════════════════════════════════════════════════════════╗');
      logger.info('║                                                                          ║');
      logger.info('║                    NEIGHBORAI v1.0.0                                     ║');
      logger.info('║              Residential Society AI Operating System                   ║');
      logger.info('║                                                                          ║');
      logger.info(`║  🌐 Server: http://localhost:${PORT}                                        ║`);
      logger.info('║  📊 API Base: http://localhost:' + PORT + '/api                                   ║');
      logger.info('║  ❤️  Health: http://localhost:' + PORT + '/health                                  ║');
      logger.info('║                                                                          ║');
      logger.info('║  🤖 AI EMPLOYEES:                                                        ║');
      logger.info('║     • Society Manager AI - Operations & Billing                          ║');
      logger.info('║     • Visitor Agent AI - Visitor Management                              ║');
      logger.info('║     • Complaint Agent AI - Issue Tracking & Escalation                   ║');
      logger.info('║     • Community Agent AI - Events & Announcements                        ║');
      logger.info('║                                                                          ║');
      logger.info('║  📋 FEATURES:                                                             ║');
      logger.info('║     • MongoDB with Mongoose ODM                                          ║');
      logger.info('║     • JWT Authentication                                                 ║');
      logger.info('║     • Rate Limiting & Helmet Security                                    ║');
      logger.info('║     • Winston Logger & Zod Validation                                    ║');
      logger.info('║     • Graceful Shutdown                                                  ║');
      logger.info('║                                                                          ║');
      logger.info('╚══════════════════════════════════════════════════════════════════════════╝');
      logger.info('');
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;