import { z } from 'zod';
import { ComplianceRule, ComplianceCheck, ComplianceHistory, IComplianceRule } from '../models/index.js';
import { logger } from '../config/index.js';

// Validation schemas
export const contentCheckSchema = z.object({
  contentId: z.string().min(1),
  text: z.string().min(1),
  imageUrls: z.array(z.string().url()).optional(),
  videoUrl: z.string().url().optional(),
  platform: z.enum(['instagram', 'facebook', 'twitter', 'youtube', 'tiktok', 'linkedin', 'all']),
  metadata: z.record(z.unknown()).optional(),
});

export const batchCheckSchema = z.object({
  contents: z.array(
    z.object({
      contentId: z.string().min(1),
      text: z.string().min(1),
      imageUrls: z.array(z.string().url()).optional(),
      videoUrl: z.string().url().optional(),
      platform: z.enum(['instagram', 'facebook', 'twitter', 'youtube', 'tiktok', 'linkedin', 'all']),
      metadata: z.record(z.unknown()).optional(),
    })
  ).min(1).max(100),
});

export const ruleSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'brand_safety',
    'platform_policy',
    'copyright',
    'trademark',
    'ftc_disclosure',
    'inappropriate_content',
    'competitor_mention',
    'custom',
  ]),
  description: z.string().min(1),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).default('medium'),
  platforms: z.array(z.enum(['instagram', 'facebook', 'twitter', 'youtube', 'tiktok', 'linkedin', 'all'])),
  pattern: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  regexPattern: z.string().optional(),
  action: z.enum(['block', 'warn', 'suggest_edit', 'flag_review', 'auto_fix']).default('warn'),
  enabled: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export type ContentCheckInput = z.infer<typeof contentCheckSchema>;
export type BatchCheckInput = z.infer<typeof batchCheckSchema>;
export type RuleInput = z.infer<typeof ruleSchema>;

// Default compliance rules
const DEFAULT_RULES: RuleInput[] = [
  {
    name: 'FTC Disclosure Check',
    type: 'ftc_disclosure',
    description: 'Checks for proper #Ad or sponsored content disclosure',
    severity: 'high',
    platforms: ['instagram', 'facebook', 'twitter', 'youtube', 'tiktok', 'linkedin', 'all'],
    keywords: ['#ad', '#sponsored', '#promo', '#partner', '#collaboration', '[ad]', '(ad)'],
    action: 'warn',
  },
  {
    name: 'Competitor Mention',
    type: 'competitor_mention',
    description: 'Detects mentions of competitor brands',
    severity: 'medium',
    platforms: ['all'],
    keywords: [],
    action: 'flag_review',
  },
  {
    name: 'Profanity Filter',
    type: 'inappropriate_content',
    description: 'Detects profanity and inappropriate language',
    severity: 'high',
    platforms: ['all'],
    keywords: [],
    action: 'block',
  },
  {
    name: 'Copyright Music',
    type: 'copyright',
    description: 'Detects copyrighted music mentions',
    severity: 'medium',
    platforms: ['instagram', 'facebook', 'twitter', 'youtube', 'tiktok'],
    keywords: ['song by', 'music by', 'soundtrack', '#nowplaying'],
    action: 'warn',
  },
  {
    name: 'Trademark Detection',
    type: 'trademark',
    description: 'Detects unauthorized trademark usage',
    severity: 'high',
    platforms: ['all'],
    keywords: [],
    action: 'flag_review',
  },
  {
    name: 'Violence Content',
    type: 'inappropriate_content',
    description: 'Detects violent content descriptions',
    severity: 'critical',
    platforms: ['all'],
    keywords: ['violence', 'gore', 'blood', 'kill', 'attack', 'shooting'],
    action: 'block',
  },
  {
    name: 'Adult Content',
    type: 'inappropriate_content',
    description: 'Detects adult/inappropriate content',
    severity: 'critical',
    platforms: ['all'],
    keywords: ['nsfw', 'xxx', 'adult'],
    action: 'block',
  },
  {
    name: 'Hate Speech',
    type: 'inappropriate_content',
    description: 'Detects hate speech and discrimination',
    severity: 'critical',
    platforms: ['all'],
    keywords: [],
    action: 'block',
  },
  {
    name: 'Instagram Community Guidelines',
    type: 'platform_policy',
    description: 'Instagram-specific content policy compliance',
    severity: 'medium',
    platforms: ['instagram'],
    keywords: [],
    action: 'warn',
  },
  {
    name: 'Facebook Ad Policy',
    type: 'platform_policy',
    description: 'Facebook advertising policy compliance',
    severity: 'medium',
    platforms: ['facebook'],
    keywords: [],
    action: 'warn',
  },
  {
    name: 'Twitter Character Limit',
    type: 'platform_policy',
    description: 'Twitter/X character limit (280 chars)',
    severity: 'low',
    platforms: ['twitter'],
    keywords: [],
    action: 'warn',
  },
];

