import { v4 as uuidv4 } from 'uuid';
import { KeywordRule, Violation, Severity } from '../types';
import { logger } from '../utils/logger';

export class KeywordService {
  private rules: Map<string, KeywordRule>;
  private defaultRules: KeywordRule[];

  constructor() {
    this.rules = new Map();
    this.defaultRules = this.initializeDefaultRules();
  }

  private initializeDefaultRules(): KeywordRule[] {
    const defaultRules: KeywordRule[] = [
      {
        id: uuidv4(),
        name: 'Adult Content',
        keywords: ['nsfw', 'porn', 'adult content', 'xxx', 'nude', 'explicit', 'sexy'],
        category: 'adult',
        severity: 'critical',
        action: 'block',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Violence',
        keywords: ['violence', 'gore', 'blood', 'murder', 'kill', 'assault', 'attack'],
        category: 'violence',
        severity: 'high',
        action: 'block',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Hate Speech',
        keywords: ['hate', 'racist', 'discrimination', 'slur', 'supremacist'],
        category: 'hate',
        severity: 'critical',
        action: 'block',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Weapons',
        keywords: ['weapon', 'gun', 'firearm', 'ammunition', 'explosive', 'bomb'],
        category: 'weapons',
        severity: 'high',
        action: 'block',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Drugs',
        keywords: ['drug', 'marijuana', 'cannabis', 'cocaine', 'heroin', 'prescription drug'],
        category: 'drugs',
        severity: 'high',
        action: 'block',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Gambling',
        keywords: ['gambling', 'casino', 'betting', 'poker', 'lottery', 'wager'],
        category: 'gambling',
        severity: 'medium',
        action: 'warn',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Alcohol',
        keywords: ['alcohol', 'beer', 'wine', 'vodka', 'whiskey', 'drunk', 'drinking'],
        category: 'alcohol',
        severity: 'low',
        action: 'warn',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Add default rules to the map
    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
    return defaultRules;
  }

  createRule(rule: Omit<KeywordRule, 'id' | 'createdAt' | 'updatedAt' | 'enabled'>): KeywordRule {
    const newRule: KeywordRule = {
      id: uuidv4(),
      ...rule,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  updateRule(ruleId: string, updates: Partial<KeywordRule>): KeywordRule | undefined {
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

  getRule(ruleId: string): KeywordRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(enabledOnly: boolean = false): KeywordRule[] {
    const rules = Array.from(this.rules.values());
    return enabledOnly ? rules.filter(r => r.enabled) : rules;
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

  checkContent(text: string): Violation[] {
    const violations: Violation[] = [];
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      for (const keyword of rule.keywords) {
        const lowerKeyword = keyword.toLowerCase();

        // Check for exact phrase match
        const phraseIndex = lowerText.indexOf(lowerKeyword);
        if (phraseIndex !== -1) {
          violations.push(this.createViolation(rule, keyword, text, phraseIndex, phraseIndex + keyword.length));
          logger.logKeywordMatch(rule.name, keyword, rule.severity);
          continue;
        }

        // Check for word boundary match
        for (let i = 0; i < words.length; i++) {
          if (words[i] === lowerKeyword) {
            const start = words.slice(0, i).join(' ').length + (i > 0 ? 1 : 0);
            const end = start + keyword.length;
            violations.push(this.createViolation(rule, keyword, text, start, end));
            logger.logKeywordMatch(rule.name, keyword, rule.severity);
          }
        }
      }
    }

    return violations;
  }

  private createViolation(
    rule: KeywordRule,
    matchedValue: string,
    text: string,
    start: number,
    end: number
  ): Violation {
    // Get context around the match
    const contextStart = Math.max(0, start - 30);
    const contextEnd = Math.min(text.length, end + 30);
    const context = text.substring(contextStart, contextEnd);

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      matchedValue,
      context,
      position: { start, end },
    };
  }

  calculateRiskScore(violations: Violation[]): number {
    const severityWeights: Record<Severity, number> = {
      critical: 40,
      high: 30,
      medium: 15,
      low: 5,
    };

    let score = 0;
    for (const violation of violations) {
      score += severityWeights[violation.severity];
    }

    return Math.min(score, 100);
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const rule of this.rules.values()) {
      categories.add(rule.category);
    }
    return Array.from(categories);
  }
}

export const keywordService = new KeywordService();
