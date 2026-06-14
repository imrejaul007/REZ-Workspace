import { logger } from '../../shared/logger';
/**
 * Airzy Visa Service
 * Port: 4512
 * Visa Navigator - Requirements, processing, documents, AI assistant
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 4512;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'airzy-visa-service',
    version: '1.0.0',
    description: 'Visa Navigator - Requirements, processing, documents, AI assistant',
    endpoints: {
      health: '/health',
      destinations: '/destinations',
      checkVisa: '/check/:destination',
      checkAll: '/destinations/:destination/all',
      readiness: '/readiness (POST)',
      applications: '/applications (POST)',
      application: '/applications/:id',
      submit: '/applications/:id/submit',
      assistant: '/assistant (POST)',
    }
  });
});

// Start server


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'airzy-visa-service',
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
║           Airzy Visa Service Started                      ║
╠═══════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                             ║
║  URL:  http://localhost:${PORT}                             ║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                              ║
║  • Visa requirement checker                              ║
║  • Popular destinations (25+)                          ║
║  • Readiness score calculator                           ║
║  • Application tracking                                 ║
║  • AI visa assistant                                   ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
