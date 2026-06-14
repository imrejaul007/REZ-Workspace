import {
  AutoUpdateRule,
  UpdateJob,
  EnrichmentCache,
  ActivitySummary,
  HealthScore,
  IAutoUpdateRule
} from '../models/AiCrmUpdates';

export interface AiUpdateResult {
  success: boolean;
  jobId: string;
  updates: {
    field: string;
    oldValue?: unknown;
    newValue?: unknown;
    source: 'ai' | 'enrichment' | 'rule' | 'manual';
    confidence?: number;
  }[];
  error?: string;
}

export interface HealthScoreInput {
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
  // Engagement signals
  touchpointsLast30Days?: number;
  emailOpenRate?: number;
  emailReplyRate?: number;
  meetingFrequency?: number;
  lastContactDate?: Date;
  // Deal signals
  dealValue?: number;
  dealStage?: string;
  daysInStage?: number;
  // Company signals
  companyRevenue?: number;
  companyGrowth?: number;
  industryTrend?: number;
}

export class AiUpdateService {
  /**
   * Process auto-update rule for a single entity
   */
  static async processRule(ruleId: string, targetId: string): Promise<AiUpdateResult> {
    const rule = await AutoUpdateRule.findById(ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }

    const job = new UpdateJob({
      ruleId: rule._id,
      ruleName: rule.name,
      jobType: 'manual',
      updateType: rule.updateType,
      targetEntity: rule.targetEntity,
      targetId,
      status: 'processing',
      startedAt: new Date()
    });

    await job.save();

    try {
      let updates: AiUpdateResult['updates'] = [];

      switch (rule.updateType) {
        case 'field_enrichment':
          updates = await this.processFieldEnrichment(rule, targetId);
          break;
        case 'health_score':
          updates = await this.processHealthScore(rule, targetId);
          break;
        case 'sentiment_analysis':
          updates = await this.processSentimentAnalysis(rule, targetId);
          break;
        case 'next_action':
          updates = await this.processNextAction(rule, targetId);
          break;
        default:
          updates = await this.processGenericUpdate(rule, targetId);
      }

      // Update job with results
      job.updates = updates;
      job.status = 'completed';
      job.completedAt = new Date();

      // Update rule stats
      rule.runCount += 1;
      rule.successCount += 1;
      rule.lastRunAt = new Date();
      rule.lastSuccessAt = new Date();

      await Promise.all([job.save(), rule.save()]);

      return {
        success: true,
        jobId: job._id.toString(),
        updates
      };
    } catch (error) {
      job.status = 'failed';
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();

      rule.failureCount += 1;
      rule.lastRunAt = new Date();
      rule.lastError = job.errorMessage;

      await Promise.all([job.save(), rule.save()]);

      return {
        success: false,
        jobId: job._id.toString(),
        updates: [],
        error: job.errorMessage
      };
    }
  }

