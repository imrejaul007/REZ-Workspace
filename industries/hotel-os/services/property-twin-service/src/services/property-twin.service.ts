import { PropertyTwin, IPropertyTwin, IVenue, IAmenity, IPolicy, IRevenueCenter } from '../models';
import { logger } from '../utils/logger';

export interface CreatePropertyTwinDTO {
  propertyId: string;
  propertyName: string;
  brand: string;
  chainCode?: string;
  location: {
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
    timezone: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
    emergencyContact?: string;
  };
  venues?: IVenue[];
  amenities?: IAmenity[];
  policies?: IPolicy[];
  revenueCenters?: IRevenueCenter[];
  configuration: {
    totalRooms: number;
    totalFloors: number;
    roomTypes: {
      type: string;
      count: number;
      baseRate: number;
    }[];
    starRating?: number;
    yearBuilt?: number;
    lastRenovation?: Date;
  };
  metrics?: {
    occupancyRate?: number;
    averageDailyRate?: number;
    revenuePerAvailableRoom?: number;
    guestSatisfactionScore?: number;
  };
  tags?: string[];
  status?: 'active' | 'inactive' | 'coming-soon';
}

export interface PropertyTwinFilters {
  city?: string;
  country?: string;
  starRating?: number;
  status?: string;
  tag?: string;
  minRooms?: number;
  maxRooms?: number;
  limit?: number;
  offset?: number;
}

export class PropertyTwinService {
  /**
   * Create a new property twin
   */
  async create(dto: CreatePropertyTwinDTO): Promise<IPropertyTwin> {
    logger.info(`Creating property twin for propertyId: ${dto.propertyId}`);

    const existingTwin = await PropertyTwin.findOne({ propertyId: dto.propertyId });
    if (existingTwin) {
      throw new Error(`Property twin with propertyId ${dto.propertyId} already exists`);
    }

    const propertyTwin = new PropertyTwin({
      propertyId: dto.propertyId,
      propertyName: dto.propertyName,
      brand: dto.brand,
      chainCode: dto.chainCode,
      location: dto.location,
      contact: dto.contact,
      venues: dto.venues || [],
      amenities: dto.amenities || [],
      policies: dto.policies || [],
      revenueCenters: dto.revenueCenters || [],
      configuration: {
        totalRooms: dto.configuration.totalRooms,
        totalFloors: dto.configuration.totalFloors,
        roomTypes: dto.configuration.roomTypes,
        starRating: dto.configuration.starRating || 3,
        yearBuilt: dto.configuration.yearBuilt,
        lastRenovation: dto.configuration.lastRenovation,
      },
      metrics: {
        occupancyRate: dto.metrics?.occupancyRate || 0,
        averageDailyRate: dto.metrics?.averageDailyRate || 0,
        revenuePerAvailableRoom: dto.metrics?.revenuePerAvailableRoom || 0,
        guestSatisfactionScore: dto.metrics?.guestSatisfactionScore || 0,
        lastUpdated: new Date(),
      },
      integrations: [],
      tags: dto.tags || [],
      status: dto.status || 'active',
    });

    await propertyTwin.save();
    logger.info(`Property twin created successfully: ${propertyTwin._id}`);
    return propertyTwin;
  }

  /**
   * Get property twin by ID
   */
  async getById(propertyId: string): Promise<IPropertyTwin | null> {
    logger.debug(`Getting property twin for propertyId: ${propertyId}`);
    return PropertyTwin.findOne({ propertyId });
  }

  /**
   * Get property twin by ID (non-archived)
   */
  async getByIdActive(propertyId: string): Promise<IPropertyTwin | null> {
    return PropertyTwin.findOne({ propertyId, status: { $ne: 'inactive' } });
  }

