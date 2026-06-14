import { logger } from '../../shared/logger';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RideService } from '../services/ride.service';
import { DriverService } from '../services/driver.service';
import { AdsService } from '../services/ads.service';
import { RedisSocketManager } from './redis-socket-manager';
import type { Location } from '@rez/types';

interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
}

interface DriverJoinPayload {
  driverId: string;
}

interface UserJoinPayload {
  userId: string;
}

interface DriverLocationPayload {
  driverId: string;
  location: DriverLocation;
}

interface RideStatusPayload {
  rideId: string;
  status: string;
}

interface HeartbeatPayload {
  timestamp: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://rez.money', 'https://rezapp.app'],
    credentials: true,
  },
  namespace: '/ride',
})
export class RideGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private socketManager: RedisSocketManager;

  // Legacy in-memory maps (kept for backward compatibility, prefer socketManager)
  private driverSockets: Map<string, string> = new Map(); // driverId -> socketId
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private rideService: RideService,
    private driverService: DriverService,
    private adsService: AdsService,
    private redis: any, // Redis instance from DI
  ) {
    // Initialize Redis socket manager if Redis is available
    if (redis) {
      this.socketManager = new RedisSocketManager(redis);
    }
  }

  handleConnection(client: Socket) {
    logger.info(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    // Remove from Redis (persistent)
    if (this.socketManager) {
      await this.socketManager.unregister(client.id);
    }

    // Remove from in-memory maps (for quick access)
    const driverId = this.findDriverBySocket(client.id);
    const userId = this.findUserBySocket(client.id);

    if (driverId) {
      this.driverSockets.delete(driverId);
    }

    if (userId) {
      this.userSockets.delete(userId);
    }

    logger.info(`Client disconnected: ${client.id}`);
  }

  /**
   * Helper to find driver ID by socket ID
   */
  private findDriverBySocket(socketId: string): string | undefined {
    for (const [driverId, sid] of this.driverSockets.entries()) {
      if (sid === socketId) return driverId;
    }
    return undefined;
  }

  /**
   * Helper to find user ID by socket ID
   */
  private findUserBySocket(socketId: string): string | undefined {
    for (const [userId, sid] of this.userSockets.entries()) {
      if (sid === socketId) return userId;
    }
    return undefined;
  }

  /**
   * Driver joins with their ID
   */
  @SubscribeMessage('driver:join')
  async handleDriverJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: DriverJoinPayload,
  ) {
    const { driverId } = data;

    // Register in Redis (persistent)
    if (this.socketManager) {
      await this.socketManager.registerDriver(driverId, client.id);
    }

    // Register in memory (quick access)
    this.driverSockets.set(driverId, client.id);

    // Join driver room
    client.join(`driver:${driverId}`);

    logger.info(`Driver joined: ${driverId}`);
    return { success: true, socketId: client.id };
  }

  /**
   * User joins with their ID
   */
  @SubscribeMessage('user:join')
  async handleUserJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UserJoinPayload,
  ) {
    const { userId } = data;

    // Register in Redis (persistent)
    if (this.socketManager) {
      await this.socketManager.registerUser(userId, client.id);
    }

    // Register in memory (quick access)
    this.userSockets.set(userId, client.id);

    // Join user room
    client.join(`user:${userId}`);

    logger.info(`User joined: ${userId}`);
    return { success: true, socketId: client.id };
  }

  /**
   * Driver location update
   */
  @SubscribeMessage('driver:location')
  async handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: DriverLocationPayload,
  ) {
    const { driverId, location } = data;

    // Update in ride service
    await this.driverService.updateLocation(driverId, location);

    // Broadcast to nearby users (via ride service)
    await (this.rideService as any).broadcastDriverLocation?.(driverId, location);

    return { success: true };
  }

  /**
   * Ride status update (for user notification)
   */
  @SubscribeMessage('ride:status')
  async handleRideStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: RideStatusPayload,
  ) {
    const { rideId, status } = data;

    // Get ride details
    let ride: any;
    try {
      ride = await (this.rideService as any).getRide(rideId);
    } catch {
      return { success: false, error: 'Ride not found' };
    }
    if (!ride) {
      return { success: false, error: 'Ride not found' };
    }

    // Get user's socket
    let userSocketId = this.userSockets.get(ride.userId);

    // Try Redis if not in memory
    if (!userSocketId && this.socketManager) {
      userSocketId = (await this.socketManager.getUserSocket(ride.userId)) ?? undefined;
    }

    // Notify user
    if (userSocketId) {
      this.server.to(userSocketId).emit('ride:updated', {
        rideId,
        status,
        updatedAt: new Date(),
      });
    }

    return { success: true };
  }

  /**
   * Get online drivers count
   */
  @SubscribeMessage('drivers:count')
  async handleGetDriversCount() {
    if (this.socketManager) {
      const counts = await this.socketManager.getOnlineCount();
      return { count: counts.drivers };
    }
    return { count: this.driverSockets.size };
  }

  /**
   * Get online drivers list
   */
  @SubscribeMessage('drivers:list')
  async handleGetDriversList() {
    if (this.socketManager) {
      const drivers = await this.socketManager.getOnlineDrivers();
      return { drivers };
    }
    return { drivers: Array.from(this.driverSockets.keys()) };
  }

  /**
   * Heartbeat to keep connection alive
   */
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: HeartbeatPayload,
  ) {
    // Refresh Redis TTL
    if (this.socketManager) {
      await this.socketManager.heartbeat(client.id);
    }

    return { success: true, serverTime: Date.now() };
  }

  /**
   * Emit to specific user
   */
  async emitToUser(userId: string, event: string, data: unknown): Promise<boolean> {
    // Try memory first
    let socketId: string | null | undefined = this.userSockets.get(userId);

    // Try Redis
    if (!socketId && this.socketManager) {
      socketId = await this.socketManager.getUserSocket(userId);
    }

    if (socketId) {
      this.server.to(socketId).emit(event, data);
      return true;
    }

    // Try room-based emission
    this.server.to(`user:${userId}`).emit(event, data);
    return true;
  }

  /**
   * Emit to specific driver
   */
  async emitToDriver(driverId: string, event: string, data: unknown): Promise<boolean> {
    // Try memory first
    let socketId: string | null | undefined = this.driverSockets.get(driverId);

    // Try Redis
    if (!socketId && this.socketManager) {
      socketId = await this.socketManager.getDriverSocket(driverId);
    }

    if (socketId) {
      this.server.to(socketId).emit(event, data);
      return true;
    }

    // Try room-based emission
    this.server.to(`driver:${driverId}`).emit(event, data);
    return true;
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(event: string, data: unknown): void {
    this.server.emit(event, data);
  }

  /**
   * Get server stats
   */
  getStats(): { connectedClients: number; driverCount: number; userCount: number; usesRedisManager: boolean } {
    return {
      connectedClients: this.server?.sockets?.sockets?.size || 0,
      driverCount: this.driverSockets.size,
      userCount: this.userSockets.size,
      usesRedisManager: !!this.socketManager,
    };
  }
}
