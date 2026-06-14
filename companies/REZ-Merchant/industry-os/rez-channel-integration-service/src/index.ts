/**
 * REZ Channel Integration Service
 * Port: 4055
 *
 * Complete channel management for hotels including:
 * - Channel connections (Booking.com, MMT, Goibibo, etc.)
 * - Room mapping management
 * - Rate plan management
 * - Inventory synchronization
 * - Booking normalization
 * - Revenue analytics
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import channelRoutes from './routes/channel.routes.js';
import { DEFAULT_CONFIG } from './config/index.js';

const app = express();
const PORT = DEFAULT_CONFIG.port;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-channel-integration-service',
    port: PORT,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api', channelRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ChannelIntegration Error]', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'ERROR',
      message: 'Internal server error',
    },
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         REZ Channel Integration Service - Port ${PORT}        ║
╠═══════════════════════════════════════════════════════════════╣
║  Supported Channels:                                          ║
║    • Booking.com (15% commission)                           ║
║    • MakeMyTrip (15% commission)                            ║
║    • Goibibo (15% commission)                               ║
║    • Expedia (12% commission)                               ║
║    • Airbnb (host fees)                                     ║
║    • Google Hotel Center (0% commission)                    ║
╠═══════════════════════════════════════════════════════════════╣
║  Features:                                                   ║
║    • Channel connection management                           ║
║    • Room mapping & synchronization                         ║
║    • Rate plan management                                   ║
║    • Booking normalization                                   ║
║    • Revenue analytics & reporting                          ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export { app, server };