  /**
   * Process field enrichment
   */
  private static async processFieldEnrichment(
    rule: IAutoUpdateRule,
    targetId: string
  ): Promise<AiUpdateResult['updates'])> {
    const updates: AiUpdateResult['updates'] = [];

    for (const mapping of rule.fieldMappings) {
      // Check enrichment cache first
      const cache = await EnrichmentCache.findOne({
        entityId: targetId,
        entityType: rule.targetEntity
      });

      if (cache && cache.enrichmentData.has(mapping.sourceField)) {
        let value = cache.enrichmentData.get(mapping.sourceField);

        // Apply transform
        value = this.transformValue(value, mapping.transform, mapping.transformFunction);

        updates.push({
          field: mapping.targetField,
          newValue: value,
          source: 'enrichment',
          confidence: 0.9
        });
      }
    }

    return updates;
  }

  /**
   * Process health score calculation
   */
  private static async processHealthScore(
    rule: IAutoUpdateRule,
    targetId: string
  ): Promise<AiUpdateResult['updates'])> {
    const updates: AiUpdateResult['updates'] = [];

    // Calculate health score based on available signals
    let score = 50; // Base score

    // Get recent activity for this entity
    const recentJobs = await UpdateJob.find({
      targetId,
      targetEntity: rule.targetEntity,
      status: 'completed',
      completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Activity frequency bonus
    const activityCount = recentJobs.length;
    if (activityCount >= 10) score += 20;
    else if (activityCount >= 5) score += 10;
    else if (activityCount >= 1) score += 5;

    // Cap at 100
    score = Math.min(Math.max(score, 0), 100);

    // Create health score record
    const healthScore = new HealthScore({
      tenantId: rule.tenantId,
      entityType: rule.targetEntity as 'contact' | 'company' | 'deal',
      entityId: targetId,
      score,
      components: [
        {
          name: 'activity_frequency',
          score: Math.min(activityCount * 5, 30),
          weight: 0.4,
          reason: `${activityCount} activities in last 30 days`
        },
        {
          name: 'engagement_quality',
          score: activityCount > 0 ? 20 : 0,
          weight: 0.3,
          reason: 'Based on interaction quality'
        },
        {
          name: 'recency',
          score: score > 30 ? 25 : 10,
          weight: 0.3,
          reason: 'Recent engagement indicator'
        }
      ],
      positiveFactors: activityCount >= 5 ? ['Active engagement'] : [],
      negativeFactors: activityCount === 0 ? ['No recent activity'] : [],
      riskFactors: activityCount === 0 ? ['Risk of losing connection'] : [],
      period: 'weekly',
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      periodEnd: new Date()
    });

    await healthScore.save();

    updates.push({
      field: 'health_score',
      newValue: score,
      source: 'ai',
      confidence: 0.85
    });

    return updates;
  }

  /**
   * Process sentiment analysis
   */
  private static async processSentimentAnalysis(
    rule: IAutoUpdateRule,
    targetId: string
  ): Promise<AiUpdateResult['updates'])> {
    const updates: AiUpdateResult['updates'] = [];

    // Get recent activity summaries
    const summaries = await ActivitySummary.find({
      entityId: targetId,
      entityType: rule.targetEntity
    }).sort({ createdAt: -1 }).limit(5);

    // Calculate aggregate sentiment
    let totalScore = 0;
    let count = 0;

    for (const summary of summaries) {
      if (summary.sentimentScore !== undefined) {
        totalScore += summary.sentimentScore;
        count++;
      }
    }

    const avgScore = count > 0 ? totalScore / count : 0;
    const sentiment = avgScore > 0.2 ? 'positive' : avgScore < -0.2 ? 'negative' : 'neutral';

    updates.push({
      field: 'ai_sentiment',
      newValue: sentiment,
      source: 'ai',
      confidence: Math.abs(avgScore)
    });

    updates.push({
      field: 'ai_sentiment_score',
      newValue: Math.round(avgScore * 100) / 100,
      source: 'ai',
      confidence: Math.abs(avgScore)
    });

    return updates;
  }

  /**
   * Process next action recommendation
   */
  private static async processNextAction(
    rule: IAutoUpdateRule,
    targetId: string
  ): Promise<AiUpdateResult['updates'])> {
    const updates: AiUpdateResult['updates'] = [];

    // Get health score
    const latestHealth = await HealthScore.findOne({
      entityId: targetId,
      entityType: rule.targetEntity
    }).sort({ createdAt: -1 });

    let recommendedAction = 'Follow up via email';

    if (latestHealth) {
      if (latestHealth.score >= 70) {
        recommendedAction = 'Schedule demo call';
      } else if (latestHealth.score >= 40) {
        recommendedAction = 'Send relevant content';
      } else {
        recommendedAction = 'Re-engage with value prop';
      }
    }

    updates.push({
      field: 'ai_recommended_next_action',
      newValue: recommendedAction,
      source: 'ai',
      confidence: 0.75
    });

    // Set recommended follow-up date
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + (latestHealth && latestHealth.score >= 60 ? 7 : 3));

    updates.push({
      field: 'ai_follow_up_date',
      newValue: followUpDate.toISOString(),
      source: 'ai',
      confidence: 0.7
    });

    return updates;
  }

  /**
   * Process generic update
   */
  private static async processGenericUpdate(
    rule: IAutoUpdateRule,
    targetId: string
  ): Promise<AiUpdateResult['updates'])> {
    const updates: AiUpdateResult['updates'] = [];

    for (const mapping of rule.fieldMappings) {
      updates.push({
        field: mapping.targetField,
        newValue: null,
        source: 'rule',
        confidence: 1.0
      });
    }

    return updates;
  }

  /**
   * Transform value based on transform type
   */
  private static transformValue(
    value: unknown,
    transform?: string,
    transformFunction?: string
  ): unknown {
    if (value === null || value === undefined) return value;

    switch (transform) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'titlecase':
        return String(value)
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      case 'date_format':
        return new Date(String(value)).toLocaleDateString();
      case 'custom':
        // Custom transform would be evaluated safely
        return value;
      default:
        return value;
    }
  }

  /**
   * Run scheduled rules
   */
  static async runScheduledRules(): Promise<void> {
    const rules = await AutoUpdateRule.find({
      isActive: true,
      'trigger.type': 'scheduled'
    });

    for (const rule of rules) {
      // Check if schedule matches current time
      // In production, use node-cron to check
      const result = await this.processRule(rule._id.toString(), 'batch');
      console.log(`Scheduled rule ${rule.name} completed:`, result.success);
    }
  }

  /**
   * Get update history for an entity
   */
  static async getUpdateHistory(
    tenantId: string,
    entityType: string,
    entityId: string,
    limit = 50
  ): Promise<UpdateJob[]> {
    return UpdateJob.find({
      tenantId,
      targetEntity: entityType,
      targetId: entityId
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get health score history
   */
  static async getHealthScoreHistory(
    tenantId: string,
    entityType: string,
    entityId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<HealthScore[]> {
    return HealthScore.find({
      tenantId,
      entityType,
      entityId,
      period
    })
      .sort({ periodStart: -1 })
      .limit(12);
  }

  /**
   * Get activity summary
   */
  static async getActivitySummary(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<IActivitySummary | null> {
    return ActivitySummary.findOne({
      tenantId,
      entityType,
      entityId
    }).sort({ createdAt: -1 });
  }
}
