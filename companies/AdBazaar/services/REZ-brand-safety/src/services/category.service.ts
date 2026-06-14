import { v4 as uuidv4 } from 'uuid';
import { CategoryExclusion, SafetyLevel, ContentCategory } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { logger } from '../utils/logger';

export class CategoryService {
  private exclusions: Map<string, CategoryExclusion>;
  private defaultCategories: string[];

  constructor() {
    this.exclusions = new Map();
    this.defaultCategories = Object.keys(DEFAULT_CATEGORIES);
  }

  createExclusion(
    name: string,
    keywords: string[],
    advertiserId?: string
  ): CategoryExclusion {
    const exclusion: CategoryExclusion = {
      id: uuidv4(),
      name,
      keywords,
      advertiserId,
      enabled: true,
      createdAt: new Date(),
    };

    this.exclusions.set(exclusion.id, exclusion);
    return exclusion;
  }

  updateExclusion(
    exclusionId: string,
    updates: Partial<Omit<CategoryExclusion, 'id' | 'createdAt'>>
  ): CategoryExclusion | undefined {
    const exclusion = this.exclusions.get(exclusionId);
    if (!exclusion) return undefined;

    const updated = { ...exclusion, ...updates };
    this.exclusions.set(exclusionId, updated);
    return updated;
  }

  deleteExclusion(exclusionId: string): boolean {
    return this.exclusions.delete(exclusionId);
  }

  getExclusion(exclusionId: string): CategoryExclusion | undefined {
    return this.exclusions.get(exclusionId);
  }

  getAllExclusions(advertiserId?: string): CategoryExclusion[] {
    let exclusions = Array.from(this.exclusions.values()).filter(e => e.enabled);

    if (advertiserId) {
      // Return global exclusions plus advertiser-specific ones
      exclusions = exclusions.filter(
        e => !e.advertiserId || e.advertiserId === advertiserId
      );
    }

    return exclusions;
  }

  getExcludedCategories(advertiserId?: string): string[] {
    const exclusions = this.getAllExclusions(advertiserId);
    const categories = new Set(this.defaultCategories);

    for (const exclusion of exclusions) {
      // If keywords match a category name, exclude that category
      for (const keyword of exclusion.keywords) {
        const categoryKey = keyword.toLowerCase();
        if (this.defaultCategories.includes(categoryKey)) {
          categories.delete(categoryKey);
        }
      }
    }

    return Array.from(categories);
  }

  checkCategories(
    detectedCategories: string[],
    safetyLevel: SafetyLevel,
    advertiserId?: string
  ): ContentCategory[] {
    const excludedCategories = this.getExcludedCategories(advertiserId);
    const results: ContentCategory[] = [];

    // Severity thresholds by safety level
    const severityThresholds: Record<SafetyLevel, string[]> = {
      strict: ['low', 'medium', 'high', 'critical'],
      moderate: ['medium', 'high', 'critical'],
      relaxed: ['high', 'critical'],
    };

    const threshold = severityThresholds[safetyLevel];
    const blockedSeverities = new Set(threshold);

    for (const category of detectedCategories) {
      const categoryInfo = DEFAULT_CATEGORIES[category as keyof typeof DEFAULT_CATEGORIES];

      if (categoryInfo) {
        const isBlocked = blockedSeverities.has(categoryInfo.severity) &&
                         excludedCategories.includes(category);

        results.push({
          name: category,
          confidence: 1,
          isBlocked,
          reason: isBlocked
            ? `Category '${categoryInfo.name}' is blocked at ${safetyLevel} safety level`
            : undefined,
        });

        if (isBlocked) {
          logger.logCategoryBlock(category, advertiserId);
        }
      }
    }

    return results;
  }

  getDefaultCategories(): { name: string; info: typeof DEFAULT_CATEGORIES[keyof typeof DEFAULT_CATEGORIES] }[] {
    return Object.entries(DEFAULT_CATEGORIES).map(([name, info]) => ({
      name,
      info,
    }));
  }

  isCategoryBlocked(category: string, safetyLevel: SafetyLevel): boolean {
    const categoryInfo = DEFAULT_CATEGORIES[category as keyof typeof DEFAULT_CATEGORIES];
    if (!categoryInfo) return false;

    const severityThresholds: Record<SafetyLevel, string[]> = {
      strict: ['low', 'medium', 'high', 'critical'],
      moderate: ['medium', 'high', 'critical'],
      relaxed: ['high', 'critical'],
    };

    return severityThresholds[safetyLevel].includes(categoryInfo.severity);
  }
}

export const categoryService = new CategoryService();
