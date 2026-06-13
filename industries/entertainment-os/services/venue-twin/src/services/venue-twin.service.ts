import { v4 as uuidv4 } from 'uuid';
import { VenueTwinModel, IVenueTwin } from '../models/index.js';
import {
  CreateVenueTwinRequest,
  UpdateVenueTwinRequest,
  UpdateOperationalMetricsRequest,
  UpdateDOOHConfigRequest,
  UpdateAudienceProfileRequest,
} from '../schemas/index.js';
import { logger } from '../utils/index.js';

// ============================================================================
// TYPES
// ============================================================================

export interface VenueTwinQuery {
  page?: number;
  limit?: number;
  venue_type?: string;
  city?: string;
  country?: string;
  min_capacity?: number;
  has_dooh?: boolean;
}

export interface VenueTwinListResult {
  twins: IVenueTwin[];
  total: number;
  page: number;
  limit: number;
}

export interface VenueTwinStats {
  total_venues: number;
  avg_occupancy: number;
  total_capacity: number;
  by_venue_type: Record<string, { count: number; capacity: number }>;
  top_performers: Array<{ venue_id: string; name: string; occupancy_rate: number }>;
}

// ============================================================================
// VENUE TWIN SERVICE
// ============================================================================

export class VenueTwinService {
  // ============================================================================
  // CREATE
  // ============================================================================

  async create(data: CreateVenueTwinRequest): Promise<IVenueTwin> {
    const venueId = `venue.${Date.now()}.${uuidv4().substring(0, 8)}`;
    const twinId = `twin.entertainment.venue.${uuidv4()}`;

    const twin = new VenueTwinModel({
      venue_id: venueId,
      twin_id: twinId,
      name: data.name,
      description: data.description,
      venue_type: data.venue_type,
      attributes: data.attributes || {
        location: {
          address: '',
          city: '',
          country: '',
          coordinates: { latitude: 0, longitude: 0 },
        },
        capacity: { max_occupancy: 0, current_capacity: 0, vip_capacity: 0, standing_room: 0 },
        amenities: [],
        technology: { dooh_screens: 0, qr_code_readers: 0, wifi_enabled: false, camera_count: 0 },
        operating_hours: { schedule: [] },
      },
      operational_metrics: {
        occupancy_rate: 0,
        avg_dwell_time: 0,
        peak_hours: [],
        event_frequency: 0,
        customer_satisfaction: 0,
      },
      audience_profile: {
        primary_segments: [],
        avg_age: 0,
        gender_split: { male: 0, female: 0, other: 0 },
      },
      dooh_configuration: {
        screen_count: 0,
        screen_locations: [],
        avg_dwell_time: 0,
        viewability: 0,
      },
      relationships: data.relationships || {
        audiences: [],
        events: [],
        creators: [],
        brands: [],
      },
    });

    await twin.save();
    logger.info('Venue twin created', { venue_id: venueId, twin_id: twinId });

    return twin;
  }

  // ============================================================================
  // READ
  // ============================================================================

  async getById(id: string): Promise<IVenueTwin | null> {
    return VenueTwinModel.findOne({
      $or: [
        { venue_id: id },
        { twin_id: id },
        { _id: id },
      ],
    });
  }

  async getByVenueId(venueId: string): Promise<IVenueTwin | null> {
    return VenueTwinModel.findOne({ venue_id: venueId });
  }

