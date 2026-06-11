/**
 * PROPFLOW - Real Estate AI Operating System
 * Production-Ready Server
 */

import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

import { config } from './config';
import { logger } from './config/logger';
import {
  authRoutes,
  propertyRoutes,
  leadRoutes,
  visitRoutes,
  dealRoutes,
  aiRoutes,
  analyticsRoutes
} from './routes';
import {
  requestId,
  apiLimiter,
  errorHandler,
  notFoundHandler,
  asyncHandler
} from './middleware';
import { Property, Lead, SiteVisit, Deal, User } from './models';
import { leadAgent, siteVisitAgent } from './agents';

// ExpertOS Integration - Clone your profession for online services
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

// ============================================
// EXPRESS APP SETUP
// ============================================

const app: Express = express();

// Trust proxy (for rate limiting behind load balancer)
app.set('trust proxy', 1);

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Security headers
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

// CORS
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID
app.use(requestId);

// HTTP logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  },
  skip: (req) => req.path.startsWith('/health')
}));

// Rate limiting
app.use('/api/', apiLimiter);

// ============================================
// HEALTH CHECKS
// ============================================

// Basic health check
app.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const [propertyCount, leadCount, visitCount, dealCount] = await Promise.all([
    Property.countDocuments({ isActive: true }),
    Lead.countDocuments(),
    SiteVisit.countDocuments(),
    Deal.countDocuments()
  ]);

  res.json({
    status: 'healthy',
    service: 'PROPFLOW',
    version: '1.0.0',
    port: config.port,
    environment: config.nodeEnv,
    uptime: Math.floor(process.uptime()),
    mongodb: mongoStatus,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    aiEmployees: [
      { name: 'Property Agent', status: 'active' },
      { name: 'Lead Agent', status: 'active' },
      { name: 'Site Visit Agent', status: 'active' },
      { name: 'ExpertOS', status: 'active', description: 'Professional AI Twin for agents' }
    ],
    stats: {
      properties: propertyCount,
      leads: leadCount,
      visits: visitCount,
      deals: dealCount
    },
    timestamp: new Date().toISOString()
  });
}));

// Liveness probe
app.get('/health/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe
app.get('/health/ready', asyncHandler(async (req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  // MongoDB check
  checks.mongodb = mongoose.connection.readyState === 1 ? 'ready' : 'not ready';

  const allReady = Object.values(checks).every(status => status === 'ready');

  if (!allReady) {
    return res.status(503).json({
      status: 'not ready',
      checks,
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    status: 'ready',
    checks,
    timestamp: new Date().toISOString()
  });
}));

// ============================================
// API ROUTES
// ============================================

// Auth routes
app.use('/api/auth', authRoutes);

// Property routes
app.use('/api/properties', propertyRoutes);

// Lead routes
app.use('/api/leads', leadRoutes);

// Visit routes
app.use('/api/visits', visitRoutes);

// Deal routes
app.use('/api/deals', dealRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// ExpertOS - Professional AI Twin for Real Estate Agents
const expertOSRouter = registerExpertOS('propflow');
app.use('/api/expert-os', expertOSRouter);

// AI status endpoint (root level)
app.get('/ai/status', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    active: true,
    aiEmployees: [
      {
        name: 'Property Agent',
        role: 'Property matching and recommendations',
        status: 'active',
        endpoints: ['/api/ai/property/match', '/api/ai/property/compare']
      },
      {
        name: 'Lead Agent',
        role: 'Lead qualification and nurturing',
        status: 'active',
        endpoints: ['/api/ai/lead/qualify', '/api/ai/lead/segmentation']
      },
      {
        name: 'Site Visit Agent',
        role: 'Visit scheduling and coordination',
        status: 'active',
        endpoints: ['/api/ai/visit/schedule', '/api/ai/visit/slots']
      }
    ],
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}));

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// MONGODB CONNECTION
// ============================================

const connectMongoDB = async (): Promise<void> => {
  try {
    const options: mongoose.ConnectionOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2
    };

    await mongoose.connect(config.mongoUri, options);
    logger.info('MongoDB connected successfully', { uri: config.mongoUri.replace(/\/\/.*@/, '//<credentials>@') });

    // Create indexes
    await createIndexes();
    logger.info('Database indexes created');

    // Seed default data if empty
    await seedDefaultData();

  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
};

const createIndexes = async (): Promise<void> => {
  await Promise.all([
    Property.createIndexes(),
    Lead.createIndexes(),
    SiteVisit.createIndexes(),
    Deal.createIndexes()
  ]);
};

const seedDefaultData = async (): Promise<void> => {
  // Seed admin user if none exists
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      name: 'Admin User',
      email: 'admin@propflow.ai',
      phone: '+919876543210',
      password: 'admin123',
      role: 'admin'
    });
    logger.info('Default admin user created');
  }

  // Seed sample properties if none exist
  const propertyCount = await Property.countDocuments();
  if (propertyCount === 0) {
    await Property.insertMany([
      {
        title: 'Luxury 3BHK Apartment with Sea View',
        type: 'apartment',
        status: 'available',
        price: 12500000,
        location: {
          address: '45 Marine Drive',
          city: 'Mumbai',
          pincode: '400001',
          locality: 'Marine Lines'
        },
        specifications: {
          bedrooms: 3,
          bathrooms: 3,
          area: 2200,
          areaUnit: 'sqft',
          floor: 15,
          totalFloors: 25,
          parkingSpaces: 2
        },
        amenities: ['Gym', 'Swimming Pool', 'Garden', 'Security', 'Club House', 'Parking', 'Power Backup'],
        images: [],
        description: 'Spacious 3BHK apartment with stunning sea views, modern amenities, and premium finishes.',
        ownerId: 'system'
      },
      {
        title: 'Modern 2BHK Flat in Andheri',
        type: 'apartment',
        status: 'available',
        price: 8500000,
        location: {
          address: '78 SV Road',
          city: 'Mumbai',
          pincode: '400058',
          locality: 'Andheri West'
        },
        specifications: {
          bedrooms: 2,
          bathrooms: 2,
          area: 1200,
          areaUnit: 'sqft',
          floor: 8,
          totalFloors: 20,
          parkingSpaces: 1
        },
        amenities: ['Gym', 'Parking', 'Security', 'Elevator'],
        images: [],
        description: 'Well-maintained 2BHK flat in prime location with excellent connectivity.',
        ownerId: 'system'
      },
      {
        title: 'Premium Villa with Private Garden',
        type: 'villa',
        status: 'available',
        price: 35000000,
        location: {
          address: '12 Green Park Lane',
          city: 'Bangalore',
          pincode: '560001',
          locality: 'Whitefield'
        },
        specifications: {
          bedrooms: 5,
          bathrooms: 5,
          area: 5000,
          areaUnit: 'sqft',
          parkingSpaces: 4
        },
        amenities: ['Private Garden', 'Swimming Pool', 'Home Theater', 'Smart Home', 'Security', 'Staff Quarters'],
        images: [],
        description: 'Luxurious 5BHK villa with private garden, perfect for families seeking premium living.',
        ownerId: 'system'
      },
      {
        title: 'Commercial Office Space in CBD',
        type: 'office',
        status: 'available',
        price: 15000000,
        location: {
          address: '99 Business Park',
          city: 'Delhi',
          pincode: '110001',
          locality: 'Connaught Place'
        },
        specifications: {
          area: 3000,
          areaUnit: 'sqft',
          floor: 10,
          totalFloors: 25,
          parkingSpaces: 3
        },
        amenities: ['Central AC', '24/7 Security', 'Power Backup', 'Conference Rooms', 'Cafeteria'],
        images: [],
        description: 'Premium commercial office space in the heart of Delhi CBD with modern infrastructure.',
        ownerId: 'system'
      }
    ]);
    logger.info('Sample properties seeded');
  }
};

