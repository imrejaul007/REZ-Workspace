import { Delivery, DeliveryDocument } from '../models/Delivery';
import { Driver, DriverDocument } from '../models/Driver';
import {
  CreateDeliveryDTO,
  UpdateDeliveryStatusDTO,
  AssignDriverDTO,
  DeliveryStatus,
  IDelivery,
  GeoLocation
} from '../types';
import { calculateDistance, calculateDeliveryPricing, generateRoute, calculateETA } from '../utils/geo';
import { trackingService } from './trackingService';
import { driverService } from './driverService';
import { redisClient } from '../config/redis';

export class DeliveryService {
  private static instance: DeliveryService;

  private constructor() {}

  public static getInstance(): DeliveryService {
    if (!DeliveryService.instance) {
      DeliveryService.instance = new DeliveryService();
    }
    return DeliveryService.instance;
  }

  public async createDelivery(data: CreateDeliveryDTO): Promise<DeliveryDocument> {
    const distance = calculateDistance(data.pickup, data.dropoff);
    const { distanceFee, totalPrice } = calculateDeliveryPricing(distance, data.pricing.basePrice);
    const routeInfo = generateRoute(data.pickup, data.dropoff);

    const initialEta = calculateETA(data.pickup, data.dropoff);

    const delivery = new Delivery({
      orderId: data.orderId,
      customerId: data.customerId,
      status: DeliveryStatus.PENDING,
      pickup: data.pickup,
      dropoff: data.dropoff,
      scheduledPickup: data.scheduledPickup,
      packageDetails: data.packageDetails,
      pricing: {
        basePrice: data.pricing.basePrice,
        distanceFee,
        surgeFee: data.pricing.surgeFee || 0,
        totalPrice
      },
      route: {
        origin: data.pickup,
        destination: data.dropoff,
        distance: routeInfo.distance,
        estimatedDuration: routeInfo.estimatedDuration
      },
      eta: initialEta,
      events: [
        {
          status: DeliveryStatus.PENDING,
          timestamp: new Date(),
          notes: 'Delivery order created'
        }
      ]
    });

    await delivery.save();

    await this.cacheDelivery(delivery);

    return delivery;
  }

  public async getDeliveryById(deliveryId: string): Promise<DeliveryDocument | null> {
    const cached = await this.getCachedDelivery(deliveryId);
    if (cached) {
      return cached;
    }

    const delivery = await Delivery.findById(deliveryId).exec();
    if (delivery) {
      await this.cacheDelivery(delivery);
    }
    return delivery;
  }

  public async getDeliveryByOrderId(orderId: string): Promise<DeliveryDocument | null> {
    return Delivery.findOne({ orderId }).exec();
  }

  public async getDeliveriesByCustomer(customerId: string): Promise<DeliveryDocument[]> {
    return Delivery.find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  public async getDeliveriesByDriver(driverId: string): Promise<DeliveryDocument[]> {
    return Delivery.find({ driverId })
      .sort({ createdAt: -1 })
      .exec();
  }

  public async getDeliveriesByStatus(status: DeliveryStatus): Promise<DeliveryDocument[]> {
    return Delivery.find({ status })
      .sort({ createdAt: -1 })
      .exec();
  }

  public async getAllDeliveries(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: DeliveryStatus;
      driverId?: string;
      customerId?: string;
    }
  ): Promise<{ deliveries: DeliveryDocument[]; total: number }> {
    const query: unknown = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.driverId) {
      query.driverId = filters.driverId;
    }
    if (filters?.customerId) {
      query.customerId = filters.customerId;
    }

    const skip = (page - 1) * limit;

    const [deliveries, total] = await Promise.all([
      Delivery.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Delivery.countDocuments(query).exec()
    ]);

