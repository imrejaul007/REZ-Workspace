/**
 * GLAMAI - Salon AI Operating System
 * Main Entry Point
 *
 * Production-Ready Server with MongoDB, JWT, Security & Logging
 *
 * AI Employees:
 * 1. Beauty Advisor - Product recommendations, styling tips
 * 2. Appointment Manager - Scheduling, reminders
 * 3. Campaign Agent - Marketing, offers, loyalty
 * 4. Retention Agent - Churn prevention, re-engagement
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Configuration
import {
  PORT,
  HOST,
  MONGODB_URI,
  MONGODB_OPTIONS,
  CORS as CORS_CONFIG,
  RATE_LIMITS,
  FEATURES,
} from './config';

// Middleware
import { requestLogger, logger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/error';
import routes from './routes';

// Models for seeding
import { Customer, Service, Stylist, Appointment } from './models';

// ExpertOS Integration - Clone your profession for online services
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

// ============================================
// EXPRESS APP SETUP
// ============================================

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
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
    }
  }
}));

// CORS
app.use(cors(CORS_CONFIG));

// Rate limiting - General API
const apiLimiter = rateLimit({
  windowMs: RATE_LIMITS.API.windowMs,
  max: RATE_LIMITS.API.max,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting - Auth endpoints
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

// Rate limiting - AI endpoints
const aiLimiter = rateLimit({
  windowMs: RATE_LIMITS.AI.windowMs,
  max: RATE_LIMITS.AI.max,
  message: {
    success: false,
    error: 'AI endpoint rate limit exceeded.',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  }
});

app.use('/api/', apiLimiter);
app.use('/api/ai/', aiLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  const appointmentCount = await Appointment.countDocuments({
    date: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lte: new Date(new Date().setHours(23, 59, 59, 999))
    }
  }).catch(() => 0);

  const serviceCount = await Service.countDocuments({ isActive: true }).catch(() => 0);
  const stylistCount = await Stylist.countDocuments({ isActive: true }).catch(() => 0);
  const customerCount = await Customer.countDocuments().catch(() => 0);

  res.json({
    status: 'healthy',
    service: 'GLAMAI',
    version: '1.0.0',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    mongo: mongoStatus,
    aiEmployees: {
      beautyAdvisor: { status: 'active', description: 'Product recommendations, styling tips' },
      appointmentManager: { status: 'active', description: 'Scheduling, reminders' },
      campaignAgent: { status: 'active', description: 'Marketing, offers, loyalty' },
      retentionAgent: { status: 'active', description: 'Churn prevention, re-engagement' },
      expertOS: { status: 'active', description: 'Professional AI Twin for stylists & beauticians' }
    },
    stats: {
      appointmentsToday: appointmentCount,
      services: serviceCount,
      stylists: stylistCount,
      customers: customerCount
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
      checks: {
        mongodb: mongoReady ? 'ready' : 'not ready'
      },
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    status: 'ready',
    checks: {
      mongodb: 'ready'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES
// ============================================

app.use(routes);

// ExpertOS - Professional AI Twin for Glam professionals
const expertOSRouter = registerExpertOS('glamai');
app.use('/api/expert-os', expertOSRouter);

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// MONGODB CONNECTION
// ============================================

const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: MONGODB_OPTIONS.serverSelectionTimeoutMS,
      socketTimeoutMS: MONGODB_OPTIONS.socketTimeoutMS,
    });
    logger.info('MongoDB connected successfully', {
      host: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')
    });

    // Create indexes
    await Promise.all([
      Customer.createIndexes(),
      Appointment.createIndexes(),
      Service.createIndexes(),
      Stylist.createIndexes(),
    ]);

    // Seed default services
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await Service.insertMany([
        { name: 'Haircut', category: 'Hair', price: 500, duration: 30, isActive: true },
        { name: 'Hair Coloring', category: 'Hair', price: 2500, duration: 120, isActive: true },
        { name: 'Hair Styling', category: 'Hair', price: 800, duration: 45, isActive: true },
        { name: 'Facial', category: 'Skin', price: 1500, duration: 60, isActive: true },
        { name: 'Cleansing', category: 'Skin', price: 1000, duration: 45, isActive: true },
        { name: 'Manicure', category: 'Nails', price: 400, duration: 30, isActive: true },
        { name: 'Pedicure', category: 'Nails', price: 500, duration: 45, isActive: true },
        { name: 'Nail Art', category: 'Nails', price: 600, duration: 30, isActive: true },
        { name: 'Full Body Massage', category: 'Spa', price: 2000, duration: 60, isActive: true },
        { name: 'Head Massage', category: 'Massage', price: 800, duration: 30, isActive: true },
        { name: 'Bridal Makeup', category: 'Makeup', price: 5000, duration: 120, isActive: true },
        { name: 'Party Makeup', category: 'Makeup', price: 2500, duration: 60, isActive: true }
      ]);
      logger.info('Default services seeded', { count: 12 });
    }

    // Seed default stylists
    const stylistCount = await Stylist.countDocuments();
    if (stylistCount === 0) {
      await Stylist.insertMany([
        { name: 'Priya Sharma', phone: '9876543210', specialties: ['Hair', 'Makeup'], rating: 4.8, isActive: true },
        { name: 'Rahul Verma', phone: '9876543211', specialties: ['Hair Coloring'], rating: 4.7, isActive: true },
        { name: 'Sneha Patel', phone: '9876543212', specialties: ['Skin', 'Spa'], rating: 4.9, isActive: true },
        { name: 'Meera Joshi', phone: '9876543213', specialties: ['Nails'], rating: 4.6, isActive: true },
        { name: 'Arjun Singh', phone: '9876543214', specialties: ['Hair', 'Massage'], rating: 4.5, isActive: true }
      ]);
      logger.info('Default stylists seeded', { count: 5 });
    }

  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let server: ReturnType<typeof app.listen>;

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB', { error });
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    await connectMongoDB();

    server = app.listen(PORT, () => {
      logger.info('');
      logger.info('╔════════════════════════════════════════════════════════════════╗');
      logger.info('║                      GLAMAI v1.0.0                          ║');
      logger.info('║                Salon AI Operating System                    ║');
      logger.info('║                                                            ║');
      logger.info('║  AI Employees Active:                                     ║');
      logger.info('║  • Beauty Advisor AI - Product recommendations              ║');
      logger.info('║  • Appointment Manager AI - Scheduling & reminders          ║');
      logger.info('║  • Campaign Agent AI - Marketing & loyalty programs         ║');
      logger.info('║  • Retention Agent AI - Churn prevention                    ║');
      logger.info('║                                                            ║');
      logger.info('║  Production Features:                                      ║');
      logger.info('║  ✓ MongoDB connection  ✓ JWT Authentication                 ║');
      logger.info('║  ✓ Rate limiting       ✓ Helmet security                   ║');
      logger.info('║  ✓ CORS                ✓ Winston logging                   ║');
      logger.info('║  ✓ Health checks       ✓ Graceful shutdown                 ║');
      logger.info('║  ✓ Zod validation     ✓ Standardized responses            ║');
      logger.info('║                                                            ║');
      logger.info(`║  Server running on http://localhost:${PORT}                  ║`);
      logger.info('╚════════════════════════════════════════════════════════════════╝');
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;