import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createKitchenRoutes } from './routes/kitchen.routes';
import { getKitchenService, KitchenService, SoundType } from './services/kitchenService';
import { KitchenOrder, SoundType as SoundTypeEnum } from './types';

const PORT = process.env.PORT || 4080;

// =============================================================================
// SECURITY: Environment validation
// =============================================================================

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET must be set');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('[FATAL] MONGODB_URI must be set');
  process.exit(1);
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
if (process.env.NODE_ENV === 'production' && ALLOWED_ORIGINS.length === 0) {
  console.error('[FATAL] ALLOWED_ORIGINS must be set in production');
  process.exit(1);
}

// =============================================================================
// SECURITY: JWT Authentication Middleware
// =============================================================================

interface AuthenticatedRequest extends Request {
  merchant?: jwt.JwtPayload | string;
}

const kitchenAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.merchant = decoded;
    next();
  } catch (err) {
    console.error('[Auth] JWT verification failed:', err instanceof Error ? err.message : 'Unknown error');
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// =============================================================================
// Sound player for terminal/console notifications
// =============================================================================

class SoundPlayer {
  private isEnabled: boolean;

  constructor(enabled: boolean = true) {
    this.isEnabled = enabled;
  }

  play(type: SoundType): void {
    if (!this.isEnabled) return;

    switch (type) {
      case 'new_order':
        console.log('\x07\x07');
        console.log('[NOTIFICATION] New order received!');
        break;
      case 'delay_alert':
        console.log('\x07\x07\x07');
        console.log('[ALERT] Order is delayed!');
        break;
      case 'order_ready':
        console.log('\x07');
        console.log('[NOTIFICATION] Order is ready!');
        break;
      case 'order_complete':
        console.log('[NOTIFICATION] Order completed');
        break;
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// =============================================================================
// Create Express application
// =============================================================================

function createApp(kitchenService: KitchenService): Application {
  const app = express();

  // CORS: Restrict to merchant app origins
  app.use(cors({
    origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : undefined,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // Apply authentication to all API routes
  app.use('/api', kitchenAuth, createKitchenRoutes(kitchenService));

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'ReZ Kitchen Display System',
      version: '1.0.0',
      port: PORT,
      endpoints: {
        orders: '/api/orders',
        stats: '/api/orders/stats',
        delayed: '/api/orders/delayed',
        next: '/api/orders/next',
        health: '/api/health',
        websocket: `ws://localhost:${PORT}`,
      },
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[Error]', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: err.message,
    });
  });

  return app;
}

// =============================================================================
// Setup Socket.IO server with authentication
// =============================================================================

function setupSocketIO(httpServer: http.Server, kitchenService: KitchenService, soundPlayer: SoundPlayer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : undefined,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // SECURITY: WebSocket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.error('[Socket.IO] Authentication failed: No token provided');
      return next(new Error('Authentication required: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (socket as any).merchant = decoded;
      console.log(`[Socket.IO] Client authenticated: ${socket.id}`);
      next();
    } catch (err) {
      console.error('[Socket.IO] Authentication failed: Invalid token');
      next(new Error('Authentication failed: Invalid token'));
    }
  });

  // Socket events
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Send current orders on connection
    socket.emit('orders_update', kitchenService.getActiveOrders());

    // Handle order status updates from client
    socket.on('update_status', (data: { orderId: string; status: string }) => {
      console.log(`[Socket.IO] Status update request: ${data.orderId} -> ${data.status}`);
      const order = kitchenService.updateOrderStatus(data.orderId, data.status as any);
      if (order) {
        io.emit('order_updated', order);
      }
    });

    // Handle item toggle from client
    socket.on('toggle_item', (data: { orderId: string; itemId: string }) => {
      console.log(`[Socket.IO] Item toggle: ${data.orderId}/${data.itemId}`);
      const order = kitchenService.toggleItemCompletion(data.orderId, data.itemId);
      if (order) {
        io.emit('order_updated', order);
      }
    });

    // Handle new order from client
    socket.on('new_order', (data: any) => {
      console.log('[Socket.IO] New order received');
      const order = kitchenService.createOrder(data);
      io.emit('new_order', order);
    });

    // Handle sound request from client
    socket.on('play_sound', (data: { type: SoundType }) => {
      soundPlayer.play(data.type);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} - ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket.IO] Socket error: ${socket.id}`, error);
    });
  });

  return io;
}

// =============================================================================
// Main entry point
// =============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(50));
  console.log('ReZ Kitchen Display System');
  console.log('='.repeat(50));

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[MongoDB] Connected successfully');
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    process.exit(1);
  }

  // Create sound player
  const soundPlayer = new SoundPlayer(true);

  // Initialize kitchen service with event handlers
  const kitchenService = getKitchenService({
    events: {
      onNewOrder: (order: KitchenOrder) => {
        console.log(`[EVENT] New order: ${order.orderNumber} (${order.totalItems} items)`);
      },
      onOrderUpdate: (order: KitchenOrder) => {
        console.log(`[EVENT] Order updated: ${order.orderNumber} -> ${order.status}`);
      },
      onOrderComplete: (order: KitchenOrder) => {
        console.log(`[EVENT] Order completed: ${order.orderNumber}`);
      },
      onDelayAlert: (order: KitchenOrder) => {
        console.log(`[ALERT] Order delayed: ${order.orderNumber}`);
      },
      onSound: (type: SoundType) => {
        soundPlayer.play(type);
      },
    },
  });

  // Create Express app
  const app = createApp(kitchenService);

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Setup Socket.IO
  const io = setupSocketIO(httpServer, kitchenService, soundPlayer);

  // Update kitchen service with Socket.IO instance for broadcasting
  const updatedService = getKitchenService({
    io,
    events: {
      onNewOrder: (order: KitchenOrder) => {
        console.log(`[EVENT] New order: ${order.orderNumber} (${order.totalItems} items)`);
      },
      onOrderUpdate: (order: KitchenOrder) => {
        console.log(`[EVENT] Order updated: ${order.orderNumber} -> ${order.status}`);
      },
      onOrderComplete: (order: KitchenOrder) => {
        console.log(`[EVENT] Order completed: ${order.orderNumber}`);
      },
      onDelayAlert: (order: KitchenOrder) => {
        console.log(`[ALERT] Order delayed: ${order.orderNumber}`);
      },
      onSound: (type: SoundType) => {
        soundPlayer.play(type);
      },
    },
  });

  // Start server
  httpServer.listen(PORT, () => {
    console.log('');
    console.log(`Server running on port ${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('API Endpoints (all require JWT):');
    console.log('  GET    /api/orders          - Get all active orders');
    console.log('  GET    /api/orders/all      - Get all orders');
    console.log('  GET    /api/orders/:id      - Get order by ID');
    console.log('  GET    /api/orders/stats    - Get order statistics');
    console.log('  GET    /api/orders/next     - Get next order in queue');
    console.log('  GET    /api/orders/delayed  - Get delayed orders');
    console.log('  POST   /api/orders          - Create new order');
    console.log('  PATCH  /api/orders/:id/status - Update order status');
    console.log('  PATCH  /api/orders/:id/items/:itemId/toggle - Toggle item');
    console.log('  POST   /api/orders/clear-completed - Clear completed orders');
    console.log('  GET    /api/sounds/:type    - Get sound config');
    console.log('');
    console.log('Socket.IO Events:');
    console.log('  Emit: orders_update, new_order, order_updated');
    console.log('  Listen: update_status, toggle_item, new_order, play_sound');
    console.log('  (WebSocket requires token in socket.handshake.auth.token)');
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('='.repeat(50));
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[Server] Shutting down...');
    kitchenService.stop();
    io.close();
    await mongoose.connection.close();
    httpServer.close(() => {
      console.log('[Server] Closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', async () => {
    console.log('\n[Server] Received SIGTERM');
    kitchenService.stop();
    io.close();
    await mongoose.connection.close();
    httpServer.close(() => {
      console.log('[Server] Closed');
      process.exit(0);
    });
  });
}

// Run the server
main().catch((error) => {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-kitchen-display',
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
