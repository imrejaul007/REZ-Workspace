import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

// Environment flag for logging
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug');

function log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
  if (LOG_LEVEL === 'debug' || (LOG_LEVEL === 'error' && level === 'error')) {
    const prefix = `[${new Date().toISOString()}] [WebSocket] [${level.toUpperCase()}]`;
    switch (level) {
      case 'debug': console.debug(prefix, message, ...args); break;
      case 'info': console.info(prefix, message, ...args); break;
      case 'warn': console.warn(prefix, message, ...args); break;
      case 'error': console.error(prefix, message, ...args); break;
    }
  }
}

export function initWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    log('info', `Client connected: ${socket.id}`);

    socket.on('authenticate', (data: { merchantId: string }) => {
      socket.join(`merchant:${data.merchantId}`);
      log('debug', `Merchant ${data.merchantId} joined room`);
      socket.emit('authenticated', { success: true });
    });

    socket.on('subscribe:orders', (data: { merchantId: string }) => {
      socket.join(`orders:${data.merchantId}`);
      log('debug', `Subscribed to orders for ${data.merchantId}`);
    });

    socket.on('subscribe:scans', (data: { merchantId: string }) => {
      socket.join(`scans:${data.merchantId}`);
      log('debug', `Subscribed to scans for ${data.merchantId}`);
    });

    socket.on('disconnect', () => {
      log('info', `Client disconnected: ${socket.id}`);
    });
  });

  log('info', 'Server initialized');
  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitOrderEvent(merchantId: string, event: string, data: Record<string, unknown>): void {
  if (io) {
    io.to(`orders:${merchantId}`).emit(event, data);
    log('debug', `Emitted ${event} to merchant ${merchantId}`);
  }
}

export function emitScanEvent(merchantId: string, event: string, data: Record<string, unknown>): void {
  if (io) {
    io.to(`scans:${merchantId}`).emit(event, data);
    log('debug', `Emitted ${event} to merchant ${merchantId}`);
  }
}

export function emitToMerchant(merchantId: string, event: string, data: Record<string, unknown>): void {
  if (io) {
    io.to(`merchant:${merchantId}`).emit(event, data);
    log('debug', `Emitted ${event} to merchant ${merchantId}`);
  }
}
