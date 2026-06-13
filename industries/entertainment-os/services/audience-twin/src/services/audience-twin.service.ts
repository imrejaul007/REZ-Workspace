import { v4 as uuidv4 } from 'uuid';
import { AudienceTwinModel, IAudienceTwin } from '../models/index.js';
import {
  CreateAudienceTwinRequest,
  UpdateAudienceTwinRequest,
  UpdateEngagementRequest,
  UpdateSizeEstimateRequest,
  UpdateRelationshipsRequest,
} from '../schemas/index.js';
import { logger } from '../utils/index.js';

// ============================================================================
// TYPES
// ============================================================================

export interface AudienceTwinQuery {
  page?: number;
  limit?: number;
  segment_type?: string;
  audience_id?: string;
  min_reach?: number;
  max_reach?: number;
}

export interface AudienceTwinListResult {
  twins: IAudienceTwin[];
  total: number;
  page: number;
  limit: number;
}

export interface AudienceTwinStats {
  total_segments: number;
  total_reach: number;
  avg_engagement: number;
  avg_sentiment: number;
  by_segment_type: Record<string, { count: number; reach: number }>;
}

// ============================================================================
// AUDIENCE TWIN SERVICE
// ============================================================================

export class AudienceTwinService {
  // ============================================================================
  // CREATE
  // ============================================================================

  async create(data: CreateAudienceTwinRequest): Promise<IAudienceTwin> {
    const audienceId = `audience.${Date.now()}.${uuidv4().substring(0, 8)}`;
    const twinId = `twin.entertainment.audience.${uuidv4()}`;

    const twin = new AudienceTwinModel({
      audience_id: audienceId,
      twin_id: twinId,
      name: data.name,
      description: data.description,
      segment_type: data.segment_type,
      attributes: data.attributes || {
        demographics: { age_ranges: [], gender: [], income_brackets: [], education_levels: [], geographic_focus: [] },
        psychographics: { interests: [], values: [], lifestyle: [] },
        behavioral: { brand_loyalty: 0, engagement_level: 'medium', media_consumption: { social: 0, streaming: 0, broadcast: 0, print: 0 } },
      },
      size_estimate: {
        total_reach: 0,
        confidence: 0,
        last_updated: new Date(),
      },
      engagement_metrics: {
        avg_session_duration: 0,
        content_interactions: 0,
        conversion_rate: 0,
        nps: 0,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
      },
      relationships: data.relationships || { venues: [], events: [], creators: [] },
    });

    await twin.save();
    logger.info('Audience twin created', { audience_id: audienceId, twin_id: twinId });

    return twin;
  }

  // ============================================================================
  // READ
  // ============================================================================

  async getById(id: string): Promise<IAudienceTwin | null> {
    return AudienceTwinModel.findOne({
      $or: [
        { audience_id: id },
        { twin_id: id },
        { _id: id },
      ],
    });
  }

  async getByTwinId(twinId: string): Promise<IAudienceTwin | null> {
    return AudienceTwinModel.findOne({ twin_id: twinId });
  }

  async getByAudienceId(audienceId: string): Promise<IAudienceTwin | null> {
    return AudienceTwinModel.findOne({ audience_id: audienceId });
  }

