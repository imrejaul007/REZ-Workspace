/**
 * ReZ Analytics V2 Service
 * Main entry point
 */

import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';

// Database
import { connectMongoDB, connectRedis, disconnectDatabase } from './config/database';

// Event listeners - Initialize integrations with order and payment services
import './events/orderEvents';
import './events/paymentEvents';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4016;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-analytics-v2',
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'ReZ Analytics V2 Service',
      version: '1.0.0',
      endpoints: {
        health: '/health',
      },
      integrations: {
        orderService: {
          url: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
          events: ['order.created', 'order.updated', 'order.cancelled', 'order.completed', 'order.status_changed'],
        },
        paymentService: {
          url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002',
          events: ['payment.created', 'payment.completed', 'payment.failed', 'refund.initiated', 'refund.completed'],
        },
      },
    },
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response) => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Analytics V2 Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
