import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';

// Presence types
export interface RiderPresence {
  riderId: string;
  displayName: string;
  avatar?: string;
  coordinates: [number, number]; // [lng, lat]
  altitude?: number;
  speed?: number;
  heading?: number;
  bikeId?: string;
  bikeNickname?: string;
  rideId?: string;
  status: 'riding' | 'idle' | 'offline';
  lastUpdate: Date;
  city?: string;
}

export interface PresenceRoom {
  roomId: string;
  type: 'route' | 'area' | 'group' | 'event';
  name: string;
  activeRiders: number;
  center?: [number, number];
  radius?: number;
}

export interface SOSAlert {
  sosId: string;
  riderId: string;
  displayName: string;
  coordinates: [number, number];
  type: 'accident' | 'medical' | 'breakdown' | 'assistance' | 'safety_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

// Socket event names
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',

  // Presence
  PRESENCE_JOIN: 'presence:join',
  PRESENCE_LEAVE: 'presence:leave',
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_NEARBY: 'presence:nearby',
  PRESENCE_ERROR: 'presence:error',

  // Ride events
  RIDE_START: 'ride:start',
  RIDE_LOCATION: 'ride:location',
  RIDE_WAYPOINT: 'ride:waypoint',
  RIDE_COMPLETE: 'ride:complete',

  // Group events
  GROUP_RIDE_START: 'group:ride:start',
  GROUP_RIDE_UPDATE: 'group:ride:update',
  GROUP_MESSAGE: 'group:message',

  // Event events
  EVENT_CHECKIN: 'event:checkin',
  EVENT_RSVP_UPDATE: 'event:rsvp',

  // SOS events
  SOS_TRIGGERED: 'sos:triggered',
  SOS_RESPONSE: 'sos:response',
  SOS_RESOLVED: 'sos:resolved',

  // Notification events
  NOTIFICATION: 'notification',

  // Presence broadcast
  RIDERS_NEARBY: 'riders:nearby',
  ACTIVE_ROUTES: 'routes:active',
  LIVE_PRESENCE: 'presence:live',
} as const;

// Socket manager class
export class SocketManager {
  private io: Server;
  private riders: Map<string, RiderPresence> = new Map();
  private socketToRider: Map<string, string> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: ['*'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupHandlers();
    this.startPresenceCleanup();
  }

  private setupHandlers(): void {
    this.io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
      logger.info(`Socket connected: ${socket.id}`);
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: Socket): void {
    // Handle rider joining presence
    socket.on(SOCKET_EVENTS.PRESENCE_JOIN, (data: { riderId: string; token: string }) => {
      this.handlePresenceJoin(socket, data);
    });

    // Handle presence updates (GPS location)
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (data: Partial<RiderPresence>) => {
      this.handlePresenceUpdate(socket, data);
    });

    // Handle ride events
    socket.on(SOCKET_EVENTS.RIDE_START, (data: { rideId: string; route?: any }) => {
      this.handleRideStart(socket, data);
    });

    socket.on(SOCKET_EVENTS.RIDE_LOCATION, (data: { rideId: string; coordinates: [number, number]; speed?: number; altitude?: number }) => {
      this.handleRideLocation(socket, data);
    });

    socket.on(SOCKET_EVENTS.RIDE_WAYPOINT, (data: { rideId: string; waypoint: any }) => {
      this.handleRideWaypoint(socket, data);
    });

    socket.on(SOCKET_EVENTS.RIDE_COMPLETE, (data: { rideId: string }) => {
      this.handleRideComplete(socket, data);
    });

    // Handle group events
    socket.on(SOCKET_EVENTS.GROUP_MESSAGE, (data: { groupId: string; message: any }) => {
      this.handleGroupMessage(socket, data);
    });

    // Handle SOS events
    socket.on(SOCKET_EVENTS.SOS_TRIGGERED, (data: SOSAlert) => {
      this.handleSOSTriggered(socket, data);
    });

    socket.on(SOCKET_EVENTS.SOS_RESPONSE, (data: { sosId: string; riderId: string }) => {
      this.handleSOSResponse(socket, data);
    });

    // Handle presence leave
    socket.on(SOCKET_EVENTS.PRESENCE_LEAVE, () => {
      this.handlePresenceLeave(socket);
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      this.handleDisconnect(socket);
    });

