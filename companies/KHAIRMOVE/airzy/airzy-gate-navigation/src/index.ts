import { logger } from '../../shared/logger';
/**
 * Airzy Gate Navigation Service
 * Port: 4510
 * Airport wayfinding and navigation for travelers
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 4510;

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
    service: 'airzy-gate-navigation',
    version: '1.0.0',
    description: 'Airport gate navigation and wayfinding service',
    endpoints: {
      health: '/health',
      airports: '/airports',
      airport: '/airports/:code',
      gates: '/airports/:code/gates',
      gate: '/airports/:code/gates/:gateId',
      navigate: '/navigate (POST)',
      nearest: '/nearest/:airportCode/:gateId',
      search: '/search/flight/:flightNumber',
      walkingTime: '/walking-time/:airportCode/:fromGate/:toGate',
    }
  });
});

// Start server


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'airzy-gate-navigation',
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
║         Airzy Gate Navigation Service Started            ║
╠═══════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                             ║
║  URL:  http://localhost:${PORT}                             ║
╠═══════════════════════════════════════════════════════════╣
║  Supported Airports: BLR, DEL, BOM                       ║
║  Features:                                                ║
║  • Gate-to-gate navigation                               ║
║  • Facility discovery (lounges, restaurants)            ║
║  • Walking time estimates                                 ║
║  • Flight-to-gate lookup                                 ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
