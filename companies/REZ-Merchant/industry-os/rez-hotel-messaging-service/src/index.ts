/**
 * REZ Hotel Messaging Service
 * Port: 4024
 *
 * Guest Messaging System for Hotel Ecosystem
 * Features:
 * - In-app guest chat
 * - Pre-stay messaging (confirmations, requests)
 * - In-stay messaging (room service, housekeeping)
 * - Post-stay messaging (reviews, re-engagement)
 * - Staff-guest communication
 * - WhatsApp integration ready
 * - Push notifications ready
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import messageRoutes from './routes/message.routes';
import { MessageModel } from './models/Message';

const app = express();
const PORT = parseInt(process.env.PORT || '4024', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/rez_hotel_messaging';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const messageCount = await MessageModel.countDocuments().catch(() => 0);

  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    service: 'rez-hotel-messaging-service',
    port: PORT,
    database: dbStatus,
    messageCount,
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
app.use('/api', messageRoutes);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
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

    await MessageModel.createIndexes();

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║       REZ Hotel Messaging Service              ║
╠══════════════════════════════════════════════════════════╣
║  Port:        ${PORT}                                 ║
║  MongoDB:     Connected                           ║
║  Features:    Conversations, Messages, Templates   ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
