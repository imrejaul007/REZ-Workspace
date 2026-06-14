import Rider, { IRider } from '../models/Rider';
import DeliveryOrder, { IDeliveryOrder } from '../models/DeliveryOrder';
import routingService from './routingService';
import trackingService from './trackingService';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

interface RiderAssignment {
  rider: IRider;
  eta: number;
  distance: number;
}

interface AssignmentResult {
  orderId: string;
  riderId: string;
  eta: number;
  distance: number;
}

class AssignmentService {
  // Default search radius in km
  private DEFAULT_RADIUS_KM = 5;
  // Maximum orders a rider can have simultaneously
  private MAX_ACTIVE_ORDERS = 3;

  /**
   * Find available riders near a location, sorted by suitability
   */
  async findAvailableRider(
    lat: number,
    lng: number,
    orderId?: string
  ): Promise<RiderAssignment[]> {
    try {
      // Find riders within radius
      const riders = await Rider.find({
        status: 'available',
        currentLocation: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: this.DEFAULT_RADIUS_KM * 1000
          }
        }
      }).limit(10);

      if (riders.length === 0) {
        logger.warn('No available riders found nearby', { lat, lng });
        return [];
      }

      // Get order details if provided
      let orderLocation: { lat: number; lng: number } | null = null;
      if (orderId) {
        const order = await DeliveryOrder.findOne({ orderId });
        if (order?.customer?.address?.coordinates) {
          orderLocation = {
            lat: order.customer.address.coordinates.lat,
            lng: order.customer.address.coordinates.lng
          };
        }
      }

      // Calculate ETA and distance for each rider
      const assignments: RiderAssignment[] = [];

      for (const rider of riders) {
        if (!rider.currentLocation?.coordinates) continue;

        const riderLocation = {
          lat: rider.currentLocation.coordinates[1],
          lng: rider.currentLocation.coordinates[0]
        };

        // Get active orders count for this rider
        const activeOrders = await DeliveryOrder.countDocuments({
          riderId: rider._id,
          status: { $in: ['picked_up', 'ready'] }
        });

        if (activeOrders >= this.MAX_ACTIVE_ORDERS) {
          continue;
        }

        // Calculate ETA
        let eta: number;
        let distance: number;

        if (orderLocation) {
          const route = await routingService.calculateDistance(
            riderLocation,
            orderLocation
          );
          eta = route.duration; // in seconds
          distance = route.distance; // in meters
        } else {
          // Estimate based on straight-line distance
          const straightLineDistance = this.calculateHaversineDistance(
            riderLocation.lat,
            riderLocation.lng,
            lat,
            lng
          );
          eta = (straightLineDistance / 30) * 3600; // Assume 30 km/h average speed
          distance = straightLineDistance * 1000; // Convert to meters
        }

        // Score rider based on multiple factors
        const score = this.scoreRider(rider, eta, distance);

        assignments.push({
          rider,
          eta,
          distance,
          score
        } as unknown);

        // Add rider location to destinations for route optimization later
        routingService.addDestination({
          id: rider._id.toString(),
          lat: riderLocation.lat,
          lng: riderLocation.lng,
          type: 'rider'
        });
      }

      // Sort by score (lower is better)
      assignments.sort((a, b) => (a as unknown).score - (b as unknown).score);

