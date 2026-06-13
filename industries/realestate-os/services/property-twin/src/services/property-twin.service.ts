import { v4 as uuidv4 } from 'uuid';
import { PropertyTwin, IPropertyTwin } from '../models';
import { logger } from '../utils/logger';
import { CreatePropertyTwinInput } from '../schemas';

// DTO interfaces
export interface CreatePropertyTwinDTO extends CreatePropertyTwinInput {}

export interface UpdatePropertyTwinDTO {
  listing?: Partial<IPropertyTwin['listing']>;
  location?: Partial<IPropertyTwin['location']>;
  physical?: Partial<IPropertyTwin['physical']>;
  features?: Partial<IPropertyTwin['features']>;
  condition?: Partial<IPropertyTwin['condition']>;
  financial?: Partial<IPropertyTwin['financial']>;
  market?: Partial<IPropertyTwin['market']>;
  media?: Partial<IPropertyTwin['media']>;
  ownership?: Partial<IPropertyTwin['ownership']>;
  agent?: Partial<IPropertyTwin['agent']>;
  tags?: string[];
  status?: 'active' | 'inactive' | 'archived';
}

export interface PropertyTwinFilters {
  city?: string;
  state?: string;
  postalCode?: string;
  propertyType?: IPropertyTwin['physical']['propertyType'];
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSqft?: number;
  maxSqft?: number;
  areaId?: string;
  neighborhood?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'listingPrice' | 'daysOnMarket' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PriceEstimateResponse {
  propertyId: string;
  estimate: {
    currentValue: number;
    confidenceInterval: {
      low: number;
      high: number;
    };
    confidenceScore: number;
  };
  forecast: {
    oneMonth: number;
    threeMonth: number;
    sixMonth: number;
    twelveMonth: number;
  };
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
}

export interface MarketAnalysisResponse {
  propertyId: string;
  marketOverview: {
    avgListPrice: number;
    avgSalePrice: number;
    avgPricePerSqft: number;
    avgDaysOnMarket: number;
    inventoryLevel: 'low' | 'normal' | 'high';
    priceTrend: 'increasing' | 'stable' | 'decreasing';
  };
  comparables: Array<{
    propertyId: string;
    address: string;
    salePrice: number;
    soldDate: string;
    sqft: number;
    pricePerSqft: number;
    similarity: number;
  }>;
}

export interface InvestmentScoreResponse {
  propertyId: string;
  investmentScore: number;
  grade: string;
  metrics: {
    capRate: number;
    cashOnCashReturn: number;
    coCReturn5yr: number;
    appreciationForecast5yr: number;
  };
  pros: string[];
  cons: string[];
  recommendation: string;
}

export class PropertyTwinService {
  /**
   * Create a new property twin
   */
  async create(dto: CreatePropertyTwinDTO): Promise<IPropertyTwin> {
    logger.info(`Creating property twin for propertyId: ${dto.propertyId}`);

    // Check if property twin already exists
    const existingTwin = await PropertyTwin.findOne({ propertyId: dto.propertyId });
    if (existingTwin) {
      throw new Error(`Property twin with propertyId ${dto.propertyId} already exists`);
    }

    // Generate twinId if not provided
    const twinId = dto.twinId || `twin.realestate.property.${uuidv4()}`;

    const propertyTwin = new PropertyTwin({
      twinId,
      propertyId: dto.propertyId,
      listing: {
        listingId: dto.listing?.listingId || `listing.${uuidv4()}`,
        status: dto.listing?.status || 'active',
        listingDate: dto.listing?.listingDate ? new Date(dto.listing.listingDate) : new Date(),
        listingPrice: dto.listing?.listingPrice,
        askingPrice: dto.listing?.askingPrice,
        priceHistory: dto.listing?.priceHistory || [],
        daysOnMarket: dto.listing?.daysOnMarket || 0,
      },
      location: dto.location,
      physical: dto.physical,
      features: dto.features || {
        interior: [],
        exterior: [],
        energy: [],
        smartHome: [],
        accessibility: [],
      },
      condition: dto.condition || {
        overall: 'good',
      },
      financial: dto.financial || {},
      market: dto.market || {
        priceTrend: 'stable',
        marketTemperature: 'warm',
      },
      media: dto.media || {
        photos: [],
        videos: [],
        documents: [],
      },
      ownership: dto.ownership || {
        ownerType: 'individual',
      },
      agent: dto.agent || {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActivity: new Date(),
        twinVersion: '1.0.0',
        twinType: 'property',
        source: 'api',
      },
      tags: dto.tags || [],
      status: dto.status || 'active',
    });

    await propertyTwin.save();
    logger.info(`Property twin created successfully: ${propertyTwin.twinId}`);
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
   * Get property twin by twinId
   */
  async getByTwinId(twinId: string): Promise<IPropertyTwin | null> {
    logger.debug(`Getting property twin for twinId: ${twinId}`);
    return PropertyTwin.findOne({ twinId });
  }

  /**
   * Get property twin by ID (non-archived)
   */
  async getByIdActive(propertyId: string): Promise<IPropertyTwin | null> {
    return PropertyTwin.findOne({ propertyId, status: { $ne: 'archived' } });
  }

  /**
   * Update property twin
   */
  async update(propertyId: string, updates: UpdatePropertyTwinDTO): Promise<IPropertyTwin | null> {
    logger.info(`Updating property twin for propertyId: ${propertyId}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    // Apply updates
    if (updates.listing) {
      propertyTwin.listing = { ...propertyTwin.listing, ...updates.listing };
    }
    if (updates.location) {
      propertyTwin.location = { ...propertyTwin.location, ...updates.location };
    }
    if (updates.physical) {
      propertyTwin.physical = { ...propertyTwin.physical, ...updates.physical };
    }
    if (updates.features) {
      propertyTwin.features = { ...propertyTwin.features, ...updates.features };
    }
    if (updates.condition) {
      propertyTwin.condition = { ...propertyTwin.condition, ...updates.condition };
    }
    if (updates.financial) {
      propertyTwin.financial = { ...propertyTwin.financial, ...updates.financial };
    }
    if (updates.market) {
      propertyTwin.market = { ...propertyTwin.market, ...updates.market };
    }
    if (updates.media) {
      propertyTwin.media = { ...propertyTwin.media, ...updates.media };
    }
    if (updates.ownership) {
      propertyTwin.ownership = { ...propertyTwin.ownership, ...updates.ownership };
    }
    if (updates.agent) {
      propertyTwin.agent = { ...propertyTwin.agent, ...updates.agent };
    }
    if (updates.tags) {
      propertyTwin.tags = updates.tags;
    }
    if (updates.status) {
      propertyTwin.status = updates.status;
    }

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    logger.info(`Property twin updated: ${propertyId}`);
    return propertyTwin;
  }

  /**
   * Update listing status
   */
  async updateListingStatus(
    propertyId: string,
    status: IPropertyTwin['listing']['status']
  ): Promise<IPropertyTwin | null> {
    logger.info(`Updating listing status for propertyId: ${propertyId} to ${status}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    // Add to price history if price changed
    if (status === 'sold' && propertyTwin.listing.listingPrice) {
      propertyTwin.listing.priceHistory.push({
        price: propertyTwin.listing.listingPrice,
        date: new Date(),
        event: 'price_change',
      });
    }

    propertyTwin.listing.status = status;
    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    return propertyTwin;
  }

  /**
   * Update price
   */
  async updatePrice(propertyId: string, newPrice: number): Promise<IPropertyTwin | null> {
    logger.info(`Updating price for propertyId: ${propertyId} to ${newPrice}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    // Add to price history
    propertyTwin.listing.priceHistory.push({
      price: newPrice,
      date: new Date(),
      event: 'price_change',
    });

    propertyTwin.listing.askingPrice = newPrice;
    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    return propertyTwin;
  }

  /**
   * Add media to property
   */
  async addMedia(
    propertyId: string,
    mediaType: 'photos' | 'videos' | 'documents',
    urls: string[]
  ): Promise<IPropertyTwin | null> {
    logger.info(`Adding ${mediaType} to propertyId: ${propertyId}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    if (mediaType === 'photos') {
      propertyTwin.media.photos.push(...urls);
    } else if (mediaType === 'videos') {
      propertyTwin.media.videos.push(...urls);
    } else if (mediaType === 'documents') {
      propertyTwin.media.documents.push(...urls);
    }

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    return propertyTwin;
  }

  /**
   * Add 3D tour URL
   */
  async addThreeDTour(propertyId: string, tourUrl: string): Promise<IPropertyTwin | null> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    propertyTwin.media.threeDTourUrl = tourUrl;
    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    return propertyTwin;
  }

  /**
   * Add floor plan URL
   */
  async addFloorPlan(propertyId: string, floorPlanUrl: string): Promise<IPropertyTwin | null> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    propertyTwin.media.floorPlanUrl = floorPlanUrl;
    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    return propertyTwin;
  }

  /**
   * Update agent assignment
   */
  async updateAgent(
    propertyId: string,
    agentData: { listingAgentId?: string; coAgentId?: string | null; brokerageId?: string }
  ): Promise<IPropertyTwin | null> {
    logger.info(`Updating agent for propertyId: ${propertyId}`);

    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    if (agentData.listingAgentId) {
      propertyTwin.agent.listingAgentId = agentData.listingAgentId;
    }
    if (agentData.coAgentId !== undefined) {
      propertyTwin.agent.coAgentId = agentData.coAgentId;
    }
    if (agentData.brokerageId) {
      propertyTwin.agent.brokerageId = agentData.brokerageId;
    }

    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    return propertyTwin;
  }

  /**
   * Query properties with filters
   */
  async query(filters: PropertyTwinFilters): Promise<{ properties: IPropertyTwin[]; total: number }> {
    const {
      city,
      state,
      postalCode,
      propertyType,
      status,
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      minSqft,
      maxSqft,
      areaId,
      neighborhood,
      tags,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = filters;

    const query: Record<string, unknown> = {};

    if (city) query['location.address.city'] = city;
    if (state) query['location.address.state'] = state;
    if (postalCode) query['location.address.postalCode'] = postalCode;
    if (propertyType) query['physical.propertyType'] = propertyType;
    if (status) query['listing.status'] = status;
    if (areaId) query['location.areaId'] = areaId;
    if (neighborhood) query['location.neighborhood'] = neighborhood;

    if (minPrice !== undefined || maxPrice !== undefined) {
      query['listing.listingPrice'] = {};
      if (minPrice !== undefined) {
        (query['listing.listingPrice'] as Record<string, number>).$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (query['listing.listingPrice'] as Record<string, number>).$lte = maxPrice;
      }
    }

    if (minBedrooms !== undefined) query['physical.bedrooms'] = { $gte: minBedrooms };
    if (maxBedrooms !== undefined) {
      query['physical.bedrooms'] = {
        ...(query['physical.bedrooms'] as object || {}),
        $lte: maxBedrooms,
      };
    }

    if (minBathrooms !== undefined) query['physical.bathrooms'] = { $gte: minBathrooms };
    if (maxBathrooms !== undefined) {
      query['physical.bathrooms'] = {
        ...(query['physical.bathrooms'] as object || {}),
        $lte: maxBathrooms,
      };
    }

    if (minSqft !== undefined) query['physical.interiorSqft'] = { $gte: minSqft };
    if (maxSqft !== undefined) {
      query['physical.interiorSqft'] = {
        ...(query['physical.interiorSqft'] as object || {}),
        $lte: maxSqft,
      };
    }

    if (tags && tags.length > 0) query.tags = { $in: tags };

    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions: Record<string, 1 | -1> = {};
    sortOptions[sortBy === 'daysOnMarket' ? 'listing.daysOnMarket' : sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [properties, total] = await Promise.all([
      PropertyTwin.find(query).skip(offset).limit(limit).sort(sortOptions),
      PropertyTwin.countDocuments(query),
    ]);

    return { properties, total };
  }

  /**
   * Search properties by text
   */
  async search(query: string, limit = 20): Promise<IPropertyTwin[]> {
    return PropertyTwin.find(
      { $text: { $search: query }, 'listing.status': 'active' },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);
  }

  /**
   * Get active listings
   */
  async getActiveListings(): Promise<IPropertyTwin[]> {
    return PropertyTwin.findActive();
  }

  /**
   * Get properties by area
   */
  async getByArea(areaId: string): Promise<IPropertyTwin[]> {
    return PropertyTwin.find({ 'location.areaId': areaId, 'listing.status': 'active' });
  }

  /**
   * Get properties by agent
   */
  async getByAgent(agentId: string): Promise<IPropertyTwin[]> {
    return PropertyTwin.find({
      $or: [
        { 'agent.listingAgentId': agentId },
        { 'agent.coAgentId': agentId },
      ],
    });
  }

  /**
   * Get properties by price range
   */
  async getByPriceRange(minPrice: number, maxPrice: number): Promise<IPropertyTwin[]> {
    return PropertyTwin.findByPriceRange(minPrice, maxPrice);
  }

  /**
   * Get recent listings
   */
  async getRecentListings(limit = 10): Promise<IPropertyTwin[]> {
    return PropertyTwin.find({ 'listing.status': 'active' })
      .sort({ 'listing.listingDate': -1 })
      .limit(limit);
  }

  /**
   * Get price per sqft stats
   */
  async getPricePerSqftStats(city?: string): Promise<{ avg: number; min: number; max: number }> {
    const matchStage: Record<string, unknown> = { 'listing.status': 'active' };
    if (city) {
      matchStage['location.address.city'] = city;
    }

    const result = await PropertyTwin.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          pricePerSqft: {
            $cond: {
              if: { $and: [{ $gt: ['$physical.interiorSqft', 0] }, '$listing.listingPrice'] },
              then: { $divide: ['$listing.listingPrice', '$physical.interiorSqft'] },
              else: null,
            },
          },
        },
      },
      {
        $match: { pricePerSqft: { $ne: null } },
      },
      {
        $group: {
          _id: null,
          avg: { $avg: '$pricePerSqft' },
          min: { $min: '$pricePerSqft' },
          max: { $max: '$pricePerSqft' },
        },
      },
    ]);

