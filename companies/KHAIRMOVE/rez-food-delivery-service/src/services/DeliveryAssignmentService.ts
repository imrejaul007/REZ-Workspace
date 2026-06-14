import Redis from 'ioredis';
import { config } from '../config';
import { DeliveryOrder, OrderStatus, OrderType } from '../models/DeliveryOrder';
import { DeliveryPerson, DriverStatus, IDeliveryPerson } from '../models/DeliveryPerson';
import { Tracking, TrackingEventType } from '../models/Tracking';
import { OrderService } from './OrderService';
import { RoutingService } from './RoutingService';

export interface AssignmentResult {
  success: boolean;
  driverId?: string;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  error?: string;
}

export interface DriverMetrics {
  currentLocation?: { lat: number; lng: number };
  driverId: string;
  name: string;
  distance: number;
  currentDeliveries: number;
  rating: number;
  score: number;
}

export class DeliveryAssignmentService {
  private redis: Redis;
  private orderService: OrderService;
  private routingService: RoutingService;
  private assignmentQueueKey = 'food_delivery:assignment:queue';

  constructor(redis: Redis, orderService: OrderService, routingService: RoutingService) {
    this.redis = redis;
    this.orderService = orderService;
    this.routingService = routingService;
  }

  async assignDriverToOrder(orderId: string): Promise<AssignmentResult> {
    const order = await DeliveryOrder.findOne({ orderId });
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.orderType !== OrderType.DELIVERY) {
      return { success: false, error: 'Order is not a delivery order' };
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      return { success: false, error: 'Order is not ready for pickup' };
    }

    // Find best driver
    const bestDriver = await this.findBestDriver(order);
    if (!bestDriver) {
      return { success: false, error: 'No available drivers found' };
    }

    // Calculate times
    const pickupTime = await this.routingService.calculateETA(
      bestDriver.currentLocation!,
      order.restaurantAddress.coordinates
    );
    const deliveryTime = await this.routingService.calculateETA(
      order.restaurantAddress.coordinates,
      order.deliveryAddress!.coordinates
    );

    const estimatedPickupTime = new Date(Date.now() + pickupTime * 1000);
    const estimatedDeliveryTime = new Date(estimatedPickupTime.getTime() + deliveryTime * 1000);

    // Assign driver
    const updatedOrder = await this.orderService.assignDriver(orderId, bestDriver.driverId);
    if (!updatedOrder) {
      return { success: false, error: 'Failed to assign driver' };
    }

    // Update driver status
    await DeliveryPerson.updateOne(
      { driverId: bestDriver.driverId },
      {
        $set: { status: DriverStatus.BUSY },
        $inc: { todayDeliveries: 1 },
      }
    );

    // Update tracking
    await Tracking.updateOne(
      { orderId },
      {
        $set: {
          estimatedArrival: estimatedDeliveryTime,
        },
        $push: {
          events: {
            type: TrackingEventType.DRIVER_EN_ROUTE_PICKUP,
            timestamp: new Date(),
            note: `Driver ${bestDriver.name} en route to pickup`,
          },
        },
      }
    );

