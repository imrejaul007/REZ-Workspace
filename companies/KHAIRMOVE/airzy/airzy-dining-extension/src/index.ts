import { logger } from '../../shared/logger';
/**
 * Airzy Dining Extension Service
 * Port: 4511
 * Airport dining and food ordering integration with REZ NOW
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 4511;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'airzy-dining-extension',
    version: '1.0.0',
    description: 'Airport dining and food ordering integration with REZ NOW',
    endpoints: {
      health: '/health',
      restaurants: '/airports/:airportCode/restaurants',
      restaurant: '/airports/:airportCode/restaurants/:restaurantId',
      search: '/search?airportCode=BLR&cuisine=indian',
      recommendations: '/recommendations/:airportCode/:gateId',
      deliveryZones: '/airports/:airportCode/delivery-zones',
      cuisines: '/airports/:airportCode/cuisines',
      createOrder: '/orders (POST)',
      trackOrder: '/orders/:orderId',
    }
  });
});

// Start server


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'airzy-dining-extension',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║        Airzy Dining Extension Service Started           ║
╠═══════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                             ║
║  URL:  http://localhost:${PORT}                             ║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                               ║
║  • Airport restaurant discovery                         ║
║  • Gate-based recommendations                          ║
║  • Delivery to gate                                    ║
║  • REZ NOW integration                                 ║
║  • Dietary filtering                                   ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
