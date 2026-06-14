import logger from './utils/logger';

/**
 * REZ Verify QR Service - WebSocket Server
 * Real-time tracking for bookings, replacements, pickups
 */

import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

interface TrackingData {
  type: 'booking' | 'replacement' | 'pickup';
  id: string;
  status: string;
  location?: { lat: number; lng: number };
  message?: string;
  timestamp: Date;
}

const io = new SocketIOServer({
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || 'https://rez.money').split(','),
    credentials: true,
    methods: ['GET', 'POST']
  }
});

const userSockets = new Map<string, Set<string>>(); // userId -> Set of socket ids
const trackingSubscriptions = new Map<string, Set<string>>(); // trackingId -> Set of socket ids

io.on('connection', (socket: Socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Authenticate user
  socket.on('authenticate', (data: { user_id: string }) => {
    socket.data.user_id = data.user_id;

    if (!userSockets.has(data.user_id)) {
      userSockets.set(data.user_id, new Set());
    }
    userSockets.get(data.user_id)!.add(socket.id);

    logger.info(`User ${data.user_id} authenticated on socket ${socket.id}`);
    socket.emit('authenticated', { success: true });
  });

  // Subscribe to tracking updates
  socket.on('subscribe', (data: { type: string; id: string }) => {
    const trackingId = `${data.type}:${data.id}`;

    if (!trackingSubscriptions.has(trackingId)) {
      trackingSubscriptions.set(trackingId, new Set());
    }
    trackingSubscriptions.get(trackingId)!.add(socket.id);

    socket.join(trackingId);
    logger.info(`Socket ${socket.id} subscribed to ${trackingId}`);
    socket.emit('subscribed', { tracking_id: trackingId });
  });

  // Unsubscribe from tracking
  socket.on('unsubscribe', (data: { type: string; id: string }) => {
    const trackingId = `${data.type}:${data.id}`;
    socket.leave(trackingId);

    if (trackingSubscriptions.has(trackingId)) {
      trackingSubscriptions.get(trackingId)!.delete(socket.id);
    }
    socket.emit('unsubscribed', { tracking_id: trackingId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user_id = socket.data.user_id;

    if (user_id && userSockets.has(user_id)) {
      userSockets.get(user_id)!.delete(socket.id);
      if (userSockets.get(user_id)!.size === 0) {
        userSockets.delete(user_id);
      }
    }

    // Clean up tracking subscriptions
    trackingSubscriptions.forEach((sockets, trackingId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        trackingSubscriptions.delete(trackingId);
      }
    });

    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Helper functions for emitting updates
export function emitTrackingUpdate(trackingId: string, data: TrackingData) {
  io.to(trackingId).emit('tracking_update', data);
}

export function emitBookingUpdate(bookingId: string, status: string, message?: string) {
  const trackingId = `booking:${bookingId}`;
  const data: TrackingData = {
    type: 'booking',
    id: bookingId,
    status,
    message,
    timestamp: new Date()
  };
  io.to(trackingId).emit('tracking_update', data);
}

export function emitReplacementUpdate(replacementId: string, status: string, location?: { lat: number; lng: number }) {
  const trackingId = `replacement:${replacementId}`;
  const data: TrackingData = {
    type: 'replacement',
    id: replacementId,
    status,
    location,
    timestamp: new Date()
  };
  io.to(trackingId).emit('tracking_update', data);
}

export function emitPickupUpdate(pickupId: string, status: string, location?: { lat: number; lng: number }) {
  const trackingId = `pickup:${pickupId}`;
  const data: TrackingData = {
    type: 'pickup',
    id: pickupId,
    status,
    location,
    timestamp: new Date()
  };
  io.to(trackingId).emit('tracking_update', data);
}

// Notify specific user
export function notifyUser(userId: string, event: string, data) {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
}

export function initWebSocket(httpServer) {
  io.attach(httpServer);
  logger.info('WebSocket server initialized');
  return io;
}

export { io };
