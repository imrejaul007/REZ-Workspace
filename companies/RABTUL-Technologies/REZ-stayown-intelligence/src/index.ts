import logger from './utils/logger';

/**
 * REZ StayOwn Intelligence - Entry Point
 *
 * Hotel/Guest → Intelligence Connector
 */

import { stayownConnector } from './stayownConnector';

const PORT = process.env.PORT || 4101;

logger.info(`StayOwn Intelligence Connector starting on port ${PORT}`);
logger.info('Connecting to:');
logger.info(`  - Offline Tracker: ${process.env.OFFLINE_TRACKER_URL || 'http://localhost:4125'}`);
logger.info(`  - Intent Service: ${process.env.INTENT_SERVICE_URL || 'http://localhost:4018'}`);
logger.info(`  - Graph Service: ${process.env.GRAPH_SERVICE_URL || 'http://localhost:4129'}`);

logger.info(`\n[READY] StayOwn Intelligence Connector`);
logger.info('Available methods:');
logger.info('  - trackBooking(booking)');
logger.info('  - trackCheckIn(guestId, hotelId, bookingId)');
logger.info('  - trackService(service)');
logger.info('  - trackCheckOut(guestId, hotelId, feedback)');
logger.info('  - getUpsells(guestId, hotelId)');
logger.info('  - getPreArrival(guestId)');
logger.info('  - getCrossMerchantOffers(guestId, hotelId)');

export { stayownConnector };


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-stayown-intelligence',
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
