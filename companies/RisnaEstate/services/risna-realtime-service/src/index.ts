import { logger } from './logger';
/**
 * RisnaEstate - Real-time Service
 *
 * WebSocket server for real-time updates.
 * Uses RABTUL Event Bus for pub/sub.
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 4121;

app.use(express.json());
app.use(cors());

// =============================================
// SOCKET.IO EVENTS
// =============================================

interface Room {
  [userId: string]: string[]; // socketId -> rooms
}

const rooms: Room = {};

// Track connected users
const connectedUsers = new Map<string, { socketId: string; role?: string }>();

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Authenticate user
  socket.on('auth', ({ userId, role }) => {
    connectedUsers.set(userId, { socketId: socket.id, role });
    socket.data.userId = userId;
    socket.data.role = role;
    logger.info(`User authenticated: ${userId}`);
    socket.emit('authenticated', { success: true });
  });

  // Join rooms (for targeted broadcasts)
  socket.on('join', ({ rooms: userRooms }) => {
    userRooms.forEach((room: string) => {
      socket.join(room);
      if (!rooms[socket.data.userId]) rooms[socket.data.userId] = [];
      rooms[socket.data.userId].push(room);
    });
    socket.emit('joined', { rooms: userRooms });
  });

  // Leave rooms
  socket.on('leave', ({ rooms: userRooms }) => {
    userRooms.forEach((room: string) => {
      socket.leave(room);
    });
  });

  // Private message
  socket.on('message', ({ to, message }) => {
    const targetUser = connectedUsers.get(to);
    if (targetUser) {
      io.to(targetUser.socketId).emit('message', {
        from: socket.data.userId,
        message,
        timestamp: new Date()
      });
    }
  });

  // Typing indicator
  socket.on('typing', ({ to }) => {
    const targetUser = connectedUsers.get(to);
    if (targetUser) {
      io.to(targetUser.socketId).emit('typing', {
        from: socket.data.userId
      });
    }
  });

  // Join broker channel for leads
  socket.on('broker:subscribe', ({ brokerId }) => {
    socket.join(`broker:${brokerId}`);
    logger.info(`Broker subscribed: ${brokerId}`);
  });

  // Join user channel
  socket.on('user:subscribe', ({ userId }) => {
    socket.join(`user:${userId}`);
    logger.info(`User subscribed: ${userId}`);
  });

  // Join property channel (for price updates, availability)
  socket.on('property:subscribe', ({ propertyId }) => {
    socket.join(`property:${propertyId}`);
    logger.info(`Property subscribed: ${propertyId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (userId) {
      connectedUsers.delete(userId);
      delete rooms[userId];
      logger.info(`User disconnected: ${userId}`);
    }
  });
});

// =============================================
// HTTP API FOR BROADCASTING
// =============================================

app.get('/health', (req, res) => res.json({
  service: 'risna-realtime',
  connections: io.engine.clientsCount,
  users: connectedUsers.size
}));

/**
 * Broadcast to all connected clients
 * POST /api/broadcast
 */
app.post('/api/broadcast', (req, res) => {
  const { event, data, room } = req.body;

  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }

  res.json({ success: true, sent: room ? `to ${room}` : 'to all' });
});

/**
 * Send to specific user
 * POST /api/send/:userId
 */
app.post('/api/send/:userId', (req, res) => {
  const { userId } = req.params;
  const { event, data } = req.body;

  const user = connectedUsers.get(userId);
  if (user) {
    io.to(user.socketId).emit(event, data);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'User not connected' });
  }
});

/**
 * Notify broker of new lead
 * POST /api/leads/:brokerId
 */
app.post('/api/leads/:brokerId', (req, res) => {
  const { brokerId } = req.params;
  const { lead } = req.body;

  io.to(`broker:${brokerId}`).emit('lead:new', {
    type: 'new_lead',
    lead,
    timestamp: new Date()
  });

  res.json({ success: true });
});

/**
 * Notify user of booking update
 * POST /api/bookings/:userId
 */
app.post('/api/bookings/:userId', (req, res) => {
  const { userId } = req.params;
  const { booking } = req.body;

  io.to(`user:${userId}`).emit('booking:update', {
    type: 'booking_update',
    booking,
    timestamp: new Date()
  });

  res.json({ success: true });
});

/**
 * Notify property watchers of price change
 * POST /api/properties/:propertyId
 */
app.post('/api/properties/:propertyId', (req, res) => {
  const { propertyId } = req.params;
  const { update } = req.body;

  io.to(`property:${propertyId}`).emit('property:update', {
    type: 'property_update',
    propertyId,
    update,
    timestamp: new Date()
  });

  res.json({ success: true });
});

/**
 * Notify of site visit scheduled
 * POST /api/visits/:brokerId
 */
app.post('/api/visits/:brokerId', (req, res) => {
  const { brokerId } = req.params;
  const { visit } = req.body;

  io.to(`broker:${brokerId}`).emit('visit:scheduled', {
    type: 'visit_scheduled',
    visit,
    timestamp: new Date()
  });

  res.json({ success: true });
});

/**
 * Get connected users count
 * GET /api/stats
 */
app.get('/api/stats', (req, res) => {
  res.json({
    totalConnections: io.engine.clientsCount,
    authenticatedUsers: connectedUsers.size,
    rooms: Object.keys(rooms).length
  });
});

// =============================================
// START
// =============================================

server.listen(PORT, () => {
  logger.info(`🚀 RisnaEstate Real-time Service running on port ${PORT}`);
});

export default app;
