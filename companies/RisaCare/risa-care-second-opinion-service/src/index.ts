import { logger } from ;
/**
 * RisaCare Second Opinion Service
 * Port 4726 - Medical second opinion and specialist matching
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import secondOpinionRoutes from './routes/secondOpinionRoutes.js';

const PORT = process.env.PORT || 4726;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_second_opinion';
const app: Express = express();

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Second Opinion Service');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    dbConnected = false;
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-second-opinion',
    version: '1.0.0',
    port: PORT,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'RisaCare Second Opinion Service',
    version: '1.0.0',
    port: PORT,
    description: 'Medical second opinion requests, specialist matching, and opinion reports',
    endpoints: {
      health: 'GET /health',
      requests: {
        create: 'POST /api/requests',
        list: 'GET /api/requests/:patientId',
        get: 'GET /api/requests/detail/:requestId',
        update: 'PUT /api/requests/:requestId',
        listAll: 'GET /api/requests',
      },
      specialists: {
        list: 'GET /api/specialists',
        search: 'GET /api/specialists/search?query=',
        get: 'GET /api/specialists/:specialistId',
        availability: 'GET /api/specialists/:specialistId/availability',
        match: 'GET /api/specialists/match?specialty=',
      },
      opinions: {
        submit: 'POST /api/opinions',
        get: 'GET /api/opinions/:reportId',
        request: 'GET /api/opinions/request/:requestId',
        patient: 'GET /api/opinions/patient/:patientId',
        summary: 'GET /api/opinions/request/:requestId/summary',
      },
      reports: {
        upload: 'POST /api/reports',
        list: 'GET /api/reports/:requestId',
      },
    },
  });
});

// Mount routes
app.use('/api', secondOpinionRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`[ERROR] ${err.message}`);
  res.status(500).json({ success: false, error: err.message });
});

// Start server with database connection
async function startServer(): Promise<void> {
  await connectToDatabase();

  app.listen(PORT, () => {
    const dbStatus = dbConnected ? 'connected' : 'disconnected';
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║       RisaCare Second Opinion Service               ║
╠═══════════════════════════════════════════════════════════╣
║  Status:     RUNNING                                ║
║  Port:       ${PORT.toString().padEnd(43)}║
║  Version:    1.0.0                               ║
║  Database:   ${dbStatus.padEnd(40)}║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                        ║
║    - Second opinion requests                      ║
║    - Specialist matching & search                  ║
║    - Medical report upload                        ║
║    - Opinion reports & summaries                  ║
║    - Multi-specialty coverage                    ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);

export default app;
