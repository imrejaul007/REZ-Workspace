import { logger } from ;
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import doctorPracticeRoutes from './routes/doctorPracticeRoutes.js';

const app = express();
const PORT = process.env.PORT || 4741;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_doctor_practice';

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Doctor Practice Service');
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
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-doctor-practice',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', doctorPracticeRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'RisaCare Doctor Practice Management Service',
    version: '1.0.0',
    port: PORT,
    endpoints: {
      health: 'GET /health',
      practice: {
        getAll: 'GET /api/practice',
        create: 'POST /api/practice',
        getById: 'GET /api/practice/:practiceId',
        update: 'PUT /api/practice/:practiceId',
        stats: 'GET /api/practice/:practiceId/stats',
      },
      doctors: {
        list: 'GET /api/doctors',
        create: 'POST /api/doctors',
        getById: 'GET /api/doctors/:doctorId',
        update: 'PUT /api/doctors/:doctorId',
      },
      appointments: {
        book: 'POST /api/appointments',
        getByDoctor: 'GET /api/appointments/doctor/:doctorId',
        getByPatient: 'GET /api/appointments/patient/:patientId',
        getById: 'GET /api/appointments/:appointmentId',
        cancel: 'PUT /api/appointments/:appointmentId/cancel',
        reschedule: 'PUT /api/appointments/:appointmentId/reschedule',
        updateStatus: 'PUT /api/appointments/:appointmentId/status',
        getSlots: 'GET /api/appointments/slots/:doctorId',
      },
      patients: {
        list: 'GET /api/patients',
        register: 'POST /api/patients',
        getById: 'GET /api/patients/:patientId',
        update: 'PUT /api/patients/:patientId',
        records: 'GET /api/patients/:patientId/records',
        addMedicalHistory: 'POST /api/patients/:patientId/medical-history',
        history: 'GET /api/patients/:patientId/history',
      },
      prescriptions: {
        create: 'POST /api/prescriptions',
        getByPatient: 'GET /api/prescriptions/:patientId',
        getById: 'GET /api/prescriptions/detail/:prescriptionId',
        renew: 'POST /api/prescriptions/:prescriptionId/renew',
        print: 'GET /api/prescriptions/:prescriptionId/print',
      },
      billing: {
        create: 'POST /api/bills',
        getByPatient: 'GET /api/bills/patient/:patientId',
        getById: 'GET /api/bills/:billingId',
        processPayment: 'PUT /api/bills/:billingId/pay',
        invoice: 'GET /api/bills/:billingId/invoice',
      },
      revenue: 'GET /api/revenue',
      schedule: {
        get: 'GET /api/schedule/:doctorId',
        set: 'POST /api/schedule',
        block: 'POST /api/schedule/block',
        setDefault: 'POST /api/schedule/default',
        getNext: 'GET /api/schedule/next/:doctorId',
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

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`[ERROR] ${err.message}`);
  logger.error(err.stack);

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err,
    });
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// Start server with database connection
async function startServer(): Promise<void> {
  await connectToDatabase();

  app.listen(PORT, () => {
    logger.info(`🏥 RisaCare Doctor Practice Management Service`);
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📋 API Base URL: http://localhost:${PORT}/api`);
    logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
    logger.info(`💾 Database: ${dbConnected ? 'connected' : 'disconnected'}`);
  });
}

startServer().catch(console.error);

export default app;