    // Handle nearby riders request
    socket.on(SOCKET_EVENTS.PRESENCE_NEARBY, (data: { coordinates: [number, number]; radiusKm: number }) => {
      this.handleNearbyRequest(socket, data);
    });
  }

  private handlePresenceJoin(socket: Socket, data: { riderId: string; token: string }): void {
    const { riderId } = data;

    // Store socket -> rider mapping
    this.socketToRider.set(socket.id, riderId);

    // Create initial presence
    const presence: RiderPresence = {
      riderId,
      displayName: 'Rider',
      coordinates: [0, 0],
      status: 'idle',
      lastUpdate: new Date(),
    };

    this.riders.set(riderId, presence);

    // Join rider-specific room
    socket.join(`rider:${riderId}`);

    logger.info(`Rider joined presence: ${riderId}`);

    // Acknowledge
    socket.emit(SOCKET_EVENTS.PRESENCE_JOIN, {
      success: true,
      riderId,
      socketId: socket.id,
    });

    // Broadcast to nearby riders
    this.broadcastNearbyRiders();
  }

  private handlePresenceUpdate(socket: Socket, data: Partial<RiderPresence>): void {
    const riderId = this.socketToRider.get(socket.id);
    if (!riderId) {
      socket.emit(SOCKET_EVENTS.PRESENCE_ERROR, { error: 'Not authenticated' });
      return;
    }

    const presence = this.riders.get(riderId);
    if (!presence) {
      socket.emit(SOCKET_EVENTS.PRESENCE_ERROR, { error: 'Presence not found' });
      return;
    }

    // Update presence
    Object.assign(presence, data, { lastUpdate: new Date() });

    // If riding, broadcast to route subscribers
    if (presence.rideId) {
      socket.to(`ride:${presence.rideId}`).emit(SOCKET_EVENTS.RIDE_LOCATION, {
        riderId,
        coordinates: presence.coordinates,
        speed: presence.speed,
        timestamp: presence.lastUpdate,
      });
    }

    // Acknowledge update
    socket.emit(SOCKET_EVENTS.PRESENCE_UPDATE, { success: true });
  }

  private handleRideStart(socket: Socket, data: { rideId: string; route?: any }): void {
    const riderId = this.socketToRider.get(socket.id);
    if (!riderId) return;

    const presence = this.riders.get(riderId);
    if (!presence) return;

    // Update presence to riding
    presence.status = 'riding';
    presence.rideId = data.rideId;

    // Join ride room
    socket.join(`ride:${data.rideId}`);

    // Broadcast ride start to group/event
    if (data.route?.groupId) {
      this.io.to(`group:${data.route.groupId}`).emit(SOCKET_EVENTS.GROUP_RIDE_START, {
        riderId,
        rideId: data.rideId,
        startLocation: data.route.startLocation,
        timestamp: new Date(),
      });
    }

    logger.info(`Ride started: ${data.rideId} by ${riderId}`);
  }

  private handleRideLocation(socket: Socket, data: { rideId: string; coordinates: [number, number]; speed?: number; altitude?: number }): void {
    const riderId = this.socketToRider.get(socket.id);
    if (!riderId) return;

    const presence = this.riders.get(riderId);
    if (!presence) return;

    // Update location
    presence.coordinates = data.coordinates;
    presence.speed = data.speed;
    presence.altitude = data.altitude;
    presence.lastUpdate = new Date();

    // Broadcast to ride followers
    socket.to(`ride:${data.rideId}`).emit(SOCKET_EVENTS.RIDE_LOCATION, {
      riderId,
      coordinates: data.coordinates,
      speed: data.speed,
      altitude: data.altitude,
      timestamp: presence.lastUpdate,
    });

    // Check for nearby riders and broadcast
    this.checkAndBroadcastNearby(socket, data.coordinates);
  }

  private handleRideWaypoint(socket: Socket, data: { rideId: string; waypoint: any }): void {
    const riderId = this.socketToRider.get(socket.id);
    if (!riderId) return;

    // Broadcast waypoint to ride followers
    socket.to(`ride:${data.rideId}`).emit(SOCKET_EVENTS.RIDE_WAYPOINT, {
      riderId,
      waypoint: data.waypoint,
      timestamp: new Date(),
    });
  }

  private handleRideComplete(socket: Socket, data: { rideId: string }): void {
    const riderId = this.socketToRider.get(socket.id);
    if (!riderId) return;

    const presence = this.riders.get(riderId);
    if (!presence) return;

    // Update presence to idle
    presence.status = 'idle';
    presence.rideId = undefined;

    // Leave ride room
    socket.leave(`ride:${data.rideId}`);

    // Broadcast completion
    socket.to(`ride:${data.rideId}`).emit(SOCKET_EVENTS.RIDE_COMPLETE, {
      riderId,
      rideId: data.rideId,
      timestamp: new Date(),
    });

    logger.info(`Ride completed: ${data.rideId} by ${riderId}`);
  }

  private handleGroupMessage(socket: Socket, data: { groupId: string; message: any }): void {
    const riderId = this.socketToRider.get(socket.id);
    if (!riderId) return;

    // Broadcast to group
    socket.to(`group:${data.groupId}`).emit(SOCKET_EVENTS.GROUP_MESSAGE, {
      riderId,
      message: data.message,
      timestamp: new Date(),
    });
  }

  private handleSOSTriggered(_socket: Socket, data: SOSAlert): void {
    // Broadcast to all nearby riders (20km radius)
    const sosRiders = this.getRidersInRadius(data.coordinates, 20);

    for (const [riderId] of sosRiders) {
      if (riderId !== data.riderId) {
        this.io.to(`rider:${riderId}`).emit(SOCKET_EVENTS.SOS_TRIGGERED, data);
      }
    }

    // Broadcast to admin room
    this.io.to('admins').emit(SOCKET_EVENTS.SOS_TRIGGERED, data);

    logger.warn(`SOS triggered: ${data.sosId} at ${data.coordinates}`);
  }

  private handleSOSResponse(socket: Socket, data: { sosId: string; riderId: string }): void {
    // Broadcast response to SOS initiator
    socket.to(`sos:${data.sosId}`).emit(SOCKET_EVENTS.SOS_RESPONSE, {
      responderId: data.riderId,
      timestamp: new Date(),
    });
  }

  private handlePresenceLeave(socket: Socket): void {
    this.cleanupRider(socket);
  }

  private handleDisconnect(socket: Socket): void {
    logger.info(`Socket disconnected: ${socket.id}`);
    this.cleanupRider(socket);
  }

  private cleanupRider(socket: Socket): void {
    const riderId = this.socketToRider.get(socket.id);
    if (riderId) {
      const presence = this.riders.get(riderId);
      if (presence) {
        presence.status = 'offline';
        presence.lastUpdate = new Date();
      }
      this.riders.delete(riderId);
    }
    this.socketToRider.delete(socket.id);
  }

  private handleNearbyRequest(socket: Socket, data: { coordinates: [number, number]; radiusKm: number }): void {
    const nearbyRiders = this.getRidersInRadius(data.coordinates, data.radiusKm);
    const nearby = Array.from(nearbyRiders.values()).filter(r => r.status !== 'offline');

    socket.emit(SOCKET_EVENTS.RIDERS_NEARBY, {
      count: nearby.length,
      riders: nearby,
    });
  }

  private getRidersInRadius(coordinates: [number, number], radiusKm: number): Map<string, RiderPresence> {
    const result = new Map<string, RiderPresence>();

    for (const [riderId, presence] of this.riders) {
      if (presence.status === 'offline') continue;

      const distance = this.calculateDistance(coordinates, presence.coordinates);
      if (distance <= radiusKm) {
        result.set(riderId, presence);
      }
    }

    return result;
  }

  private checkAndBroadcastNearby(socket: Socket, coordinates: [number, number]): void {
    const nearby = this.getRidersInRadius(coordinates, 5);
    if (nearby.size > 1) {
      socket.emit(SOCKET_EVENTS.RIDERS_NEARBY, {
        count: nearby.size,
        riders: Array.from(nearby.values()),
      });
    }
  }

  private broadcastNearbyRiders(): void {
    // Group riders by city/area for live presence display
    const groups = new Map<string, RiderPresence[]>();

    for (const presence of this.riders.values()) {
      if (presence.status === 'offline' || !presence.city) continue;

      const group = groups.get(presence.city) || [];
      group.push(presence);
      groups.set(presence.city, group);
    }

    // Broadcast to all admins
    this.io.to('admins').emit(SOCKET_EVENTS.LIVE_PRESENCE, {
      totalRiders: this.riders.size,
      activeRiders: Array.from(this.riders.values()).filter(r => r.status !== 'offline').length,
      byCity: Array.from(groups.entries()).map(([city, riders]) => ({
        city,
        count: riders.length,
      })),
    });
  }

  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2[1] - coord1[1]);
    const dLon = this.toRad(coord2[0] - coord1[0]);
    const lat1 = this.toRad(coord1[1]);
    const lat2 = this.toRad(coord2[1]);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Clean up stale presences every 5 minutes
  private startPresenceCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const timeout = 5 * 60 * 1000; // 5 minutes

      for (const [riderId, presence] of this.riders) {
        if (presence.status !== 'offline') {
          const lastUpdate = new Date(presence.lastUpdate).getTime();
          if (now - lastUpdate > timeout) {
            presence.status = 'offline';
            logger.info(`Presence timed out: ${riderId}`);
          }
        }
      }

      // Broadcast updated presence
      this.broadcastNearbyRiders();
    }, 5 * 60 * 1000);
  }

  // Public methods for external use
  public emitToRider(riderId: string, event: string, data: any): void {
    this.io.to(`rider:${riderId}`).emit(event, data);
  }

  public emitToRide(rideId: string, event: string, data: any): void {
    this.io.to(`ride:${rideId}`).emit(event, data);
  }

  public emitToGroup(groupId: string, event: string, data: any): void {
    this.io.to(`group:${groupId}`).emit(event, data);
  }

  public emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public getActiveRiders(): RiderPresence[] {
    return Array.from(this.riders.values()).filter(r => r.status !== 'offline');
  }

  public getRiderCount(): number {
    return this.riders.size;
  }

  public getOnlineCount(): number {
    return Array.from(this.riders.values()).filter(r => r.status !== 'offline').length;
  }
}

// Singleton instance
let socketManager: SocketManager | null = null;

export function initSocketManager(httpServer: HttpServer): SocketManager {
  if (!socketManager) {
    socketManager = new SocketManager(httpServer);
    logger.info('Socket.io manager initialized');
  }
  return socketManager;
}

export function getSocketManager(): SocketManager | null {
  return socketManager;
}