import { CheckProfileRequest, Platform } from '../utils/validators';
import { FlagType, RiskLevel } from '../models/InfluencerProfile';

export interface AnalysisResult {
  scores: {
    followerQuality: number;
    engagementAuthenticity: number;
    historicalPattern: number;
    botLikelihood: number;
  };
  overallScore: number;
  riskLevel: RiskLevel;
  flags: FlagType[];
  breakdown: {
    followerQuality: { score: number; factors: Record<string, number> };
    engagementAuthenticity: { score: number; factors: Record<string, number> };
    historicalPattern: { score: number; factors: Record<string, number> };
    botLikelihood: { score: number; factors: Record<string, number> };
  };
  recommendations: Array<{
    category: string;
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    action: string;
  }>;
}

// Platform-specific engagement rate benchmarks
const ENGAGEMENT_BENCHMARKS: Record<Platform, { low: number; medium: number; high: number }> = {
  instagram: { low: 1, medium: 3, high: 6 },
  youtube: { low: 0.5, medium: 2, high: 5 },
  twitter: { low: 0.1, medium: 0.5, high: 1.5 },
  tiktok: { low: 3, medium: 8, high: 15 },
  facebook: { low: 0.5, medium: 1.5, high: 3 },
  linkedin: { low: 1, medium: 3, high: 6 },
};

// Follower to following ratio benchmarks
const FOLLOWER_RATIO_BENCHMARKS: Record<Platform, { suspicious: number; warning: number; good: number }> = {
  instagram: { suspicious: 0.1, warning: 0.5, good: 2 },
  youtube: { suspicious: 0.1, warning: 0.5, good: 5 },
  twitter: { suspicious: 0.2, warning: 0.8, good: 3 },
  tiktok: { suspicious: 0.1, warning: 0.5, good: 2 },
  facebook: { suspicious: 0.2, warning: 1, good: 5 },
  linkedin: { suspicious: 0.3, warning: 1, good: 5 },
};

