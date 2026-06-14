import { logger } from '../../shared/logger';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler, notFoundHandler, rateLimit } from './middleware';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4739;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks-shifts';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimit(60000, 100)); // 100 requests per minute

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'shift-service',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/shifts', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'CorpPerks Shift Scheduling Service',
    version: '1.0.0',
    port: PORT,
    endpoints: {
      templates: '/api/shifts/templates',
      schedule: '/api/shifts/schedule',
      swap: '/api/shifts/swap',
      requests: '/api/shifts/requests',
      coverage: '/api/shifts/coverage/:date',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB successfully');

    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║           CorpPerks Shift Scheduling Service                  ║
╠═══════════════════════════════════════════════════════════════╣
║  Status: Running                                            ║
║  Port: ${PORT}                                                ║
║  MongoDB: ${MONGODB_URI.substring(0, 40)}...    ║
╚═══════════════════════════════════════════════════════════════╝

API Endpoints:
  POST   /api/shifts/templates          - Create shift template
  GET    /api/shifts/templates          - List all templates
  POST   /api/shifts/schedule           - Create shift schedule
  GET    /api/shifts/:date              - Get shifts for date
  POST   /api/shifts/swap               - Request shift swap
  POST   /api/shifts/swap/approve       - Approve/reject swap
  GET    /api/shifts/requests/:empId    - Get employee requests
  GET    /api/shifts/coverage/:date     - Get coverage for date
      `);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
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
