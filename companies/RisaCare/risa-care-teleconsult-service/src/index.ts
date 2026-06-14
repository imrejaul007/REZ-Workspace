import { logger } from '../../shared/logger';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import teleconsultRoutes from './routes/teleconsultRoutes.js';

const app: Express = express();
const PORT = process.env.PORT || 4723;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_teleconsult';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'healthy',
    service: 'risa-care-teleconsult',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: dbStates[mongoose.connection.readyState as keyof typeof dbStates] || 'unknown'
  });
});

// API info endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'RisaCare Teleconsult Service',
    version: '1.0.0',
    description: 'Video consultations with doctors',
    endpoints: {
      health: 'GET /health',
      sessions: {
        schedule: 'POST /sessions',
        get: 'GET /sessions/:sessionId',
        start: 'PUT /sessions/:sessionId/start',
        end: 'PUT /sessions/:sessionId/end',
        cancel: 'PUT /sessions/:sessionId/cancel',
        patient: 'GET /sessions/patient/:patientId',
        doctor: 'GET /sessions/doctor/:doctorId',
        token: 'GET /sessions/:sessionId/token',
      },
      availability: {
        get: 'GET /availability/:doctorId/:date',
        set: 'POST /availability',
        range: 'GET /availability/:doctorId/:startDate/:endDate',
        slots: 'GET /availability/:doctorId/:date/slots',
        book: 'POST /availability/book',
      },
      notes: {
        save: 'POST /sessions/:sessionId/notes',
        get: 'GET /sessions/:sessionId/notes',
        update: 'PUT /sessions/:sessionId/notes',
        soap: 'GET /sessions/:sessionId/notes/soap',
      },
      prescription: {
        create: 'POST /sessions/:sessionId/prescription',
        get: 'GET /sessions/:sessionId/prescription',
        addMedicine: 'POST /sessions/:sessionId/prescription/medicine',
      },
      reviews: {
        submit: 'POST /sessions/:sessionId/review',
        doctor: 'GET /doctors/:doctorId/reviews',
        stats: 'GET /doctors/:doctorId/reviews/stats',
        distribution: 'GET /doctors/:doctorId/reviews/distribution',
        topRated: 'GET /doctors/top-rated',
      },
    },
  });
});

// Mount routes
app.use('/', teleconsultRoutes);

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

  // Zod validation errors
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err,
    });
    return;
  }

  // Custom application errors
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server with MongoDB
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected for Teleconsult Service');

    app.listen(PORT, () => {
      logger.info(`RisaCare Teleconsult Service v2.0 started on port ${PORT}`);
      logger.info(`Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

startServer();
export default app;
