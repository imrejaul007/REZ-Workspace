/**
 * Delivery Service - Event Connector
 *
 * Hook into delivery service to emit events
 */

import { eventConnector } from './eventConnectors';

export interface DeliveryConnector {
  /**
   * Hook: Delivery started
   */
  onDeliveryStarted(delivery: {
    deliveryId: string;
    orderId: string;
    userId: string;
    driverId: string;
    pickupAddress: string;
    deliveryAddress: string;
  }): void;

  /**
   * Hook: Driver assigned
   */
  onDriverAssigned(delivery: {
    deliveryId: string;
    orderId: string;
    driverId: string;
    driverName: string;
    estimatedPickupTime: string;
  }): void;

  /**
   * Hook: Location updated
   */
  onLocationUpdated(delivery: {
    deliveryId: string;
    driverId: string;
    latitude: number;
    longitude: number;
    timestamp: string;
  }): void;

  /**
   * Hook: ETA updated
   */
  onETAUpdated(delivery: {
    deliveryId: string;
    estimatedDeliveryTime: string;
    distanceRemaining: number;
  }): void;

  /**
   * Hook: Delivery in progress
   */
  onDeliveryInProgress(delivery: {
    deliveryId: string;
    orderId: string;
    status: string;
    location: { lat: number; lng: number };
  }): void;

  /**
   * Hook: Delivery completed
   */
  onDeliveryCompleted(delivery: {
    deliveryId: string;
    orderId: string;
    userId: string;
    completedAt: string;
    deliveryTime: number;
  }): void;

  /**
   * Hook: Delivery failed
   */
  onDeliveryFailed(delivery: {
    deliveryId: string;
    orderId: string;
    reason: string;
    failedAt: string;
  }): void;

  /**
   * Hook: Delivery cancelled
   */
  onDeliveryCancelled(delivery: {
    deliveryId: string;
    orderId: string;
    reason: string;
    cancelledBy: 'user' | 'driver' | 'merchant' | 'system';
    cancelledAt: string;
  }): void;

  /**
   * Hook: Delivery returned
   */
  onDeliveryReturned(delivery: {
    deliveryId: string;
    orderId: string;
    reason: string;
    returnedAt: string;
  }): void;
}

export function createDeliveryConnector(): DeliveryConnector {
  return {
    onDeliveryStarted: (delivery) => {
      eventConnector.emit('delivery.started', {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        driverId: delivery.driverId,
        pickupAddress: delivery.pickupAddress,
        deliveryAddress: delivery.deliveryAddress,
        startedAt: new Date().toISOString()
      }, {
        userId: delivery.userId,
        correlationId: delivery.deliveryId
      });
    },

    onDriverAssigned: (delivery) => {
      eventConnector.emit('delivery.driver_assigned', {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        driverId: delivery.driverId,
        driverName: delivery.driverName,
        estimatedPickupTime: delivery.estimatedPickupTime,
        assignedAt: new Date().toISOString()
      }, {
        correlationId: delivery.deliveryId
      });
    },

    onLocationUpdated: (delivery) => {
      eventConnector.emit('delivery.location_updated', {
        deliveryId: delivery.deliveryId,
        driverId: delivery.driverId,
        latitude: delivery.latitude,
        longitude: delivery.longitude,
        timestamp: delivery.timestamp
      }, {
        correlationId: delivery.deliveryId
      });
    },

    onETAUpdated: (delivery) => {
      eventConnector.emit('delivery.eta_updated', {
        deliveryId: delivery.deliveryId,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime,
        distanceRemaining: delivery.distanceRemaining,
        updatedAt: new Date().toISOString()
      }, {
        correlationId: delivery.deliveryId
      });
    },

    onDeliveryInProgress: (delivery) => {
      eventConnector.emit('delivery.in_progress', {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        status: delivery.status,
        location: delivery.location,
        updatedAt: new Date().toISOString()
      }, {
        correlationId: delivery.deliveryId
      });
    },

    onDeliveryCompleted: (delivery) => {
      eventConnector.emit('delivery.completed', {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        completedAt: delivery.completedAt,
        deliveryTimeMinutes: delivery.deliveryTime,
        completedAtTimestamp: new Date().toISOString()
      }, {
        userId: delivery.userId,
        correlationId: delivery.deliveryId
      });
    },

    onDeliveryFailed: (delivery) => {
      eventConnector.emit('delivery.failed', {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        reason: delivery.reason,
        failedAt: delivery.failedAt
      }, {
        correlationId: delivery.deliveryId
      });
    },

    onDeliveryCancelled: (delivery) => {
      eventConnector.emit('delivery.cancelled', {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        reason: delivery.reason,
        cancelledBy: delivery.cancelledBy,
        cancelledAt: delivery.cancelledAt
      }, {
        correlationId: delivery.deliveryId
      });
    },

    onDeliveryReturned: (delivery) => {
      eventConnector.emit('delivery.returned', {
        deliveryId: delivery.deliveryId,
        orderId: delivery.orderId,
        reason: delivery.reason,
        returnedAt: delivery.returnedAt
      }, {
        correlationId: delivery.deliveryId
      });
    }
  };
}

export const deliveryConnector = createDeliveryConnector();
export default deliveryConnector;
