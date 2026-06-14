import express, { Express, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import medicinesRouter from './routes/medicines.routes';
import ordersRouter from './routes/orders.routes';
import { Prescription, PrescriptionStatus } from './models/Prescription';
import { z } from 'zod';
import { authenticateToken } from './middleware/auth';

// Load environment variables
dotenv.config();

const app: Express = express();
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration - restrict origins in production
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

if (isProduction && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: isProduction ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000']),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-pharmacy-service',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/medicines', medicinesRouter);
app.use('/api/orders', ordersRouter);

// Prescription routes with authentication
const prescriptionRouter = express.Router();
prescriptionRouter.use(authenticateToken);

const createPrescriptionSchema = z.object({
  prescriptionNumber: z.string().min(1),
  patientId: z.string().min(1),
  patientName: z.string().min(1),
  patientAge: z.number().int().positive(),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  patientPhone: z.string().optional(),
  doctorId: z.string().min(1),
  doctorName: z.string().min(1),
  doctorRegistrationNumber: z.string().min(1),
  doctorSpecialization: z.string().min(1),
  hospitalClinicName: z.string().optional(),
  diagnosis: z.array(z.string()),
  items: z.array(z.object({
    medicineId: z.string().min(1),
    medicineName: z.string().min(1),
    prescribedDosage: z.string().min(1),
    dosageForm: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    quantity: z.number().int().positive(),
    instructions: z.string().optional(),
    refillsAllowed: z.number().int().min(0).optional(),
    refillsRemaining: z.number().int().min(0).optional()
  })).min(1),
  prescriptionDate: z.string().transform(s => new Date(s)),
  validFrom: z.string().transform(s => new Date(s)),
  validUntil: z.string().transform(s => new Date(s)),
  uploadedDocumentUrl: z.string().optional(),
  documentType: z.enum(['DIGITAL', 'PHYSICAL_UPLOAD', 'E_PRESCRIPTION']).default('E_PRESCRIPTION'),
  notes: z.string().optional()
});

const verifyPrescriptionSchema = z.object({
  status: z.enum(['APPROVED', 'FLAGGED', 'REJECTED']),
  notes: z.string().optional(),
  verifiedBy: z.string().min(1)
});

// Create prescription
prescriptionRouter.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createPrescriptionSchema.parse(req.body);
    const { v4: uuidv4 } = require('uuid');

    const prescription = new Prescription({
      prescriptionId: `RX-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...validatedData,
      totalItems: validatedData.items.length,
      filledItems: 0,
      status: PrescriptionStatus.PENDING,
      verificationStatus: 'PENDING'
    });

    await prescription.save();

    res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

// Get prescription by ID
prescriptionRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const prescription = await Prescription.findOne({ prescriptionId: req.params.id });

    if (!prescription) {
      res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
      return;
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get prescriptions by patient
prescriptionRouter.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.patientId })
      .sort({ prescriptionDate: -1 });

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Verify prescription
prescriptionRouter.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const validatedData = verifyPrescriptionSchema.parse(req.body);

    const prescription = await Prescription.findOne({ prescriptionId: req.params.id });

    if (!prescription) {
      res.status(404).json({
        success: false,
        error: 'Prescription not found'
      });
      return;
    }

    prescription.verificationStatus = validatedData.status.toUpperCase() as unknown;
    prescription.verificationNotes = validatedData.notes;
    prescription.verifiedBy = validatedData.verifiedBy;
    prescription.verifiedAt = new Date();

    if (validatedData.status === 'APPROVED') {
      prescription.status = PrescriptionStatus.VERIFIED as unknown;
    } else if (validatedData.status === 'REJECTED') {
      prescription.status = PrescriptionStatus.REJECTED as unknown;
    } else {
      prescription.flags.push(`FLAGGED by ${validatedData.verifiedBy}: ${validatedData.notes}`);
    }

    await prescription.save();

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

// Get pending prescriptions
prescriptionRouter.get('/status/pending', async (req: Request, res: Response) => {
  try {
    const prescriptions = await Prescription.find({
      status: PrescriptionStatus.PENDING
    }).sort({ prescriptionDate: -1 });

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Expiring prescriptions
prescriptionRouter.get('/expiring', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const prescriptions = await Prescription.find({
      validUntil: { $lte: futureDate },
      status: { $nin: [PrescriptionStatus.EXPIRED, PrescriptionStatus.CANCELLED] }
    }).sort({ validUntil: 1 });

    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

app.use('/api/prescriptions', prescriptionRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Database connection and server start
const PORT = process.env.PORT || 4008;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-pharmacy';

async function startServer() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB successfully');

    app.listen(PORT, () => {
      logger.info(`Pharmacy Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API endpoints:`);
      logger.info(`  - POST /api/medicines - Create medicine`);
      logger.info(`  - GET /api/medicines - Search medicines`);
      logger.info(`  - GET /api/medicines/alerts - Get inventory alerts`);
      logger.info(`  - POST /api/medicines/interactions - Check drug interactions`);
      logger.info(`  - POST /api/orders - Create order`);
      logger.info(`  - GET /api/orders - Get orders`);
      logger.info(`  - POST /api/prescriptions - Create prescription`);
      logger.info(`  - POST /api/prescriptions/:id/verify - Verify prescription`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;