    if (result.length === 0) {
      return { avg: 0, min: 0, max: 0 };
    }

    return {
      avg: Math.round(result[0].avg * 100) / 100,
      min: Math.round(result[0].min * 100) / 100,
      max: Math.round(result[0].max * 100) / 100,
    };
  }

  /**
   * Get market statistics
   */
  async getMarketStats(city?: string): Promise<{
    totalListings: number;
    avgPrice: number;
    avgDaysOnMarket: number;
    byPropertyType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const matchStage: Record<string, unknown> = {};
    if (city) {
      matchStage['location.address.city'] = city;
    }

    const result = await PropertyTwin.aggregate([
      { $match: matchStage },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalListings: { $sum: 1 },
                avgPrice: { $avg: '$listing.listingPrice' },
                avgDaysOnMarket: { $avg: '$listing.daysOnMarket' },
              },
            },
          ],
          byPropertyType: [
            { $group: { _id: '$physical.propertyType', count: { $sum: 1 } } },
          ],
          byStatus: [
            { $group: { _id: '$listing.status', count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const overview = result[0]?.overview[0] || { totalListings: 0, avgPrice: 0, avgDaysOnMarket: 0 };
    const byPropertyType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    (result[0]?.byPropertyType || []).forEach((item: { _id: string; count: number }) => {
      byPropertyType[item._id] = item.count;
    });

    (result[0]?.byStatus || []).forEach((item: { _id: string; count: number }) => {
      byStatus[item._id] = item.count;
    });

    return {
      totalListings: overview.totalListings,
      avgPrice: Math.round(overview.avgPrice),
      avgDaysOnMarket: Math.round(overview.avgDaysOnMarket),
      byPropertyType,
      byStatus,
    };
  }

  /**
   * Get PropFlow insights for a property
   */
  async getPropflowInsights(propertyId: string): Promise<{
    investmentScore: number;
    grade: string;
    priceEstimate: number;
    confidenceScore: number;
    factors: Array<{ factor: string; impact: string; description: string }>;
  } | null> {
    const propertyTwin = await PropertyTwin.findOne({ propertyId });
    if (!propertyTwin) {
      return null;
    }

    // Simulated PropFlow insights - in production, this would call an actual ML service
    const baseScore = 70;
    let investmentScore = baseScore;
    const factors: Array<{ factor: string; impact: string; description: string }> = [];

    // Adjust score based on condition
    if (propertyTwin.condition.overall === 'excellent') {
      investmentScore += 10;
      factors.push({ factor: 'condition', impact: 'positive', description: 'Property is in excellent condition' });
    } else if (propertyTwin.condition.overall === 'poor') {
      investmentScore -= 15;
      factors.push({ factor: 'condition', impact: 'negative', description: 'Property needs significant repairs' });
    }

    // Adjust based on market temperature
    if (propertyTwin.market.marketTemperature === 'hot') {
      investmentScore += 5;
      factors.push({ factor: 'market', impact: 'positive', description: 'Hot market with high demand' });
    } else if (propertyTwin.market.marketTemperature === 'cold') {
      investmentScore -= 5;
      factors.push({ factor: 'market', impact: 'negative', description: 'Cold market with lower demand' });
    }

    // Adjust based on price trend
    if (propertyTwin.market.priceTrend === 'increasing') {
      investmentScore += 5;
      factors.push({ factor: 'appreciation', impact: 'positive', description: 'Area shows increasing price trend' });
    }

    // Adjust based on days on market
    const daysOnMarket = propertyTwin.getDaysOnMarket();
    if (daysOnMarket > 90) {
      investmentScore -= 5;
      factors.push({ factor: 'dom', impact: 'negative', description: 'Property has been on market for extended period' });
    }

    // Ensure score is within bounds
    investmentScore = Math.max(0, Math.min(100, investmentScore));

    // Calculate grade
    let grade: string;
    if (investmentScore >= 90) grade = 'A+';
    else if (investmentScore >= 80) grade = 'A';
    else if (investmentScore >= 70) grade = 'B+';
    else if (investmentScore >= 60) grade = 'B';
    else if (investmentScore >= 50) grade = 'C';
    else grade = 'D';

    // Price estimate (simplified)
    const priceEstimate = propertyTwin.financial.propflowEstimate || propertyTwin.listing.listingPrice;
    const confidenceScore = 0.85;

    return {
      investmentScore,
      grade,
      priceEstimate: priceEstimate || 0,
      confidenceScore,
      factors,
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

    propertyTwin.status = 'archived';
    propertyTwin.metadata.lastActivity = new Date();
    await propertyTwin.save();

    logger.info(`Property twin archived: ${propertyId}`);
    return propertyTwin;
  }

  /**
   * Delete property twin
   */
  async delete(propertyId: string): Promise<boolean> {
    logger.info(`Deleting property twin for propertyId: ${propertyId}`);

    const result = await PropertyTwin.deleteOne({ propertyId });
    if (result.deletedCount === 0) {
      throw new Error(`Property twin not found for propertyId: ${propertyId}`);
    }

    logger.info(`Property twin deleted: ${propertyId}`);
    return true;
  }
}

export const propertyTwinService = new PropertyTwinService();