  async list(query: VenueTwinQuery): Promise<VenueTwinListResult> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.venue_type) filter.venue_type = query.venue_type;
    if (query.city) filter['attributes.location.city'] = query.city;
    if (query.country) filter['attributes.location.country'] = query.country;
    if (query.min_capacity) filter['attributes.capacity.max_occupancy'] = { $gte: query.min_capacity };
    if (query.has_dooh) filter['attributes.technology.dooh_screens'] = { $gt: 0 };

    const [twins, total] = await Promise.all([
      VenueTwinModel.find(filter).skip(skip).limit(limit).sort({ created_at: -1 }),
      VenueTwinModel.countDocuments(filter),
    ]);

    return { twins, total, page, limit };
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number, limit = 10): Promise<IVenueTwin[]> {
    return VenueTwinModel.find({
      'attributes.location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(limit);
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  async update(id: string, data: UpdateVenueTwinRequest): Promise<IVenueTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.name) twin.name = data.name;
    if (data.description !== undefined) twin.description = data.description;
    if (data.attributes) {
      if (data.attributes.location) {
        Object.assign(twin.attributes.location, data.attributes.location);
      }
      if (data.attributes.capacity) {
        Object.assign(twin.attributes.capacity, data.attributes.capacity);
      }
      if (data.attributes.amenities) {
        twin.attributes.amenities = data.attributes.amenities;
      }
      if (data.attributes.technology) {
        Object.assign(twin.attributes.technology, data.attributes.technology);
      }
    }

    twin.version += 1;
    await twin.save();
    logger.info('Venue twin updated', { venue_id: twin.venue_id });

    return twin;
  }

  async updateOperationalMetrics(id: string, data: UpdateOperationalMetricsRequest): Promise<IVenueTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.occupancy_rate !== undefined) twin.operational_metrics.occupancy_rate = data.occupancy_rate;
    if (data.avg_dwell_time !== undefined) twin.operational_metrics.avg_dwell_time = data.avg_dwell_time;
    if (data.peak_hours) twin.operational_metrics.peak_hours = data.peak_hours;
    if (data.revenue_per_sqft !== undefined) twin.operational_metrics.revenue_per_sqft = data.revenue_per_sqft;
    if (data.event_frequency !== undefined) twin.operational_metrics.event_frequency = data.event_frequency;
    if (data.customer_satisfaction !== undefined) twin.operational_metrics.customer_satisfaction = data.customer_satisfaction;

    twin.version += 1;
    await twin.save();
    logger.info('Venue operational metrics updated', { venue_id: twin.venue_id });

    return twin;
  }

  async updateDOOHConfig(id: string, data: UpdateDOOHConfigRequest): Promise<IVenueTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.screen_count !== undefined) twin.dooh_configuration.screen_count = data.screen_count;
    if (data.screen_locations) twin.dooh_configuration.screen_locations = data.screen_locations;
    if (data.avg_dwell_time !== undefined) twin.dooh_configuration.avg_dwell_time = data.avg_dwell_time;
    if (data.viewability !== undefined) twin.dooh_configuration.viewability = data.viewability;

    twin.version += 1;
    await twin.save();
    logger.info('Venue DOOH config updated', { venue_id: twin.venue_id });

    return twin;
  }

  async updateAudienceProfile(id: string, data: UpdateAudienceProfileRequest): Promise<IVenueTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.primary_segments) twin.audience_profile.primary_segments = data.primary_segments;
    if (data.avg_age !== undefined) twin.audience_profile.avg_age = data.avg_age;
    if (data.gender_split) {
      if (data.gender_split.male !== undefined) twin.audience_profile.gender_split.male = data.gender_split.male;
      if (data.gender_split.female !== undefined) twin.audience_profile.gender_split.female = data.gender_split.female;
      if (data.gender_split.other !== undefined) twin.audience_profile.gender_split.other = data.gender_split.other;
    }
    if (data.income_bracket) twin.audience_profile.income_bracket = data.income_bracket;

    twin.version += 1;
    await twin.save();
    logger.info('Venue audience profile updated', { venue_id: twin.venue_id });

    return twin;
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  async delete(id: string): Promise<boolean> {
    const result = await VenueTwinModel.deleteOne({
      $or: [
        { venue_id: id },
        { twin_id: id },
        { _id: id },
      ],
    });
    return result.deletedCount > 0;
  }

  // ============================================================================
  // STATS
  // ============================================================================

  async getStats(): Promise<VenueTwinStats> {
    const pipeline = [
      {
        $group: {
          _id: '$venue_type',
          count: { $sum: 1 },
          total_capacity: { $sum: '$attributes.capacity.max_occupancy' },
          avg_occupancy: { $avg: '$operational_metrics.occupancy_rate' },
        },
      },
      { $sort: { count: -1 } },
    ];

    const results = await VenueTwinModel.aggregate(pipeline);

    const byVenueType: Record<string, { count: number; capacity: number }> = {};
    let totalVenues = 0;
    let totalCapacity = 0;
    let totalOccupancy = 0;

    for (const result of results) {
      byVenueType[result._id] = { count: result.count, capacity: result.total_capacity };
      totalVenues += result.count;
      totalCapacity += result.total_capacity;
      totalOccupancy += result.avg_occupancy || 0;
    }

    const topPerformers = await VenueTwinModel.find()
      .sort({ 'operational_metrics.occupancy_rate': -1 })
      .limit(5)
      .select('venue_id name operational_metrics.occupancy_rate');

    return {
      total_venues: totalVenues,
      avg_occupancy: results.length > 0 ? totalOccupancy / results.length : 0,
      total_capacity: totalCapacity,
      by_venue_type: byVenueType,
      top_performers: topPerformers.map(v => ({
        venue_id: v.venue_id,
        name: v.name,
        occupancy_rate: v.operational_metrics.occupancy_rate,
      })),
    };
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getDOOHInventory(venueId: string): Promise<{
    screen_count: number;
    total_daily_impressions: number;
    screens: Array<{ screen_id: string; location: string; daily_impressions: number }>;
  }> {
    const venue = await this.getById(venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }

    return {
      screen_count: venue.dooh_configuration.screen_count,
      total_daily_impressions: venue.dooh_configuration.screen_locations.reduce((sum, s) => sum + (s.daily_impressions || 0), 0),
      screens: venue.dooh_configuration.screen_locations.map(s => ({
        screen_id: s.screen_id,
        location: s.location,
        daily_impressions: s.daily_impressions,
      })),
    };
  }

  async getAudienceAffinity(venueId: string): Promise<Array<{ audience_id: string; affinity_score: number }>> {
    const venue = await this.getById(venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }

    return venue.relationships.audiences
      .map(a => ({
        audience_id: a.audience_id,
        affinity_score: a.affinity_score || 0,
      }))
      .sort((a, b) => b.affinity_score - a.affinity_score);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const venueTwinService = new VenueTwinService();