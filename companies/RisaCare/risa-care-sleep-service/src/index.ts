import { logger } from ;
/**
 * RisaCare Sleep Service
 * Port 4729 - Sleep tracking, analysis, and improvement
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import sleepRoutes from './routes/sleepRoutes.js';

const PORT = process.env.PORT || 4729;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_sleep';
const app: Express = express();

// Database connection
let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    dbConnected = true;
    logger.info('✅ MongoDB connected for Sleep Service');
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
    service: 'risa-care-sleep',
    version: '1.0.0',
    port: PORT,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'RisaCare Sleep Service',
    version: '1.0.0',
    port: PORT,
    description: 'Sleep tracking, analysis, and improvement recommendations',
    endpoints: {
      health: 'GET /health',
      sleep: {
        log: 'POST /api/sleep',
        get: 'GET /api/sleep/:userId/:date',
        history: 'GET /api/sleep/:userId/history',
        analysis: 'GET /api/sleep/:userId/analysis',
        patterns: 'GET /api/sleep/:userId/patterns',
        trend: 'GET /api/sleep/:userId/trend',
        efficiency: 'GET /api/sleep/:userId/efficiency/:date',
      },
      goals: {
        set: 'POST /api/goals',
        get: 'GET /api/goals/:userId',
        update: 'PUT /api/goals/:goalId',
        progress: 'GET /api/goals/:userId/progress',
        delete: 'DELETE /api/goals/:goalId',
      },
      insights: {
        list: 'GET /api/insights/:userId',
        disorders: 'GET /api/insights/:userId/disorders',
      },
      recommendations: {
        list: 'GET /api/recommendations/:userId',
        bedtime: 'GET /api/recommendations/:userId/bedtime',
        hygieneScore: 'GET /api/recommendations/:userId/hygiene-score',
        tips: 'GET /api/recommendations/tips',
      },
      factors: {
        log: 'POST /api/factors',
        list: 'GET /api/factors/:userId',
        impact: 'GET /api/factors/:userId/impact',
        byType: 'GET /api/factors/:userId/:type',
        daily: 'GET /api/factors/:userId/daily/:date',
        delete: 'DELETE /api/factors/:factorId',
      },
      disorders: {
        list: 'GET /api/disorders/:userId',
        add: 'POST /api/disorders',
        update: 'PUT /api/disorders/:disorderId',
        delete: 'DELETE /api/disorders/:disorderId',
      },
    },
  });
});

// Mount routes
app.use('/api', sleepRoutes);

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
║         RisaCare Sleep Service                          ║
╠═══════════════════════════════════════════════════════════╣
║  Status:     RUNNING                                    ║
║  Port:       ${PORT.toString().padEnd(43)}║
║  Version:    1.0.0                                     ║
║  Database:   ${dbConnected ? 'connected'.padEnd(40)}║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                              ║
║    - Sleep tracking & logging                           ║
║    - Pattern analysis & insights                        ║
║    - Goal setting & progress                           ║
║    - Factor correlation                                ║
║    - Disorder detection                                ║
║    - AI recommendations                                ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);

export default app;
