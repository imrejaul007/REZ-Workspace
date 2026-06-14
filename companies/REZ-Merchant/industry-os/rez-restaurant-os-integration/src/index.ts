/**
 * Restaurant OS Integration Layer
 *
 * This service orchestrates all restaurant services:
 * - POS Service (4081) - Orders, billing, payments
 * - Menu Service (4030) - Menu management
 * - KDS Service (4006) - Kitchen display
 * - Staff Service - Staff, shifts, attendance
 * - Table Booking - Reservations, waitlist
 * - Invoice Service (4028) - GST invoices
 * - Procurement (4083) - Inventory, suppliers
 *
 * Plus RABTUL Platform:
 * - Auth (4002) - Authentication
 * - Payment (4001) - Payment processing
 * - Wallet (4004) - Coins, loyalty
 * - Notifications (4011) - SMS, Email
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { logger } from './config/logger';
import { restaurantRoutes } from './routes/restaurant.routes';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];
if (IS_PRODUCTION && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: IS_PRODUCTION ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000']),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(limiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${Date.now() - start}ms`,
    });
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-restaurant-os-integration',
    timestamp: new Date().toISOString(),
    services: {
      pos: process.env.POS_SERVICE_URL || 'localhost:4081',
      menu: process.env.MENU_SERVICE_URL || 'localhost:4030',
      kds: process.env.KDS_SERVICE_URL || 'localhost:4006',
      staff: process.env.STAFF_SERVICE_URL,
      tableBooking: process.env.TABLE_BOOKING_URL,
      invoice: process.env.INVOICE_SERVICE_URL || 'localhost:4028',
      procurement: process.env.PROCUREMENT_SERVICE_URL || 'localhost:4083',
      auth: process.env.AUTH_SERVICE_URL || 'localhost:4002',
      payment: process.env.PAYMENT_SERVICE_URL || 'localhost:4001',
      wallet: process.env.WALLET_SERVICE_URL || 'localhost:4004',
      notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'localhost:4011',
    },
  });
});

// Integration routes
app.use('/api/restaurant', authenticateToken, restaurantRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Restaurant OS Integration running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;
