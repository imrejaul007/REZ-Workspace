import { Place } from '../models/place.model.js';
import { SearchQuery, NearbyQuery, IPlace, PaginatedResponse } from '../types/index.js';
import { cacheService } from './cache.service.js';

export class SearchService {
  /**
   * Search places by query
   */
  async searchPlaces(
    query: SearchQuery
  ): Promise<PaginatedResponse<IPlace>> {
    const { q, type, city, limit = 20, offset = 0 } = query;

    const cacheKey = `places:search:${JSON.stringify({ q, type, city, limit, offset })}`;
    const cached = await cacheService.get<PaginatedResponse<IPlace>>(cacheKey);
    if (cached) {
      return cached;
    }

    const searchQuery: Record<string, unknown> = {
      $text: { $search: q },
      status: 'active',
    };

    if (type) {
      searchQuery.type = type;
    }
    if (city) {
      searchQuery['address.city'] = city;
    }

    const [places, total] = await Promise.all([
      Place.find(searchQuery, { score: { $meta: 'textScore' } })
        .skip(offset)
        .limit(limit)
        .sort({ score: { $meta: 'textScore' } }),
      Place.countDocuments(searchQuery),
    ]);

    const result: PaginatedResponse<IPlace> = {
      data: places.map((p) => p.toObject() as IPlace),
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await cacheService.set(cacheKey, result, 180);

    return result;
  }

  /**
   * Find nearby places
   */
  async findNearby(query: NearbyQuery): Promise<IPlace[]> {
    const { lat, lng, radius = 5000, type, limit = 20 } = query;

    const cacheKey = `places:nearby:${lat}:${lng}:${radius}:${type || 'all'}:${limit}`;
    const cached = await cacheService.get<IPlace[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const searchQuery: Record<string, unknown> = {
      status: 'active',
    };

    if (type) {
      searchQuery.type = type;
    }

    const places = await Place.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radius,
        },
      },
      ...searchQuery,
    }).limit(limit);

    const result = places.map((p) => p.toObject() as IPlace);

    await cacheService.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Autocomplete search
   */
  async autocomplete(
    prefix: string,
    limit: number = 10
  ): Promise<Array<{ placeId: string; name: string; type: string; city: string }>> {
    if (prefix.length < 2) {
      return [];
    }

    const cacheKey = `places:autocomplete:${prefix}:${limit}`;
    const cached = await cacheService.get<Array<{ placeId: string; name: string; type: string; city: string }>>(cacheKey);
    if (cached) {
      return cached;
    }

    const regex = new RegExp(`^${prefix}`, 'i');

    const places = await Place.find({
      name: regex,
      status: 'active',
    })
      .select('placeId name type address.city')
      .limit(limit);

    const result = places.map((p) => ({
      placeId: p.placeId,
      name: p.name,
      type: p.type,
      city: p.address.city,
    }));

    await cacheService.set(cacheKey, result, 120);

    return result;
  }

  /**
   * Advanced search with filters
   */
  async advancedSearch(
    filters: {
      query?: string;
      type?: string;
      category?: string;
      city?: string;
      state?: string;
      minRating?: number;
      size?: string;
      priceRange?: string;
      availableFormat?: string;
      incomeLevel?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<IPlace>> {
    const query: Record<string, unknown> = {
      status: 'active',
    };

    if (filters.query) {
      query.$text = { $search: filters.query };
    }
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
    if (filters.minRating) {
      query['attributes.ratings'] = { $gte: filters.minRating };
    }
    if (filters.size) {
      query['attributes.size'] = filters.size;
    }
    if (filters.priceRange) {
      query['attributes.priceRange'] = filters.priceRange;
    }
    if (filters.availableFormat) {
      query['advertising.availableFormats'] = filters.availableFormat;
    }
    if (filters.incomeLevel) {
      query['audienceProfile.demographics.incomeLevel'] = filters.incomeLevel;
    }

    const skip = (page - 1) * limit;

    const [places, total] = await Promise.all([
      Place.find(query)
        .skip(skip)
        .limit(limit)
        .sort(filters.query ? { score: { $meta: 'textScore' } } : { createdAt: -1 }),
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
   * Get places by category
   */
  async getByCategory(
    category: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<IPlace>> {
    const cacheKey = `places:category:${category}:${page}:${limit}`;
    const cached = await cacheService.get<PaginatedResponse<IPlace>>(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const [places, total] = await Promise.all([
      Place.find({ category, status: 'active' })
        .skip(skip)
        .limit(limit)
        .sort({ 'attributes.ratings': -1 }),
      Place.countDocuments({ category, status: 'active' }),
    ]);

    const result: PaginatedResponse<IPlace> = {
      data: places.map((p) => p.toObject() as IPlace),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await cacheService.set(cacheKey, result, 600);

    return result;
  }

  /**
   * Get places by type
   */
  async getByType(
    type: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<IPlace>> {
    const cacheKey = `places:type:${type}:${page}:${limit}`;
    const cached = await cacheService.get<PaginatedResponse<IPlace>>(cacheKey);
    if (cached) {
      return cached;
    }

    const skip = (page - 1) * limit;

    const [places, total] = await Promise.all([
      Place.find({ type, status: 'active' })
        .skip(skip)
        .limit(limit)
        .sort({ 'attributes.ratings': -1 }),
      Place.countDocuments({ type, status: 'active' }),
    ]);

    const result: PaginatedResponse<IPlace> = {
      data: places.map((p) => p.toObject() as IPlace),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await cacheService.set(cacheKey, result, 600);

    return result;
  }

  /**
   * Get trending places (most visited in last 30 days)
   */
  async getTrending(limit: number = 10): Promise<IPlace[]> {
    const cacheKey = `places:trending:${limit}`;
    const cached = await cacheService.get<IPlace[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const places = await Place.find({
      status: 'active',
      updatedAt: { $gte: thirtyDaysAgo },
    })
      .sort({ 'attributes.visitorCount': -1 })
      .limit(limit);

    const result = places.map((p) => p.toObject() as IPlace);

    await cacheService.set(cacheKey, result, 900);

    return result;
  }
}

export const searchService = new SearchService();
export default searchService;
