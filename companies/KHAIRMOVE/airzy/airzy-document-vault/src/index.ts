import { logger } from '../../shared/logger';
/**
 * Airzy Document Vault Service
 * Port: 4513
 * Secure document storage for travelers
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 4513;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'airzy-document-vault',
    version: '1.0.0',
    description: 'Secure document storage for travelers',
    endpoints: {
      health: '/health',
      labels: '/labels',
      vault: '/vault/:userId',
      addDocument: '/vault/:userId/documents (POST)',
      getDocument: '/vault/:userId/documents/:docId',
      updateDocument: '/vault/:userId/documents/:docId (PATCH)',
      deleteDocument: '/vault/:userId/documents/:docId (DELETE)',
      verify: '/vault/:userId/documents/:docId/verify (POST)',
      share: '/share (POST)',
      shared: '/shared/:linkId',
      folders: '/folders (POST), /folders/:userId (GET)',
      digilocker: '/digilocker/:userId',
    }
  });
});

// Start server


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'airzy-document-vault',
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
║        Airzy Document Vault Service Started            ║
╠═══════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                             ║
║  URL:  http://localhost:${PORT}                             ║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                             ║
║  • Secure document storage                            ║
║  • Travel folders                                     ║
║  • Share links                                        ║
║  • DigiLocker integration                             ║
║  • Document verification                              ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