  async list(query: AudienceTwinQuery): Promise<AudienceTwinListResult> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.segment_type) {
      filter.segment_type = query.segment_type;
    }
    if (query.audience_id) {
      filter.audience_id = query.audience_id;
    }
    if (query.min_reach !== undefined) {
      filter['size_estimate.total_reach'] = { $gte: query.min_reach };
    }
    if (query.max_reach !== undefined) {
      filter['size_estimate.total_reach'] = { ...filter['size_estimate.total_reach'] as object, $lte: query.max_reach };
    }

    const [twins, total] = await Promise.all([
      AudienceTwinModel.find(filter).skip(skip).limit(limit).sort({ created_at: -1 }),
      AudienceTwinModel.countDocuments(filter),
    ]);

    return { twins, total, page, limit };
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  async update(id: string, data: UpdateAudienceTwinRequest): Promise<IAudienceTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.name) twin.name = data.name;
    if (data.description !== undefined) twin.description = data.description;
    if (data.attributes) {
      if (data.attributes.demographics) {
        Object.assign(twin.attributes.demographics, data.attributes.demographics);
      }
      if (data.attributes.psychographics) {
        Object.assign(twin.attributes.psychographics, data.attributes.psychographics);
      }
      if (data.attributes.behavioral) {
        Object.assign(twin.attributes.behavioral, data.attributes.behavioral);
      }
    }

    twin.version += 1;
    await twin.save();
    logger.info('Audience twin updated', { audience_id: twin.audience_id });

    return twin;
  }

  async updateEngagement(id: string, data: UpdateEngagementRequest): Promise<IAudienceTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.avg_session_duration !== undefined) {
      twin.engagement_metrics.avg_session_duration = data.avg_session_duration;
    }
    if (data.content_interactions !== undefined) {
      twin.engagement_metrics.content_interactions = data.content_interactions;
    }
    if (data.conversion_rate !== undefined) {
      twin.engagement_metrics.conversion_rate = data.conversion_rate;
    }
    if (data.nps !== undefined) {
      twin.engagement_metrics.nps = data.nps;
    }
    if (data.sentiment) {
      if (data.sentiment.positive !== undefined) {
        twin.engagement_metrics.sentiment.positive = data.sentiment.positive;
      }
      if (data.sentiment.neutral !== undefined) {
        twin.engagement_metrics.sentiment.neutral = data.sentiment.neutral;
      }
      if (data.sentiment.negative !== undefined) {
        twin.engagement_metrics.sentiment.negative = data.sentiment.negative;
      }
    }

    twin.version += 1;
    await twin.save();
    logger.info('Audience engagement updated', { audience_id: twin.audience_id });

    return twin;
  }

  async updateSizeEstimate(id: string, data: UpdateSizeEstimateRequest): Promise<IAudienceTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.total_reach !== undefined) {
      twin.size_estimate.total_reach = data.total_reach;
    }
    if (data.confidence !== undefined) {
      twin.size_estimate.confidence = data.confidence;
    }
    twin.size_estimate.last_updated = new Date();

    twin.version += 1;
    await twin.save();
    logger.info('Audience size estimate updated', { audience_id: twin.audience_id });

    return twin;
  }

  async updateRelationships(id: string, data: UpdateRelationshipsRequest): Promise<IAudienceTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.venues) twin.relationships.venues = data.venues;
    if (data.events) twin.relationships.events = data.events;
    if (data.creators) twin.relationships.creators = data.creators;

    twin.version += 1;
    await twin.save();
    logger.info('Audience relationships updated', { audience_id: twin.audience_id });

    return twin;
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  async delete(id: string): Promise<boolean> {
    const result = await AudienceTwinModel.deleteOne({
      $or: [
        { audience_id: id },
        { twin_id: id },
        { _id: id },
      ],
    });
    return result.deletedCount > 0;
  }

  // ============================================================================
  // STATS
  // ============================================================================

  async getStats(): Promise<AudienceTwinStats> {
    const pipeline = [
      {
        $group: {
          _id: '$segment_type',
          count: { $sum: 1 },
          total_reach: { $sum: '$size_estimate.total_reach' },
          avg_engagement: { $avg: '$engagement_metrics.conversion_rate' },
          avg_positive_sentiment: { $avg: '$engagement_metrics.sentiment.positive' },
        },
      },
    ];

    const results = await AudienceTwinModel.aggregate(pipeline);

    const bySegmentType: Record<string, { count: number; reach: number }> = {};
    let totalSegments = 0;
    let totalReach = 0;
    let totalEngagement = 0;
    let totalSentiment = 0;

    for (const result of results) {
      bySegmentType[result._id] = { count: result.count, reach: result.total_reach };
      totalSegments += result.count;
      totalReach += result.total_reach;
      totalEngagement += result.avg_engagement || 0;
      totalSentiment += result.avg_positive_sentiment || 0;
    }

    return {
      total_segments: totalSegments,
      total_reach: totalReach,
      avg_engagement: results.length > 0 ? totalEngagement / results.length : 0,
      avg_sentiment: results.length > 0 ? totalSentiment / results.length : 0,
      by_segment_type: bySegmentType,
    };
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getAudienceOverlap(audienceIds: string[]): Promise<Array<{ venue_id: string; overlap_count: number }>> {
    const audiences = await AudienceTwinModel.find({
      audience_id: { $in: audienceIds },
    }).select('relationships.venues.venue_id');

    const venueCounts: Record<string, number> = {};

    for (const audience of audiences) {
      for (const venue of audience.relationships.venues) {
        venueCounts[venue.venue_id] = (venueCounts[venue.venue_id] || 0) + 1;
      }
    }

    return Object.entries(venueCounts)
      .map(([venue_id, overlap_count]) => ({ venue_id, overlap_count }))
      .sort((a, b) => b.overlap_count - a.overlap_count);
  }

  async findSimilarAudiences(audienceId: string, limit = 10): Promise<IAudienceTwin[]> {
    const source = await this.getById(audienceId);
    if (!source) return [];

    const targetInterests = source.attributes.psychographics?.interests || [];
    const targetAgeRanges = source.attributes.demographics?.age_ranges || [];

    const candidates = await AudienceTwinModel.find({
      audience_id: { $ne: audienceId },
      segment_type: source.segment_type,
    });

    const scored = candidates.map(candidate => {
      let score = 0;

      const candidateInterests = candidate.attributes.psychographics?.interests || [];
      const interestOverlap = candidateInterests.filter(i => targetInterests.includes(i)).length;
      score += interestOverlap * 10;

      const candidateAgeRanges = candidate.attributes.demographics?.age_ranges || [];
      const ageOverlap = candidateAgeRanges.filter(a => targetAgeRanges.includes(a)).length;
      score += ageOverlap * 5;

      return { candidate, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.candidate);
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const audienceTwinService = new AudienceTwinService();