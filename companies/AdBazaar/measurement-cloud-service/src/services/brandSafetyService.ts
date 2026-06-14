import { v4 as uuidv4 } from 'uuid';
import {
  BrandSafety,
  BrandSafetySettings,
  IBrandSafety,
  IBrandSafetyCheck,
  ViolationType,
  SeverityLevel,
  CheckStatus
} from '../models/BrandSafety';
import { logBrandSafetyEvent } from '../utils/logger';
import { brandSafetyChecks, brandSafetyScore, dbOperationDuration } from '../utils/metrics';

export interface BrandSafetyCheckInput {
  campaignId: string;
  contentUrl?: string;
  contentText?: string;
  contentCategories?: string[];
  competitorDomains?: string[];
  customKeywords?: {
    positive?: string[];
    negative?: string[];
  };
  metadata?: Record<string, unknown>;
}

export interface BrandSafetyCheckResult {
  checkId: string;
  checkType: string;
  name: string;
  status: CheckStatus;
  score: number;
  violations: {
    type: ViolationType;
    severity: SeverityLevel;
    description: string;
    url?: string;
  }[];
  recommendations?: string[];
}

class BrandSafetyService {
  /**
   * Perform brand safety check for a campaign
   */
  async performBrandSafetyCheck(input: BrandSafetyCheckInput): Promise<IBrandSafety> {
    const startTime = Date.now();

    try {
      const checks: IBrandSafetyCheck[] = [];

      // 1. Content Category Analysis
      const categoryCheck = await this.analyzeContentCategories(
        input.campaignId,
        input.contentCategories || []
      );
      checks.push(categoryCheck);

      // 2. Keyword Filtering
      const keywordCheck = await this.checkKeywords(
        input.campaignId,
        input.contentText || '',
        input.customKeywords
      );
      checks.push(keywordCheck);

      // 3. Competitor Adjacency Check
      const competitorCheck = await this.checkCompetitorAdjacency(
        input.campaignId,
        input.contentUrl || '',
        input.competitorDomains || []
      );
      checks.push(competitorCheck);

      // 4. Contextual Analysis
      const contextualCheck = await this.performContextualAnalysis(
        input.campaignId,
        input.contentText || '',
        input.contentUrl || ''
      );
      checks.push(contextualCheck);

      // 5. Sentiment Analysis
      const sentimentCheck = await this.analyzeSentiment(
        input.campaignId,
        input.contentText || ''
      );
      checks.push(sentimentCheck);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(checks);
      const overallStatus = this.determineOverallStatus(overallScore);

      // Create brand safety record
      const brandSafety = new BrandSafety({
        campaignId: input.campaignId,
        timestamp: new Date(),
        overallScore,
        overallStatus,
        checks,
        contentCategories: input.contentCategories?.map((cat) => ({
          category: cat,
          risk: 50,
          exposure: 0
        })),
        contextualAnalysis: [
          {
            topic: 'general',
            sentiment: 'neutral',
            relevance: 0.5
          }
        ],
        recommendations: this.generateRecommendations(checks, overallScore)
      });

      await brandSafety.save();

      // Record metrics
      brandSafetyChecks.inc({
        campaign_id: input.campaignId,
        result: overallStatus
      });

      brandSafetyScore.set({ campaign_id: input.campaignId }, overallScore);

      logBrandSafetyEvent('brand_safety_check_completed', input.campaignId, {
        overallScore,
        overallStatus,
        checkCount: checks.length
      });

      return brandSafety;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      dbOperationDuration.observe(
        { operation: 'insert', collection: 'brand_safety' },
        duration
      );
    }
  }

  /**
   * Analyze content categories for risk
   */
  private async analyzeContentCategories(
    campaignId: string,
    categories: string[]
  ): Promise<IBrandSafetyCheck> {
    const violations: IBrandSafetyCheck['violations'] = [];
    let score = 100;

    // High-risk categories
    const highRiskCategories = [
      'adult',
      'hate',
      'violence',
      'drugs',
      'gambling',
      'controversial'
    ];

    // Medium-risk categories
    const mediumRiskCategories = ['politics', 'religion', 'health', 'finance'];

    categories.forEach((category) => {
      const lowerCategory = category.toLowerCase();

      if (highRiskCategories.some((r) => lowerCategory.includes(r))) {
        violations.push({
          type: ViolationType.SENSITIVE_TOPIC,
          severity: SeverityLevel.CRITICAL,
          description: `Content category "${category}" is high-risk`
        });
        score -= 40;
      } else if (mediumRiskCategories.some((r) => lowerCategory.includes(r))) {
        violations.push({
          type: ViolationType.SENSITIVE_TOPIC,
          severity: SeverityLevel.MEDIUM,
          description: `Content category "${category}" requires review`
        });
        score -= 20;
      }
    });

    return {
      checkId: uuidv4(),
      checkType: 'content_category',
      name: 'Content Category Analysis',
      status: violations.length === 0 ? CheckStatus.PASSED : CheckStatus.FAILED,
      score: Math.max(0, score),
      violations
    };
  }