    return { deliveries, total };
  }

  public async assignDriver(data: AssignDriverDTO): Promise<DeliveryDocument> {
    const [delivery, driver] = await Promise.all([
      Delivery.findById(data.deliveryId).exec(),
      Driver.findById(data.driverId).exec()
    ]);

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if (!driver) {
      throw new Error('Driver not found');
    }

    if (delivery.status !== DeliveryStatus.PENDING) {
      throw new Error(`Cannot assign driver to delivery with status: ${delivery.status}`);
    }

    if (driver.status !== 'available') {
      throw new Error('Driver is not available');
    }

    await Promise.all([
      delivery.updateOne({
        driverId: driver._id,
        status: DeliveryStatus.ASSIGNED,
        $push: {
          events: {
            status: DeliveryStatus.ASSIGNED,
            timestamp: new Date(),
            notes: `Driver ${driver.name} assigned`,
            updatedBy: driver._id?.toString()
          }
        }
      }),
      driver.updateOne({
        currentDeliveryId: delivery._id,
        status: 'busy',
        'availability.isAvailable': false
      })
    ]);

    await this.invalidateDeliveryCache(delivery._id?.toString() || '');

    await trackingService.startTrackingDelivery(delivery._id?.toString() || '', driver._id?.toString() || '');

    const updatedDelivery = await Delivery.findById(data.deliveryId).exec();
    if (!updatedDelivery) {
      throw new Error('Failed to retrieve updated delivery');
    }

    return updatedDelivery;
  }

  public async updateDeliveryStatus(data: UpdateDeliveryStatusDTO): Promise<DeliveryDocument> {
    const delivery = await Delivery.findById(data.deliveryId).exec();

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      [DeliveryStatus.PENDING]: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],
      [DeliveryStatus.ASSIGNED]: [DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED],
      [DeliveryStatus.PICKED_UP]: [DeliveryStatus.IN_TRANSIT],
      [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.OUT_FOR_DELIVERY, DeliveryStatus.FAILED],
      [DeliveryStatus.OUT_FOR_DELIVERY]: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED],
      [DeliveryStatus.DELIVERED]: [],
      [DeliveryStatus.FAILED]: [DeliveryStatus.PENDING],
      [DeliveryStatus.CANCELLED]: []
    };

    const allowedStatuses = validTransitions[delivery.status];
    if (!allowedStatuses.includes(data.status)) {
      throw new Error(
        `Invalid status transition from ${delivery.status} to ${data.status}`
      );
    }

    const updateData: unknown = {
      status: data.status
    };

    if (data.status === DeliveryStatus.PICKED_UP) {
      updateData.actualPickup = new Date();
    } else if (data.status === DeliveryStatus.DELIVERED) {
      updateData.actualDropoff = new Date();
    }

    if (data.location) {
      const eta = calculateETA(data.location, delivery.dropoff);
      updateData.eta = eta;
    }

    await delivery.updateOne({
      ...updateData,
      $push: {
        events: {
          status: data.status,
          timestamp: new Date(),
          location: data.location,
          notes: data.notes,
          updatedBy: delivery.driverId
        }
      }
    });

    if (data.status === DeliveryStatus.DELIVERED || data.status === DeliveryStatus.FAILED) {
      await driverService.completeCurrentDelivery(delivery.driverId || '');
      await trackingService.stopTrackingDelivery(delivery._id?.toString() || '');
    }

    await this.invalidateDeliveryCache(delivery._id?.toString() || '');

    const updatedDelivery = await Delivery.findById(data.deliveryId).exec();
    if (!updatedDelivery) {
      throw new Error('Failed to retrieve updated delivery');
    }

    return updatedDelivery;
  }

  public async cancelDelivery(deliveryId: string, reason?: string): Promise<DeliveryDocument> {
    const delivery = await Delivery.findById(deliveryId).exec();

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if ([DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED].includes(delivery.status)) {
      throw new Error(`Cannot cancel delivery with status: ${delivery.status}`);
    }

    if (delivery.driverId) {
      await driverService.cancelCurrentDelivery(delivery.driverId);
    }

    await delivery.updateOne({
      status: DeliveryStatus.CANCELLED,
      $push: {
        events: {
          status: DeliveryStatus.CANCELLED,
          timestamp: new Date(),
          notes: reason || 'Delivery cancelled',
          updatedBy: 'system'
        }
      }
    });

    await this.invalidateDeliveryCache(deliveryId);
    await trackingService.stopTrackingDelivery(deliveryId);

    const updatedDelivery = await Delivery.findById(deliveryId).exec();
    if (!updatedDelivery) {
      throw new Error('Failed to retrieve updated delivery');
    }

    return updatedDelivery;
  }

  public async updateProofOfDelivery(
    deliveryId: string,
    proof: {
      signature?: string;
      photo?: string;
      recipientName?: string;
    }
  ): Promise<DeliveryDocument> {
    const delivery = await Delivery.findById(deliveryId).exec();

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    if (delivery.status !== DeliveryStatus.DELIVERED) {
      throw new Error('Proof of delivery can only be added after delivery is completed');
    }

    await delivery.updateOne({
      proofOfDelivery: {
        signature: proof.signature,
        photo: proof.photo,
        recipientName: proof.recipientName
      }
    });

    await this.invalidateDeliveryCache(deliveryId);

    const updatedDelivery = await Delivery.findById(deliveryId).exec();
    if (!updatedDelivery) {
      throw new Error('Failed to retrieve updated delivery');
    }

    return updatedDelivery;
  }

  public async getDeliveryStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    const stats = await Delivery.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).exec();

    const result = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    stats.forEach((s) => {
      const status = s._id as DeliveryStatus;
      result.total += s.count;

      switch (status) {
        case DeliveryStatus.PENDING:
        case DeliveryStatus.ASSIGNED:
          result.pending += s.count;
          break;
        case DeliveryStatus.PICKED_UP:
        case DeliveryStatus.IN_TRANSIT:
        case DeliveryStatus.OUT_FOR_DELIVERY:
          result.inProgress += s.count;
          break;
        case DeliveryStatus.DELIVERED:
          result.completed += s.count;
          break;
        case DeliveryStatus.FAILED:
          result.failed += s.count;
          break;
        case DeliveryStatus.CANCELLED:
          result.cancelled += s.count;
          break;
      }
    });

    return result;
  }

  private async cacheDelivery(delivery: DeliveryDocument): Promise<void> {
    const redis = redisClient.getClient();
    const key = `delivery:${delivery._id}`;
    await redis.set(key, JSON.stringify(delivery.toObject()), 'EX', 3600);
  }

  private async getCachedDelivery(deliveryId: string): Promise<DeliveryDocument | null> {
    try {
      const redis = redisClient.getClient();
      const cached = await redis.get(`delivery:${deliveryId}`);
      if (cached) {
        const data = JSON.parse(cached);
        return new Delivery(data);
      }
    } catch (error) {
      logger.error('Cache read error:', error);
    }
    return null;
  }

  private async invalidateDeliveryCache(deliveryId: string): Promise<void> {
    const redis = redisClient.getClient();
    await redis.del(`delivery:${deliveryId}`);
  }
}

export const deliveryService = DeliveryService.getInstance();
export default deliveryService;