  /**
   * Update property metrics
   */
  async updateMetrics(
    propertyId: string,
    metrics: {
      occupancyRate?: number;
      averageDailyRate?: number;
      revenuePerAvailableRoom?: number;
      guestSatisfactionScore?: number;
    }
  ): Promise<IPropertyTwin | null> {
    logger.info(`Updating metrics for propertyId: ${propertyId}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    if (metrics.occupancyRate !== undefined) {
      propertyTwin.metrics.occupancyRate = metrics.occupancyRate;
    }
    if (metrics.averageDailyRate !== undefined) {
      propertyTwin.metrics.averageDailyRate = metrics.averageDailyRate;
    }
    if (metrics.revenuePerAvailableRoom !== undefined) {
      propertyTwin.metrics.revenuePerAvailableRoom = metrics.revenuePerAvailableRoom;
    }
    if (metrics.guestSatisfactionScore !== undefined) {
      propertyTwin.metrics.guestSatisfactionScore = metrics.guestSatisfactionScore;
    }
    propertyTwin.metrics.lastUpdated = new Date();

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    logger.info(`Metrics updated for propertyId: ${propertyId}`);
    return propertyTwin;
  }

  /**
   * Add venue to property
   */
  async addVenue(propertyId: string, venue: IVenue): Promise<IPropertyTwin | null> {
    logger.info(`Adding venue ${venue.name} to propertyId: ${propertyId}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    const existingVenueIndex = propertyTwin.venues.findIndex((v) => v.venueId === venue.venueId);
    if (existingVenueIndex >= 0) {
      propertyTwin.venues[existingVenueIndex] = venue;
    } else {
      propertyTwin.venues.push(venue);
    }

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    logger.info(`Venue added to propertyId: ${propertyId}`);
    return propertyTwin;
  }

  /**
   * Update venue
   */
  async updateVenue(propertyId: string, venueId: string, updates: Partial<IVenue>): Promise<IPropertyTwin | null> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    const venueIndex = propertyTwin.venues.findIndex((v) => v.venueId === venueId);
    if (venueIndex < 0) {
      throw new Error(`Venue ${venueId} not found in property ${propertyId}`);
    }

    propertyTwin.venues[venueIndex] = { ...propertyTwin.venues[venueIndex], ...updates };

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    return propertyTwin;
  }