    return {
      success: true,
      driverId: bestDriver.driverId,
      estimatedPickupTime,
      estimatedDeliveryTime,
    };
  }

  async findBestDriver(order: typeof DeliveryOrder.prototype): Promise<DriverMetrics | null> {
    if (!order.deliveryAddress) return null;

    // Find available drivers in relevant zones
    const drivers = await DeliveryPerson.find({
      status: DriverStatus.AVAILABLE,
      isActive: true,
      zones: order.zoneId || { $exists: true },
    });

    if (drivers.length === 0) {
      // Fallback: find any available driver
      const anyDrivers = await DeliveryPerson.find({
        status: DriverStatus.AVAILABLE,
        isActive: true,
      });
      if (anyDrivers.length === 0) return null;
      return this.scoreDriver(anyDrivers[0], order, await this.getDriverMetrics(anyDrivers[0], order));
    }

    // Score each driver
    const scoredDrivers: DriverMetrics[] = [];
    for (const driver of drivers) {
      if (!driver.currentLocation) continue;
      const metrics = await this.getDriverMetrics(driver, order);
      const score = this.calculateDriverScore(driver, metrics, order);
      scoredDrivers.push({
        driverId: driver.driverId,
        name: driver.name,
        distance: metrics.distance,
        currentDeliveries: metrics.currentDeliveries,
        rating: driver.rating,
        score,
      });
    }

    // Sort by score (higher is better)
    scoredDrivers.sort((a, b) => b.score - a.score);

    const bestDriverData = scoredDrivers[0];
    const bestDriver = await DeliveryPerson.findOne({ driverId: bestDriverData.driverId });

    return bestDriverData;
  }

  private async getDriverMetrics(
    driver: IDeliveryPerson,
    order: typeof DeliveryOrder.prototype
  ): Promise<{ distance: number; currentDeliveries: number }> {
    let distance = 999; // Default high distance
    if (driver.currentLocation && order.restaurantAddress) {
      distance = this.calculateDistance(
        driver.currentLocation,
        order.restaurantAddress.coordinates
      );
    }

    const currentDeliveries = await DeliveryOrder.countDocuments({
      deliveryPersonId: driver.driverId,
      status: {
        $in: [
          OrderStatus.ASSIGNED,
          OrderStatus.PICKED_UP,
          OrderStatus.IN_TRANSIT,
          OrderStatus.ARRIVED,
        ],
      },
    });

    return { distance, currentDeliveries };
  }

  private calculateDriverScore(
    driver: IDeliveryPerson,
    metrics: { distance: number; currentDeliveries: number },
    order: typeof DeliveryOrder.prototype
  ): number {
    // Weights for scoring factors
    const WEIGHT_DISTANCE = 0.5;
    const WEIGHT_WORKLOAD = 0.3;
    const WEIGHT_RATING = 0.2;

    // Distance score (closer is better) - normalize to 0-100
    const maxAcceptableDistance = 10; // km
    const distanceScore = Math.max(0, 100 - (metrics.distance / maxAcceptableDistance) * 100);

    // Workload score (less busy is better) - normalize to 0-100
    const maxDeliveries = 5;
    const workloadScore = Math.max(0, 100 - (metrics.currentDeliveries / maxDeliveries) * 100);

    // Rating score - already 0-5, normalize to 0-100
    const ratingScore = (driver.rating / 5) * 100;

    return (
      distanceScore * WEIGHT_DISTANCE +
      workloadScore * WEIGHT_WORKLOAD +
      ratingScore * WEIGHT_RATING
    );
  }


  private scoreDriver(
    driver: IDeliveryPerson,
    order: typeof DeliveryOrder.prototype,
    metrics: { distance: number; currentDeliveries: number }
  ): DriverMetrics {
    const score = this.calculateDriverScore(driver, metrics, order);
    return {
      driverId: driver.driverId,
      name: driver.name,
      distance: metrics.distance,
      currentDeliveries: metrics.currentDeliveries,
      rating: driver.rating,
      score,
      currentLocation: driver.currentLocation,
    };
  }

  async autoAssignAvailableOrders(): Promise<number> {
    const orders = await DeliveryOrder.find({
      status: OrderStatus.READY_FOR_PICKUP,
      orderType: OrderType.DELIVERY,
      deliveryPersonId: null,
    }).sort({ createdAt: 1 });

    let assigned = 0;
    for (const order of orders) {
      const result = await this.assignDriverToOrder(order.orderId);
      if (result.success) {
        assigned++;
      }
    }
    return assigned;
  }

  async reassignDriver(orderId: string, reason: string): Promise<AssignmentResult> {
    const order = await DeliveryOrder.findOne({ orderId });
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Mark current driver as available again
    if (order.deliveryPersonId) {
      await DeliveryPerson.updateOne(
        { driverId: order.deliveryPersonId },
        { $set: { status: DriverStatus.AVAILABLE } }
      );
    }

    // Find new driver
    return this.assignDriverToOrder(orderId);
  }

  async completeDelivery(
    orderId: string,
    otp: string
  ): Promise<{ success: boolean; error?: string }> {
    const order = await DeliveryOrder.findOne({ orderId });
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (!order.otpVerified && otp !== order.otp) {
      return { success: false, error: 'Invalid OTP' };
    }

    // Calculate driver earnings
    const earnings = await this.calculateDriverEarnings(order);

    // Update order status
    await this.orderService.updateOrderStatus(orderId, OrderStatus.DELIVERED, 'Delivery completed');

    // Update driver stats
    if (order.deliveryPersonId) {
      await DeliveryPerson.updateOne(
        { driverId: order.deliveryPersonId },
        {
          $set: { status: DriverStatus.AVAILABLE },
          $inc: {
            totalDeliveries: 1,
            todayDeliveries: 1,
            totalEarnings: earnings,
            todayEarnings: earnings,
          },
        }
      );

      // Check for incentive bonus
      const driver = await DeliveryPerson.findOne({ driverId: order.deliveryPersonId });
      if (driver && driver.todayDeliveries > 0 && driver.todayDeliveries % 5 === 0) {
        await DeliveryPerson.updateOne(
          { driverId: order.deliveryPersonId },
          { $inc: { todayEarnings: config.driverEarnings.incentiveBonus } }
        );
      }
    }

    // Update tracking
    await Tracking.updateOne(
      { orderId },
      {
        $push: {
          events: {
            type: TrackingEventType.DELIVERY_COMPLETED,
            timestamp: new Date(),
            note: 'Order delivered successfully',
          },
        },
      }
    );

    return { success: true };
  }

  private async calculateDriverEarnings(order: typeof DeliveryOrder.prototype): Promise<number> {
    if (!order.deliveryAddress) return 0;

    const distance = this.calculateDistance(
      order.restaurantAddress.coordinates,
      order.deliveryAddress.coordinates
    );

    const baseEarnings = config.driverEarnings.baseFee;
    const distanceEarnings = Math.round(distance * config.driverEarnings.basePerKm);

    return baseEarnings + distanceEarnings;
  }

  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371;
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
