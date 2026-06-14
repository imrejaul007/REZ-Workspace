import logger from './utils/logger';

/**
 * REZ POS Intelligence - Entry Point
 *
 * POS System → Offline Commerce Connector
 */

import { posConnector } from './posConnector';

const PORT = process.env.PORT || 4103;

logger.info(`POS Intelligence Connector starting on port ${PORT}`);
logger.info('Connecting to:');
logger.info(`  - Offline Tracker: ${process.env.OFFLINE_TRACKER_URL || 'http://localhost:4125'}`);
logger.info(`  - Graph Service: ${process.env.GRAPH_SERVICE_URL || 'http://localhost:4129'}`);
logger.info(`  - Wallet Service: ${process.env.WALLET_SERVICE_URL || 'http://localhost:4004'}`);

logger.info(`\n[READY] POS Intelligence Connector`);
logger.info('Available methods:');
logger.info('  - registerPOS(config)');
logger.info('  - processTransaction(transaction)');
logger.info('  - getMerchantAnalytics(merchantId)');

export { posConnector };


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-pos-intelligence',
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