// ============================================
// CRON JOBS
// ============================================

const setupCronJobs = (): void => {
  // Lead follow-up reminder (every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      const leadsDue = await leadAgent.getLeadsForFollowUp();
      if (leadsDue.length > 0) {
        logger.info('Cron: Found leads due for follow-up', { count: leadsDue.length });
        // In production, send notifications here
      }
    } catch (error) {
      logger.error('Cron: Follow-up check failed', { error });
    }
  });

  // Visit reminder generation (every 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    try {
      const reminders = await siteVisitAgent.generateReminders();
      if (reminders.length > 0) {
        logger.info('Cron: Generated visit reminders', { count: reminders.length });
        // In production, send SMS/email notifications here
      }
    } catch (error) {
      logger.error('Cron: Reminder generation failed', { error });
    }
  });

  // Clean up old cancelled visits (daily at midnight)
  cron.schedule('0 0 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await SiteVisit.deleteMany({
        status: 'cancelled',
        updatedAt: { $lt: thirtyDaysAgo }
      });
      if (result.deletedCount > 0) {
        logger.info('Cron: Cleaned up old cancelled visits', { deleted: result.deletedCount });
      }
    } catch (error) {
      logger.error('Cron: Cleanup failed', { error });
    }
  });

  logger.info('Cron jobs scheduled');
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let server: ReturnType<Express['listen']> | null = null;
let isShuttingDown = false;

const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  // Set timeout for force shutdown
  const forceShutdownTimeout = setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);

  try {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    clearTimeout(forceShutdownTimeout);
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

// ============================================
// SERVER START
// ============================================

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Setup cron jobs
    setupCronJobs();

    // Start HTTP server
    server = app.listen(config.port, () => {
      logger.info('');
      logger.info('╔═══════════════════════════════════════════════════════════════════╗');
      logger.info('║                                                                   ║');
      logger.info('║                     PROPFLOW v1.0.0                                ║');
      logger.info('║              Real Estate AI Operating System                      ║');
      logger.info('║                                                                   ║');
      logger.info('╠═══════════════════════════════════════════════════════════════════╣');
      logger.info('║  Port        : ' + String(config.port).padEnd(52) + '║');
      logger.info('║  Environment  : ' + config.nodeEnv.padEnd(52) + '║');
      logger.info('║  AI Employees: Property Agent, Lead Agent, Site Visit Agent      ║');
      logger.info('║                                                                   ║');
      logger.info('╠═══════════════════════════════════════════════════════════════════╣');
      logger.info('║  Endpoints:                                                     ║');
      logger.info('║  - GET  /health          Health check                            ║');
      logger.info('║  - GET  /ai/status       AI system status                        ║');
      logger.info('║  - POST /api/auth/*       Authentication                           ║');
      logger.info('║  - GET  /api/properties   Property management                      ║');
      logger.info('║  - GET  /api/leads        Lead management                          ║');
      logger.info('║  - GET  /api/visits       Site visit scheduling                    ║');
      logger.info('║  - GET  /api/deals        Deal pipeline                            ║');
      logger.info('║  - GET  /api/analytics/*  Analytics                               ║');
      logger.info('║  - POST /api/ai/*         AI endpoints                             ║');
      logger.info('║                                                                   ║');
      logger.info('╚═══════════════════════════════════════════════════════════════════╝');
      logger.info('');
    });

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;