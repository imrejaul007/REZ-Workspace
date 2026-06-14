import { v4 as uuidv4 } from 'uuid';
import { Place, PlaceDocument } from '../models/place.model.js';
import {
  IPlace,
  CreatePlaceSchema,
  UpdatePlaceSchema,
  PlaceFilters,
  PaginatedResponse,
  ApiResponse,
  PlaceStatistics,
} from '../types/index.js';
import { cacheService } from './cache.service.js';
import { eventBus } from './event-bus.service.js';

export class PlaceService {
  /**
   * Create a new place
   */
  async createPlace(data: z.infer<typeof CreatePlaceSchema>): Promise<IPlace> {
    const placeId = `place_${uuidv4()}`;

    const place = new Place({
      placeId,
      ...data,
      advertising: data.advertising || {
        availableFormats: [],
        pricing: { cpm: 0, minBudget: 0 },
        targetingOptions: [],
      },
      audienceProfile: data.audienceProfile || {
        demographics: {
          ageGroups: {},
          genderSplit: {},
          incomeLevel: 'middle',
        },
        visitorPatterns: {
          peakHours: [],
          busyDays: [],
          seasonalTrends: [],
        },
        commonPurposes: [],
      },
      nearbyPlaces: data.nearbyPlaces || [],
      status: 'active',
    });

    await place.save();

    // Invalidate cache
    await cacheService.invalidatePattern('places:*');

    // Publish event
    eventBus.publish('place_created', { placeId, data: place.toObject() });

    return place.toObject() as IPlace;
  }

  /**
   * Get place by ID
   */
  async getPlaceById(placeId: string): Promise<IPlace | null> {
    // Check cache first
    const cached = await cacheService.get<IPlace>(`places:${placeId}`);
    if (cached) {
      return cached;
    }

    const place = await Place.findByPlaceId(placeId);
    if (!place) {
      return null;
    }

    const placeData = place.toObject() as IPlace;

    // Cache the result
    await cacheService.set(`places:${placeId}`, placeData, 600);

    return placeData;
  }

  /**
   * Update place
   */
  async updatePlace(
    placeId: string,
    data: z.infer<typeof UpdatePlaceSchema>
  ): Promise<IPlace | null> {
    const place = await Place.findByPlaceId(placeId);
    if (!place) {
      return null;
    }

    // Update fields
    Object.assign(place, data);
    await place.save();

    // Invalidate cache
    await cacheService.delete(`places:${placeId}`);
    await cacheService.invalidatePattern('places:list:*');

    // Publish event
    eventBus.publish('place_updated', { placeId, data: place.toObject() });

    return place.toObject() as IPlace;
  }

  /**
   * Delete place
   */
  async deletePlace(placeId: string): Promise<boolean> {
    const result = await Place.deleteOne({ placeId });
    if (result.deletedCount === 0) {
      return false;
    }

    // Invalidate cache
    await cacheService.delete(`places:${placeId}`);
    await cacheService.invalidatePattern('places:list:*');

    // Publish event
    eventBus.publish('place_deleted', { placeId, data: {} });

    return true;
  }

  /**
   * List places with filters and pagination
   */
  async listPlaces(
    filters: PlaceFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<IPlace>> {
    const query: Record<string, unknown> = {};

    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.city) {
      query['address.city'] = filters.city;
    }
    if (filters.state) {
      query['address.state'] = filters.state;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.minRating) {
      query['attributes.ratings'] = { $gte: filters.minRating };
    }
    if (filters.size) {
      query['attributes.size'] = filters.size;
    }

    const skip = (page - 1) * limit;

    const [places, total] = await Promise.all([
      Place.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Place.countDocuments(query),
    ]);

    return {
      data: places.map((p) => p.toObject() as IPlace),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get place statistics
   */
  async getStatistics(): Promise<PlaceStatistics> {
    const cacheKey = 'places:statistics';
    const cached = await cacheService.get<PlaceStatistics>(cacheKey);
    if (cached) {
      return cached;
    }

    const [totalPlaces, byType, byStatus, places] = await Promise.all([
      Place.countDocuments(),
      Place.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Place.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Place.find({ 'attributes.ratings': { $exists: true } }),
    ]);

    const byTypeMap: Record<string, number> = {};
    byType.forEach((item) => {
      byTypeMap[item._id] = item.count;
    });

    const byStatusMap: Record<string, number> = {};
    byStatus.forEach((item) => {
      byStatusMap[item._id] = item.count;
    });

    const ratings = places
      .map((p) => p.attributes?.ratings || 0)
      .filter((r) => r > 0);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    const categoryAggregation = await Place.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topCategories = categoryAggregation.map((item) => ({
      category: item._id,
      count: item.count,
    }));

    const statistics: PlaceStatistics = {
      totalPlaces,
      byType: byTypeMap as Record<'mall' | 'airport' | 'hospital' | 'hotel' | 'school' | 'office' | 'restaurant' | 'retail' | 'event_venue' | 'transit', number>,
      byStatus: byStatusMap as Record<'active' | 'inactive', number>,
      averageRating: Math.round(averageRating * 10) / 10,
      topCategories,
    };

    await cacheService.set(cacheKey, statistics, 300);

    return statistics;
  }

  /**
   * Add nearby place reference
   */
  async addNearbyPlace(placeId: string, nearbyPlaceId: string): Promise<boolean> {
    const place = await Place.findByPlaceId(placeId);
    if (!place) {
      return false;
    }

    if (!place.nearbyPlaces.includes(nearbyPlaceId)) {
      place.nearbyPlaces.push(nearbyPlaceId);
      await place.save();
      await cacheService.delete(`places:${placeId}`);
    }

    return true;
  }

  /**
   * Remove nearby place reference
   */
  async removeNearbyPlace(placeId: string, nearbyPlaceId: string): Promise<boolean> {
    const place = await Place.findByPlaceId(placeId);
    if (!place) {
      return false;
    }

    place.nearbyPlaces = place.nearbyPlaces.filter((id) => id !== nearbyPlaceId);
    await place.save();
    await cacheService.delete(`places:${placeId}`);

    return true;
  }
}

export const placeService = new PlaceService();
export default placeService;
