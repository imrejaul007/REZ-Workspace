import { logger } from ;
/**
 * RisaCare Vaccination Service
 * Port 4727 - Immunization tracking and certificate generation
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import vaccinationRoutes from './routes/vaccinationRoutes.js';

const PORT = process.env.PORT || 4727;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_vaccination';
const app: Express = express();

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Vaccination Service');
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
    service: 'risa-care-vaccination',
    version: '1.0.0',
    port: PORT,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'RisaCare Vaccination Service',
    version: '1.0.0',
    port: PORT,
    description: 'Immunization tracking, reminders, and certificate generation',
    endpoints: {
      health: 'GET /health',
      vaccinations: {
        add: 'POST /api/vaccinations',
        list: 'GET /api/vaccinations/:userId',
        upcoming: 'GET /api/vaccinations/:userId/upcoming',
        overdue: 'GET /api/vaccinations/:userId/overdue',
        compliance: 'GET /api/vaccinations/:userId/compliance',
      },
      vaccines: {
        catalog: 'GET /api/vaccines',
        details: 'GET /api/vaccines/:code',
      },
      reminders: {
        set: 'POST /api/reminders',
        list: 'GET /api/reminders/:userId',
        markSent: 'PUT /api/reminders/:reminderId/sent',
      },
      certificates: {
        generate: 'POST /api/certificates',
        get: 'GET /api/certificates/:certificateId',
      },
    },
  });
});

// Mount routes
app.use('/api', vaccinationRoutes);

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
║       RisaCare Vaccination Service                    ║
╠═══════════════════════════════════════════════════════════╣
║  Status:     RUNNING                                ║
║  Port:       ${PORT.toString().padEnd(43)}║
║  Version:    1.0.0                               ║
║  Database:   ${dbConnected ? 'connected'.padEnd(40)}║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                        ║
║    - Vaccination record tracking                  ║
║    - Vaccine catalog                            ║
║    - Compliance reports                          ║
║    - Reminder management                        ║
║    - Immunization certificates                  ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);

export default app;
