import logger from './utils/logger';

/**
 * REZ BuzzLocal Intelligence - Entry Point
 *
 * Social/Community → Intelligence Connector
 */

import { buzzlocalConnector } from './buzzlocalConnector';

const PORT = process.env.PORT || 4100;

logger.info(`BuzzLocal Intelligence Connector starting on port ${PORT}`);
logger.info('Connecting to:');
logger.info(`  - Event Bus: ${process.env.EVENT_BUS_URL || 'http://localhost:4025'}`);
logger.info(`  - Intent Service: ${process.env.INTENT_SERVICE_URL || 'http://localhost:4018'}`);

// Health check endpoint simulation
logger.info(`\n[READY] BuzzLocal Intelligence Connector`);
logger.info('Available methods:');
logger.info('  - trackPost(post)');
logger.info('  - trackEngagement(engagement)');
logger.info('  - getTrending(location)');
logger.info('  - getPersonalizedFeed(userId, limit)');
logger.info('  - getMerchantSocialSignals(merchantId)');
logger.info('  - getLocalInsights(location)');

export { buzzlocalConnector };


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-buzzlocal-intelligence',
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