export class ComplianceService {
  private defaultRulesInitialized = false;

  async initializeDefaultRules(createdBy: string = 'system'): Promise<void> {
    if (this.defaultRulesInitialized) return;

    const existingRules = await ComplianceRule.countDocuments({ createdBy: 'system' });
    if (existingRules > 0) {
      this.defaultRulesInitialized = true;
      return;
    }

    try {
      await ComplianceRule.insertMany(
        DEFAULT_RULES.map((rule) => ({
          ...rule,
          createdBy,
        }))
      );
      this.defaultRulesInitialized = true;
      logger.info('Default compliance rules initialized', { count: DEFAULT_RULES.length });
    } catch (error) {
      logger.error('Failed to initialize default rules', { error });
      throw error;
    }
  }

  async checkContent(
    input: ContentCheckInput,
    userId?: string,
    sessionId?: string
  ): Promise<InstanceType<typeof ComplianceCheck>> {
    const startTime = Date.now();

    try {
      // Get active rules for the platform
      const rules = await this.getActiveRules(input.platform);
      const violations: Array<{
        ruleId: string;
        ruleName: string;
        type: string;
        severity: string;
        description: string;
        matchedContent: string;
        position: { start: number; end: number };
        action: string;
        autoFixAvailable: boolean;
      }> = [];
      const checkResults: Array<{
        ruleId: string;
        ruleName: string;
        passed: boolean;
        details?: string;
      }> = [];

      // Check each rule
      for (const rule of rules) {
        const result = await this.evaluateRule(rule, input.text);
        checkResults.push({
          ruleId: rule._id.toString(),
          ruleName: rule.name,
          passed: result.passed,
          details: result.details,
        });

        if (!result.passed && result.matchedContent) {
          violations.push({
            ruleId: rule._id.toString(),
            ruleName: rule.name,
            type: rule.type,
            severity: rule.severity,
            description: rule.description,
            matchedContent: result.matchedContent,
            position: result.position,
            action: rule.action,
            autoFixAvailable: rule.action === 'auto_fix' || rule.action === 'suggest_edit',
          });
        }
      }

      // Calculate compliance score
      const score = this.calculateScore(violations);
      const status = this.determineStatus(score, violations);

      const check = new ComplianceCheck({
        contentId: input.contentId,
        content: {
          text: input.text,
          imageUrls: input.imageUrls,
          videoUrl: input.videoUrl,
          metadata: input.metadata,
        },
        platform: input.platform,
        rules: checkResults,
        violations,
        score,
        status,
        checkedAt: new Date(),
        userId,
        sessionId,
        processingTimeMs: Date.now() - startTime,
      });

      await check.save();

      // Update user history
      if (userId) {
        await this.updateHistory(userId, check);
      }

      logger.info('Content check completed', {
        contentId: input.contentId,
        score,
        status,
        violations: violations.length,
        processingTimeMs: Date.now() - startTime,
      });

      return check;
    } catch (error) {
      logger.error('Content check failed', { contentId: input.contentId, error });
      throw error;
    }
  }

  private async evaluateRule(
    rule: IComplianceRule,
    text: string
  ): Promise<{ passed: boolean; matchedContent?: string; position?: { start: number; end: number }; details?: string }> {
    const lowerText = text.toLowerCase();

    // Check keywords
    if (rule.keywords && rule.keywords.length > 0) {
      for (const keyword of rule.keywords) {
        const lowerKeyword = keyword.toLowerCase();
        const index = lowerText.indexOf(lowerKeyword);
        if (index !== -1) {
          return {
            passed: false,
            matchedContent: text.substring(index, index + keyword.length),
            position: { start: index, end: index + keyword.length },
            details: `Matched keyword: ${keyword}`,
          };
        }
      }
    }

    // Check regex pattern
    if (rule.regexPattern) {
      try {
        const regex = new RegExp(rule.regexPattern, 'gi');
        const match = regex.exec(text);
        if (match) {
          return {
            passed: false,
            matchedContent: match[0],
            position: { start: match.index, end: match.index + match[0].length },
            details: `Matched pattern: ${rule.regexPattern}`,
          };
        }
      } catch (e) {
        logger.warn('Invalid regex pattern', { ruleId: rule._id, pattern: rule.regexPattern });
      }
    }

    // Check pattern string
    if (rule.pattern) {
      const index = lowerText.indexOf(rule.pattern.toLowerCase());
      if (index !== -1) {
        return {
          passed: false,
          matchedContent: text.substring(index, index + rule.pattern.length),
          position: { start: index, end: index + rule.pattern.length },
          details: `Matched pattern: ${rule.pattern}`,
        };
      }
    }

    return { passed: true };
  }

