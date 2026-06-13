import { createApp, GuestMemoryService, TwinOSClient } from './app';
import { logger } from './utils';

const PORT = process.env.PORT || 8447;
const TWINOS_HUB_URL = process.env.TWINOS_HUB_URL || 'http://localhost:4143';
const TWINOS_API_KEY = process.env.TWINOS_API_KEY || '';

// Initialize TwinOS client if URL is provided
let twinosClient: TwinOSClient | undefined;
if (TWINOS_HUB_URL) {
  twinosClient = new TwinOSClient({
    baseUrl: TWINOS_HUB_URL,
    apiKey: TWINOS_API_KEY,
    timeout: 5000,
  });
  logger.info(`TwinOS Hub configured: ${TWINOS_HUB_URL}`);
}

// Initialize Guest Memory Service
const guestMemoryService = new GuestMemoryService(twinosClient);

// Create Express app
const app = createApp(guestMemoryService);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Guest Memory TwinOS Integration started on port ${PORT}`);
  logger.info(`TwinOS sync: ${twinosClient ? 'enabled' : 'disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, guestMemoryService };