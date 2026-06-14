/**
 * REZ Restaurant Inventory Service
 * Port: 4056
 *
 * Complete restaurant inventory management including:
 * - Inventory item management
 * - Stock tracking and adjustments
 * - Supplier management
 * - Purchase orders
 * - Alerts for low stock and expiring items
 * - Inventory reports
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import inventoryRoutes from './routes/inventory.routes.js';
import { DEFAULT_CONFIG, ITEM_CATEGORIES, ITEM_UNITS } from './config/index.js';

const app = express();
const PORT = DEFAULT_CONFIG.port;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-restaurant-inventory-service',
    port: PORT,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api', inventoryRoutes);

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
  console.error('[InventoryService Error]', err);

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
║       REZ Restaurant Inventory Service - Port ${PORT}          ║
╠═══════════════════════════════════════════════════════════════╣
║  Categories:                                                 ║
║    ${ITEM_CATEGORIES.slice(0, 4).join(', ')}       ║
║    ${ITEM_CATEGORIES.slice(4, 8).join(', ')}          ║
║    ${ITEM_CATEGORIES.slice(8).join(', ')}   ║
╠═══════════════════════════════════════════════════════════════╣
║  Units:                                                      ║
║    ${ITEM_UNITS.join(', ')}   ║
╠═══════════════════════════════════════════════════════════════╣
║  Features:                                                   ║
║    • Inventory item management                              ║
║    • Stock tracking & adjustments                           ║
║    • Low stock alerts                                       ║
║    • Expiration tracking                                    ║
║    • Supplier management                                    ║
║    • Purchase order workflow                                 ║
║    • Inventory reports & analytics                          ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export { app, server };