      // Remove score from final result
      return assignments.map(({ rider, eta, distance }) => ({ rider, eta, distance }));

    } catch (error) {
      logger.error('Failed to find available riders', { lat, lng, error: error.message });
      throw error;
    }
  }

  /**
   * Score a rider based on multiple factors
   */
  private scoreRider(rider: IRider, eta: number, distance: number): number {
    // Weights for scoring factors
    const ETA_WEIGHT = 0.4;
    const RATING_WEIGHT = 0.3;
    const DISTANCE_WEIGHT = 0.2;
    const DELIVERIES_WEIGHT = 0.1;

    // Normalize factors (lower is better for ETA and distance)
    const normalizedEta = eta / 1800; // 30 mins = 1
    const normalizedDistance = distance / 5000; // 5 km = 1
    const normalizedRating = (5 - rider.rating) / 5; // Invert (lower rating = lower score)
    const normalizedDeliveries = Math.min(rider.totalDeliveries / 100, 1); // Cap at 100 deliveries

    return (
      ETA_WEIGHT * normalizedEta +
      RATING_WEIGHT * normalizedRating +
      DISTANCE_WEIGHT * normalizedDistance -
      DELIVERIES_WEIGHT * normalizedDeliveries
    );
  }

  /**
   * Calculate ETA for a delivery
   */
  async calculateETA(
    riderLat: number,
    riderLng: number,
    destinationLat: number,
    destinationLng: number
  ): Promise<{ eta: number; distance: number; route?: unknown }> {
    return routingService.calculateDistance(
      { lat: riderLat, lng: riderLng },
      { lat: destinationLat, lng: destinationLng }
    );
  }

  /**
   * Assign a rider to an order
   */
  async assignRider(orderId: string, riderId: string): Promise<AssignmentResult> {
    try {
      // Get order
      const order = await DeliveryOrder.findOne({ orderId });
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== 'ready') {
        throw new AppError('Order is not ready for assignment', 400);
      }

      if (order.riderId) {
        throw new AppError('Order already has a rider assigned', 400);
      }

      // Get rider
      const rider = await Rider.findById(riderId);
      if (!rider) {
        throw new AppError('Rider not found', 404);
      }

      if (rider.status !== 'available') {
        throw new AppError('Rider is not available', 400);
      }

      // Get delivery location
      const deliveryLocation = order.customer.address.coordinates
        ? {
            lat: order.customer.address.coordinates.lat,
            lng: order.customer.address.coordinates.lng
          }
        : null;

      let eta = 1800; // Default 30 mins
      let distance = 0;

      if (deliveryLocation && rider.currentLocation?.coordinates) {
        const routeInfo = await this.calculateETA(
          rider.currentLocation.coordinates[1],
          rider.currentLocation.coordinates[0],
          deliveryLocation.lat,
          deliveryLocation.lng
        );
        eta = routeInfo.eta;
        distance = routeInfo.distance;
      }

      // Update order
      order.riderId = rider._id;
      order.status = 'picked_up';
      order.statusHistory.push({
        status: 'picked_up',
        timestamp: new Date(),
        note: `Assigned to rider: ${rider.name}`
      });
      if (deliveryLocation) {
        order.estimatedDelivery = new Date(Date.now() + eta * 1000);
      }
      await order.save();

      // Update rider status
      rider.status = 'busy';
      await rider.save();

      logger.info(`Rider ${riderId} assigned to order ${orderId}`);

      // Emit tracking event
      trackingService.emitTrackingEvent(orderId, 'rider_assigned', {
        riderId: rider._id.toString(),
        riderName: rider.name,
        eta
      });

      return {
        orderId,
        riderId,
        eta,
        distance
      };
    } catch (error) {
      logger.error('Failed to assign rider', { orderId, riderId, error: error.message });
      throw error;
    }
  }

  /**
   * Reassign a rider to a different order or unassign
   */
  async reassignRider(
    orderId: string,
    newRiderId?: string,
    reason?: string
  ): Promise<AssignmentResult | null> {
    try {
      const order = await DeliveryOrder.findOne({ orderId });
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Unassign current rider
      if (order.riderId) {
        const currentRider = await Rider.findById(order.riderId);
        if (currentRider) {
          // Check if rider has other active orders
          const otherActiveOrders = await DeliveryOrder.countDocuments({
            riderId: currentRider._id,
            orderId: { $ne: orderId },
            status: { $in: ['picked_up', 'ready'] }
          });

          if (otherActiveOrders === 0) {
            currentRider.status = 'available';
            await currentRider.save();
          }
        }
      }

      // If no new rider specified, just unassign
      if (!newRiderId) {
        order.riderId = undefined;
        order.status = 'ready';
        order.statusHistory.push({
          status: 'ready',
          timestamp: new Date(),
          note: reason || 'Rider unassigned'
        });
        await order.save();

        // Auto-assign another rider
        const newAssignment = await assignmentService.autoAssignRider(order);
        return newAssignment;
      }

      // Assign to new rider
      return this.assignRider(orderId, newRiderId);
    } catch (error) {
      logger.error('Failed to reassign rider', { orderId, newRiderId, error: error.message });
      throw error;
    }
  }

  /**
   * Auto-assign a rider to an order (for ready orders)
   */
  async autoAssignRider(order: IDeliveryOrder): Promise<AssignmentResult | null> {
    try {
      if (order.status !== 'ready' || order.riderId) {
        return null;
      }

      const deliveryLocation = order.customer.address.coordinates;
      if (!deliveryLocation) {
        logger.warn('Cannot auto-assign: missing delivery coordinates', { orderId: order.orderId });
        return null;
      }

      const availableRiders = await this.findAvailableRider(
        deliveryLocation.lat,
        deliveryLocation.lng,
        order.orderId
      );

      if (availableRiders.length === 0) {
        logger.warn('No available riders for auto-assignment', { orderId: order.orderId });
        return null;
      }

      // Assign to best rider
      const bestRider = availableRiders[0];
      return this.assignRider(order.orderId, bestRider.rider._id.toString());
    } catch (error) {
      logger.error('Auto-assignment failed', { orderId: order.orderId, error: error.message });
      return null;
    }
  }

  /**
   * Complete delivery and update metrics
   */
  async completeDelivery(orderId: string): Promise<void> {
    try {
      const order = await DeliveryOrder.findOne({ orderId });
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (!order.riderId) {
        throw new AppError('No rider assigned to this order', 400);
      }

      const rider = await Rider.findById(order.riderId);
      if (!rider) {
        throw new AppError('Rider not found', 404);
      }

      // Calculate delivery time
      const deliveryTimeMinutes = order.actualDelivery && order.createdAt
        ? (order.actualDelivery.getTime() - order.createdAt.getTime()) / (1000 * 60)
        : 30;

      const wasOnTime = order.actualDelivery
        ? order.actualDelivery <= order.estimatedDelivery
        : true;

      // Update rider metrics
      await rider.completeDelivery(deliveryTimeMinutes, wasOnTime);

      // Update rider status if no more active orders
      const otherActiveOrders = await DeliveryOrder.countDocuments({
        riderId: rider._id,
        orderId: { $ne: orderId },
        status: { $in: ['picked_up'] }
      });

      if (otherActiveOrders === 0) {
        rider.status = 'available';
        await rider.save();
      }

      logger.info(`Delivery completed: ${orderId}`, {
        riderId: rider._id,
        deliveryTime: deliveryTimeMinutes,
        onTime: wasOnTime
      });
    } catch (error) {
      logger.error('Failed to complete delivery', { orderId, error: error.message });
      throw error;
    }
  }

  /**
   * Calculate distance using Haversine formula
   */
  private calculateHaversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(): Promise<{
    totalAssignments: number;
    averageEta: number;
    reassignmentRate: number;
    unassignedOrders: number;
  }> {
    const [
      totalAssignments,
      readyOrders,
      totalOrders
    ] = await Promise.all([
      DeliveryOrder.countDocuments({ riderId: { $exists: true } }),
      DeliveryOrder.countDocuments({ status: 'ready', riderId: { $exists: false } }),
      DeliveryOrder.countDocuments()
    ]);

    return {
      totalAssignments,
      averageEta: 1800, // Would calculate from actual ETAs
      reassignmentRate: 0.05, // Would calculate from reassignment events
      unassignedOrders: readyOrders
    };
  }
}

export default new AssignmentService();
