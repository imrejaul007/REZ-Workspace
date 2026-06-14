/**
 * WebSocket for REZ Referral OS
 * Simple real-time updates
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initWebSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
    path: '/ws',
  });

  io.on('connection', (socket) => {
    console.log('[WS] Client connected:', socket.id);

    socket.on('auth', (data: { userId?: string }) => {
      if (data.userId) {
        socket.data.userId = data.userId;
        socket.join(`user:${data.userId}`);
      }
    });

    socket.on('subscribe', (topic: string) => {
      socket.join(topic);
    });

    socket.on('unsubscribe', (topic: string) => {
      socket.leave(topic);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Client disconnected:', socket.id);
    });
  });

  console.log('[WS] Socket.IO initialized on /ws');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown): void {
  io?.emit(event, data);
}

export function emitReferralCreated(userId: string, referralId: string): void {
  emitToUser(userId, 'referral:created', { referralId, timestamp: new Date().toISOString() });
}

export function emitReferralQualified(userId: string, referralId: string, rewardAmount: number): void {
  emitToUser(userId, 'referral:qualified', { referralId, rewardAmount, timestamp: new Date().toISOString() });
}

export function emitReferralRewarded(userId: string, referralId: string, amount: number): void {
  emitToUser(userId, 'referral:rewarded', { referralId, amount, timestamp: new Date().toISOString() });
}

export function emitLeaderboardUpdate(): void {
  emitToAll('leaderboard:updated', { timestamp: new Date().toISOString() });
}
