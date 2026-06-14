/**
 * REZ Multi-Property Dashboard Service
 * Port: 4029
 *
 * Chain-wide Analytics Dashboard providing:
 * - Consolidated KPI dashboards
 * - Multi-property performance metrics
 * - Revenue analytics
 * - Occupancy tracking
 * - Guest analytics
 * - Staff performance
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import propertyRoutes from './routes/property.routes';
import analyticsRoutes from './routes/analytics.routes';
import { PropertyModel } from './models/Property';

const app = express();
const PORT = parseInt(process.env.PORT || '4029', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/rez_multi_property';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const propertyCount = await PropertyModel.countDocuments().catch(() => 0);

  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    service: 'rez-multi-property-dashboard',
    port: PORT,
    database: dbStatus,
    propertyCount,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ status: 'not_ready', reason: 'Database not connected' });
  }
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/properties', propertyRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    error: { code: 'ERROR', message: 'Internal server error' },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    await PropertyModel.createIndexes().catch(() => {
      console.log('Creating indexes skipped');
    });

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║   REZ Multi-Property Dashboard - Port ${PORT}          ║
╠══════════════════════════════════════════════════════════╣
║  Chain-wide KPI Dashboards                           ║
║  Multi-Property Performance Metrics                   ║
║  Revenue & Occupancy Analytics                      ║
║  Guest & Staff Analytics                           ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
