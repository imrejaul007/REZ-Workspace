/**
 * Rider Twin Service
 *
 * Digital Twin service for rider profiles, preferences, loyalty, and activity tracking.
 * Part of the Transport OS integration with TwinOS.
 *
 * Service: rider-twin
 * Port: 9050
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// Routes
import { riderRoutes } from './api/routes/rider.routes';
import { paymentRoutes } from './api/routes/payment.routes';
import { addressRoutes } from './api/routes/address.routes';
import { loyaltyRoutes } from './api/routes/loyalty.routes';

// Services
import { RiderTwinService } from './services/rider-twin.service';
import { WebSocketService } from './services/websocket.service';
import { EventBusService } from './services/event-bus.service';

// Utils
import { createLogger } from './utils/logger';
import { errorHandler } from './utils/error-handler';
import { validateEnv } from './utils/validate-env';

// Types
import { RiderTwinConfig } from './models/types';

const logger = createLogger('rider-twin');

// Environment validation
const env = validateEnv();

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGINS.split(','),
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug('incoming_request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'rider-twin',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api/v1/riders', riderRoutes);
  app.use('/api/v1/riders', paymentRoutes);
  app.use('/api/v1/riders', addressRoutes);
  app.use('/api/v1/riders', loyaltyRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'The requested resource was not found',
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

/**
 * Initialize WebSocket server for real-time updates
 */
export function initWebSocket(server: createServer.Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket, req: Request) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract rider_id from query if present
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const riderId = url.searchParams.get('rider_id');

    if (riderId) {
      clients.set(`${riderId}:${clientId}`, ws);
      logger.info('ws_client_connected', { clientId, riderId });
    } else {
      clients.set(clientId, ws);
      logger.info('ws_client_connected', { clientId });
    }

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        logger.debug('ws_message_received', { clientId, messageType: message.type });

        // Handle subscription requests
        if (message.type === 'subscribe') {
          const key = `${message.rider_id}:${clientId}`;
          clients.delete(`${riderId || ''}:${clientId}`);
          clients.set(key, ws);
          ws.send(JSON.stringify({
            type: 'subscribed',
            rider_id: message.rider_id,
          }));
        }
      } catch (error) {
        logger.error('ws_message_parse_error', { error });
      }
    });

    ws.on('close', () => {
      clients.delete(`${riderId || ''}:${clientId}`);
      logger.info('ws_client_disconnected', { clientId, riderId });
    });

    ws.on('error', (error) => {
      logger.error('ws_error', { clientId, error: error.message });
    });
  });

  // Store clients reference for broadcasting
  (global as any).__wsClients = clients;

  return wss;
}

/**
 * Broadcast event to subscribed WebSocket clients
 */
export function broadcastToRider(riderId: string, event: any): void {
  const clients = (global as any).__wsClients as Map<string, WebSocket>;
  if (!clients) return;

  const message = JSON.stringify({
    type: 'rider_update',
    rider_id: riderId,
    event,
    timestamp: new Date().toISOString(),
  });

  for (const [key, ws] of clients) {
    if (key.startsWith(`${riderId}:`) && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const app = createApp();
  const server = createServer(app);

  // Initialize WebSocket
  initWebSocket(server);

  // Initialize services
  const riderService = new RiderTwinService();
  const eventBus = new EventBusService();
  const wsService = new WebSocketService();

  // Connect services
  await eventBus.connect();

  // Subscribe to relevant events
  eventBus.subscribe('transport.order.created', async (event) => {
    const riderId = event.rider_id;
    if (riderId) {
      await riderService.updateActivity(riderId, 'order_created');
      broadcastToRider(riderId, { type: 'order_created', order_id: event.order_id });
    }
  });

  eventBus.subscribe('transport.journey.completed', async (event) => {
    const riderId = event.rider_id;
    if (riderId) {
      await riderService.updateActivity(riderId, 'journey_completed');
      broadcastToRider(riderId, { type: 'journey_completed', journey_id: event.journey_id });
    }
  });

  logger.info('rider_twin_service_starting', {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  });

  // Start server
  server.listen(env.PORT, () => {
    logger.info('rider_twin_service_started', {
      port: env.PORT,
      url: `http://localhost:${env.PORT}`,
      wsUrl: `ws://localhost:${env.PORT}/ws`,
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('rider_twin_service_shutting_down');
    await eventBus.disconnect();
    server.close(() => {
      logger.info('rider_twin_service_stopped');
      process.exit(0);
    });
  });
}

// Export for testing
export { riderTwinService, eventBusService };

// Initialize singleton instances
const riderTwinService = new RiderTwinService();
const eventBusService = new EventBusService();

// Run if main module
if (require.main === module) {
  main().catch((error) => {
    logger.error('rider_twin_service_failed', { error: error.message });
    process.exit(1);
  });
}