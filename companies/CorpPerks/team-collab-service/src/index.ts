import { logger } from '../../shared/logger';
import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import channelRoutes from './routes/channelRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';
import communityRoutes from './routes/communityRoutes.js';

// Import middleware
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from './middleware/errorHandler.js';
import { AuthenticatedRequest } from './middleware/auth.js';

// Import database
import { connectDatabase, setupGracefulShutdown } from './config/database.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
}));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Service-Name'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'team-collab-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness check
app.get('/ready', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/channels', messageRoutes); // Channel-specific message routes
app.use('/api/announcements', announcementRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/communities', communityRoutes);

// Socket.IO connection handling
interface SocketData {
  userId?: string;
  name?: string;
  companyId?: string;
  channels: Set<string>;
}

const userSockets = new Map<string, Set<string>>();
const channelSockets = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Initialize socket data
  const socketData: SocketData = {
    channels: new Set(),
  };
  (socket as any).data = socketData;

  // Authenticate user
  socket.on('authenticate', (data: { userId: string; name: string; companyId: string }) => {
    socketData.userId = data.userId;
    socketData.name = data.name;
    socketData.companyId = data.companyId;

    // Track user sockets
    if (!userSockets.has(data.userId)) {
      userSockets.set(data.userId, new Set());
    }
    userSockets.get(data.userId)!.add(socket.id);

    // Join company room
    socket.join(`company:${data.companyId}`);

    // Broadcast presence
    io.emit('presence:update', {
      odId: data.userId,
      status: 'online',
      lastSeen: new Date(),
    });

    logger.info(`User authenticated: ${data.userId} (${data.name})`);
  });

  // Join channel
  socket.on('channel:join', (channelId: string) => {
    if (!socketData.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    socket.join(`channel:${channelId}`);
    socketData.channels.add(channelId);

    // Track channel members
    if (!channelSockets.has(channelId)) {
      channelSockets.set(channelId, new Set());
    }
    channelSockets.get(channelId)!.add(socket.id);

    // Notify channel members
    socket.to(`channel:${channelId}`).emit('user:joined', {
      channelId,
      userId: socketData.userId,
      name: socketData.name,
    });
  });

  // Leave channel
  socket.on('channel:leave', (channelId: string) => {
    socket.leave(`channel:${channelId}`);
    socketData.channels.delete(channelId);

    // Remove from channel tracking
    if (channelSockets.has(channelId)) {
      channelSockets.get(channelId)!.delete(socket.id);
    }

    // Notify channel members
    socket.to(`channel:${channelId}`).emit('user:left', {
      channelId,
      userId: socketData.userId,
      name: socketData.name,
    });
  });

  // Send message (real-time)
  socket.on('message:send', async (data: {
    channelId: string;
    content: string;
    mentions?: string[];
    threadId?: string;
  }) => {
    if (!socketData.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Broadcast message to channel
    io.to(`channel:${data.channelId}`).emit('message:new', {
      channelId: data.channelId,
      senderId: socketData.userId,
      senderName: socketData.name,
      content: data.content,
      mentions: data.mentions,
      threadId: data.threadId,
      timestamp: new Date(),
    });

    // Notify mentioned users
    if (data.mentions && data.mentions.length > 0) {
      data.mentions.forEach((userId) => {
        const userSocketIds = userSockets.get(userId);
        if (userSocketIds) {
          userSocketIds.forEach((socketId) => {
            io.to(socketId).emit('notification:mention', {
              channelId: data.channelId,
              senderId: socketData.userId,
              senderName: socketData.name,
              content: data.content,
            });
          });
        }
      });
    }
  });

  // Typing indicator
  socket.on('message:typing', (data: { channelId: string; isTyping: boolean }) => {
    if (!socketData.userId) return;

    socket.to(`channel:${data.channelId}`).emit('typing:update', {
      channelId: data.channelId,
      userId: socketData.userId,
      userName: socketData.name,
      isTyping: data.isTyping,
    });
  });

  // Update presence
  socket.on('presence:update', (status: 'online' | 'away' | 'busy' | 'offline') => {
    if (!socketData.userId) return;

    io.emit('presence:update', {
      odId: socketData.userId,
      status,
      lastSeen: new Date(),
    });
  });

  // Join meeting
  socket.on('meeting:join', (meetingId: string) => {
    if (!socketData.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    socket.join(`meeting:${meetingId}`);
    socket.to(`meeting:${meetingId}`).emit('meeting:participant_joined', {
      meetingId,
      userId: socketData.userId,
      name: socketData.name,
    });
  });

  // Leave meeting
  socket.on('meeting:leave', (meetingId: string) => {
    socket.leave(`meeting:${meetingId}`);
    socket.to(`meeting:${meetingId}`).emit('meeting:participant_left', {
      meetingId,
      userId: socketData.userId,
      name: socketData.name,
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);

    if (socketData.userId) {
      // Remove from user sockets
      const sockets = userSockets.get(socketData.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(socketData.userId);
          // Broadcast offline
          io.emit('presence:update', {
            odId: socketData.userId,
            status: 'offline',
            lastSeen: new Date(),
          });
        }
      }

      // Remove from channel tracking
      socketData.channels.forEach((channelId) => {
        if (channelSockets.has(channelId)) {
          channelSockets.get(channelId)!.delete(socket.id);
        }
      });
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT || '4716');

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║          Team Collaboration Service Started                   ║
╠═══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                   ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║  Socket.IO: Enabled                                         ║
║                                                               ║
║  Routes:                                                      ║
║    POST /api/channels          - Create channel              ║
║    GET  /api/channels          - List channels               ║
║    GET  /api/channels/:id      - Get channel                ║
║    PATCH /api/channels/:id     - Update channel             ║
║    POST /api/channels/:id/members - Add members             ║
║                                                               ║
║    POST /api/channels/:id/messages - Send message          ║
║    GET  /api/channels/:id/messages - Get messages           ║
║    PATCH /api/messages/:id     - Edit message                ║
║    DELETE /api/messages/:id     - Delete message             ║
║    POST /api/messages/:id/reactions - Add reaction           ║
║                                                               ║
║    POST /api/announcements     - Create announcement        ║
║    GET  /api/announcements     - List announcements         ║
║    POST /api/announcements/:id/view - Track view            ║
║                                                               ║
║    POST /api/meetings          - Schedule meeting           ║
║    GET  /api/meetings          - List meetings              ║
║    POST /api/meetings/:id/start - Start meeting             ║
║    POST /api/meetings/:id/end   - End meeting               ║
║    POST /api/meetings/:id/ai-notes - Generate AI notes      ║
║                                                               ║
║    GET  /api/analytics/channels - Channel analytics         ║
║    GET  /api/analytics/user/:id - User activity             ║
║                                                               ║
║  Health:                                                      ║
║    GET  /health                 - Health check              ║
║    GET  /ready                  - Readiness check           ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Setup global error handlers
setupGlobalErrorHandlers();

// Start the server
startServer();

export { app, io };
