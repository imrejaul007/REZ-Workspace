import { z } from 'zod';

// Validation Schemas
export const ContentCheckSchema = z.object({
  content: z.object({
    text: z.string().optional(),
    imageUrl: z.string().url().optional(),
    categories: z.array(z.string()).optional(),
  }),
  advertiserId: z.string().optional(),
  campaignId: z.string().optional(),
  safetyLevel: z.enum(['strict', 'moderate', 'relaxed']).optional(),
});

export const KeywordRuleSchema = z.object({
  name: z.string().min(1),
  keywords: z.array(z.string().min(1)),
  category: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  action: z.enum(['warn', 'block', 'review']),
});

export const BrandRuleSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['whitelist', 'blacklist']),
  entries: z.array(z.object({
    value: z.string(),
    matchType: z.enum(['exact', 'contains', 'regex']),
  })),
  entityType: z.enum(['advertiser', 'publisher', 'keyword', 'url', 'category']),
});

// Type Definitions
export type SafetyLevel = 'strict' | 'moderate' | 'relaxed';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Action = 'warn' | 'block' | 'review';
export type MatchType = 'exact' | 'contains' | 'regex';
export type EntityType = 'advertiser' | 'publisher' | 'keyword' | 'url' | 'category';

export interface ContentCheckResult {
  id: string;
  isSafe: boolean;
  riskScore: number;
  safetyLevel: SafetyLevel;
  violations: Violation[];
  warnings: Warning[];
  matchedRules: MatchedRule[];
  categories: ContentCategory[];
  recommendations: string[];
  checkedAt: Date;
}

export interface Violation {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: Severity;
  matchedValue: string;
  context?: string;
  position: { start: number; end: number };
}

export interface Warning {
  ruleId: string;
  ruleName: string;
  message: string;
  severity: Severity;
}

export interface MatchedRule {
  ruleId: string;
  ruleName: string;
  type: 'keyword' | 'brand' | 'category' | 'image';
  matchedValue: string;
}

export interface ContentCategory {
  name: string;
  confidence: number;
  isBlocked: boolean;
  reason?: string;
}

export interface KeywordRule {
  id: string;
  name: string;
  keywords: string[];
  category: string;
  severity: Severity;
  action: Action;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandRule {
  id: string;
  name: string;
  type: 'whitelist' | 'blacklist';
  entries: BrandRuleEntry[];
  entityType: EntityType;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandRuleEntry {
  value: string;
  matchType: MatchType;
  caseSensitive?: boolean;
}

export interface CategoryExclusion {
  id: string;
  name: string;
  keywords: string[];
  advertiserId?: string; // Optional - if set, applies only to this advertiser
  enabled: boolean;
  createdAt: Date;
}

export interface AdvertiserSettings {
  advertiserId: string;
  safetyLevel: SafetyLevel;
  excludedCategories: string[];
  customRules: string[]; // Rule IDs
  whitelistedDomains: string[];
  blacklistedDomains: string[];
  updatedAt: Date;
}

export interface BatchCheckResult {
  total: number;
  safe: number;
  flagged: number;
  blocked: number;
  results: ContentCheckResult[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Default blocked categories
export const DEFAULT_CATEGORIES = {
  adult: {
    name: 'Adult Content',
    keywords: ['nsfw', 'porn', 'adult', 'xxx', 'nude', 'explicit'],
    severity: 'critical' as Severity,
  },
  violence: {
    name: 'Violence',
    keywords: ['violence', 'gore', 'blood', 'murder', 'weapons', 'guns', 'kill'],
    severity: 'high' as Severity,
  },
  hate: {
    name: 'Hate Speech',
    keywords: ['hate', 'racist', 'discrimination', 'slur'],
    severity: 'critical' as Severity,
  },
  politics: {
    name: 'Political',
    keywords: ['political', 'election', 'politician', 'government', 'vote'],
    severity: 'medium' as Severity,
  },
  gambling: {
    name: 'Gambling',
    keywords: ['gambling', 'casino', 'betting', 'poker', 'lottery'],
    severity: 'medium' as Severity,
  },
  weapons: {
    name: 'Weapons',
    keywords: ['weapon', 'gun', 'firearm', 'ammunition', 'explosive'],
    severity: 'high' as Severity,
  },
  drugs: {
    name: 'Drugs',
    keywords: ['drug', 'marijuana', 'cannabis', 'cocaine', 'heroin', 'prescription'],
    severity: 'high' as Severity,
  },
  alcohol: {
    name: 'Alcohol',
    keywords: ['alcohol', 'beer', 'wine', 'vodka', 'whiskey', 'drunk'],
    severity: 'low' as Severity,
  },
  tobacco: {
    name: 'Tobacco',
    keywords: ['tobacco', 'cigarette', 'smoking', 'vape', 'nicotine'],
    severity: 'medium' as Severity,
  },
  religion: {
    name: 'Religion',
    keywords: ['religion', 'god', 'church', 'mosque', 'temple', 'faith'],
    severity: 'low' as Severity,
  },
};

// Type exports for Zod inference
export type ContentCheckRequest = z.infer<typeof ContentCheckSchema>;
export type KeywordRuleRequest = z.infer<typeof KeywordRuleSchema>;
export type BrandRuleRequest = z.infer<typeof BrandRuleSchema>;
