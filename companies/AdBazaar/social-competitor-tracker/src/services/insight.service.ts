import { Competitor, CompetitorPost, CompetitorSnapshot, BenchmarkData } from '../models/index.js';
import { logger } from '../config/logger.js';
import { AppError } from '../middleware/error.middleware.js';

export interface BestContentInsight {
  postId: string;
  competitorId: string;
  competitorName: string;
  platform: string;
  content: string;
  hashtags: string[];
  type: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };
  postedAt: Date;
  whyItWorked: string;
}

export interface StrategyInsight {
  category: 'content' | 'timing' | 'engagement' | 'growth' | 'benchmark';
  title: string;
  description: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  data?: Record<string, unknown>;
}

export interface CompetitorAnalysis {
  competitorId: string;
  competitorName: string;
  industry: string;
  strength: string;
  weakness: string;
  opportunity: string;
  threat: string;
  contentStrategy: string;
  postingPattern: string;
}

export class InsightService {
  /**
   * Get best performing content across all competitors
   */
  async getBestContent(options?: {
    competitorIds?: string[];
    platform?: string;
    days?: number;
    limit?: number;
    industry?: string;
  }): Promise<BestContentInsight[]> {
    const days = options?.days || 30;
    const limit = options?.limit || 20;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const query: Record<string, unknown> = {
      postedAt: { $gte: startDate },
    };

    if (options?.competitorIds && options.competitorIds.length > 0) {
      query.competitorId = { $in: options.competitorIds };
    }

    if (options?.platform) {
      query.platform = options.platform;
    }

    // Get top performing posts
    const posts = await CompetitorPost.find(query)
      .sort({ 'metrics.engagementRate': -1, 'metrics.likes': -1 })
      .limit(limit * 2) // Get more to filter
      .exec();

    // Get competitor names
    const competitorIds = [...new Set(posts.map((p) => p.competitorId.toString()))];
    const competitors = await Competitor.find({ _id: { $in: competitorIds } });
    const competitorMap = new Map(competitors.map((c) => [c._id.toString(), c.name]));

    // Analyze and enhance posts with insights
    const bestContent: BestContentInsight[] = posts.slice(0, limit).map((post) => {
      const competitorName = competitorMap.get(post.competitorId.toString()) || 'Unknown';
      const whyItWorked = this.analyzeWhyItWorked(post);

      return {
        postId: post.postId,
        competitorId: post.competitorId.toString(),
        competitorName,
        platform: post.platform,
        content: post.content,
        hashtags: post.hashtags,
        type: post.type,
        metrics: {
          likes: post.metrics.likes,
          comments: post.metrics.comments,
          shares: post.metrics.shares,
          engagementRate: post.metrics.engagementRate,
        },
        postedAt: post.postedAt,
        whyItWorked,
      };
    });

    return bestContent;
  }

  /**
   * Analyze why a post worked well
   */
  private analyzeWhyItWorked(post: InstanceType<typeof CompetitorPost>): string {
    const reasons: string[] = [];

    // Check engagement rate
    if (post.metrics.engagementRate > 5) {
      reasons.push('exceptionally high engagement rate');
    } else if (post.metrics.engagementRate > 3) {
      reasons.push('strong engagement rate');
    }

    // Check comment ratio
    const commentRatio = post.metrics.comments / (post.metrics.likes || 1);
    if (commentRatio > 0.1) {
      reasons.push('high comment-to-like ratio indicating active discussion');
    }

    // Check share ratio
    const shareRatio = post.metrics.shares / (post.metrics.likes || 1);
    if (shareRatio > 0.05) {
      reasons.push('high share ratio suggesting viral potential');
    }

    // Check content characteristics
    if (post.hashtags.length > 5) {
      reasons.push('uses multiple hashtags for discoverability');
    }

    if (post.type === 'video' || post.type === 'reel') {
      reasons.push('video content typically drives higher engagement');
    }

    if (post.type === 'carousel') {
      reasons.push('carousel posts encourage multiple interactions');
    }

    if (post.mediaUrls.length > 1) {
      reasons.push('multi-image posts increase time spent on content');
    }

    if (reasons.length === 0) {
      reasons.push('compelling content that resonated with audience');
    }

    return reasons.join(', ');
  }

