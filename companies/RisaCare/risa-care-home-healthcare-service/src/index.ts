import { logger } from ;
/**
 * RisaCare Home Healthcare Service
 * Port 4728 - In-home medical care, caregiver matching, and care plans
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import homeHealthcareRoutes from './routes/homeHealthcareRoutes.js';

const PORT = process.env.PORT || 4728;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_home_healthcare';
const app: Express = express();

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Home Healthcare Service');
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
    service: 'risa-care-home-healthcare',
    version: '1.0.0',
    port: PORT,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'RisaCare Home Healthcare Service',
    version: '1.0.0',
    port: PORT,
    description: 'In-home medical care, caregiver matching, and care plan management',
    endpoints: {
      health: 'GET /health',
      careRequests: {
        create: 'POST /api/care-requests',
        list: 'GET /api/care-requests/:patientId',
        get: 'GET /api/care-requests/request/:requestId',
        update: 'PUT /api/care-requests/:requestId',
        cancel: 'DELETE /api/care-requests/:requestId',
      },
      caregivers: {
        list: 'GET /api/caregivers',
        get: 'GET /api/caregivers/:caregiverId',
        search: 'GET /api/caregivers/search?serviceType=&location=',
      },
      visits: {
        create: 'POST /api/visits',
        list: 'GET /api/visits/:patientId',
        get: 'GET /api/visits/detail/:visitId',
        update: 'PUT /api/visits/:visitId',
        start: 'POST /api/visits/:visitId/start',
        end: 'POST /api/visits/:visitId/end',
      },
      carePlans: {
        create: 'POST /api/care-plans',
        get: 'GET /api/care-plans/:planId',
        update: 'PUT /api/care-plans/:planId',
        progress: 'GET /api/care-plans/:planId/progress',
      },
      equipment: {
        request: 'POST /api/equipment',
        list: 'GET /api/equipment/:patientId',
        update: 'PUT /api/equipment/:requestId',
      },
      vitals: {
        record: 'POST /api/vitals',
        patient: 'GET /api/vitals/:patientId',
        trends: 'GET /api/vitals/:patientId/trends',
      },
      reviews: {
        create: 'POST /api/reviews',
        caregiver: 'GET /api/reviews/caregiver/:caregiverId',
      },
    },
  });
});

// Mount routes
app.use('/api', homeHealthcareRoutes);

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
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║       RisaCare Home Healthcare Service              ║
╠═══════════════════════════════════════════════════════════╣
║  Status:     RUNNING                                ║
║  Port:       ${PORT.toString().padEnd(43)}║
║  Version:    1.0.0                               ║
║  Database:   ${dbConnected ? 'connected'.padEnd(40)}║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                        ║
║    - Caregiver matching & scheduling               ║
║    - Care plan management                         ║
║    - Visit tracking & documentation               ║
║    - Medical equipment delivery                   ║
║    - Vital signs monitoring                       ║
║    - Review & rating system                       ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);

export default app;