  /**
   * Remove venue from property
   */
  async removeVenue(propertyId: string, venueId: string): Promise<IPropertyTwin | null> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    propertyTwin.venues = propertyTwin.venues.filter((v) => v.venueId !== venueId);

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    return propertyTwin;
  }

  /**
   * Add amenity to property
   */
  async addAmenity(propertyId: string, amenity: IAmenity): Promise<IPropertyTwin | null> {
    logger.info(`Adding amenity ${amenity.name} to propertyId: ${propertyId}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    const existingIndex = propertyTwin.amenities.findIndex((a) => a.amenityId === amenity.amenityId);
    if (existingIndex >= 0) {
      propertyTwin.amenities[existingIndex] = amenity;
    } else {
      propertyTwin.amenities.push(amenity);
    }

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    logger.info(`Amenity added to propertyId: ${propertyId}`);
    return propertyTwin;
  }

  /**
   * Update amenity availability
   */
  async updateAmenityAvailability(
    propertyId: string,
    amenityId: string,
    available: boolean
  ): Promise<IPropertyTwin | null> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    const amenityIndex = propertyTwin.amenities.findIndex((a) => a.amenityId === amenityId);
    if (amenityIndex < 0) {
      throw new Error(`Amenity ${amenityId} not found in property ${propertyId}`);
    }

    propertyTwin.amenities[amenityIndex].available = available;

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    return propertyTwin;
  }

  /**
   * Add policy to property
   */
  async addPolicy(propertyId: string, policy: IPolicy): Promise<IPropertyTwin | null> {
    logger.info(`Adding policy ${policy.name} to propertyId: ${propertyId}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    const existingIndex = propertyTwin.policies.findIndex((p) => p.policyId === policy.policyId);
    if (existingIndex >= 0) {
      propertyTwin.policies[existingIndex] = policy;
    } else {
      propertyTwin.policies.push(policy);
    }

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    logger.info(`Policy added to propertyId: ${propertyId}`);
    return propertyTwin;
  }

  /**
   * Update revenue center
   */
  async updateRevenueCenter(
    propertyId: string,
    centerId: string,
    updates: Partial<IRevenueCenter>
  ): Promise<IPropertyTwin | null> {
    logger.info(`Updating revenue center ${centerId} for propertyId: ${propertyId}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    const centerIndex = propertyTwin.revenueCenters.findIndex((c) => c.centerId === centerId);
    if (centerIndex < 0) {
      throw new Error(`Revenue center ${centerId} not found in property ${propertyId}`);
    }

    propertyTwin.revenueCenters[centerIndex] = {
      ...propertyTwin.revenueCenters[centerIndex],
      ...updates,
      lastUpdated: new Date(),
    };

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    logger.info(`Revenue center updated for propertyId: ${propertyId}`);
    return propertyTwin;
  }

  /**
   * Update integration status
   */
  async updateIntegrationStatus(
    propertyId: string,
    serviceName: string,
    status: 'connected' | 'disconnected' | 'error',
    endpoint?: string
  ): Promise<IPropertyTwin | null> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    const integrationIndex = propertyTwin.integrations.findIndex(
      (i) => i.serviceName === serviceName
    );

    const integrationData = {
      serviceName,
      endpoint: endpoint || (integrationIndex >= 0 ? propertyTwin.integrations[integrationIndex].endpoint : ''),
      status,
      lastSync: new Date(),
    };

    if (integrationIndex >= 0) {
      propertyTwin.integrations[integrationIndex] = integrationData;
    } else {
      propertyTwin.integrations.push(integrationData);
    }

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    return propertyTwin;
  }

  /**
   * Query properties with filters
   */
  async query(filters: PropertyTwinFilters): Promise<{ properties: IPropertyTwin[]; total: number }> {
    const { city, country, starRating, status, tag, minRooms, maxRooms, limit = 20, offset = 0 } = filters;

    const query: Record<string, unknown> = {};

    if (city) query['location.address.city'] = city;
    if (country) query['location.address.country'] = country;
    if (starRating) query['configuration.starRating'] = starRating;
    if (status) query.status = status;
    if (tag) query.tags = tag;
    if (minRooms !== undefined) query['configuration.totalRooms'] = { $gte: minRooms };
    if (maxRooms !== undefined) {
      query['configuration.totalRooms'] = {
        ...(query['configuration.totalRooms'] as object || {}),
        $lte: maxRooms,
      };
    }

    const [properties, total] = await Promise.all([
      PropertyTwin.find(query).skip(offset).limit(limit).sort({ propertyName: 1 }),
      PropertyTwin.countDocuments(query),
    ]);

    return { properties, total };
  }

  /**
   * Get properties by country
   */
  async getByCountry(country: string): Promise<IPropertyTwin[]> {
    return PropertyTwin.find({ 'location.address.country': country, status: 'active' });
  }

  /**
   * Get properties by city
   */
  async getByCity(city: string): Promise<IPropertyTwin[]> {
    return PropertyTwin.find({ 'location.address.city': city, status: 'active' });
  }

  /**
   * Get active venues for property
   */
  async getActiveVenues(propertyId: string): Promise<IVenue[]> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }
    return propertyTwin.getActiveVenues();
  }

  /**
   * Get available amenities for property
   */
  async getAvailableAmenities(propertyId: string): Promise<IAmenity[]> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }
    return propertyTwin.getAvailableAmenities();
  }

  /**
   * Get policies by category
   */
  async getPoliciesByCategory(
    propertyId: string,
    category: IPolicy['category']
  ): Promise<IPolicy[]> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }
    return propertyTwin.getPoliciesByCategory(category);
  }

  /**
   * Calculate RevPAR
   */
  async calculateRevPAR(propertyId: string): Promise<number> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }
    return propertyTwin.calculateRevPAR();
  }

  /**
   * Get total venue capacity
   */
  async getTotalVenueCapacity(propertyId: string): Promise<number> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }
    return propertyTwin.getTotalVenueCapacity();
  }

  /**
   * Get portfolio statistics
   */
  async getPortfolioStatistics(): Promise<{
    totalProperties: number;
    activeProperties: number;
    totalRooms: number;
    averageOccupancy: number;
    averageADR: number;
    averageRevPAR: number;
    averageGuestSatisfaction: number;
  }> {
    const stats = await PropertyTwin.aggregate([
      {
        $facet: {
          counts: [
            { $count: 'totalProperties' },
            { $match: { status: 'active' } },
            { $count: 'activeProperties' },
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalRooms: { $sum: '$configuration.totalRooms' },
                avgOccupancy: { $avg: '$metrics.occupancyRate' },
                avgADR: { $avg: '$metrics.averageDailyRate' },
                avgRevPAR: { $avg: '$metrics.revenuePerAvailableRoom' },
                avgSatisfaction: { $avg: '$metrics.guestSatisfactionScore' },
              },
            },
          ],
        },
      },
    ]);

    const result = stats[0] || {};

    return {
      totalProperties: result.counts?.[0]?.totalProperties || 0,
      activeProperties: result.counts?.[1]?.activeProperties || 0,
      totalRooms: result.totals?.[0]?.totalRooms || 0,
      averageOccupancy: result.totals?.[0]?.avgOccupancy || 0,
      averageADR: result.totals?.[0]?.avgADR || 0,
      averageRevPAR: result.totals?.[0]?.avgRevPAR || 0,
      averageGuestSatisfaction: result.totals?.[0]?.avgSatisfaction || 0,
    };
  }

  /**
   * Archive property twin
   */
  async archive(propertyId: string): Promise<IPropertyTwin | null> {
    logger.info(`Archiving property twin for propertyId: ${propertyId}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    propertyTwin.status = 'inactive';
    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    logger.info(`Property twin archived: ${propertyId}`);
    return propertyTwin;
  }
}

export const propertyTwinService = new PropertyTwinService();