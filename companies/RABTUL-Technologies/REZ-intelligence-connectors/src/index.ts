/**
 * REZ Intelligence Connectors - Entry Point
 *
 * Export all connectors and event helpers
 */

export {
  EventConnector,
  eventConnector,
  commerceEvents,
  identityEvents,
  loyaltyEvents,
  engagementEvents,
  supportEvents,
  mediaEvents,
  notificationEvents
} from './eventConnectors';

// Service Connectors
export { createOrderConnector } from './orderConnector';
export { createPaymentConnector } from './paymentConnector';
export { createAuthConnector } from './authConnector';
export { createNotificationConnector } from './notificationConnector';

// NEW: Missing Service Connectors
export { createDeliveryConnector } from './deliveryConnector';
export { createCatalogConnector } from './catalogConnector';
export { createSearchConnector } from './searchConnector';
export { createQRConnector } from './qrConnector';
export { createDOOHConnector } from './doohConnector';
export { createBookingConnector } from './bookingConnector';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-intelligence-connectors',
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
