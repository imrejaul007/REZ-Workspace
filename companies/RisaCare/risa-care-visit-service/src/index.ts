import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import visitRoutes from './routes/visitRoutes';
import logger from './utils/logger';
import {
  initializeRisaCareIntelligence,
  onPatientRegistered,
  onVisitScheduled,
  onVisitCompleted,
  onVitalsRecorded,
  onPrescriptionCreated,
  getRisaCareStats
} from './intelligence';

const app = express();
const PORT = process.env.PORT || 4705;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa-care-visits';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query
  });
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-visit-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/visits', visitRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    // Continue without database for development
    logger.warn('Running without database connection');
  }
}

// ============================================
// INTELLIGENCE INITIALIZATION
// ============================================

let risaCareIntelligence: any = null;

async function initializeIntelligence(): Promise<void> {
  try {
    risaCareIntelligence = await initializeRisaCareIntelligence({
      emitToParent: async (signal: any) => {
        // Emit to parent HOJAI Intelligence if available
        try {
          await fetch(`${process.env.HOJAI_INTELLIGENCE_URL || 'http://localhost:4100'}/api/intelligence/signals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...signal, source: 'risa-care-visit-service' }),
          });
        } catch (e) {
          // Parent not available - continue with local intelligence
        }
      }
    });
    logger.info('RisaCare Intelligence initialized successfully');
  } catch (error) {
    logger.warn('RisaCare Intelligence initialization failed - running without AI layer', { error });
  }
}

// Start server
async function startServer(): Promise<void> {
  await connectDatabase();

  // Initialize intelligence layer
  await initializeIntelligence();

  app.listen(PORT, () => {
    logger.info(`RisaCare Visit Service started`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      mongodb: MONGODB_URI,
      intelligence: risaCareIntelligence ? 'Active' : 'Standalone'
    });
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

export default app;