export class AnalysisService {
  /**
   * Analyze influencer profile for authenticity
   */
  analyze(request: CheckProfileRequest): AnalysisResult {
    const startTime = Date.now();

    // Calculate individual scores
    const followerQuality = this.calculateFollowerQuality(request);
    const engagementAuthenticity = this.calculateEngagementAuthenticity(request);
    const historicalPattern = this.calculateHistoricalPattern(request);
    const botLikelihood = this.calculateBotLikelihood(request);

    // Combine scores with weights
    const scores = {
      followerQuality,
      engagementAuthenticity,
      historicalPattern,
      botLikelihood: 100 - botLikelihood, // Invert bot likelihood (higher is better)
    };

    // Calculate overall score
    const overallScore = Math.round(
      scores.followerQuality * 0.25 +
      scores.engagementAuthenticity * 0.30 +
      scores.historicalPattern * 0.20 +
      scores.botLikelihood * 0.25
    );

    // Determine risk level
    const riskLevel = this.determineRiskLevel(overallScore, request);

    // Collect flags
    const flags = this.collectFlags(request, scores);

    // Generate breakdown
    const breakdown = {
      followerQuality: this.getFollowerQualityBreakdown(request),
      engagementAuthenticity: this.getEngagementBreakdown(request),
      historicalPattern: this.getHistoricalBreakdown(request),
      botLikelihood: this.getBotLikelihoodBreakdown(request),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(request, scores, flags);

    return {
      scores,
      overallScore,
      riskLevel,
      flags,
      breakdown,
      recommendations,
    };
  }

  private calculateFollowerQuality(request: CheckProfileRequest): number {
    let score = 100;
    const factors: Record<string, number> = {};

    // Check follower/following ratio
    const ratio = request.followers > 0 ? request.followers / Math.max(request.following, 1) : 0;
    const benchmarks = FOLLOWER_RATIO_BENCHMARKS[request.platform];

    if (ratio < benchmarks.suspicious) {
      score -= 40;
      factors.followerRatioPenalty = -40;
    } else if (ratio < benchmarks.warning) {
      score -= 20;
      factors.followerRatioPenalty = -20;
    } else if (ratio >= benchmarks.good) {
      factors.followerRatioBonus = 10;
      score += 10;
    }

    // Check follower count reasonableness
    if (request.followers > 0 && request.following > 0) {
      const avgPostEngagement = request.engagementLikes && request.posts
        ? request.engagementLikes / request.posts
        : 0;

      // If average engagement per post is suspiciously high relative to followers
      if (request.followers > 100000 && avgPostEngagement > request.followers * 0.1) {
        score -= 30;
        factors.suspiciousEngagementRatio = -30;
      }
    }

    // Penalty for very high following count with low followers
    if (request.following > 0 && request.followers > 0) {
      const followingRatio = request.following / request.followers;
      if (followingRatio > 10) {
        score -= 25;
        factors.highFollowingRatio = -25;
      } else if (followingRatio > 5) {
        score -= 15;
        factors.elevatedFollowingRatio = -15;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateEngagementAuthenticity(request: CheckProfileRequest): number {
    let score = 100;
    const factors: Record<string, number> = {};

    // Calculate engagement rate
    const engagementRate = this.calculateEngagementRate(request);
    const benchmarks = ENGAGEMENT_BENCHMARKS[request.platform];

    if (engagementRate < benchmarks.low) {
      score -= 40;
      factors.lowEngagementRate = -40;
    } else if (engagementRate < benchmarks.medium) {
      score -= 20;
      factors.belowAverageEngagement = -20;
    } else if (engagementRate >= benchmarks.high) {
      score += 10;
      factors.highEngagementBonus = 10;
    }

    // Check likes to comments ratio (authentic accounts have more comments relative to likes)
    if (request.engagementLikes && request.engagementComments) {
      const likesToCommentsRatio = request.engagementLikes / Math.max(request.engagementComments, 1);

      // Very high ratio (>100:1) might indicate bot-like behavior
      if (likesToCommentsRatio > 100) {
        score -= 20;
        factors.suspiciousLikeCommentRatio = -20;
      } else if (likesToCommentsRatio > 50) {
        score -= 10;
        factors.elevatedLikeCommentRatio = -10;
      }
    }

    // Check views to likes ratio for video platforms
    if ((request.platform === 'youtube' || request.platform === 'tiktok') &&
        request.engagementViews && request.engagementLikes) {
      const viewsToLikesRatio = request.engagementViews / Math.max(request.engagementLikes, 1);

      // Unusually low likes from views might indicate fake engagement
      if (viewsToLikesRatio > 1000) {
        score -= 25;
        factors.lowViewEngagementRatio = -25;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateHistoricalPattern(request: CheckProfileRequest): number {
    let score = 100;
    const factors: Record<string, number> = {};

    // Check follower growth rate
    if (request.followerGrowthRate !== undefined) {
      if (request.followerGrowthRate > 50) {
        // Suspicious growth rate (>50% in a short period)
        score -= 35;
        factors.suspiciousGrowthRate = -35;
      } else if (request.followerGrowthRate > 20) {
        score -= 15;
        factors.elevatedGrowthRate = -15;
      } else if (request.followerGrowthRate > 0 && request.followerGrowthRate < 5) {
        score += 5;
        factors.healthyGrowthBonus = 5;
      }
    }

    // Check posting frequency
    if (request.postingFrequency !== undefined) {
      if (request.postingFrequency === 0) {
        score -= 10;
        factors.noRecentPosts = -10;
      } else if (request.postingFrequency > 50) {
        // Suspiciously high posting frequency
        score -= 20;
        factors.excessivePostingFrequency = -20;
      } else if (request.postingFrequency < 1) {
        // Very low posting frequency
        score -= 5;
        factors.lowPostingFrequency = -5;
      }
    }

    // Check if last post was very recent (could indicate bot-like behavior)
    if (request.lastPostDate) {
      const lastPostAge = Date.now() - new Date(request.lastPostDate).getTime();
      const hoursSincePost = lastPostAge / (1000 * 60 * 60);

      // Posts less than 5 minutes apart might indicate automation
      if (hoursSincePost < 0.083) {
        score -= 15;
        factors.rapidPosting = -15;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateBotLikelihood(request: CheckProfileRequest): number {
    let likelihood = 0;
    const factors: Record<string, number> = {};

    // High following with low engagement = more likely bot
    const engagementRate = this.calculateEngagementRate(request);
    const ratio = request.followers > 0 ? request.following / request.followers : 0;

    if (ratio > 10 && engagementRate < 1) {
      likelihood += 40;
      factors.highRatioLowEngagement = 40;
    }

    // Very high follower count with very low posts
    if (request.followers > 100000 && request.posts < 10) {
      likelihood += 30;
      factors.highFollowersLowPosts = 30;
    }

    // Zero engagement with non-zero followers
    if (request.followers > 1000 && request.engagementLikes === 0) {
      likelihood += 35;
      factors.zeroEngagement = 35;
    }

    // Very low engagement for large accounts
    if (request.followers > 500000 && engagementRate < 0.5) {
      likelihood += 25;
      factors.lowEngagementLargeAccount = 25;
    }

    // Check for suspiciously round numbers in follower count (purchased followers often are)
    const followerStr = request.followers.toString();
    if (followerStr.endsWith('000') || followerStr.endsWith('0000')) {
      likelihood += 15;
      factors.roundFollowerCount = 15;
    }

    return Math.max(0, Math.min(100, likelihood));
  }

  private calculateEngagementRate(request: CheckProfileRequest): number {
    if (!request.followers || request.followers === 0) return 0;

    const totalEngagement =
      (request.engagementLikes || 0) +
      (request.engagementComments || 0);

    return (totalEngagement / request.followers) * 100;
  }

  private determineRiskLevel(score: number, request: CheckProfileRequest): RiskLevel {
    // Adjust thresholds based on platform
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  private collectFlags(
    request: CheckProfileRequest,
    scores: { followerQuality: number; engagementAuthenticity: number; historicalPattern: number; botLikelihood: number }
  ): FlagType[] {
    const flags: FlagType[] = [];

    // Follower quality flags
    if (scores.followerQuality < 50) {
      flags.push('fake_followers_ratio');
    }

    // Engagement flags
    if (scores.engagementAuthenticity < 50) {
      flags.push('low_engagement_rate');
      flags.push('engagement_inconsistency');
    }

    // Bot likelihood flags
    if (scores.botLikelihood < 50) {
      flags.push('bot_engagement');
      flags.push('purchased_followers');
    }

    // Historical pattern flags
    if (scores.historicalPattern < 50) {
      flags.push('suspicious_growth');
      flags.push('unusual_posting_pattern');
    }

    // Content quality check
    if (request.posts > 0 && request.followers > 0) {
      const avgEngagementPerPost =
        ((request.engagementLikes || 0) + (request.engagementComments || 0)) / request.posts;
      if (avgEngagementPerPost < 1 && request.followers > 1000) {
        flags.push('content_quality_issues');
      }
    }

    return [...new Set(flags)]; // Remove duplicates
  }

  private getFollowerQualityBreakdown(request: CheckProfileRequest) {
    const ratio = request.followers > 0 ? request.followers / Math.max(request.following, 1) : 0;
    const benchmarks = FOLLOWER_RATIO_BENCHMARKS[request.platform];

    return {
      score: this.calculateFollowerQuality(request),
      factors: {
        followerToFollowingRatio: ratio,
        ratioBenchmark: benchmarks.good,
        followerCount: request.followers,
        followingCount: request.following,
      },
    };
  }

  private getEngagementBreakdown(request: CheckProfileRequest) {
    const engagementRate = this.calculateEngagementRate(request);
    const benchmarks = ENGAGEMENT_BENCHMARKS[request.platform];

    return {
      score: this.calculateEngagementAuthenticity(request),
      factors: {
        engagementRate: Math.round(engagementRate * 100) / 100,
        benchmarkHigh: benchmarks.high,
        benchmarkMedium: benchmarks.medium,
        totalLikes: request.engagementLikes || 0,
        totalComments: request.engagementComments || 0,
      },
    };
  }

  private getHistoricalBreakdown(request: CheckProfileRequest) {
    return {
      score: this.calculateHistoricalPattern(request),
      factors: {
        followerGrowthRate: request.followerGrowthRate || 0,
        postingFrequency: request.postingFrequency || 0,
        lastPostAge: request.lastPostDate
          ? Math.round((Date.now() - new Date(request.lastPostDate).getTime()) / (1000 * 60 * 60))
          : null,
      },
    };
  }

  private getBotLikelihoodBreakdown(request: CheckProfileRequest) {
    return {
      score: 100 - this.calculateBotLikelihood(request),
      factors: {
        botLikelihood: this.calculateBotLikelihood(request),
        engagementRate: this.calculateEngagementRate(request),
        followersToPostsRatio: request.posts > 0 ? request.followers / request.posts : null,
      },
    };
  }

  private generateRecommendations(
    request: CheckProfileRequest,
    scores: { followerQuality: number; engagementAuthenticity: number; historicalPattern: number; botLikelihood: number },
    flags: FlagType[]
  ): AnalysisResult['recommendations'] {
    const recommendations: AnalysisResult['recommendations'] = [];

    // Follower quality recommendations
    if (scores.followerQuality < 70) {
      recommendations.push({
        category: 'Follower Quality',
        priority: scores.followerQuality < 50 ? 'high' : 'medium',
        title: 'Review Follower Authenticity',
        description: 'The follower-to-following ratio and engagement patterns suggest potential fake followers.',
        action: 'Request a detailed follower analysis or use third-party tools to verify follower quality.',
      });
    }

    // Engagement recommendations
    if (scores.engagementAuthenticity < 70) {
      recommendations.push({
        category: 'Engagement',
        priority: scores.engagementAuthenticity < 50 ? 'high' : 'medium',
        title: 'Verify Engagement Authenticity',
        description: 'Low engagement rates may indicate purchased engagement or inactive audience.',
        action: 'Request audience demographics and engagement analytics. Look for authentic comments.',
      });
    }

    // Bot detection recommendations
    if (scores.botLikelihood < 70) {
      recommendations.push({
        category: 'Bot Detection',
        priority: scores.botLikelihood < 50 ? 'high' : 'medium',
        title: 'Potential Bot Activity Detected',
        description: 'Multiple indicators suggest automated or bot-like behavior patterns.',
        action: 'Conduct manual review of recent followers and comments. Check for suspicious activity patterns.',
      });
    }

    // Historical pattern recommendations
    if (scores.historicalPattern < 70) {
      recommendations.push({
        category: 'Historical Analysis',
        priority: scores.historicalPattern < 50 ? 'high' : 'medium',
        title: 'Review Growth History',
        description: 'Unusual growth patterns or posting behavior detected.',
        action: 'Request historical follower growth data and posting schedule for the past 6 months.',
      });
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'General',
        priority: 'low',
        title: 'Profile Appears Authentic',
        description: 'The influencer profile shows normal engagement and growth patterns.',
        action: 'Continue monitoring for any changes in behavior or metrics.',
      });
    }

    return recommendations;
  }
}

export const analysisService = new AnalysisService();