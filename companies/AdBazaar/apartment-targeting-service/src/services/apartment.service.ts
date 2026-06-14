import { v4 as uuidv4 } from 'uuid';
import { ApartmentModel, IApartmentDocument } from '../models/index.js';
import { redisService } from './redis.service.js';
import {
  CreateApartmentInput,
  UpdateApartmentInput,
  ListApartmentsQuery,
  PaginatedResponse,
  Apartment,
  ResidentStats,
} from '../types/index.js';
import haversine from 'haversine-distance';

export class ApartmentService {
  // Create a new apartment
  async create(input: CreateApartmentInput): Promise<Apartment> {
    const apartmentId = `APT-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Calculate estimated residents
    const estimatedResidents = Math.round(
      input.demographics.occupiedFlats * input.demographics.avgFamilySize
    );

    const apartment = new ApartmentModel({
      apartmentId,
      ...input,
      demographics: {
        ...input.demographics,
        estimatedResidents,
      },
    });

    await apartment.save();

    const doc = apartment.toJSON() as unknown as Apartment;
    await redisService.cacheApartment(apartmentId, doc);

    return doc;
  }

  // Get apartment by ID
  async getById(apartmentId: string): Promise<Apartment | null> {
    // Try cache first
    const cached = await redisService.getCachedApartment(apartmentId);
    if (cached) {
      return cached as Apartment;
    }

    const apartment = await ApartmentModel.findOne({ apartmentId });
    if (!apartment) return null;

    const doc = apartment.toJSON() as unknown as Apartment;
    await redisService.cacheApartment(apartmentId, doc);

    return doc;
  }

  // Update apartment
  async update(apartmentId: string, input: UpdateApartmentInput): Promise<Apartment | null> {
    const apartment = await ApartmentModel.findOne({ apartmentId });
    if (!apartment) return null;

    // Apply updates
    Object.keys(input).forEach((key) => {
      const k = key as keyof UpdateApartmentInput;
      if (input[k] !== undefined) {
        if (key === 'demographics' && input.demographics) {
          Object.assign(apartment.demographics, input.demographics);
          // Recalculate residents
          apartment.demographics.estimatedResidents = Math.round(
            apartment.demographics.occupiedFlats * apartment.demographics.avgFamilySize
          );
        } else if (key === 'address' && input.address) {
          Object.assign(apartment.address, input.address);
        } else if (key === 'location' && input.location) {
          Object.assign(apartment.location, input.location);
        } else if (key === 'targeting' && input.targeting) {
          Object.assign(apartment.targeting, input.targeting);
        } else {
          (apartment as Record<string, unknown>)[key] = input[k];
        }
      }
    });

    await apartment.save();

    const doc = apartment.toJSON() as unknown as Apartment;
    await redisService.invalidateApartmentCache(apartmentId);
    await redisService.cacheApartment(apartmentId, doc);

    return doc;
  }

  // List apartments with filters and pagination
  async list(query: ListApartmentsQuery): Promise<PaginatedResponse<Apartment>> {
    const { page, limit, city, state, incomeLevel, type, status, minResidents, maxResidents, amenities, search } = query;

    const filter: Record<string, unknown> = {};

    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (state) filter['address.state'] = new RegExp(state, 'i');
    if (incomeLevel) filter['demographics.incomeLevel'] = incomeLevel;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (minResidents) filter['demographics.estimatedResidents'] = { $gte: minResidents };
    if (maxResidents) filter['demographics.estimatedResidents'] = {
      ...(filter['demographics.estimatedResidents'] as object || {}),
      ...(minResidents ? { $gte: minResidents } : {}),
      $lte: maxResidents,
    };
    if (amenities && amenities.length > 0) {
      filter.amenities = { $all: amenities };
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [apartments, total] = await Promise.all([
      ApartmentModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ 'demographics.estimatedResidents': -1 })
        .lean(),
      ApartmentModel.countDocuments(filter),
    ]);

    return {
      data: apartments as unknown as Apartment[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get resident stats for an apartment
  async getResidentStats(apartmentId: string): Promise<ResidentStats | null> {
    const apartment = await ApartmentModel.findOne({ apartmentId }).lean();
    if (!apartment) return null;

    const { demographics } = apartment;
    const occupancyRate = (demographics.occupiedFlats / demographics.totalFlats) * 100;
    const estimatedHouseholds = demographics.occupiedFlats;
    // Estimate ~2 devices per household on average
    const estimatedTargetableDevices = Math.round(estimatedHouseholds * 2);

    return {
      apartmentId,
      totalFlats: demographics.totalFlats,
      occupiedFlats: demographics.occupiedFlats,
      estimatedResidents: demographics.estimatedResidents,
      avgFamilySize: demographics.avgFamilySize,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      incomeLevel: demographics.incomeLevel,
      estimatedHouseholds,
      estimatedTargetableDevices,
    };
  }

  // Find nearby apartments using Haversine formula
  async findNearby(
    lat: number,
    lng: number,
    radiusMeters: number,
    limit: number,
    filters?: {
      incomeLevel?: string;
      minResidents?: number;
    }
  ): Promise<(Apartment & { distance: number })[]> {
    // First, get all active apartments in a bounding box to reduce computation
    const latDelta = radiusMeters / 111000; // ~111km per degree latitude
    const lngDelta = radiusMeters / (111000 * Math.cos((lat * Math.PI) / 180));

    const query: Record<string, unknown> = {
      status: 'active',
      'location.lat': { $gte: lat - latDelta, $lte: lat + latDelta },
      'location.lng': { $gte: lng - lngDelta, $lte: lng + lngDelta },
    };

    if (filters?.incomeLevel) {
      query['demographics.incomeLevel'] = filters.incomeLevel;
    }
    if (filters?.minResidents) {
      query['demographics.estimatedResidents'] = { $gte: filters.minResidents };
    }

    const apartments = await ApartmentModel.find(query).lean();

    // Calculate distance and filter by radius
    const withDistance = apartments
      .map((apt) => {
        const from = { lat, lng };
        const to = { lat: apt.location.lat, lng: apt.location.lng };
        const distance = haversine(from, to); // returns distance in meters
        return {
          ...(apt as unknown as Apartment),
          distance: Math.round(distance),
        };
      })
      .filter((apt) => apt.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return withDistance;
  }

  // Delete apartment
  async delete(apartmentId: string): Promise<boolean> {
    const result = await ApartmentModel.deleteOne({ apartmentId });
    if (result.deletedCount > 0) {
      await redisService.invalidateApartmentCache(apartmentId);
      return true;
    }
    return false;
  }

  // Get apartments by city
  async getByCity(city: string): Promise<Apartment[]> {
    return ApartmentModel.find({
      'address.city': new RegExp(city, 'i'),
      status: 'active',
    }).lean() as unknown as Promise<Apartment[]>;
  }

  // Get apartments by pincode
  async getByPincode(pincode: string): Promise<Apartment[]> {
    return ApartmentModel.find({
      'address.pincode': pincode,
      status: 'active',
    }).lean() as unknown as Promise<Apartment[]>;
  }

  // Get count by income level
  async getCountByIncomeLevel(): Promise<Record<string, number>> {
    const result = await ApartmentModel.aggregate([
      { $group: { _id: '$demographics.incomeLevel', count: { $sum: 1 } } },
    ]);
    return result.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {} as Record<string, number>);
  }

  // Get total residents across all apartments
  async getTotalResidents(): Promise<number> {
    const result = await ApartmentModel.aggregate([
      { $group: { _id: null, total: { $sum: '$demographics.estimatedResidents' } } },
    ]);
    return result[0]?.total || 0;
  }
}

export const apartmentService = new ApartmentService();