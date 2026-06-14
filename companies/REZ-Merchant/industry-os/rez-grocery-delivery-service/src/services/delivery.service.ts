import { DeliveryModel } from '../models/Delivery';
import { DriverModel } from '../models/Driver';
import { Delivery, Driver, DeliveryStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class DeliveryService {
  async createDelivery(data: {
    orderId: string;
    customerId: string;
    pickupAddress: string;
    deliveryAddress: string;
    items: { productId: string; name: string; quantity: number }[];
    scheduledTime: string;
  }): Promise<Delivery> {
    const delivery = new DeliveryModel({
      deliveryId: `DEL-${uuidv4().substring(0, 8).toUpperCase()}`,
      ...data,
      scheduledTime: new Date(data.scheduledTime),
      status: 'pending'
    });
    await delivery.save();
    return delivery.toJSON();
  }

  async getDeliveries(filters: { status?: DeliveryStatus; driverId?: string; page?: number; limit?: number }): Promise<{ deliveries: Delivery[]; total: number }> {
    const { status, driverId, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (driverId) query.driverId = driverId;

    const [deliveries, total] = await Promise.all([
      DeliveryModel.find(query).sort({ scheduledTime: 1 }).skip((page - 1) * limit).limit(limit),
      DeliveryModel.countDocuments(query)
    ]);

    return { deliveries: deliveries.map(d => d.toJSON()), total };
  }

  async assignDriver(deliveryId: string, driverId: string): Promise<Delivery | null> {
    const delivery = await DeliveryModel.findByIdAndUpdate(deliveryId, { $set: { driverId, status: 'assigned' } }, { new: true });
    return delivery?.toJSON() || null;
  }

  async updateStatus(deliveryId: string, status: DeliveryStatus): Promise<Delivery | null> {
    const updates: Record<string, unknown> = { status };
    if (status === 'picked_up') updates.pickedUpAt = new Date();
    if (status === 'delivered') updates.deliveredAt = new Date();
    const delivery = await DeliveryModel.findByIdAndUpdate(deliveryId, { $set: updates }, { new: true });
    return delivery?.toJSON() || null;
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    const drivers = await DriverModel.findAvailable();
    return drivers.map(d => d.toJSON());
  }

  async createDriver(data: Partial<Driver>): Promise<Driver> {
    const driver = new DriverModel(data);
    await driver.save();
    return driver.toJSON();
  }

  async updateDriverStatus(driverId: string, status: string): Promise<Driver | null> {
    const driver = await DriverModel.findByIdAndUpdate(driverId, { $set: { status } }, { new: true });
    return driver?.toJSON() || null;
  }
}

export const deliveryService = new DeliveryService();
