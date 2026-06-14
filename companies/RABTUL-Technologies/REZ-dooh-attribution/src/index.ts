import logger from './utils/logger';

/**
 * REZ DOOH Attribution - Entry Point
 *
 * DOOH Screen → Offline Attribution Connector
 */

import { doohConnector } from './doohOfflineConnector';

const PORT = process.env.PORT || 4102;

logger.info(`DOOH Attribution Connector starting on port ${PORT}`);
logger.info('Connecting to:');
logger.info(`  - Offline Tracker: ${process.env.OFFLINE_TRACKER_URL || 'http://localhost:4125'}`);
logger.info(`  - Graph Service: ${process.env.GRAPH_SERVICE_URL || 'http://localhost:4129'}`);
logger.info(`  - Attribution: ${process.env.ATTRIBUTION_URL || 'http://localhost:4061'}`);

logger.info(`\n[READY] DOOH Attribution Connector`);
logger.info('Available methods:');
logger.info('  - trackImpression(impression)');
logger.info('  - trackQRConversion(conversion)');
logger.info('  - trackStoreVisit(visit)');
logger.info('  - trackPurchase(purchase)');

export { doohConnector };


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-dooh-attribution',
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