  /**
   * Check for blocked/negative keywords
   */
  private async checkKeywords(
    campaignId: string,
    contentText: string,
    customKeywords?: {
      positive?: string[];
      negative?: string[];
    }
  ): Promise<IBrandSafetyCheck> {
    const violations: IBrandSafetyCheck['violations'] = [];
    let score = 100;

    // Default blocked keywords
    const defaultBlockedKeywords = [
      'violence',
      'hate',
      'explicit',
      'illegal',
      'scam',
      'fraud'
    ];

    const blockedKeywords = [
      ...defaultBlockedKeywords,
      ...(customKeywords?.negative || [])
    ];

    const lowerText = contentText.toLowerCase();

    blockedKeywords.forEach((keyword) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        violations.push({
          type: ViolationType.EXPLICIT_CONTENT,
          severity: SeverityLevel.HIGH,
          description: `Blocked keyword "${keyword}" found in content`
        });
        score -= 15;
      }
    });

    return {
      checkId: uuidv4(),
      checkType: 'keyword_filter',
      name: 'Keyword Filtering',
      status: violations.length === 0 ? CheckStatus.PASSED : CheckStatus.FAILED,
      score: Math.max(0, score),
      violations
    };
  }

  /**
   * Check for competitor adjacency
   */
  private async checkCompetitorAdjacency(
    campaignId: string,
    contentUrl: string,
    competitorDomains: string[]
  ): Promise<IBrandSafetyCheck> {
    const violations: IBrandSafetyCheck['violations'] = [];
    let score = 100;

    const lowerUrl = contentUrl.toLowerCase();

    competitorDomains.forEach((domain) => {
      if (lowerUrl.includes(domain.toLowerCase())) {
        violations.push({
          type: ViolationType.COMPETITOR_ADJACENCY,
          severity: SeverityLevel.HIGH,
          description: `Competitor domain "${domain}" detected`,
          url: contentUrl
        });
        score -= 30;
      }
    });

    return {
      checkId: uuidv4(),
      checkType: 'competitor_adjacency',
      name: 'Competitor Adjacency Check',
      status: violations.length === 0 ? CheckStatus.PASSED : CheckStatus.WARNING,
      score: Math.max(0, score),
      violations
    };
  }

  /**
   * Perform contextual analysis
   */
  private async performContextualAnalysis(
    campaignId: string,
    contentText: string,
    contentUrl: string
  ): Promise<IBrandSafetyCheck> {
    const violations: IBrandSafetyCheck['violations'] = [];
    let score = 100;

    // Simple keyword-based contextual analysis
    const negativeContexts = [
      { keywords: ['scandal', 'lawsuit', 'controversy'], severity: SeverityLevel.HIGH },
      { keywords: ['accident', 'crash', 'death'], severity: SeverityLevel.MEDIUM },
      { keywords: ['crisis', 'emergency', 'disaster'], severity: SeverityLevel.MEDIUM }
    ];

    const lowerText = contentText.toLowerCase();

    negativeContexts.forEach(({ keywords, severity }) => {
      keywords.forEach((keyword) => {
        if (lowerText.includes(keyword)) {
          violations.push({
            type: ViolationType.CONTROVERSIAL,
            severity,
            description: `Negative context detected: "${keyword}"`
          });
          score -= severity === SeverityLevel.HIGH ? 25 : 15;
        }
      });
    });

    return {
      checkId: uuidv4(),
      checkType: 'contextual_analysis',
      name: 'Contextual Analysis',
      status: violations.length === 0 ? CheckStatus.PASSED : CheckStatus.WARNING,
      score: Math.max(0, score),
      violations
    };
  }

  /**
   * Analyze sentiment of content
   */
  private async analyzeSentiment(
    campaignId: string,
    contentText: string
  ): Promise<IBrandSafetyCheck> {
    const violations: IBrandSafetyCheck['violations'] = [];
    let score = 100;

    // Simple sentiment analysis based on negative words
    const negativeWords = ['hate', 'angry', 'sad', 'terrible', 'awful', 'horrible'];
    const positiveWords = ['happy', 'great', 'excellent', 'amazing', 'wonderful'];

    const lowerText = contentText.toLowerCase();
    const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length;
    const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length;

    if (negativeCount > positiveCount * 2) {
      violations.push({
        type: ViolationType.HATE_SPEECH,
        severity: SeverityLevel.MEDIUM,
        description: 'Content has predominantly negative sentiment'
      });
      score -= 20;
    }

    return {
      checkId: uuidv4(),
      checkType: 'sentiment_analysis',
      name: 'Sentiment Analysis',
      status: violations.length === 0 ? CheckStatus.PASSED : CheckStatus.WARNING,
      score: Math.max(0, score),
      violations
    };
  }

  /**
   * Calculate overall brand safety score
   */
  private calculateOverallScore(checks: IBrandSafetyCheck[]): number {
    if (checks.length === 0) return 100;

    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    return Math.round(totalScore / checks.length);
  }

  /**
   * Determine overall status based on score
   */
  private determineOverallStatus(score: number): CheckStatus {
    if (score >= 80) return CheckStatus.PASSED;
    if (score >= 60) return CheckStatus.WARNING;
    return CheckStatus.FAILED;
  }

  /**
   * Generate recommendations based on check results
   */
  private generateRecommendations(checks: IBrandSafetyCheck[], overallScore: number): string[] {
    const recommendations: string[] = [];

    if (overallScore < 80) {
      recommendations.push('Consider adjusting your targeting to avoid sensitive content categories');
    }

    checks.forEach((check) => {
      if (check.status === CheckStatus.FAILED) {
        if (check.checkType === 'keyword_filter') {
          recommendations.push('Review and update your negative keyword list');
        }
        if (check.checkType === 'competitor_adjacency') {
          recommendations.push('Add competitor domains to your exclusion list');
        }
        if (check.checkType === 'contextual_analysis') {
          recommendations.push('Use contextual targeting to avoid negative content environments');
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Brand safety is within acceptable thresholds');
    }

    return recommendations;
  }

  /**
   * Get brand safety results for a campaign
   */
  async getBrandSafetyResults(
    campaignId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<IBrandSafety[]> {
    const startTime = Date.now();

    try {
      const query: Record<string, unknown> = { campaignId };

      if (options?.startDate || options?.endDate) {
        query.timestamp = {};
        if (options.startDate) {
          (query.timestamp as Record<string, Date>).$gte = options.startDate;
        }
        if (options.endDate) {
          (query.timestamp as Record<string, Date>).$lte = options.endDate;
        }
      }

      const results = await BrandSafety.find(query)
        .sort({ timestamp: -1 })
        .limit(options?.limit || 10)
        .lean();

      return results as IBrandSafety[];
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      dbOperationDuration.observe(
        { operation: 'find', collection: 'brand_safety' },
        duration
      );
    }
  }

  /**
   * Get or create brand safety settings for an advertiser
   */
  async getBrandSafetySettings(advertiserId: string): Promise<IBrandSafetySettings | null> {
    return BrandSafetySettings.findOne({ advertiserId });
  }

  /**
   * Update brand safety settings
   */
  async updateBrandSafetySettings(
    advertiserId: string,
    settings: Partial<IBrandSafetySettings>
  ): Promise<IBrandSafetySettings> {
    const existing = await BrandSafetySettings.findOne({ advertiserId });

    if (existing) {
      Object.assign(existing, settings);
      await existing.save();
      return existing;
    }

    const newSettings = new BrandSafetySettings({
      advertiserId,
      brandName: settings.brandName || 'Unknown Brand',
      vertical: settings.vertical || 'general',
      blockedCategories: settings.blockedCategories || [],
      competitorDomains: settings.competitorDomains || [],
      customKeywords: settings.customKeywords || { positive: [], negative: [] },
      minimumScoreThreshold: settings.minimumScoreThreshold || 70,
      autoPauseEnabled: settings.autoPauseEnabled ?? true,
      notificationSettings: settings.notificationSettings || {
        email: true,
        webhook: false,
        threshold: 50
      }
    });

    await newSettings.save();
    return newSettings;
  }
}

export const brandSafetyService = new BrandSafetyService();
export default brandSafetyService;