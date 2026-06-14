import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createServer } from 'http';

import { config } from './config/index.js';
import {
  sessionRoutes,
  cartRoutes,
  checkoutRoutes,
  merchantRoutes,
  syncRoutes,
  storeRoutes,
  qrRoutes,
  recommendationRoutes,
  sponsoredRoutes,
  recoveryRoutes,
  productIntelligenceRoutes,
  verificationRoutes,
  analyticsRoutes,
  inventoryRoutes,
  universalScanRoutes,
} from './routes/index.js';
import {
  apiLimiter,
  checkoutLimiter,
  scanLimiter,
  authMiddleware,
} from './middleware/index.js';
import { goWebSocketServer } from './services/websocketService.js';
import { startSessionExpiryJob } from './services/sessionExpiryService.js';

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? ['https://rez.app', 'https://rez.money']
    : '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-go-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    websocket: {
      clients: goWebSocketServer.getTotalClients(),
    },
  });
});

// API routes
app.use('/api/sessions', apiLimiter, authMiddleware, sessionRoutes);
app.use('/api/cart', scanLimiter, authMiddleware, cartRoutes);
app.use('/api/checkout', checkoutLimiter, authMiddleware, checkoutRoutes);
app.use('/api/merchants', apiLimiter, authMiddleware, merchantRoutes);
app.use('/api/sync', apiLimiter, authMiddleware, syncRoutes);
app.use('/api/stores', apiLimiter, authMiddleware, storeRoutes);
app.use('/api/qr', apiLimiter, authMiddleware, qrRoutes);
app.use('/api/recommendations', apiLimiter, authMiddleware, recommendationRoutes);
app.use('/api/sponsored', apiLimiter, authMiddleware, sponsoredRoutes);
app.use('/api/recovery', apiLimiter, authMiddleware, recoveryRoutes);
app.use('/api/product-intelligence', apiLimiter, authMiddleware, productIntelligenceRoutes);
app.use('/api/verify', verificationRoutes); // No auth for public verification
app.use('/api/analytics', apiLimiter, authMiddleware, analyticsRoutes);
app.use('/api/inventory', apiLimiter, authMiddleware, inventoryRoutes);
app.use('/api/universal', universalScanRoutes); // No auth for public scans
app.use('/api/timeline', apiLimiter, authMiddleware, universalScanRoutes);
app.use('/api/shopping-list', apiLimiter, authMiddleware, universalScanRoutes);
app.use('/api/receipts', apiLimiter, authMiddleware, universalScanRoutes);

// Internal routes (for service-to-service communication)
app.use('/internal', authMiddleware, (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-go-internal' });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    error: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start server
async function start() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Initialize WebSocket server
    goWebSocketServer.initialize(server);
    console.log('WebSocket server initialized');

    // Start background jobs
    startSessionExpiryJob();
    console.log('Background jobs started');

    // Start HTTP server
    server.listen(config.PORT, () => {
      console.log(`REZ Go Service running on port ${config.PORT}`);
      console.log(`Health check: http://localhost:${config.PORT}/health`);
      console.log(`WebSocket: ws://localhost:${config.PORT}/ws`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