  /**
   * Get strategy insights based on competitor analysis
   */
  async getStrategyInsights(options?: {
    competitorIds?: string[];
    industry?: string;
    days?: number;
  }): Promise<StrategyInsight[]> {
    const insights: StrategyInsight[] = [];
    const days = options?.days || 30;

    // Get competitors
    let competitors;
    if (options?.competitorIds && options.competitorIds.length > 0) {
      competitors = await Competitor.find({ _id: { $in: options.competitorIds } });
    } else if (options?.industry) {
      competitors = await Competitor.find({ industry: options.industry });
    } else {
      competitors = await Competitor.find();
    }

    if (competitors.length === 0) {
      return insights;
    }

    // Analyze content strategy
    const contentInsights = await this.analyzeContentStrategy(competitors, days);
    insights.push(...contentInsights);

    // Analyze timing patterns
    const timingInsights = await this.analyzeTimingPatterns(competitors, days);
    insights.push(...timingInsights);

    // Analyze engagement patterns
    const engagementInsights = await this.analyzeEngagementPatterns(competitors, days);
    insights.push(...engagementInsights);

    // Analyze growth patterns
    const growthInsights = await this.analyzeGrowthPatterns(competitors, days);
    insights.push(...growthInsights);

    // Get benchmark comparison
    const benchmarkInsights = await this.analyzeBenchmarkComparison(competitors);
    insights.push(...benchmarkInsights);

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return insights;
  }

