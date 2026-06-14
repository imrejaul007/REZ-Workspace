import { logger } from '../utils/logger';
import Redis from 'ioredis';
import { Server as SocketServer, Socket } from 'socket.io';
import { Tracking, ITracking, TrackingEventType } from '../models/Tracking';
import { DeliveryPerson, DriverStatus } from '../models/DeliveryPerson';
import { DeliveryOrder, OrderStatus } from '../models/DeliveryOrder';
import { config } from '../config';

interface LocationUpdate {
  driverId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  orderId?: string;
}

export class TrackingService {
  private redis: Redis;
  private io: SocketServer | null = null;
  private locationUpdateChannel = 'food_delivery:location_updates';

  constructor(redis: Redis) {
    this.redis = redis;
    this.subscribeToLocationUpdates();
  }

  setSocketServer(io: SocketServer): void {
    this.io = io;
  }

  async getTracking(orderId: string): Promise<ITracking | null> {
    return Tracking.findOne({ orderId });
  }

  async getTrackingByDriver(driverId: string): Promise<ITracking[]> {
    return Tracking.find({ driverId });
  }

  async updateDriverLocation(update: LocationUpdate): Promise<void> {
    const { driverId, lat, lng, timestamp, orderId } = update;

    // Update driver's current location in database
    await DeliveryPerson.updateOne(
      { driverId },
      {
        $set: {
          currentLocation: { lat, lng, updatedAt: new Date() },
        },
      }
    );

    // Store in Redis for quick access
    const locationKey = `driver:location:${driverId}`;
    await this.redis.set(
      locationKey,
      JSON.stringify({ lat, lng, timestamp }),
      'EX',
      300 // 5 minute expiry
    );

    // If driver has active order, update tracking
    if (orderId) {
      await this.updateOrderTracking(orderId, { lat, lng });
    }

    // Publish location update for real-time subscribers
    await this.redis.publish(this.locationUpdateChannel, JSON.stringify(update));
  }

  async getDriverLocation(driverId: string): Promise<{ lat: number; lng: number; timestamp: Date } | null> {
    const locationKey = `driver:location:${driverId}`;
    const data = await this.redis.get(locationKey);
    if (!data) return null;

    const parsed = JSON.parse(data);
    return {
      lat: parsed.lat,
      lng: parsed.lng,
      timestamp: new Date(parsed.timestamp),
    };
  }

  private async updateOrderTracking(orderId: string, location: { lat: number; lng: number }): Promise<void> {
    const order = await DeliveryOrder.findOne({ orderId });
    if (!order || !order.deliveryAddress) return;

    const tracking = await Tracking.findOne({ orderId });
    if (!tracking) return;

    // Calculate distance to destination
    const distanceToDestination = this.calculateDistance(
      location,
      order.deliveryAddress.coordinates
    );

    // Calculate ETA based on average speed
    const avgSpeedMps = 6.94; // 25 km/h in m/s
    const etaSeconds = Math.round(distanceToDestination * 1000 / avgSpeedMps);

    // Update tracking document
    await Tracking.updateOne(
      { orderId },
      {
        $set: {
          currentLocation: { ...location, updatedAt: new Date() },
          distanceRemaining: Math.round(distanceToDestination * 100) / 100,
          etaSeconds,
        },
        $push: {
          events: {
            type: TrackingEventType.ORDER_IN_TRANSIT,
            timestamp: new Date(),
            location,
            note: `Driver location updated. Distance: ${distanceToDestination.toFixed(2)} km`,
          },
        },
      }
    );

    // Update estimated arrival time
    const estimatedArrival = new Date(Date.now() + etaSeconds * 1000);
    await Tracking.updateOne({ orderId }, { $set: { estimatedArrival } });

    // Emit socket event for real-time updates
    if (this.io) {
      this.io.to(`order:${orderId}`).emit('tracking:update', {
        orderId,
        location,
        distanceRemaining: distanceToDestination,
        etaSeconds,
        estimatedArrival,
      });
    }
  }

  async addTrackingEvent(
    orderId: string,
    eventType: TrackingEventType,
    note?: string,
    location?: { lat: number; lng: number }
  ): Promise<void> {
    await Tracking.updateOne(
      { orderId },
      {
        $push: {
          events: {
            type: eventType,
            timestamp: new Date(),
            location,
            note,
          },
        },
      }
    );

    // Emit socket event
    if (this.io) {
      this.io.to(`order:${orderId}`).emit('tracking:event', {
        orderId,
        eventType,
        timestamp: new Date(),
        note,
        location,
      });
    }
  }

  async getTrackingHistory(orderId: string): Promise<ITracking['events']> {
    const tracking = await Tracking.findOne({ orderId }, { events: 1 });
    return tracking?.events || [];
  }

  async subscribeToLocationUpdates(): Promise<void> {
    // Redis subscription is handled in the socket setup
  }

  async handleSocketConnection(socket: Socket): Promise<void> {
    const orderId = socket.handshake.query.orderId as string;
    const customerId = socket.handshake.query.customerId as string;
    const driverId = socket.handshake.query.driverId as string;

    if (orderId) {
      // Join order tracking room
      socket.join(`order:${orderId}`);
      logger.info(`Socket joined order room: ${orderId}`);

      // Send current tracking data
      const tracking = await this.getTracking(orderId);
      if (tracking) {
        socket.emit('tracking:init', tracking);
      }
    }

    if (driverId) {
      // Driver socket for location updates
      socket.join(`driver:${driverId}`);
      logger.info(`Socket joined driver room: ${driverId}`);

      // Handle location updates from driver app
      socket.on('location:update', async (data: { lat: number; lng: number; orderId?: string }) => {
        await this.updateDriverLocation({
          driverId,
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date(),
          orderId: data.orderId,
        });
      });
    }

    if (customerId) {
      // Customer socket for order notifications
      socket.join(`customer:${customerId}`);
      logger.info(`Socket joined customer room: ${customerId}`);
    }

    socket.on('disconnect', () => {
      logger.info('Socket disconnected:', socket.id);
    });
  }

  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) *
        Math.cos(this.toRad(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
