/**
 * Delivery Tracking Service
 *
 * Business logic for managing delivery tracking operations.
 * Handles delivery creation, driver assignment, status updates, and location tracking.
 */

import { Types } from 'mongoose';
import { Delivery, IDelivery, DeliveryStatus, DELIVERY_STATUS_VALUES } from '../models/DeliveryTracking';
import { logger } from '../config/logger';

/**
 * Input type for creating a delivery
 */
export interface DeliveryInput {
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  estimatedTime?: Date;
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Location update input
 */
export interface Location {
  lat: number;
  lng: number;
}

/**
 * Delivery Tracking Service
 * Provides methods for managing delivery lifecycle
 */
export class DeliveryTrackingService {
  /**
   * Create a new delivery tracking record for an order
   * @param orderId - The order ID to create delivery for
   * @param data - Optional delivery data
   * @returns The created delivery record
   */
  async createDelivery(orderId: string, data?: DeliveryInput): Promise<IDelivery> {
    const orderObjectId = new Types.ObjectId(orderId);

    // Check if delivery already exists for this order
    const existing = await Delivery.findOne({ orderId: orderObjectId });
    if (existing) {
      throw new Error(`Delivery already exists for order ${orderId}`);
    }

    const delivery = new Delivery({
      orderId: orderObjectId,
      driverId: data?.driverId,
      driverName: data?.driverName,
      driverPhone: data?.driverPhone,
      estimatedTime: data?.estimatedTime,
      location: data?.location,
      status: 'pending',
    });

    await delivery.save();
    logger.info(`Delivery created for order ${orderId}`);

    return delivery;
  }

  /**
   * Assign a driver to a delivery
   * @param deliveryId - The delivery ID
   * @param driverId - The driver ID
   * @param driverName - Optional driver name
   * @param driverPhone - Optional driver phone number
   * @returns The updated delivery record
   */
  async assignDriver(
    deliveryId: string,
    driverId: string,
    driverName?: string,
    driverPhone?: string,
  ): Promise<IDelivery> {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    if (delivery.status !== 'pending') {
      throw new Error(`Cannot assign driver to delivery in ${delivery.status} status`);
    }

    delivery.driverId = driverId;
    delivery.driverName = driverName;
    delivery.driverPhone = driverPhone;
    delivery.status = 'assigned';

    await delivery.save();
    logger.info(`Driver ${driverId} assigned to delivery ${deliveryId}`);

    return delivery;
  }

  /**
   * Update the status of a delivery
   * @param deliveryId - The delivery ID
   * @param status - The new status
   * @param location - Optional location update
   * @returns The updated delivery record
   */
  async updateStatus(
    deliveryId: string,
    status: string,
    location?: Location,
  ): Promise<IDelivery> {
    // Validate status
    if (!DELIVERY_STATUS_VALUES.includes(status as DeliveryStatus)) {
      throw new Error(`Invalid status: ${status}. Valid values: ${DELIVERY_STATUS_VALUES.join(', ')}`);
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    delivery.status = status as DeliveryStatus;

    // Set timestamps based on status
    if (status === 'picked_up') {
      delivery.pickupTime = new Date();
    } else if (status === 'delivered') {
      delivery.deliveryTime = new Date();
      delivery.actualTime = new Date();
    }

    // Update location if provided
    if (location) {
      delivery.location = {
        lat: location.lat,
        lng: location.lng,
      };
    }

    await delivery.save();
    logger.info(`Delivery ${deliveryId} status updated to ${status}`);

    return delivery;
  }

  /**
   * Get delivery by order ID
   * @param orderId - The order ID
   * @returns The delivery record or null if not found
   */
  async getDelivery(orderId: string): Promise<IDelivery | null> {
    const orderObjectId = new Types.ObjectId(orderId);
    return Delivery.findOne({ orderId: orderObjectId });
  }

  /**
   * Get all deliveries assigned to a driver
   * @param driverId - The driver ID
   * @returns Array of delivery records
   */
  async getDriverDeliveries(driverId: string): Promise<IDelivery[]> {
    return Delivery.find({ driverId }).sort({ createdAt: -1 });
  }

  /**
   * Update the location of a delivery
   * @param deliveryId - The delivery ID
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns The updated delivery record
   */
  async updateLocation(deliveryId: string, lat: number, lng: number): Promise<IDelivery> {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    delivery.location = { lat, lng };

    // Auto-update status to in_transit if currently assigned
    if (delivery.status === 'assigned') {
      delivery.status = 'in_transit';
    }

    await delivery.save();
    logger.info(`Delivery ${deliveryId} location updated to (${lat}, ${lng})`);

    return delivery;
  }

  /**
   * Complete a delivery with optional proof of delivery
   * @param deliveryId - The delivery ID
   * @param proof - Optional proof of delivery (e.g., signature, photo URL)
   * @returns The updated delivery record
   */
  async completeDelivery(deliveryId: string, proof?: string): Promise<IDelivery> {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    if (delivery.status === 'delivered' || delivery.status === 'cancelled') {
      throw new Error(`Cannot complete delivery already in ${delivery.status} status`);
    }

    delivery.status = 'delivered';
    delivery.actualTime = new Date();
    delivery.deliveryTime = new Date();

    if (proof) {
      delivery.proofOfDelivery = proof;
    }

    await delivery.save();
    logger.info(`Delivery ${deliveryId} completed`);

    return delivery;
  }

  /**
   * Cancel a delivery
   * @param deliveryId - The delivery ID
   * @returns The updated delivery record
   */
  async cancelDelivery(deliveryId: string): Promise<IDelivery> {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    if (delivery.status === 'delivered') {
      throw new Error('Cannot cancel a delivered order');
    }

    delivery.status = 'cancelled';
    await delivery.save();
    logger.info(`Delivery ${deliveryId} cancelled`);

    return delivery;
  }
}

// Singleton instance
let deliveryTrackingServiceInstance: DeliveryTrackingService | null = null;

/**
 * Get the singleton DeliveryTrackingService instance
 */
export function getDeliveryTrackingService(): DeliveryTrackingService {
  if (!deliveryTrackingServiceInstance) {
    deliveryTrackingServiceInstance = new DeliveryTrackingService();
  }
  return deliveryTrackingServiceInstance;
}

export default DeliveryTrackingService;
