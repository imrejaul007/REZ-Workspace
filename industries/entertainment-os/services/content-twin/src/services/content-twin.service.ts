import { v4 as uuidv4 } from 'uuid';
import { ContentTwinModel, IContentTwin } from '../models/index.js';
import {
  CreateContentTwinRequest,
  UpdateContentTwinRequest,
  UpdatePerformanceRequest,
  UpdateAudienceAlignmentRequest,
  AddPlacementRequest,
} from '../schemas/index.js';
import { logger } from '../utils/index.js';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentTwinQuery {
  page?: number;
  limit?: number;
  content_type?: string;
  genre?: string;
  min_views?: number;
  min_engagement?: number;
}

export interface ContentTwinListResult {
  twins: IContentTwin[];
  total: number;
  page: number;
  limit: number;
}

export interface ContentTwinStats {
  total_content: number;
  total_views: number;
  avg_engagement: number;
  by_content_type: Record<string, { count: number; views: number }>;
  top_performers: Array<{ content_id: string; title: string; views: number; engagement_score: number }>;
}

// ============================================================================
// CONTENT TWIN SERVICE
// ============================================================================

export class ContentTwinService {
  // ============================================================================
  // CREATE
  // ============================================================================

  async create(data: CreateContentTwinRequest): Promise<IContentTwin> {
    const contentId = `content.${Date.now()}.${uuidv4().substring(0, 8)}`;
    const twinId = `twin.entertainment.content.${uuidv4()}`;

    const twin = new ContentTwinModel({
      content_id: contentId,
      twin_id: twinId,
      title: data.title,
      description: data.description,
      content_type: data.content_type,
      attributes: data.attributes || {
        genre: [],
        mood: [],
        theme: [],
        language: [],
        target_age: { min: 0, max: 100 },
        production_quality: 'medium',
        metadata: {},
      },
      performance_metrics: {
        views: 0,
        unique_viewers: 0,
        avg_watch_time: 0,
        completion_rate: 0,
        engagement_score: 0,
        share_count: 0,
        comment_count: 0,
        save_count: 0,
        revenue: 0,
        roi: 0,
      },
      audience_alignment: {
        primary_audience: [],
        secondary_audience: [],
        demographic_match: 0,
        intent_match: 0,
      },
      rights_management: {
        territories: [],
        platforms: [],
        exclusivity: { exclusive: false, exclusive_platforms: [] },
        licensing_status: 'unknown',
      },
      placements: [],
      relationships: data.relationships || {
        creators: [],
        events: [],
        brands: [],
      },
    });

    await twin.save();
    logger.info('Content twin created', { content_id: contentId, twin_id: twinId });

    return twin;
  }

  // ============================================================================
  // READ
  // ============================================================================

  async getById(id: string): Promise<IContentTwin | null> {
    return ContentTwinModel.findOne({
      $or: [
        { content_id: id },
        { twin_id: id },
        { _id: id },
      ],
    });
  }