  /**
   * Analyze content strategy across competitors
   */
  private async analyzeContentStrategy(
    competitors: InstanceType<typeof Competitor>[],
    days: number
  ): Promise<StrategyInsight[]> {
    const insights: StrategyInsight[] = [];
    const competitorIds = competitors.map((c) => c._id);

    // Get content type distribution
    const contentTypes = await CompetitorPost.getContentTypeDistribution(
      competitorIds[0].toString()
    );

    if (contentTypes.length > 0) {
      const topType = contentTypes[0];
      const topTypeName = topType._id || 'Unknown';

      if (topTypeName !== 'Unknown') {
        insights.push({
          category: 'content',
          title: 'Content Type Opportunity',
          description: `Competitors are heavily using ${topTypeName} content (${topType.count} posts) with ${Math.round(topType.avgEngagement)}% avg engagement`,
          recommendation: `Consider increasing ${topTypeName} content production to match competitor strategy`,
          priority: 'medium',
          data: { contentTypes },
        });
      }
    }

    // Analyze hashtag usage
    const posts = await CompetitorPost.find({
      competitorId: { $in: competitorIds },
      postedAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    }).limit(100);

    const hashtagCounts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.hashtags) {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      }
    }

    const topHashtags = Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topHashtags.length > 0) {
      insights.push({
        category: 'content',
        title: 'Popular Hashtags',
        description: `Top hashtags used by competitors: ${topHashtags.map((h) => h[0]).join(', ')}`,
        recommendation: 'Incorporate these trending hashtags into your content strategy',
        priority: 'low',
        data: { topHashtags },
      });
    }

    return insights;
  }

  /**
   * Analyze posting timing patterns
   */
  private async analyzeTimingPatterns(
    competitors: InstanceType<typeof Competitor>[],
    days: number
  ): Promise<StrategyInsight[]> {
    const insights: StrategyInsight[] = [];

    // Get posts and analyze timing
    const posts = await CompetitorPost.find({
      competitorId: { $in: competitors.map((c) => c._id) },
      postedAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    }).limit(500);

    const hourCounts = new Map<number, number>();
    const dayCounts = new Map<number, number>();

    for (const post of posts) {
      const date = new Date(post.postedAt);
      hourCounts.set(date.getHours(), (hourCounts.get(date.getHours()) || 0) + 1);
      dayCounts.set(date.getDay(), (dayCounts.get(date.getDay()) || 0) + 1);
    }

    // Find best posting times
    const bestHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((h) => h[0]);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDays = Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((d) => dayNames[d[0]]);

    if (bestHours.length > 0) {
      insights.push({
        category: 'timing',
        title: 'Optimal Posting Times',
        description: `Competitors post most frequently at ${bestHours.map((h) => `${h}:00`).join(', ')} hours`,
        recommendation: `Schedule your posts around these peak hours: ${bestHours.map((h) => `${h}:00`).join(', ')}`,
        priority: 'medium',
        data: { bestHours, bestDays },
      });
    }

    return insights;
  }

  /**
   * Analyze engagement patterns
   */
  private async analyzeEngagementPatterns(
    competitors: InstanceType<typeof Competitor>[],
    days: number
  ): Promise<StrategyInsight[]> {
    const insights: StrategyInsight[] = [];

    // Calculate average engagement metrics
    let totalEngagement = 0;
    let totalPosts = 0;
    let highEngagementPosts = 0;

    for (const competitor of competitors) {
      const avgMetrics = await CompetitorPost.getAverageMetrics(
        competitor._id.toString(),
        undefined,
        days
      );

      if (avgMetrics.length > 0) {
        totalEngagement += avgMetrics[0].avgEngagementRate * avgMetrics[0].totalPosts;
        totalPosts += avgMetrics[0].totalPosts;

        if (avgMetrics[0].avgEngagementRate > 3) {
          highEngagementPosts++;
        }
      }
    }

    const avgEngagement = totalPosts > 0 ? totalEngagement / totalPosts : 0;

    if (avgEngagement > 0) {
      insights.push({
        category: 'engagement',
        title: 'Engagement Benchmarks',
        description: `Average competitor engagement rate: ${avgEngagement.toFixed(2)}%`,
        recommendation: `Target an engagement rate of ${(avgEngagement * 1.2).toFixed(2)}% or higher to outperform competitors`,
        priority: 'high',
        data: { avgEngagement, competitorCount: competitors.length },
      });
    }

    // Analyze comment patterns
    const recentPosts = await CompetitorPost.find({
      competitorId: { $in: competitors.map((c) => c._id) },
      postedAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    })
      .sort({ 'metrics.comments': -1 })
      .limit(10);

    if (recentPosts.length > 0) {
      const avgComments = recentPosts.reduce((sum, p) => sum + p.metrics.comments, 0) / recentPosts.length;

      insights.push({
        category: 'engagement',
        title: 'Comment Strategy',
        description: `Top posts average ${Math.round(avgComments)} comments`,
        recommendation: 'Encourage comments by asking questions or seeking opinions in your posts',
        priority: 'medium',
        data: { topPostsAnalyzed: recentPosts.length },
      });
    }

    return insights;
  }

  /**
   * Analyze growth patterns
   */
  private async analyzeGrowthPatterns(
    competitors: InstanceType<typeof Competitor>[],
    days: number
  ): Promise<StrategyInsight[]> {
    const insights: StrategyInsight[] = [];

    let totalGrowth = 0;
    let growthCount = 0;

    for (const competitor of competitors) {
      for (const platform of competitor.platforms) {
        const growthData = await CompetitorSnapshot.getGrowthRate(
          competitor._id.toString(),
          platform.platform,
          days
        );

        if (growthData) {
          totalGrowth += growthData.growthRate;
          growthCount++;
        }
      }
    }

    const avgGrowth = growthCount > 0 ? totalGrowth / growthCount : 0;

    if (avgGrowth !== 0) {
      const growthDirection = avgGrowth > 0 ? 'growing' : 'declining';
      insights.push({
        category: 'growth',
        title: 'Follower Growth Trends',
        description: `Competitors are ${growthDirection} at an average rate of ${Math.abs(avgGrowth).toFixed(2)}% over ${days} days`,
        recommendation:
          avgGrowth > 0
            ? 'Monitor competitor growth strategies to stay competitive'
            : 'This is an opportunity to gain follower share while competitors are declining',
        priority: avgGrowth < 0 ? 'high' : 'low',
        data: { avgGrowth, days },
      });
    }

    return insights;
  }

  /**
   * Analyze benchmark comparison
   */
  private async analyzeBenchmarkComparison(
    competitors: InstanceType<typeof Competitor>[]
  ): Promise<StrategyInsight[]> {
    const insights: StrategyInsight[] = [];

    const industries = [...new Set(competitors.map((c) => c.industry))];

    for (const industry of industries) {
      const benchmark = await BenchmarkData.findLatest(industry);

      if (benchmark) {
        insights.push({
          category: 'benchmark',
          title: 'Industry Benchmark Comparison',
          description: `Industry benchmark for ${industry}: ${benchmark.metrics.avgEngagementRate.toFixed(2)}% avg engagement, ${benchmark.metrics.avgPostingFrequency.toFixed(1)} posts/week`,
          recommendation: `Align your posting frequency to the industry average of ${benchmark.metrics.avgPostingFrequency.toFixed(1)} posts per week`,
          priority: 'medium',
          data: {
            industry,
            benchmarkMetrics: benchmark.metrics,
            sampleSize: benchmark.sampleSize,
          },
        });

        if (benchmark.metrics.topContentTypes.length > 0) {
          insights.push({
            category: 'benchmark',
            title: 'Top Content Types',
            description: `Industry top content types: ${benchmark.metrics.topContentTypes.join(', ')}`,
            recommendation: 'Focus on creating more content in these top-performing formats',
            priority: 'low',
            data: { topContentTypes: benchmark.metrics.topContentTypes },
          });
        }
      }
    }

    return insights;
  }

  /**
   * Get SWOT analysis for a competitor
   */
  async getCompetitorAnalysis(competitorId: string): Promise<CompetitorAnalysis> {
    const competitor = await Competitor.findById(competitorId);
    if (!competitor) {
      throw new AppError('Competitor not found', 404);
    }

    // Get latest snapshots
    const snapshots = await Promise.all(
      competitor.platforms.map((p) =>
        CompetitorSnapshot.findLatest(competitorId, p.platform)
      )
    );

    // Get top performing posts
    const topPosts = await CompetitorPost.findTopPerforming(competitorId, undefined, 10);

    // Calculate metrics
    const totalFollowers = snapshots.reduce((sum, s) => sum + (s?.followers || 0), 0);
    const avgEngagement = snapshots.reduce((sum, s) => sum + (s?.engagementRate || 0), 0) /
      (snapshots.filter((s) => s).length || 1);
    const avgFrequency = snapshots.reduce((sum, s) => sum + (s?.postingFrequency || 0), 0) /
      (snapshots.filter((s) => s).length || 1);

    // Get benchmark
    const benchmark = await BenchmarkData.findLatest(competitor.industry);

    // Analyze content strategy
    const contentTypes = await CompetitorPost.getContentTypeDistribution(competitorId);
    const topContentType = contentTypes[0]?._id || 'image';

    // Determine strengths and weaknesses
    const strength = avgEngagement > (benchmark?.metrics.avgEngagementRate || 2)
      ? 'High engagement rate compared to industry average'
      : 'Strong follower base with room for engagement improvement';

    const weakness = avgFrequency < (benchmark?.metrics.avgPostingFrequency || 3)
      ? 'Below average posting frequency'
      : 'Content strategy may need refinement';

    const opportunity = totalFollowers > 100000
      ? 'Large audience provides opportunity for viral content'
      : 'Growing audience with potential for rapid growth';

    const threat = avgFrequency > (benchmark?.metrics.avgPostingFrequency || 3) * 1.5
      ? 'High posting frequency may lead to audience fatigue'
      : 'Consistent posting could be outpaced by more active competitors';

    return {
      competitorId,
      competitorName: competitor.name,
      industry: competitor.industry,
      strength,
      weakness,
      opportunity,
      threat,
      contentStrategy: `Focuses on ${topContentType} content with ${topPosts.length} top-performing posts analyzed`,
      postingPattern: `Posts approximately ${avgFrequency.toFixed(1)} times per week across ${competitor.platforms.length} platforms`,
    };
  }
}

export const insightService = new InsightService();
