import { VehicleModel } from '../models/Vehicle';
import { ServiceModel } from '../models/Service';
import { Vehicle, Service } from '../types';

export class AutomotiveService {
  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = new VehicleModel(data);
    await vehicle.save();
    return vehicle.toJSON();
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    const vehicle = await VehicleModel.findById(id);
    return vehicle?.toJSON() || null;
  }

  async getVehicles(filters: {
    customerId?: string;
    make?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ vehicles: Vehicle[]; total: number }> {
    const { customerId, make, type, status, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (customerId) query.customerId = customerId;
    if (make) query.make = make;
    if (type) query.type = type;
    if (status) query.status = status;

    const [vehicles, total] = await Promise.all([
      VehicleModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      VehicleModel.countDocuments(query)
    ]);

    return { vehicles: vehicles.map(v => v.toJSON()), total };
  }

  async getVehiclesByCustomer(customerId: string): Promise<Vehicle[]> {
    const vehicles = await VehicleModel.findByCustomer(customerId);
    return vehicles.map(v => v.toJSON());
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle | null> {
    const vehicle = await VehicleModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    return vehicle?.toJSON() || null;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const vehicle = await VehicleModel.findByIdAndUpdate(id, { $set: { status: 'inactive' } }, { new: true });
    return !!vehicle;
  }

  async getExpiringInsurance(days: number = 30): Promise<Vehicle[]> {
    const vehicles = await VehicleModel.findExpiringInsurance(days);
    return vehicles.map(v => v.toJSON());
  }

  async createService(data: Partial<Service>): Promise<Service> {
    const service = new ServiceModel(data);
    await service.save();
    return service.toJSON();
  }

  async getServiceById(id: string): Promise<Service | null> {
    const service = await ServiceModel.findById(id);
    return service?.toJSON() || null;
  }

  async getServices(filters: {
    category?: string;
    isPackage?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ services: Service[]; total: number }> {
    const { category, isPackage, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (isPackage !== undefined) query.isPackage = isPackage;

    const [services, total] = await Promise.all([
      ServiceModel.find(query).sort({ price: 1 }).skip((page - 1) * limit).limit(limit),
      ServiceModel.countDocuments(query)
    ]);

    return { services: services.map(s => s.toJSON()), total };
  }

  async getServicesByCategory(category: string): Promise<Service[]> {
    const services = await ServiceModel.findByCategory(category);
    return services.map(s => s.toJSON());
  }

  async updateService(id: string, data: Partial<Service>): Promise<Service | null> {
    const service = await ServiceModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    return service?.toJSON() || null;
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await ServiceModel.findByIdAndDelete(id);
    return !!result;
  }
}

export const automotiveService = new AutomotiveService();
