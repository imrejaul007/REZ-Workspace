import Redis from 'ioredis';
import { config } from '../config';
import {
  DeliveryOrder,
  IDeliveryOrder,
  OrderStatus,
  OrderType,
} from '../models/DeliveryOrder';
import { Tracking, TrackingEventType } from '../models/Tracking';
import { v4 as uuidv4 } from 'uuid';

// Simple UUID generator without external dependency
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class OrderService {
  private redis: Redis;
  private surgeOrderCountKey = 'food_delivery:surge:order_count';
  private surgeWindowKey = 'food_delivery:surge:window';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async createOrder(orderData: {
    customerId: string;
    restaurantId: string;
    orderType: OrderType;
    items: { itemId: string; name: string; quantity: number; price: number; notes?: string }[];
    customerPhone: string;
    restaurantAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      coordinates: { lat: number; lng: number };
    };
    deliveryAddress?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      coordinates: { lat: number; lng: number };
    };
    pickupTime?: Date;
  }): Promise<{ order: IDeliveryOrder; estimatedDeliveryTime?: Date; deliveryFee: number; surgeFee: number }> {
    const session = await DeliveryOrder.startSession();
    session.startTransaction();

    try {
      // Calculate subtotal
      const subtotal = orderData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Calculate delivery fee and surge pricing
      let deliveryFee = 0;
      let surgeFee = 0;
      let zoneId: string | undefined;
      let estimatedDeliveryTime: Date | undefined;

      if (orderData.orderType === OrderType.DELIVERY && orderData.deliveryAddress) {
        const { zone, fee } = await this.calculateDeliveryFee(
          orderData.restaurantAddress.coordinates,
          orderData.deliveryAddress.coordinates
        );
        deliveryFee = fee;
        zoneId = zone?.zoneId;

        // Check for rush hour surge
        const rushMultiplier = this.getRushHourMultiplier();
        surgeFee = Math.round(deliveryFee * (rushMultiplier - 1));

        // Check for demand surge
        const demandSurgeMultiplier = await this.getDemandSurgeMultiplier();
        surgeFee = Math.round(surgeFee * demandSurgeMultiplier);

        // Apply free delivery threshold
        if (zone && subtotal >= zone.freeThreshold) {
          deliveryFee = 0;
          surgeFee = 0;
        }

        // Estimate delivery time based on zone
        estimatedDeliveryTime = this.calculateEstimatedDeliveryTime(
          orderData.restaurantAddress.coordinates,
          orderData.deliveryAddress.coordinates,
          zone ?? undefined
        );
      } else {
        // Takeaway - no delivery fee
        estimatedDeliveryTime = orderData.pickupTime || new Date(Date.now() + 30 * 60 * 1000);
      }

      // Generate OTP for delivery orders
      const otp = orderData.orderType === OrderType.DELIVERY
        ? this.generateOTP()
        : undefined;

      // Create order
      const order = new DeliveryOrder({
        orderId: generateId('FDO'),
        customerId: orderData.customerId,
        restaurantId: orderData.restaurantId,
        orderType: orderData.orderType,
        status: OrderStatus.PENDING,
        items: orderData.items,
        subtotal,
        deliveryFee,
        surgeFee,
        totalAmount: subtotal + deliveryFee + surgeFee,
        deliveryAddress: orderData.deliveryAddress,
        pickupTime: orderData.pickupTime,
        estimatedDeliveryTime,
        customerPhone: orderData.customerPhone,
        restaurantAddress: orderData.restaurantAddress,
        zoneId,
        otp,
        otpVerified: false,
        statusHistory: [
          {
            status: OrderStatus.PENDING,
            timestamp: new Date(),
            note: 'Order created',
          },
        ],
      });

      await order.save({ session });

      // Create tracking record
      const tracking = new Tracking({
        trackingId: generateId('TRK'),
        orderId: order.orderId,
        events: [
          {
            type: TrackingEventType.ORDER_CREATED,
            timestamp: new Date(),
            note: 'Order placed successfully',
          },
        ],
      });
      await tracking.save({ session });

      // Increment surge order count
      await this.redis.incr(this.surgeOrderCountKey);
      await this.redis.expire(this.surgeOrderCountKey, 60); // 1-minute window

      await session.commitTransaction();

      return {
        order,
        estimatedDeliveryTime,
        deliveryFee,
        surgeFee,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getOrder(orderId: string): Promise<IDeliveryOrder | null> {
    return DeliveryOrder.findOne({ orderId });
  }

  async getOrdersByCustomer(customerId: string, limit = 20): Promise<IDeliveryOrder[]> {
    return DeliveryOrder.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getOrdersByRestaurant(restaurantId: string, limit = 50): Promise<IDeliveryOrder[]> {
    return DeliveryOrder.find({ restaurantId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getOrdersByStatus(status: OrderStatus, limit = 50): Promise<IDeliveryOrder[]> {
    return DeliveryOrder.find({ status })
      .sort({ createdAt: 1 })
      .limit(limit);
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string
  ): Promise<IDeliveryOrder | null> {
    const order = await DeliveryOrder.findOne({ orderId });
    if (!order) return null;

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
      [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
      [OrderStatus.ASSIGNED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
      [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.ARRIVED, OrderStatus.DELIVERED],
      [OrderStatus.ARRIVED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[order.status]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
    }

    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note,
    });

    if (newStatus === OrderStatus.DELIVERED) {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    // Update tracking
    await Tracking.updateOne(
      { orderId },
      {
        $push: {
          events: {
            type: this.mapStatusToTrackingEvent(newStatus),
            timestamp: new Date(),
            note,
          },
        },
      }
    );

    return order;
  }

  async assignDriver(orderId: string, driverId: string): Promise<IDeliveryOrder | null> {
    const order = await DeliveryOrder.findOneAndUpdate(
      { orderId, status: OrderStatus.READY_FOR_PICKUP },
      {
        $set: {
          deliveryPersonId: driverId,
          status: OrderStatus.ASSIGNED,
        },
        $push: {
          statusHistory: {
            status: OrderStatus.ASSIGNED,
            timestamp: new Date(),
            note: `Driver ${driverId} assigned`,
          },
        },
      },
      { new: true }
    );

    if (order) {
      await Tracking.updateOne(
        { orderId },
        {
          $set: { driverId },
          $push: {
            events: {
              type: TrackingEventType.DRIVER_ASSIGNED,
              timestamp: new Date(),
              note: `Driver ${driverId} assigned to order`,
            },
          },
        }
      );
    }

    return order;
  }

  async verifyOTP(orderId: string, otp: string): Promise<boolean> {
    const order = await DeliveryOrder.findOne({ orderId });
    if (!order || order.otp !== otp) {
      return false;
    }

    order.otpVerified = true;
    await order.save();
    return true;
  }

  async cancelOrder(orderId: string, reason: string): Promise<IDeliveryOrder | null> {
    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED, reason);
  }

  private async calculateDeliveryFee(
    restaurantCoords: { lat: number; lng: number },
    deliveryCoords: { lat: number; lng: number }
  ): Promise<{ zone: typeof config.deliveryZones[0] | null; fee: number }> {
    const distance = this.calculateDistance(restaurantCoords, deliveryCoords);

    // Find applicable zone
    const zone = config.deliveryZones.find((z) => distance <= z.radiusKm);
    if (!zone) {
      // Outside all zones - apply max zone fee + per km charge
      const maxZone = config.deliveryZones[config.deliveryZones.length - 1];
      const extraKm = distance - maxZone.radiusKm;
      return {
        zone: maxZone,
        fee: maxZone.baseFee + extraKm * 10,
      };
    }

    return { zone, fee: zone.baseFee };
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

  private getRushHourMultiplier(): number {
    const hour = new Date().getHours();
    for (const rush of [config.rushHours.lunch, config.rushHours.dinner]) {
      if (hour >= rush.start && hour < rush.end) {
        return rush.multiplier;
      }
    }
    return 1.0;
  }

  private async getDemandSurgeMultiplier(): Promise<number> {
    const orderCount = await this.redis.get(this.surgeOrderCountKey);
    const count = parseInt(orderCount || '0', 10);
    if (count > config.surgeThreshold) {
      return config.surgeMultiplier;
    }
    return 1.0;
  }

  private calculateEstimatedDeliveryTime(
    restaurantCoords: { lat: number; lng: number },
    deliveryCoords: { lat: number; lng: number },
    zone?: typeof config.deliveryZones[0]
  ): Date {
    const distance = this.calculateDistance(restaurantCoords, deliveryCoords);
    const avgSpeedKmh = 25; // Average delivery speed in city
    const prepTimeMinutes = 15; // Average food prep time
    const travelTimeMinutes = Math.round((distance / avgSpeedKmh) * 60);

    const totalMinutes = prepTimeMinutes + travelTimeMinutes;
    return new Date(Date.now() + totalMinutes * 60 * 1000);
  }

  private generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < config.otpLength; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  private mapStatusToTrackingEvent(status: OrderStatus): TrackingEventType {
    const mapping: Record<OrderStatus, TrackingEventType> = {
      [OrderStatus.PENDING]: TrackingEventType.ORDER_CREATED,
      [OrderStatus.CONFIRMED]: TrackingEventType.ORDER_CONFIRMED,
      [OrderStatus.PREPARING]: TrackingEventType.ORDER_PREPARING,
      [OrderStatus.READY_FOR_PICKUP]: TrackingEventType.ORDER_READY,
      [OrderStatus.ASSIGNED]: TrackingEventType.DRIVER_ASSIGNED,
      [OrderStatus.PICKED_UP]: TrackingEventType.ORDER_PICKED_UP,
      [OrderStatus.IN_TRANSIT]: TrackingEventType.ORDER_IN_TRANSIT,
      [OrderStatus.ARRIVED]: TrackingEventType.DRIVER_ARRIVED_DROPOFF,
      [OrderStatus.DELIVERED]: TrackingEventType.DELIVERY_COMPLETED,
      [OrderStatus.CANCELLED]: TrackingEventType.DELIVERY_CANCELLED,
    };
    return mapping[status];
  }
}
