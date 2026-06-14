import logger from './utils/logger';

/**
 * REZ CorpPerks Intelligence - Entry Point
 *
 * Enterprise/HR → Intelligence Connector
 */

import { corpperksConnector } from './corpperksConnector';

const PORT = process.env.PORT || 4104;

logger.info(`CorpPerks Intelligence Connector starting on port ${PORT}`);
logger.info('Connecting to:');
logger.info(`  - Event Bus: ${process.env.EVENT_BUS_URL || 'http://localhost:4025'}`);
logger.info(`  - Intent Service: ${process.env.INTENT_SERVICE_URL || 'http://localhost:4018'}`);

logger.info(`\n[READY] CorpPerks Intelligence Connector`);
logger.info('Available methods:');
logger.info('  - trackEngagement(engagement)');
logger.info('  - trackWellness(signal)');
logger.info('  - getInsights(employeeId)');
logger.info('  - getTeamHealth(companyId)');
logger.info('  - getBehaviorSignals(companyId)');

export { corpperksConnector };


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-corpperks-intelligence',
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
