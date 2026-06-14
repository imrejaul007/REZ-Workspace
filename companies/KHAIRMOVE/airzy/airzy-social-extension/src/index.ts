import { logger } from '../../shared/logger';
/**
 * Airzy Social Extension Service
 * Port: 4514
 * Traveler community - reviews, tips, itineraries
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 4514;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'airzy-social-extension',
    version: '1.0.0',
    description: 'Traveler community - reviews, tips, itineraries',
    endpoints: {
      health: '/health',
      destinations: '/destinations',
      tags: '/tags',
      reviews: '/reviews (GET, POST)',
      review: '/reviews/:id',
      helpful: '/reviews/:id/helpful (POST)',
      itineraries: '/itineraries (GET, POST)',
      itinerary: '/itineraries/:id',
      tips: '/tips (GET, POST)',
      comments: '/comments (GET, POST)',
      stats: '/stats',
    }
  });
});

// Start server


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'airzy-social-extension',
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
║        Airzy Social Extension Started                 ║
╠═══════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                             ║
║  URL:  http://localhost:${PORT}                             ║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                           ║
║  • Traveler reviews (lounges, airports, hotels)   ║
║  • Itinerary sharing                               ║
║  • Travel tips                                     ║
║  • Community comments                              ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
