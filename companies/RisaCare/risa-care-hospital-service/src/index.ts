import { logger } from '../../shared/logger';
/**
 * RisaCare Hospital Management Service
 * B2B Hospital Operations Management - Port 4740
 *
 * A comprehensive hospital management system providing:
 * - Hospital & Department Management
 * - Patient Registration & History
 * - Admission/Discharge/Transfer
 * - Bed Allocation & Management
 * - Operation Scheduling
 * - Staff Management
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { hospitalRoutes } from './routes/index.js';
import { hospitalService } from './services/index.js';

const PORT = process.env.PORT || 4740;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_hospital';
const app: Express = express();

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Hospital Service');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    dbConnected = false;
  }
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-hospital',
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', hospitalRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'RisaCare Hospital Management Service',
    version: '1.0.0',
    port: PORT,
    description: 'B2B Hospital Operations Management Service',
    endpoints: {
      health: 'GET /health',
      hospital: {
        get: 'GET /api/hospital',
        create: 'POST /api/hospital',
        update: 'PUT /api/hospital',
        stats: 'GET /api/hospital/stats',
      },
      departments: {
        list: 'GET /api/departments',
        create: 'POST /api/departments',
        get: 'GET /api/departments/:departmentId',
      },
      patients: {
        register: 'POST /api/patients',
        get: 'GET /api/patients/:patientId',
        search: 'GET /api/patients/search',
        stats: 'GET /api/patients/stats',
      },
      admissions: {
        list: 'GET /api/admissions',
        active: 'GET /api/admissions/active',
        create: 'POST /api/admissions',
        get: 'GET /api/admissions/:admissionId',
        discharge: 'PUT /api/admissions/:admissionId/discharge',
        transfer: 'POST /api/admissions/transfer',
        stats: 'GET /api/admissions/stats',
      },
      beds: {
        list: 'GET /api/beds',
        available: 'GET /api/beds/available',
        allocate: 'POST /api/beds/allocate',
        release: 'POST /api/beds/release',
        wards: 'GET /api/beds/wards',
        stats: 'GET /api/beds/stats',
      },
      operations: {
        list: 'GET /api/operations',
        schedule: 'POST /api/operations',
        get: 'GET /api/operations/:operationId',
        update: 'PUT /api/operations/:operationId',
        start: 'POST /api/operations/:operationId/start',
        complete: 'POST /api/operations/:operationId/complete',
        cancel: 'POST /api/operations/:operationId/cancel',
        stats: 'GET /api/operations/stats',
      },
      staff: {
        list: 'GET /api/staff',
        add: 'POST /api/staff',
        get: 'GET /api/staff/:staffId',
        schedule: 'GET /api/staff/:staffId/schedule',
        updateSchedule: 'PUT /api/staff/:staffId/schedule',
        doctors: 'GET /api/staff/doctors',
        nurses: 'GET /api/staff/nurses',
        search: 'GET /api/staff/search',
        stats: 'GET /api/staff/stats',
      },
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize default hospital and start server
async function bootstrap(): Promise<void> {
  try {
    // Connect to database
    await connectToDatabase();

    // Initialize hospital with default data if not exists
    const existingHospital = await hospitalService.getHospital();
    if (!existingHospital) {
      logger.info('Initializing default hospital...');
      await hospitalService.createHospital({
        name: 'RisaCare Medical Center',
        address: {
          street: '123 Healthcare Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India',
        },
        phone: '+91-22-1234-5678',
        email: 'info@risacare.medical',
        icuBeds: 20,
        totalBeds: 200,
      });
      logger.info('Default hospital initialized successfully');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════════╗
║           RisaCare Hospital Management Service                ║
╠════════════════════════════════════════════════════════════════╣
║  Status:     RUNNING                                          ║
║  Port:       ${PORT.toString().padEnd(54)}║
║  Version:     1.0.0                                            ║
║  Database:    ${dbConnected ? 'connected'.padEnd(50)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(47)}║
╠════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                   ║
║    Health:  GET /health                                        ║
║    API:    /api/*                                             ║
║    Docs:   GET /                                               ║
╠════════════════════════════════════════════════════════════════╣
║  RTNM Group | HOJAI AI Infrastructure                         ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