  private calculateScore(violations: Array<{ severity: string }>): number {
    if (violations.length === 0) return 100;

    const severityWeights: Record<string, number> = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3,
      info: 1,
    };

    let deduction = 0;
    for (const violation of violations) {
      deduction += severityWeights[violation.severity] || 5;
    }

    return Math.max(0, 100 - deduction);
  }

  private determineStatus(
    score: number,
    violations: Array<{ severity: string; action: string }>
  ): 'passed' | 'warning' | 'failed' | 'error' {
    if (violations.some((v) => v.action === 'block' || v.severity === 'critical')) {
      return 'failed';
    }
    if (score >= 80) return 'passed';
    if (score >= 50) return 'warning';
    return 'failed';
  }

  private async getActiveRules(platform: string): Promise<IComplianceRule[]> {
    return ComplianceRule.find({
      enabled: true,
      $or: [{ platforms: 'all' }, { platforms: platform }],
    });
  }

  async batchCheck(
    inputs: BatchCheckInput['contents'],
    userId?: string
  ): Promise<InstanceType<typeof ComplianceCheck>[]> {
    const results: InstanceType<typeof ComplianceCheck>[] = [];

    for (const input of inputs) {
      try {
        const check = await this.checkContent(
          {
            contentId: input.contentId,
            text: input.text,
            imageUrls: input.imageUrls,
            videoUrl: input.videoUrl,
            platform: input.platform,
            metadata: input.metadata,
          },
          userId
        );
        results.push(check);
      } catch (error) {
        logger.error('Batch check item failed', { contentId: input.contentId, error });
      }
    }

    return results;
  }

  async prePublishValidation(
    input: ContentCheckInput
  ): Promise<{
    isValid: boolean;
    score: number;
    status: string;
    violations: Array<{ type: string; message: string; severity: string }>;
    warnings: string[];
  }> {
    const check = await this.checkContent(input);

    const blockingViolations = check.violations.filter(
      (v) => v.action === 'block' || v.severity === 'critical'
    );

    const warnings = check.violations
      .filter((v) => v.action === 'warn' || v.action === 'flag_review')
      .map((v) => `${v.type}: ${v.description}`);

    return {
      isValid: blockingViolations.length === 0,
      score: check.score,
      status: check.status,
      violations: blockingViolations.map((v) => ({
        type: v.type,
        message: v.description,
        severity: v.severity,
      })),
      warnings,
    };
  }

  async getFixSuggestions(
    contentId: string
  ): Promise<{
    originalContent: string;
    suggestions: Array<{ original: string; suggested: string; reason: string }>;
  }> {
    const check = await ComplianceCheck.findOne({ contentId });
    if (!check) {
      throw new Error('Check not found');
    }

    const suggestions: Array<{ original: string; suggested: string; reason: string }> = [];

    for (const violation of check.violations) {
      if (violation.autoFixAvailable) {
        // Generate fix suggestion based on violation type
        let suggested = check.content.text;

        if (violation.type === 'ftc_disclosure') {
          suggested = '#Ad ' + check.content.text;
          suggestions.push({
            original: violation.matchedContent,
            suggested: '#Ad',
            reason: 'Add proper disclosure for sponsored content',
          });
        } else if (violation.action === 'warn' && violation.matchedContent) {
          // Simple replacement suggestion
          suggestions.push({
            original: violation.matchedContent,
            suggested: '[REDACTED]',
            reason: `Remove or replace content flagged as ${violation.type}`,
          });
        }
      }
    }

    return {
      originalContent: check.content.text,
      suggestions,
    };
  }

  private async updateHistory(
    userId: string,
    check: InstanceType<typeof ComplianceCheck>
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      await ComplianceHistory.findOneAndUpdate(
        { userId, date: today },
        {
          $push: {
            checks: {
              checkId: check._id.toString(),
              contentId: check.contentId,
              platform: check.platform,
              score: check.score,
              status: check.status,
              violations: check.violations.length,
            },
          },
          $inc: {
            totalChecks: 1,
            totalViolations: check.violations.length,
          },
          $setOnInsert: {
            userId,
            date: today,
          },
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error('Failed to update history', { userId, error });
    }
  }

  async getHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<InstanceType<typeof ComplianceHistory>[]> {
    const query: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    return ComplianceHistory.find(query).sort({ date: -1 }).limit(100);
  }

  async getAnalytics(
    startDate?: Date,
    endDate?: Date,
    userId?: string
  ): Promise<{
    totalChecks: number;
    averageScore: number;
    passRate: number;
    topViolations: Array<{ type: string; count: number }>;
    scoreTrend: Array<{ date: string; averageScore: number }>;
    severityBreakdown: Record<string, number>;
  }> {
    const matchStage: Record<string, unknown> = {};
    if (userId) matchStage.userId = userId;
    if (startDate || endDate) {
      matchStage.checkedAt = {};
      if (startDate) matchStage.checkedAt.$gte = startDate;
      if (endDate) matchStage.checkedAt.$lte = endDate;
    }

    const aggregation = await ComplianceCheck.aggregate([
      { $match: matchStage },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalChecks: { $sum: 1 },
                averageScore: { $avg: '$score' },
                passRate: {
                  $avg: { $cond: [{ $in: ['$status', ['passed']] }, 1, 0] },
                },
              },
            },
          ],
          topViolations: [
            { $unwind: '$violations' },
            {
              $group: {
                _id: '$violations.type',
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { type: '$_id', count: 1, _id: 0 } },
          ],
          severityBreakdown: [
            { $unwind: '$violations' },
            {
              $group: {
                _id: '$violations.severity',
                count: { $sum: 1 },
              },
            },
            { $project: { severity: '$_id', count: 1, _id: 0 } },
          ],
          scoreTrend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$checkedAt' },
                },
                averageScore: { $avg: '$score' },
              },
            },
            { $sort: { _id: 1 } },
            { $limit: 30 },
            { $project: { date: '$_id', averageScore: 1, _id: 0 } },
          ],
        },
      },
    ]);

    const overview = aggregation[0]?.overview[0] || {
      totalChecks: 0,
      averageScore: 0,
      passRate: 0,
    };

    const severityBreakdown: Record<string, number> = {};
    for (const item of aggregation[0]?.severityBreakdown || []) {
      severityBreakdown[item.severity] = item.count;
    }

    return {
      totalChecks: overview.totalChecks,
      averageScore: Math.round(overview.averageScore * 100) / 100,
      passRate: Math.round(overview.passRate * 100 * 100) / 100,
      topViolations: aggregation[0]?.topViolations || [],
      scoreTrend: aggregation[0]?.scoreTrend || [],
      severityBreakdown,
    };
  }

  // Rule management methods
  async createRule(input: RuleInput, createdBy: string): Promise<IComplianceRule> {
    const rule = new ComplianceRule({
      ...input,
      createdBy,
    });
    await rule.save();
    logger.info('Rule created', { ruleId: rule._id, name: rule.name });
    return rule;
  }

  async getRules(
    filters?: {
      type?: string;
      severity?: string;
      platform?: string;
      enabled?: boolean;
    },
    pagination?: { page: number; limit: number }
  ): Promise<{ rules: IComplianceRule[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.type) query.type = filters.type;
    if (filters?.severity) query.severity = filters.severity;
    if (filters?.enabled !== undefined) query.enabled = filters.enabled;
    if (filters?.platform) {
      query.$or = [{ platforms: 'all' }, { platforms: filters.platform }];
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const [rules, total] = await Promise.all([
      ComplianceRule.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      ComplianceRule.countDocuments(query),
    ]);

    return { rules, total };
  }

  async updateRule(
    ruleId: string,
    updates: Partial<RuleInput>
  ): Promise<IComplianceRule | null> {
    const rule = await ComplianceRule.findByIdAndUpdate(
      ruleId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (rule) {
      logger.info('Rule updated', { ruleId: rule._id });
    }

    return rule;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const result = await ComplianceRule.findByIdAndDelete(ruleId);
    if (result) {
      logger.info('Rule deleted', { ruleId });
      return true;
    }
    return false;
  }
}

export const complianceService = new ComplianceService();