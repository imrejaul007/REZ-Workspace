/**
 * REZ Guest Mobile App Service
 * Guest-facing hotel services
 * Port: 4028
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import bookingRoutes from './routes/booking.routes';
import serviceRoutes from './routes/service.routes';
import profileRoutes from './routes/profile.routes';
import { GuestProfileModel } from './models/GuestProfile';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

const app = express();
const PORT = parseInt(process.env.PORT || '4028', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/rez_guest_mobile';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.path}`);
  next();
});

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const profileCount = await GuestProfileModel.countDocuments().catch(() => 0);

  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    service: 'rez-guest-mobile-app',
    port: PORT,
    database: dbStatus,
    profileCount,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/profile', profileRoutes);

// Room endpoints (inline)
app.get('/api/room/:bookingId', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      bookingId: req.params.bookingId,
      room: '301',
      type: 'Deluxe',
      floor: 3,
    },
  });
});

// Notifications endpoint
app.get('/api/notifications/:guestId', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      notifications: [],
    },
  });
});

// Dining endpoint
app.get('/api/dining/:merchantId', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      dining: [
        { name: 'Rooftop Restaurant', cuisine: 'Multi-cuisine', hours: '6AM - 11PM' },
        { name: 'Coffee Shop', cuisine: 'Cafe', hours: '24 hours' },
      ],
    },
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
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
  logger.info('Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    logger.info('Connected to MongoDB');

    await GuestProfileModel.createIndexes();

    app.listen(PORT, () => {
      logger.info(
╔══════════════════════════════════════════════════════════╗
║       REZ Guest Mobile App Service             ║
╠══════════════════════════════════════════════════════════╣
║  Port:        ${PORT}                                 ║
║  MongoDB:     Connected                           ║
║  Features:    Bookings, Services, Profile         ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
