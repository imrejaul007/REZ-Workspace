import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import webhookRoutes from './routes/webhooks';
import syncRoutes from './routes/sync';

const app = express();
const PORT = process.env.PORT || 4084;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/webhooks', webhookRoutes);
app.use('/sync', syncRoutes);

// Root health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'POS-Inventory-Sync',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhooks: {
        sale: 'POST /webhooks/pos/sale',
        return: 'POST /webhooks/pos/return',
        received: 'POST /webhooks/inventory/received',
        alert: 'POST /webhooks/inventory/alert',
      },
      sync: {
        full: 'POST /sync/full',
        product: 'POST /sync/product/:sku',
        status: 'GET /sync/status',
        lowStockCheck: 'POST /sync/low-stock-check',
      },
      health: 'GET /health',
    },
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'POS-Inventory-Sync',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${err.message}`);
  console.error(err.stack);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           POS ↔ Inventory Sync Service                         ║
╠═══════════════════════════════════════════════════════════════╣
║  Status:    RUNNING                                            ║
║  Port:      ${PORT.toString().padEnd(56)}║
║  Env:       ${(process.env.NODE_ENV || 'development').padEnd(56)}║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                    ║
║    POST /webhooks/pos/sale      - Sale completed               ║
║    POST /webhooks/pos/return    - Return completed             ║
║    POST /webhooks/inventory/received - Stock received          ║
║    POST /webhooks/inventory/alert - Low stock alert            ║
║    POST /sync/full              - Full inventory sync           ║
║    POST /sync/product/:sku      - Sync single product          ║
║    GET  /sync/status            - Sync status                  ║
║    GET  /health                - Health check                 ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n[${signal}] Received shutdown signal, closing server...`);

  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Error] Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
