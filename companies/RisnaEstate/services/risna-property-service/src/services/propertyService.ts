import { Property, IProperty } from '../models/Property';
import { logger } from '../config/logger';

export interface CreatePropertyInput {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  propertyType: string;
  listingType: string;
  country: string;
  city: string;
  locality: string;
  subLocality?: string;
  address?: Record<string, string>;
  price: {
    amount: number;
    currency: string;
    displayPrice?: string;
    pricePerSqFt?: number;
  };
  bedrooms?: number;
  bathrooms?: number;
  carpetArea?: number;
  furnishedStatus?: string;
  amenities?: string[];
  media?: Array<{
    type: string;
    url: string;
    thumbnailUrl?: string;
    caption?: string;
    isPrimary?: boolean;
  }>;
  virtualTourUrl?: string;
  brokerId?: string;
  agentId?: string;
  ownerId?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface PropertyFilters {
  country?: string;
  city?: string;
  locality?: string;
  propertyType?: string;
  listingType?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  furnished?: string;
  brokerId?: string;
  search?: string;
}

export interface PropertySearchOptions extends PropertyFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export class PropertyService {
  async create(input: CreatePropertyInput): Promise<IProperty> {
    const property = new Property({
      ...input,
      status: 'draft',
      views: 0,
      inquiries: 0,
      shortlisted: 0
    });
    await property.save();
    logger.info('Property created', { propertyId: property._id });
    return property;
  }

  async getById(id: string): Promise<IProperty | null> {
    return Property.findOne({ _id: id, deletedAt: null });
  }

  async update(id: string, updates: Partial<CreatePropertyInput>): Promise<IProperty | null> {
    const property = await Property.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updates },
      { new: true }
    );
    if (property) {
      logger.info('Property updated', { propertyId: id });
    }
    return property;
  }

  async delete(id: string): Promise<boolean> {
    const result = await Property.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );
    if (result) {
      logger.info('Property soft deleted', { propertyId: id });
      return true;
    }
    return false;
  }

  async publish(id: string): Promise<IProperty | null> {
    const property = await Property.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $set: {
          status: 'active',
          publishedAt: new Date()
        }
      },
      { new: true }
    );
    if (property) {
      logger.info('Property published', { propertyId: id });
    }
    return property;
  }

  async unpublish(id: string): Promise<IProperty | null> {
    const property = await Property.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: 'draft' } },
      { new: true }
    );
    if (property) {
      logger.info('Property unpublished', { propertyId: id });
    }
    return property;
  }

  async search(options: PropertySearchOptions): Promise<{ properties: IProperty[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      country,
      city,
      locality,
      propertyType,
      listingType,
      status = 'active',
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      furnished,
      brokerId,
      search,
      lat,
      lng,
      radiusKm
    } = options;

    const query: Record<string, any> = { deletedAt: null };

    // Apply filters
    if (country) query.country = country;
    if (city) query.city = city;
    if (locality) query.locality = locality;
    if (propertyType) query.propertyType = propertyType;
    if (listingType) query.listingType = listingType;
    if (status) query.status = status;
    if (brokerId) query.brokerId = brokerId;

    // Price range
    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = minPrice;
      if (maxPrice) query['price.amount'].$lte = maxPrice;
    }

    // Bedrooms
    if (minBedrooms || maxBedrooms) {
      query.bedrooms = {};
      if (minBedrooms) query.bedrooms.$gte = minBedrooms;
      if (maxBedrooms) query.bedrooms.$lte = maxBedrooms;
    }

    if (furnished) query.furnishedStatus = furnished;

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Geo search
    if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radiusKm * 1000 // Convert km to meters
        }
      };
    }

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [properties, total] = await Promise.all([
      Property.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Property.countDocuments(query)
    ]);

    return { properties: properties as IProperty[], total };
  }

  async getFeatured(limit = 10): Promise<IProperty[]> {
    return Property.find({
      status: 'active',
      deletedAt: null
    })
      .sort({ views: -1, inquiries: -1 })
      .limit(limit)
      .lean();
  }

  async getNewLaunches(limit = 10): Promise<IProperty[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return Property.find({
      status: 'active',
      deletedAt: null,
      publishedAt: { $gte: sevenDaysAgo }
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
  }

  async trackView(id: string, userId?: string): Promise<void> {
    await Property.findByIdAndUpdate(id, { $inc: { views: 1 } });
    logger.debug('Property view tracked', { propertyId: id, userId });
  }

  async trackInquiry(id: string, userId?: string): Promise<void> {
    await Property.findByIdAndUpdate(id, { $inc: { inquiries: 1 } });
    logger.debug('Property inquiry tracked', { propertyId: id, userId });
  }

  async trackShortlist(id: string): Promise<void> {
    await Property.findByIdAndUpdate(id, { $inc: { shortlisted: 1 } });
    logger.debug('Property shortlisted', { propertyId: id });
  }

  async getByBroker(brokerId: string, page = 1, limit = 20): Promise<{ properties: IProperty[]; total: number }> {
    const skip = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      Property.find({ brokerId, deletedAt: null })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Property.countDocuments({ brokerId, deletedAt: null })
    ]);
    return { properties: properties as IProperty[], total };
  }

  async getAnalytics(id: string): Promise<{
    views: number;
    inquiries: number;
    shortlisted: number;
    viewTrend: number[];
  } | null> {
    const property = await Property.findById(id).select('views inquiries shortlisted').lean();
    if (!property) return null;

    return {
      views: property.views,
      inquiries: property.inquiries,
      shortlisted: property.shortlisted,
      viewTrend: [] // Could implement trend tracking with historical data
    };
  }

  async getSimilar(propertyId: string, limit = 5): Promise<IProperty[]> {
    const property = await Property.findById(propertyId);
    if (!property) return [];

    return Property.find({
      _id: { $ne: propertyId },
      status: 'active',
      deletedAt: null,
      propertyType: property.propertyType,
      listingType: property.listingType,
      city: property.city
    })
      .limit(limit)
      .lean();
  }
}

export const propertyService = new PropertyService();
