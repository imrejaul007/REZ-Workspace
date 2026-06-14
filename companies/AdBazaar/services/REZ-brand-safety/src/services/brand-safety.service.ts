import { v4 as uuidv4 } from 'uuid';
import {
  ContentCheckResult,
  ContentCheckRequest,
  BatchCheckResult,
  SafetyLevel,
  Violation,
  Warning,
  MatchedRule,
} from '../types';
import { keywordService } from './keyword.service';
import { imageModerationService } from './image.service';
import { brandService } from './brand.service';
import { categoryService } from './category.service';
import { logger } from '../utils/logger';

export class BrandSafetyService {
  private defaultSafetyLevel: SafetyLevel;
  private cache: Map<string, { result: ContentCheckResult; timestamp: number }>;
  private cacheTTL: number; // ms

  constructor(defaultSafetyLevel: SafetyLevel = 'moderate', cacheTTL: number = 15 * 60 * 1000) {
    this.defaultSafetyLevel = defaultSafetyLevel;
    this.cache = new Map();
    this.cacheTTL = cacheTTL;
  }

  async checkContent(request: ContentCheckRequest): Promise<ContentCheckResult> {
    const safetyLevel = request.safetyLevel || this.defaultSafetyLevel;
    const contentId = this.generateContentId(request);

    // Check cache
    const cached = this.getFromCache(contentId);
    if (cached) {
      return cached;
    }

    const violations: Violation[] = [];
    const warnings: Warning[] = [];
    const matchedRules: MatchedRule[] = [];
    const categories: ContentCheckResult['categories'] = [];

    // Check text content for keyword violations
    if (request.content.text) {
      const keywordViolations = keywordService.checkContent(request.content.text);
      violations.push(...keywordViolations);

      // Add matched rules
      for (const violation of keywordViolations) {
        matchedRules.push({
          ruleId: violation.ruleId,
          ruleName: violation.ruleName,
          type: 'keyword',
          matchedValue: violation.matchedValue,
        });

        // Generate warnings for non-blocking violations
        if (violation.severity === 'low') {
          warnings.push({
            ruleId: violation.ruleId,
            ruleName: violation.ruleName,
            message: `Low severity match for: ${violation.matchedValue}`,
            severity: 'low',
          });
        }
      }
    }

    // Check image content
    if (request.content.imageUrl) {
      const imageResult = await imageModerationService.analyzeImage(request.content.imageUrl);

      for (const category of imageResult.categories) {
        if (category.isBlocked) {
          violations.push({
            ruleId: 'image-moderation',
            ruleName: 'Image Moderation',
            category: category.name,
            severity: 'high',
            matchedValue: category.name,
            context: category.reason,
            position: { start: 0, end: 0 },
          });
        }

        matchedRules.push({
          ruleId: 'image-moderation',
          ruleName: 'Image Moderation',
          type: 'image',
          matchedValue: category.name,
        });
      }

      categories.push(...imageResult.categories);
    }

    // Check against brand rules
    if (request.content.text) {
      const brandCheck = brandService.checkContent(request.content.text);
      for (const rule of brandCheck.matchedRules) {
        for (const entry of rule.entries) {
          matchedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            type: 'brand',
            matchedValue: entry.value,
          });
        }

        if (rule.type === 'blacklist') {
          warnings.push({
            ruleId: rule.id,
            ruleName: rule.name,
            message: `Content matches blacklist rule: ${rule.name}`,
            severity: 'medium',
          });
        }
      }
    }

    // Check categories
    if (request.content.categories && request.content.categories.length > 0) {
      const categoryResults = categoryService.checkCategories(
        request.content.categories,
        safetyLevel,
        request.advertiserId
      );

      for (const category of categoryResults) {
        categories.push(category);

        if (category.isBlocked) {
          violations.push({
            ruleId: 'category-exclusion',
            ruleName: `Category: ${category.name}`,
            category: category.name,
            severity: 'high',
            matchedValue: category.name,
            context: category.reason,
            position: { start: 0, end: 0 },
          });
        }
      }
    }

    // Calculate overall risk score
    const keywordRiskScore = keywordService.calculateRiskScore(violations);
    const imageCategoriesRisk = categories
      .filter(c => c.isBlocked)
      .reduce((sum, c) => sum + (c.confidence * 30), 0);
    const riskScore = Math.min(keywordRiskScore + imageCategoriesRisk, 100);

    // Determine if content is safe based on safety level
    const isSafe = this.isContentSafe(violations, safetyLevel);

    const result: ContentCheckResult = {
      id: uuidv4(),
      isSafe,
      riskScore,
      safetyLevel,
      violations,
      warnings,
      matchedRules,
      categories,
      recommendations: this.generateRecommendations(violations, warnings, safetyLevel),
      checkedAt: new Date(),
    };

    // Cache the result
    this.cacheResult(contentId, result);

    logger.logContentCheck(contentId, isSafe, violations.length, riskScore);

    return result;
  }

  async checkBatch(requests: ContentCheckRequest[]): Promise<BatchCheckResult> {
    const results: ContentCheckResult[] = [];
    let safe = 0;
    let flagged = 0;
    let blocked = 0;

    for (const request of requests) {
      const result = await this.checkContent(request);
      results.push(result);

      if (result.isSafe) safe++;
      else if (result.violations.some(v => v.severity === 'critical' || v.severity === 'high')) blocked++;
      else flagged++;
    }

    return {
      total: requests.length,
      safe,
      flagged,
      blocked,
      results,
    };
  }

  private isContentSafe(violations: Violation[], safetyLevel: SafetyLevel): boolean {
    // Severity thresholds by safety level
    const blockingSeverities: Record<SafetyLevel, string[]> = {
      strict: ['low', 'medium', 'high', 'critical'],
      moderate: ['medium', 'high', 'critical'],
      relaxed: ['high', 'critical'],
    };

    const blocking = blockingSeverities[safetyLevel];
    return !violations.some(v => blocking.includes(v.severity));
  }

  private generateRecommendations(
    violations: Violation[],
    warnings: Warning[],
    safetyLevel: SafetyLevel
  ): string[] {
    const recommendations: string[] = [];

    if (violations.length === 0 && warnings.length === 0) {
      recommendations.push('Content appears safe for all safety levels');
      return recommendations;
    }

    // Categorize violations by severity
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const highViolations = violations.filter(v => v.severity === 'high');
    const mediumViolations = violations.filter(v => v.severity === 'medium');

    if (criticalViolations.length > 0) {
      recommendations.push('CRITICAL: Content contains critical violations that must be addressed');
      recommendations.push(`Remove or modify content matching: ${criticalViolations.map(v => v.matchedValue).join(', ')}`);
    }

    if (highViolations.length > 0) {
      recommendations.push('HIGH: Content contains high-severity violations');
      recommendations.push(`Review content matching: ${highViolations.map(v => v.matchedValue).join(', ')}`);
    }

    if (mediumViolations.length > 0) {
      recommendations.push('MEDIUM: Content contains moderate violations that may need attention');
    }

    if (warnings.length > 0) {
      recommendations.push('Review the following warnings:');
      warnings.forEach(w => {
        recommendations.push(`  - ${w.message}`);
      });
    }

    if (safetyLevel === 'relaxed' && (criticalViolations.length > 0 || highViolations.length > 0)) {
      recommendations.push('Consider using a stricter safety level for this content');
    }

    return recommendations;
  }

  private generateContentId(request: ContentCheckRequest): string {
    const parts = [
      request.content.text || '',
      request.content.imageUrl || '',
      request.advertiserId || '',
      request.safetyLevel || this.defaultSafetyLevel,
    ];
    return this.hashString(parts.join('|'));
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private getFromCache(contentId: string): ContentCheckResult | null {
    const cached = this.cache.get(contentId);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTTL) {
      this.cache.delete(contentId);
      return null;
    }

    return cached.result;
  }

  private cacheResult(contentId: string, result: ContentCheckResult): void {
    this.cache.set(contentId, {
      result,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.cache.size > 10000) {
      const entries = Array.from(this.cache.entries());
      const oldEntries = entries.slice(0, 1000);
      oldEntries.forEach(([key]) => this.cache.delete(key));
    }
  }

  setDefaultSafetyLevel(level: SafetyLevel): void {
    this.defaultSafetyLevel = level;
  }

  getDefaultSafetyLevel(): SafetyLevel {
    return this.defaultSafetyLevel;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getStats(): { cacheSize: number } {
    return { cacheSize: this.cache.size };
  }
}

export const brandSafetyService = new BrandSafetyService();