  async list(query: ContentTwinQuery): Promise<ContentTwinListResult> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.content_type) filter.content_type = query.content_type;
    if (query.genre) filter['attributes.genre'] = query.genre;
    if (query.min_views) filter['performance_metrics.views'] = { $gte: query.min_views };
    if (query.min_engagement) filter['performance_metrics.engagement_score'] = { $gte: query.min_engagement };

    const [twins, total] = await Promise.all([
      ContentTwinModel.find(filter).skip(skip).limit(limit).sort({ created_at: -1 }),
      ContentTwinModel.countDocuments(filter),
    ]);

    return { twins, total, page, limit };
  }

  async findByAudience(audienceId: string, limit = 10): Promise<IContentTwin[]> {
    return ContentTwinModel.find({
      $or: [
        { 'audience_alignment.primary_audience.audience_id': audienceId },
        { 'audience_alignment.secondary_audience.audience_id': audienceId },
      ],
    })
      .sort({ 'performance_metrics.engagement_score': -1 })
      .limit(limit);
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  async update(id: string, data: UpdateContentTwinRequest): Promise<IContentTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.title) twin.title = data.title;
    if (data.description !== undefined) twin.description = data.description;
    if (data.attributes) {
      if (data.attributes.genre) twin.attributes.genre = data.attributes.genre;
      if (data.attributes.mood) twin.attributes.mood = data.attributes.mood;
      if (data.attributes.theme) twin.attributes.theme = data.attributes.theme;
      if (data.attributes.runtime !== undefined) twin.attributes.runtime = data.attributes.runtime;
      if (data.attributes.rating !== undefined) twin.attributes.rating = data.attributes.rating;
      if (data.attributes.language) twin.attributes.language = data.attributes.language;
      if (data.attributes.target_age) {
        if (data.attributes.target_age.min !== undefined) twin.attributes.target_age.min = data.attributes.target_age.min;
        if (data.attributes.target_age.max !== undefined) twin.attributes.target_age.max = data.attributes.target_age.max;
      }
      if (data.attributes.production_quality) twin.attributes.production_quality = data.attributes.production_quality;
    }

    twin.version += 1;
    await twin.save();
    logger.info('Content twin updated', { content_id: twin.content_id });

    return twin;
  }

  async updatePerformance(id: string, data: UpdatePerformanceRequest): Promise<IContentTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.views !== undefined) twin.performance_metrics.views = data.views;
    if (data.unique_viewers !== undefined) twin.performance_metrics.unique_viewers = data.unique_viewers;
    if (data.avg_watch_time !== undefined) twin.performance_metrics.avg_watch_time = data.avg_watch_time;
    if (data.completion_rate !== undefined) twin.performance_metrics.completion_rate = data.completion_rate;
    if (data.engagement_score !== undefined) twin.performance_metrics.engagement_score = data.engagement_score;
    if (data.share_count !== undefined) twin.performance_metrics.share_count = data.share_count;
    if (data.comment_count !== undefined) twin.performance_metrics.comment_count = data.comment_count;
    if (data.save_count !== undefined) twin.performance_metrics.save_count = data.save_count;
    if (data.revenue !== undefined) twin.performance_metrics.revenue = data.revenue;
    if (data.roi !== undefined) twin.performance_metrics.roi = data.roi;

    twin.version += 1;
    await twin.save();
    logger.info('Content performance updated', { content_id: twin.content_id });

    return twin;
  }

  async updateAudienceAlignment(id: string, data: UpdateAudienceAlignmentRequest): Promise<IContentTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    if (data.primary_audience) twin.audience_alignment.primary_audience = data.primary_audience;
    if (data.secondary_audience) twin.audience_alignment.secondary_audience = data.secondary_audience;
    if (data.demographic_match !== undefined) twin.audience_alignment.demographic_match = data.demographic_match;
    if (data.intent_match !== undefined) twin.audience_alignment.intent_match = data.intent_match;

    twin.version += 1;
    await twin.save();
    logger.info('Content audience alignment updated', { content_id: twin.content_id });

    return twin;
  }

  async addPlacement(id: string, data: AddPlacementRequest): Promise<IContentTwin | null> {
    const twin = await this.getById(id);
    if (!twin) return null;

    twin.placements.push({
      venue_id: data.venue_id,
      screen_id: data.screen_id,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
      position: data.position,
    });

    twin.version += 1;
    await twin.save();
    logger.info('Content placement added', { content_id: twin.content_id, venue_id: data.venue_id });

    return twin;
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  async delete(id: string): Promise<boolean> {
    const result = await ContentTwinModel.deleteOne({
      $or: [
        { content_id: id },
        { twin_id: id },
        { _id: id },
      ],
    });
    return result.deletedCount > 0;
  }

  // ============================================================================
  // STATS
  // ============================================================================

  async getStats(): Promise<ContentTwinStats> {
    const pipeline = [
      {
        $group: {
          _id: '$content_type',
          count: { $sum: 1 },
          total_views: { $sum: '$performance_metrics.views' },
          avg_engagement: { $avg: '$performance_metrics.engagement_score' },
        },
      },
    ];

    const results = await ContentTwinModel.aggregate(pipeline);

    const byContentType: Record<string, { count: number; views: number }> = {};
    let totalContent = 0;
    let totalViews = 0;
    let totalEngagement = 0;

    for (const result of results) {
      byContentType[result._id] = { count: result.count, views: result.total_views };
      totalContent += result.count;
      totalViews += result.total_views;
      totalEngagement += result.avg_engagement || 0;
    }

    const topPerformers = await ContentTwinModel.find()
      .sort({ 'performance_metrics.views': -1 })
      .limit(5)
      .select('content_id title performance_metrics.views performance_metrics.engagement_score');

    return {
      total_content: totalContent,
      total_views: totalViews,
      avg_engagement: results.length > 0 ? totalEngagement / results.length : 0,
      by_content_type: byContentType,
      top_performers: topPerformers.map(c => ({
        content_id: c.content_id,
        title: c.title,
        views: c.performance_metrics.views,
        engagement_score: c.performance_metrics.engagement_score,
      })),
    };
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async predictPerformance(contentId: string, targetAudienceId: string): Promise<{
    predicted_views: number;
    predicted_engagement: number;
    confidence: number;
    recommendations: string[];
  }> {
    const content = await this.getById(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    const primaryMatch = content.audience_alignment.primary_audience.find(
      a => a.audience_id === targetAudienceId
    );

    const baseViews = content.performance_metrics.views;
    const baseEngagement = content.performance_metrics.engagement_score;
    const matchScore = primaryMatch?.match_score || 50;

    const predictedViews = Math.round(baseViews * (matchScore / 50));
    const predictedEngagement = Math.min(100, baseEngagement * (matchScore / 50));

    const recommendations: string[] = [];
    if (matchScore < 30) {
      recommendations.push('Consider repositioning content for better audience alignment');
    }
    if (content.performance_metrics.completion_rate < 50) {
      recommendations.push('Improve content hooks to increase completion rates');
    }
    if (content.audience_alignment.primary_audience.length < 3) {
      recommendations.push('Expand audience targeting to multiple segments');
    }

    return {
      predicted_views: predictedViews,
      predicted_engagement: predictedEngagement,
      confidence: matchScore,
      recommendations,
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const contentTwinService = new ContentTwinService();