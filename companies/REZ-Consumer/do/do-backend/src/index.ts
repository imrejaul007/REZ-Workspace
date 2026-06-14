import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { z } from 'zod';

import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { rateLimiter } from './api/middleware/rateLimit.js';
import { authRouter } from './api/routes/auth.js';
import { chatRouter } from './api/routes/chat.js';
import { discoverRouter } from './api/routes/discover.js';
import { walletRouter } from './api/routes/wallet.js';
import { bookingsRouter } from './api/routes/bookings.js';
import { profileRouter } from './api/routes/profile.js';
import { complaintsRouter } from './api/routes/complaints.js';
import { notificationsRouter } from './api/routes/notifications.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { verifyToken } from './api/middleware/auth.js';

const app = express();
const server = createServer(app);

// WebSocket server for real-time
const wss = new WebSocketServer({ server, path: '/stream' });

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/auth', authRouter);
app.use('/do/chat', chatRouter);
app.use('/do/complaints', complaintsRouter);
app.use('/discovery', discoverRouter);
app.use('/wallet', walletRouter);
app.use('/bookings', bookingsRouter);
app.use('/profile', profileRouter);
app.use('/notifications', notificationsRouter);

// WebSocket message validation schema
const wsMessageSchema = z.object({
  type: z.enum(['message', 'typing', 'heartbeat']),
  payload: z.record(z.unknown()).optional(),
});

// WebSocket handling with authentication
wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);

  // Extract and validate token from query params or headers
  const token = url.searchParams.get('token');
  const sessionId = url.searchParams.get('sessionId');

  // Authenticate user from token
  let authenticatedUser: { id: string; phone: string } | null = null;

  if (token) {
    authenticatedUser = verifyToken(token);
  }

  if (!authenticatedUser) {
    logger.warn('WebSocket connection rejected: invalid or missing token', {
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });
    ws.send(JSON.stringify({
      type: 'error',
      payload: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    }));
    ws.close(1008, 'Authentication required');
    return;
  }

  logger.info('WebSocket authenticated', {
    userId: authenticatedUser.id,
    sessionId,
    phone: authenticatedUser.phone.slice(-4),
  });

  // Store connection with authenticated user
  const connection = {
    ws,
    sessionId,
    userId: authenticatedUser.id,
    authenticatedUser,
    active: true,
  };

  ws.on('message', async (data) => {
    try {
      const rawMessage = JSON.parse(data.toString());

      // Validate message structure
      const parsed = wsMessageSchema.safeParse(rawMessage);
      if (!parsed.success) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { code: 'INVALID_MESSAGE', message: 'Invalid message format' },
        }));
        return;
      }

      const message = parsed.data;
      await handleWebSocketMessage(connection, message);
    } catch (error) {
      logger.error('WebSocket message error', { error });
      ws.send(JSON.stringify({
        type: 'error',
        payload: { code: 'PARSE_ERROR', message: 'Invalid JSON format' },
      }));
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket disconnected', { sessionId, userId: authenticatedUser.id });
    connection.active = false;
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error', { error, sessionId, userId: authenticatedUser.id });
  });

  // Send connection confirmation with user info
  ws.send(JSON.stringify({
    type: 'connected',
    payload: {
      sessionId,
      userId: authenticatedUser.id,
      timestamp: Date.now(),
    },
  }));
});

async function handleWebSocketMessage(connection: typeof connections extends Map<string, infer V> ? V : never, message: z.infer<typeof wsMessageSchema>) {
  const { ws, sessionId, userId } = connection;

  switch (message.type) {
    case 'message': {
      // Validate message content
      const text = message.payload?.text;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { code: 'INVALID_CONTENT', message: 'Message text is required' },
        }));
        return;
      }

      // Sanitize and limit message length
      const sanitizedText = text.trim().slice(0, 2000);
      const location = message.payload?.location;

      ws.send(JSON.stringify({ type: 'typing', payload: { isTyping: true } }));

      try {
        const { workflowEngine } = await import('./services/workflowEngine.js');
        const result = await workflowEngine.execute(sanitizedText, {
          sessionId,
          userId,
          location,
        });

        ws.send(JSON.stringify({ type: 'typing', payload: { isTyping: false } }));
        ws.send(JSON.stringify({ type: 'message', payload: result }));
      } catch (error) {
        logger.error('Workflow execution failed', { error, userId, sessionId });
        ws.send(JSON.stringify({ type: 'typing', payload: { isTyping: false } }));
        ws.send(JSON.stringify({
          type: 'error',
          payload: { code: 'PROCESSING_ERROR', message: 'Failed to process message' },
        }));
      }
      break;
    }

    case 'typing':
      // Typing indicator (could broadcast to other clients)
      ws.send(JSON.stringify({
        type: 'typing',
        payload: { isTyping: message.payload?.isTyping ?? false },
      }));
      break;

    case 'heartbeat':
      ws.send(JSON.stringify({
        type: 'heartbeat',
        payload: { timestamp: Date.now() },
      }));
      break;
  }
}

// Connection tracking
const connections = new Map<string, ReturnType<typeof Object.assign>>();

// Error handler (must be last)
app.use(errorHandler);

// Start server
server.listen(config.PORT, () => {
  logger.info(`Do Backend running on port ${config.PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});

export default app;
