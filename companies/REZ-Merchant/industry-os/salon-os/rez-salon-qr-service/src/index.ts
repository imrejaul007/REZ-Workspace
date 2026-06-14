import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

import qrRoutes from './routes/qr.routes';
import loyaltyRoutes from './routes/loyalty.routes';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || 'https://rez.money').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-salon-qr-service',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// API Routes
app.use('/api/qr', qrRoutes);
app.use('/api/loyalty', loyaltyRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Database connection
const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-salon-qr';

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit in production - let the service retry
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  logger.info('Received shutdown signal. Closing connections...');

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════╗
║        Salon QR Check-in Service Started              ║
╠═══════════════════════════════════════════════════════╣
║  Port: ${PORT}                                          ║
║  Environment: ${process.env.NODE_ENV || 'development'}                      ║
╠═══════════════════════════════════════════════════════╣
║  Endpoints:                                          ║
║    POST /api/qr/generate       - Generate QR code   ║
║    POST /api/qr/generate/bulk   - Bulk generate QRs  ║
║    POST /api/qr/check-in       - Customer check-in  ║
║    GET  /api/qr/verify/:qrData - Verify QR code     ║
║    GET  /api/qr/queue/:salonId - Get salon queue    ║
║    GET  /api/qr/wait-time/:id  - Wait time estimate ║
║    GET  /api/qr/history/:id   - Check-in history   ║
╠═══════════════════════════════════════════════════════╣
║  Loyalty Endpoints:                                  ║
║    POST /api/loyalty/account   - Create account    ║
║    GET  /api/loyalty/account/:id - Get account      ║
║    POST /api/loyalty/redeem     - Redeem points    ║
║    GET  /api/loyalty/tiers      - Tier info        ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
};

startServer().catch(console.error);

export default app;
