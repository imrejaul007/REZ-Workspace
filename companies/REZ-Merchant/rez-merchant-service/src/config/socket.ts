/**
 * Socket.IO Configuration
 *
 * Provides Socket.IO instance for real-time events.
 * Falls back gracefully if Socket.IO is not configured.
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from './logger';

let io: Server | null = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer?: HttpServer): Server | null {
  if (io) {
    logger.warn('[Socket] Already initialized');
    return io;
  }

  if (!httpServer) {
    logger.warn('[Socket] No HTTP server provided, skipping initialization');
    return null;
  }

  try {
    io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Connection handler
    io.on('connection', (socket: Socket) => {
      logger.info('[Socket] Client connected', {
        socketId: socket.id,
        remoteAddress: socket.handshake.address,
      });

      // Join merchant room
      socket.on('join:merchant', (merchantId: string) => {
        socket.join(`merchant:${merchantId}`);
        logger.info('[Socket] Client joined merchant room', {
          socketId: socket.id,
          merchantId,
        });
      });

      // Leave merchant room
      socket.on('leave:merchant', (merchantId: string) => {
        socket.leave(`merchant:${merchantId}`);
        logger.info('[Socket] Client left merchant room', {
          socketId: socket.id,
          merchantId,
        });
      });

      // Disconnect handler
      socket.on('disconnect', (reason: string) => {
        logger.info('[Socket] Client disconnected', {
          socketId: socket.id,
          reason,
        });
      });

      // Error handler
      socket.on('error', (error: Error) => {
        logger.error('[Socket] Socket error', {
          socketId: socket.id,
          error: error.message,
        });
      });
    });

    logger.info('[Socket] Initialized successfully');
    return io;
  } catch (error) {
    logger.error('[Socket] Initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get Socket.IO server instance
 */
export function getIO(): Server | null {
  return io;
}

/**
 * Close Socket.IO server
 */
export async function closeSocket(): Promise<void> {
  if (io) {
    await new Promise<void>((resolve) => {
      io!.close(() => {
        logger.info('[Socket] Closed');
        resolve();
      });
    });
    io = null;
  }
}

/**
 * Emit event to a specific merchant room
 */
export function emitToMerchant(merchantId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`merchant:${merchantId}`).emit(event, data);
    logger.debug('[Socket] Emitted to merchant', { merchantId, event });
  }
}

/**
 * Emit event to all connected clients
 */
export function emitToAll(event: string, data: unknown): void {
  if (io) {
    io.emit(event, data);
    logger.debug('[Socket] Emitted to all', { event });
  }
}

export default {
  initializeSocket,
  getIO,
  closeSocket,
  emitToMerchant,
  emitToAll,
};
