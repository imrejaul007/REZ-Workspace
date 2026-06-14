import { v4 as uuidv4 } from 'uuid';
import { BrandRule, BrandRuleEntry, EntityType, MatchType } from '../types';
import { logger } from '../utils/logger';

export class BrandService {
  private rules: Map<string, BrandRule>;

  constructor() {
    this.rules = new Map();
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Add some default brand safety rules
    const defaultRules: BrandRule[] = [
      {
        id: uuidv4(),
        name: 'Competitor Brands',
        type: 'blacklist',
        entries: [
          { value: 'competitor1', matchType: 'contains' },
          { value: 'competitor2', matchType: 'contains' },
        ],
        entityType: 'keyword',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Safe Publishers',
        type: 'whitelist',
        entries: [
          { value: 'nytimes.com', matchType: 'exact' },
          { value: 'bbc.com', matchType: 'exact' },
          { value: 'reuters.com', matchType: 'exact' },
        ],
        entityType: 'url',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  createRule(rule: Omit<BrandRule, 'id' | 'createdAt' | 'updatedAt' | 'enabled'>): BrandRule {
    const newRule: BrandRule = {
      id: uuidv4(),
      ...rule,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  updateRule(ruleId: string, updates: Partial<BrandRule>): BrandRule | undefined {
    const rule = this.rules.get(ruleId);
    if (!rule) return undefined;

    const updatedRule = {
      ...rule,
      ...updates,
      id: rule.id,
      createdAt: rule.createdAt,
      updatedAt: new Date(),
    };

    this.rules.set(ruleId, updatedRule);
    return updatedRule;
  }

  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRule(ruleId: string): BrandRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(type?: 'whitelist' | 'blacklist'): BrandRule[] {
    const rules = Array.from(this.rules.values());
    if (type) {
      return rules.filter(r => r.type === type);
    }
    return rules;
  }

  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    rule.enabled = true;
    rule.updatedAt = new Date();
    return true;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    rule.enabled = false;
    rule.updatedAt = new Date();
    return true;
  }

  checkContent(
    content: string,
    entityType?: EntityType
  ): { blocked: boolean; matchedRules: BrandRule[] } {
    const matchedRules: BrandRule[] = [];
    const lowerContent = content.toLowerCase();

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (entityType && rule.entityType !== entityType) continue;

      for (const entry of rule.entries) {
        if (this.matchesEntry(lowerContent, entry)) {
          if (!matchedRules.includes(rule)) {
            matchedRules.push(rule);
            logger.logBrandViolation(entry.value, rule.type, rule.entityType);
          }
        }
      }
    }

    // Check if any blacklist rule matched
    const blocked = matchedRules.some(r => r.type === 'blacklist');

    return { blocked, matchedRules };
  }

  checkUrl(url: string): { allowed: boolean; matchedRules: BrandRule[] } {
    const { blocked, matchedRules } = this.checkContent(url, 'url');

    // If it's a whitelist rule, we need to verify the URL is in the whitelist
    if (!blocked) {
      const whitelistRules = this.getAllRules('whitelist').filter(r =>
        r.entityType === 'url' && r.enabled
      );

      for (const rule of whitelistRules) {
        for (const entry of rule.entries) {
          if (this.matchesEntry(url.toLowerCase(), entry)) {
            return { allowed: true, matchedRules: [rule] };
          }
        }
      }
    }

    return { allowed: !blocked, matchedRules };
  }

  private matchesEntry(content: string, entry: BrandRuleEntry): boolean {
    const value = entry.caseSensitive ? entry.value : entry.value.toLowerCase();
    const checkContent = entry.caseSensitive ? content : content;

    switch (entry.matchType) {
      case 'exact':
        return checkContent === value;

      case 'contains':
        return checkContent.includes(value);

      case 'regex':
        try {
          const regex = new RegExp(value, 'i');
          return regex.test(content);
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  getEntityTypes(): EntityType[] {
    return ['advertiser', 'publisher', 'keyword', 'url', 'category'];
  }
}

export const brandService = new BrandService();
