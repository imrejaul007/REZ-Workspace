import { Vehicle, VehicleDocument } from '../models';
import { IVehicle, IVehicleFilters, IPaginatedResult } from '../types';
import logger from '../utils/logger';

export interface CreateVehicleData {
  merchantId: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  registrationNumber: string;
  vin: string;
  color: string;
  fuelType: IVehicle['fuelType'];
  transmission: IVehicle['transmission'];
  kilometerReading?: number;
  ownership: IVehicle['ownership'];
  insuranceStatus?: IVehicle['insuranceStatus'];
  insuranceExpiry?: Date;
  taxStatus?: IVehicle['taxStatus'];
  pucStatus?: IVehicle['pucStatus'];
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  images?: string[];
  status?: IVehicle['status'];
  price: number;
  priceNegotiable?: boolean;
  notes?: string;
}

export interface UpdateVehicleData {
  make?: string;
  model?: string;
  variant?: string;
  year?: number;
  registrationNumber?: string;
  vin?: string;
  color?: string;
  fuelType?: IVehicle['fuelType'];
  transmission?: IVehicle['transmission'];
  kilometerReading?: number;
  ownership?: IVehicle['ownership'];
  insuranceStatus?: IVehicle['insuranceStatus'];
  insuranceExpiry?: Date;
  taxStatus?: IVehicle['taxStatus'];
  pucStatus?: IVehicle['pucStatus'];
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  images?: string[];
  status?: IVehicle['status'];
  price?: number;
  priceNegotiable?: boolean;
  notes?: string;
}

export interface VehicleSearchParams extends IVehicleFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

class VehicleService {
  /**
   * Create a new vehicle
   */
  async create(data: CreateVehicleData): Promise<VehicleDocument> {
    try {
      const vehicle = new Vehicle(data);
      await vehicle.save();

      logger.info('Vehicle created', {
        vehicleId: vehicle.vehicleId,
        merchantId: vehicle.merchantId,
        make: vehicle.make,
        model: vehicle.model,
      });

      return vehicle;
    } catch (error) {
      logger.error('Failed to create vehicle', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId: data.merchantId,
      });
      throw error;
    }
  }

  /**
   * Get vehicle by ID
   */
  async getById(vehicleId: string): Promise<VehicleDocument | null> {
    return Vehicle.findOne({ vehicleId });
  }

  /**
   * Get vehicle by registration number
   */
  async getByRegistrationNumber(registrationNumber: string): Promise<VehicleDocument | null> {
    return Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
  }

  /**
   * Get vehicle by VIN
   */
  async getByVin(vin: string): Promise<VehicleDocument | null> {
    return Vehicle.findOne({ vin: vin.toUpperCase() });
  }

  /**
   * Update vehicle
   */
  async update(vehicleId: string, data: UpdateVehicleData): Promise<VehicleDocument | null> {
    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (vehicle) {
      logger.info('Vehicle updated', {
        vehicleId,
        updates: Object.keys(data),
      });
    }

    return vehicle;
  }

  /**
   * Delete vehicle
   */
  async delete(vehicleId: string): Promise<boolean> {
    const result = await Vehicle.deleteOne({ vehicleId });

    if (result.deletedCount > 0) {
      logger.info('Vehicle deleted', { vehicleId });
      return true;
    }

    return false;
  }

  /**
   * Get vehicles by merchant
   */
  async getByMerchant(
    merchantId: string,
    options: { page?: number; limit?: number; status?: IVehicle['status'] } = {}
  ): Promise<IPaginatedResult<VehicleDocument>> {
    const { page = 1, limit = 20, status } = options;

    const query: Record<string, unknown> = { merchantId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Vehicle.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Search vehicles with filters
   */
  async search(params: VehicleSearchParams): Promise<IPaginatedResult<VehicleDocument>> {
    const {
      merchantId,
      make,
      model,
      year,
      fuelType,
      transmission,
      status,
      priceRange,
      kilometerRange,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = params;

    const query: Record<string, unknown> = {};

    // Merchant filter
    if (merchantId) {
      query.merchantId = merchantId;
    }

    // Make/Model filters
    if (make) {
      query.make = make.toUpperCase();
    }
    if (model) {
      query.model = model.toUpperCase();
    }

    // Year range
    if (year) {
      query.year = year;
    } else if (year?.min || year?.max) {
      query.year = {};
      if (year.min) (query.year as Record<string, number>).$gte = year.min;
      if (year.max) (query.year as Record<string, number>).$lte = year.max;
    }

    // Fuel type
    if (fuelType) {
      query.fuelType = fuelType;
    }

    // Transmission
    if (transmission) {
      query.transmission = transmission;
    }

    // Status
    if (status) {
      query.status = status;
    }

    // Price range
    if (priceRange) {
      query.price = {};
      if (priceRange.min !== undefined) (query.price as Record<string, number>).$gte = priceRange.min;
      if (priceRange.max !== undefined) (query.price as Record<string, number>).$lte = priceRange.max;
    }

    // Kilometer range
    if (kilometerRange) {
      query.kilometerReading = {};
      if (kilometerRange.min !== undefined) (query.kilometerReading as Record<string, number>).$gte = kilometerRange.min;
      if (kilometerRange.max !== undefined) (query.kilometerReading as Record<string, number>).$lte = kilometerRange.max;
    }

    // Text search
    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { variant: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { vin: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query).sort(sort).skip(skip).limit(limit),
      Vehicle.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.debug('Vehicle search completed', {
      query,
      results: vehicles.length,
      total,
      page,
    });

    return {
      data: vehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get available vehicles ready for sale
   */
  async getReadyForSale(merchantId?: string): Promise<VehicleDocument[]> {
    const query: Record<string, unknown> = {
      status: 'available',
      insuranceStatus: 'valid',
      taxStatus: 'paid',
      pucStatus: 'valid',
    };

    if (merchantId) {
      query.merchantId = merchantId;
    }

    return Vehicle.find(query).sort({ price: 1 });
  }

  /**
   * Mark vehicle as sold
   */
  async markAsSold(vehicleId: string, customerId: string, customerName: string, customerPhone: string): Promise<VehicleDocument | null> {
    return this.update(vehicleId, {
      status: 'sold',
      customerId,
      customerName,
      customerPhone,
    });
  }

  /**
   * Reserve vehicle
   */
  async reserve(vehicleId: string): Promise<VehicleDocument | null> {
    return this.update(vehicleId, { status: 'reserved' });
  }

  /**
   * Get vehicle statistics for merchant
   */
  async getStatistics(merchantId: string): Promise<{
    total: number;
    available: number;
    sold: number;
    reserved: number;
    avgPrice: number;
    avgKilometerReading: number;
  }> {
    const vehicles = await Vehicle.find({ merchantId });

    const stats = {
      total: vehicles.length,
      available: vehicles.filter((v) => v.status === 'available').length,
      sold: vehicles.filter((v) => v.status === 'sold').length,
      reserved: vehicles.filter((v) => v.status === 'reserved').length,
      avgPrice: vehicles.length > 0
        ? vehicles.reduce((sum, v) => sum + v.price, 0) / vehicles.length
        : 0,
      avgKilometerReading: vehicles.length > 0
        ? vehicles.reduce((sum, v) => sum + v.kilometerReading, 0) / vehicles.length
        : 0,
    };

    return stats;
  }
}

export const vehicleService = new VehicleService();
export default vehicleService;