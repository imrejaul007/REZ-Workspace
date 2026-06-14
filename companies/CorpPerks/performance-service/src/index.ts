import { logger } from '../../shared/logger';
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

// Import routes
import reviewRoutes from './routes/reviewRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

// Import services for error handling
import { ReviewServiceError } from './services/reviewService.js';
import { GoalServiceError } from './services/goalService.js';

// Environment
const PORT = process.env.PORT || 4729;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks-performance';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'corpperks-performance-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'CorpPerks Performance Review Service',
    version: '1.0.0',
    description: 'Performance Review System for CorpPerks PeopleOS',
    port: PORT,
    endpoints: {
      reviews: '/api/reviews',
      cycles: '/api/reviews/cycles',
      goals: '/api/goals',
      feedback: '/api/feedback',
      health: '/health',
    },
  });
});

// API Routes
app.use('/api/reviews', reviewRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/feedback', feedbackRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);

  // Handle known service errors
  if (err instanceof ReviewServiceError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof GoalServiceError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'VALIDATION_ERROR',
    });
  }

  // Handle mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID',
    });
  }

  // Handle duplicate key errors
  if ((err as unknown as { code: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      code: 'DUPLICATE',
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info(`Connected to MongoDB: ${MONGODB_URI}`);

    // Start server
    app.listen(PORT, () => {
      logger.info(`
========================================
  CorpPerks Performance Review Service
========================================
  Status: Running
  Port: ${PORT}
  Environment: ${NODE_ENV}
  MongoDB: ${MONGODB_URI}

  Endpoints:
  - Health:     GET  /health
  - Cycles:     /api/reviews/cycles
  - Reviews:     /api/reviews
  - Goals:      /api/goals
  - Feedback:   /api/feedback

  API Documentation:
  - Create Cycle:     POST   /api/reviews/cycles
  - List Cycles:     GET    /api/reviews/cycles
  - Get Cycle:       GET    /api/reviews/cycles/:id
  - Create Review:   POST   /api/reviews
  - Get Review:      GET    /api/reviews/:id
  - Update Rating:   PATCH  /api/reviews/:id/rating
  - Create Goal:     POST   /api/goals
  - List Goals:     GET    /api/goals
  - Update Progress: PATCH /api/goals/:id/progress
  - Submit Feedback: POST  /api/feedback
========================================
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

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

// Start the server
startServer();

export default app;
