/**
 * Reviews Management System
 * Features: Review submission, Moderation, Response templates, Sentiment analysis
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ModerationAction = 'allow' | 'block' | 'review';
export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface Review {
  id: string;
  authorId: string;
  targetId: string;
  targetType: 'product' | 'service' | 'user';
  rating: number;
  title: string;
  content: string;
  status: ReviewStatus;
  sentiment?: SentimentLabel;
  sentimentScore?: number;
  moderatedAt?: Date;
  moderatedBy?: string;
  moderationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  responses: ReviewResponse[];
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  category: 'thank_you' | 'apology' | 'follow_up' | 'correction' | 'general';
  sentiment: SentimentLabel;
  ratingRange?: { min: number; max: number };
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModerationRule {
  id: string;
  name: string;
  type: 'keyword' | 'pattern' | 'sentiment_threshold' | 'rating_threshold' | 'rate_limit';
  config: ModerationRuleConfig;
  action: ModerationAction;
  priority: number;
  isActive: boolean;
  createdAt: Date;
}

export type ModerationRuleConfig =
  | { type: 'keyword'; words: string[]; matchAll?: boolean }
  | { type: 'pattern'; patterns: string[]; caseSensitive?: boolean }
  | { type: 'sentiment_threshold'; threshold: number; direction: 'below' | 'above' }
  | { type: 'rating_threshold'; min?: number; max?: number }
  | { type: 'rate_limit'; maxReviewsPerDay: number; maxReviewsPerHour: number };

export interface SubmissionResult {
  success: boolean;
  review?: Review;
  errors: string[];
  warnings: string[];
}

export interface ModerationResult {
  action: ModerationAction;
  reason: string;
  matchedRules: string[];
  sentiment?: SentimentLabel;
  sentimentScore?: number;
}

export interface ReviewFilters {
  targetId?: string;
  targetType?: 'product' | 'service' | 'user';
  status?: ReviewStatus;
  sentiment?: SentimentLabel;
  ratingMin?: number;
  ratingMax?: number;
  authorId?: string;
  verified?: boolean;
  sortBy?: 'createdAt' | 'rating' | 'helpful' | 'sentimentScore';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Sentiment Analyzer
// ============================================================================

const POSITIVE_WORDS = new Set([
  'excellent', 'amazing', 'wonderful', 'fantastic', 'great', 'awesome', 'outstanding',
  'perfect', 'love', 'loved', 'best', 'brilliant', 'superb', 'quality', 'recommend',
  'impressive', 'exceptional', 'delightful', 'pleased', 'satisfied', 'happy',
  'helpful', 'professional', 'friendly', 'responsive', 'reliable', 'fast', 'quick',
  'beautiful', 'elegant', 'smooth', 'easy', 'intuitive', 'convenient', 'affordable',
  'value', 'worth', 'exceptional', 'incredible', 'phenomenal', 'terrific', 'marvelous',
  'positive', 'pleasant', 'enjoyable', 'satisfying', 'remarkable', 'spectacular',
  'good', 'nice', 'fine', 'decent', 'acceptable', 'adequate', 'reasonable',
  'helpful', 'efficient', 'prompt', 'courteous', 'knowledgeable', 'skilled',
]);

const NEGATIVE_WORDS = new Set([
  'terrible', 'horrible', 'awful', 'worst', 'bad', 'poor', 'disappointing', 'disgusting',
  'hate', 'hated', 'waste', 'useless', 'broken', 'defective', 'fail', 'failed',
  'failure', 'problem', 'problems', 'issue', 'issues', 'bug', 'bugs', 'error', 'errors',
  'slow', 'delayed', 'late', 'rude', 'unprofessional', 'unhelpful', 'unreliable',
  'expensive', 'overpriced', 'scam', 'fraud', 'fake', 'counterfeit', 'misleading',
  'frustrating', 'frustrated', 'annoying', 'annoyed', 'angry', 'upset', 'dissatisfied',
  'complaint', 'complained', 'refund', 'return', 'cancel', 'cancelled', 'refused',
  'never', 'avoid', 'warn', 'warning', 'dangerous', 'unsafe', 'damaged', 'broken',
  'worst', 'pathetic', 'ridiculous', 'unacceptable', 'disaster', 'nightmare', 'regret',
  'complicated', 'confusing', 'difficult', 'hard', 'inconvenient', 'uncomfortable',
]);

const INTENSIFIERS = new Set([
  'very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely', 'really',
  'highly', 'particularly', 'especially', 'exceptionally', 'remarkably', 'truly',
]);

const NEGATORS = new Set([
  'not', "n't", 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere',
  'hardly', 'barely', 'scarcely', 'rarely', 'seldom',
]);

export class SentimentAnalyzer {
  private positiveWords: Set<string>;
  private negativeWords: Set<string>;
  private intensifiers: Set<string>;
  private negators: Set<string>;

  constructor(customWords?: {
    positive?: string[];
    negative?: string[];
    intensifiers?: string[];
    negators?: string[];
  }) {
    this.positiveWords = new Set(customWords?.positive || POSITIVE_WORDS);
    this.negativeWords = new Set(customWords?.negative || NEGATIVE_WORDS);
    this.intensifiers = new Set(customWords?.intensifiers || INTENSIFIERS);
    this.negators = new Set(customWords?.negators || NEGATORS);
  }

  analyze(text: string): { label: SentimentLabel; score: number; details: SentimentDetails } {
    const words = this.tokenize(text);
    let positiveScore = 0;
    let negativeScore = 0;
    let isNegated = false;
    let intensifierMultiplier = 1;

    const positiveMatches: string[] = [];
    const negativeMatches: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();

      // Check for negators
      if (this.negators.has(word)) {
        isNegated = true;
        continue;
      }

      // Check for intensifiers
      if (this.intensifiers.has(word)) {
        intensifierMultiplier = 2;
        continue;
      }

      // Reset negation after a few words
      if (i > 0 && words[i - 1] && !this.isSentenceBoundary(words[i - 1])) {
        if (i - (words.indexOf(word) || 0) > 3) {
          isNegated = false;
        }
      }

      // Check positive words
      if (this.positiveWords.has(word)) {
        const score = intensifierMultiplier * (isNegated ? -1 : 1);
        positiveScore += score;
        if (score > 0) positiveMatches.push(word);
        intensifierMultiplier = 1;
        isNegated = false;
      }

      // Check negative words
      if (this.negativeWords.has(word)) {
        const score = intensifierMultiplier * (isNegated ? -1 : 1);
        negativeScore += Math.abs(score);
        if (score > 0) negativeMatches.push(word);
        intensifierMultiplier = 1;
        isNegated = false;
      }

      // Reset intensifier if we hit a sentence boundary
      if (this.isSentenceBoundary(word)) {
        intensifierMultiplier = 1;
      }
    }

    // Calculate final score: normalized between -1 and 1
    const totalWords = words.length || 1;
    const rawScore = (positiveScore - negativeScore) / Math.sqrt(totalWords);
    const normalizedScore = Math.max(-1, Math.min(1, rawScore / 5));

    // Determine label
    let label: SentimentLabel;
    if (normalizedScore > 0.1) {
      label = 'positive';
    } else if (normalizedScore < -0.1) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    return {
      label,
      score: Math.round(normalizedScore * 100) / 100,
      details: {
        positiveMatches,
        negativeMatches,
        positiveScore,
        negativeScore,
        wordCount: totalWords,
      },
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private isSentenceBoundary(word: string): boolean {
    return /[.!?]$/.test(word);
  }

  getWordLists(): { positive: string[]; negative: string[] } {
    return {
      positive: Array.from(this.positiveWords),
      negative: Array.from(this.negativeWords),
    };
  }
}

// ============================================================================
// Moderation Engine
// ============================================================================

export class ModerationEngine {
  private rules: ModerationRule[] = [];

  constructor(rules?: ModerationRule[]) {
    if (rules) {
      this.rules = rules;
    } else {
      this.rules = this.getDefaultRules();
    }
  }

  addRule(rule: ModerationRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  getRules(): ModerationRule[] {
    return [...this.rules];
  }

  setRules(rules: ModerationRule[]): void {
    this.rules = rules.sort((a, b) => b.priority - a.priority);
  }

  moderate(
    review: { content: string; title: string; rating: number },
    sentimentScore?: number
  ): ModerationResult {
    const matchedRules: string[] = [];
    const fullText = `${review.title} ${review.content}`.toLowerCase();

    for (const rule of this.rules) {
      if (!rule.isActive) continue;

      const result = this.evaluateRule(rule, fullText, review, sentimentScore);
      if (result.matched) {
        matchedRules.push(rule.name);
        if (rule.action === 'block') {
          return {
            action: 'block',
            reason: `Blocked by rule: ${rule.name}`,
            matchedRules,
          };
        }
      }
    }

    // Default action based on matched rules
    if (matchedRules.length > 0) {
      return {
        action: 'review',
        reason: `Flagged for manual review: ${matchedRules.join(', ')}`,
        matchedRules,
      };
    }

    return {
      action: 'allow',
      reason: 'Passed all moderation checks',
      matchedRules: [],
    };
  }

  private evaluateRule(
    rule: ModerationRule,
    text: string,
    review: { rating: number },
    sentimentScore?: number
  ): { matched: boolean } {
    const config = rule.config;

    switch (config.type) {
      case 'keyword': {
        const words = config.words.map(w => w.toLowerCase());
        if (config.matchAll) {
          const allMatch = words.every(word => text.includes(word));
          return { matched: allMatch };
        } else {
          const anyMatch = words.some(word => text.includes(word));
          return { matched: anyMatch };
        }
      }

      case 'pattern': {
        const caseSensitive = config.caseSensitive ?? false;
        const searchText = caseSensitive ? text : text;
        const anyMatch = config.patterns.some(pattern => {
          const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
          return regex.test(searchText);
        });
        return { matched: anyMatch };
      }

      case 'sentiment_threshold': {
        if (sentimentScore === undefined) return { matched: false };
        if (config.direction === 'below') {
          return { matched: sentimentScore < config.threshold };
        } else {
          return { matched: sentimentScore > config.threshold };
        }
      }

      case 'rating_threshold': {
        const minOk = config.min === undefined || review.rating >= config.min;
        const maxOk = config.max === undefined || review.rating <= config.max;
        return { matched: minOk && maxOk };
      }

      case 'rate_limit': {
        // Rate limiting is handled externally
        return { matched: false };
      }

      default:
        return { matched: false };
    }
  }

  private getDefaultRules(): ModerationRule[] {
    return [
      {
        id: 'profanity-rule',
        name: 'Profanity Filter',
        type: 'keyword',
        config: {
          type: 'keyword',
          words: ['spam', 'scam', 'fake', 'hate', 'xxx', 'http://', 'https://'],
          matchAll: false,
        },
        action: 'block',
        priority: 100,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 'extreme-negative-sentiment',
        name: 'Extreme Negative Sentiment',
        type: 'sentiment_threshold',
        config: {
          type: 'sentiment_threshold',
          threshold: -0.7,
          direction: 'below',
        },
        action: 'review',
        priority: 50,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 'rating-content-mismatch',
        name: 'Rating Content Mismatch',
        type: 'pattern',
        config: {
          type: 'pattern',
          patterns: [
            'best product ever',
            'love this',
            'amazing quality',
            'highly recommend',
          ],
          caseSensitive: false,
        },
        action: 'review',
        priority: 30,
        isActive: true,
        createdAt: new Date(),
      },
    ];
  }
}

// ============================================================================
// Response Template Manager
// ============================================================================

export class ResponseTemplateManager {
  private templates: ResponseTemplate[] = [];

  constructor(templates?: ResponseTemplate[]) {
    if (templates) {
      this.templates = templates;
    } else {
      this.templates = this.getDefaultTemplates();
    }
  }

  addTemplate(template: ResponseTemplate): void {
    this.templates.push(template);
  }

  updateTemplate(templateId: string, updates: Partial<ResponseTemplate>): boolean {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
      this.templates[index] = {
        ...this.templates[index],
        ...updates,
        updatedAt: new Date(),
      };
      return true;
    }
    return false;
  }

  removeTemplate(templateId: string): boolean {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
      this.templates.splice(index, 1);
      return true;
    }
    return false;
  }

  getTemplates(): ResponseTemplate[] {
    return [...this.templates];
  }

  findTemplates(filters: {
    category?: ResponseTemplate['category'];
    sentiment?: SentimentLabel;
    ratingRange?: { min: number; max: number };
    activeOnly?: boolean;
  }): ResponseTemplate[] {
    return this.templates.filter(template => {
      if (filters.activeOnly && !template.isActive) return false;
      if (filters.category && template.category !== filters.category) return false;
      if (filters.sentiment && template.sentiment !== filters.sentiment) return false;
      if (filters.ratingRange && template.ratingRange) {
        // Check if template's rating range overlaps with filter range
        const templateMin = template.ratingRange.min;
        const templateMax = template.ratingRange.max;
        const filterMin = filters.ratingRange.min;
        const filterMax = filters.ratingRange.max;
        if (templateMax < filterMin || templateMin > filterMax) return false;
      }
      return true;
    });
  }

  generateResponse(templateId: string, variables: Record<string, string>): string | null {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return null;

    let content = template.content;
    for (const variable of template.variables) {
      const value = variables[variable] || `[${variable}]`;
      content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    }
    return content;
  }

  suggestTemplate(
    sentiment: SentimentLabel,
    rating: number
  ): ResponseTemplate | null {
    const candidates = this.findTemplates({
      sentiment,
      ratingRange: { min: rating, max: rating },
      activeOnly: true,
    });

    // If no exact match, try without rating range
    if (candidates.length === 0) {
      const fallback = this.findTemplates({
        sentiment,
        activeOnly: true,
      });
      return fallback[0] || null;
    }

    return candidates[0];
  }

  private getDefaultTemplates(): ResponseTemplate[] {
    return [
      {
        id: 'thanks-positive-5',
        name: 'Thank You - 5 Star',
        category: 'thank_you',
        sentiment: 'positive',
        ratingRange: { min: 5, max: 5 },
        content:
          'Dear {{customerName}},\n\nThank you for your wonderful 5-star review! We are thrilled to hear that you had an amazing experience with {{productName}}. Your satisfaction is our top priority, and we look forward to serving you again.\n\nBest regards,\n{{companyName}}',
        variables: ['customerName', 'productName', 'companyName'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'thanks-positive-4',
        name: 'Thank You - 4 Star',
        category: 'thank_you',
        sentiment: 'positive',
        ratingRange: { min: 4, max: 4 },
        content:
          'Dear {{customerName}},\n\nThank you for your positive feedback on {{productName}}! We appreciate your 4-star rating and are glad you had a good experience. If there is anything we can do to earn that 5th star, please let us know.\n\nWarm regards,\n{{companyName}}',
        variables: ['customerName', 'productName', 'companyName'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'apology-negative',
        name: 'Apology - Negative Review',
        category: 'apology',
        sentiment: 'negative',
        content:
          'Dear {{customerName}},\n\nWe are truly sorry to hear about your experience with {{productName}}. This is not the standard of service we strive to provide. We have escalated your feedback to our team, and {{contactPerson}} will reach out to you directly to resolve this issue.\n\nWe value your business and hope to make this right.\n\nSincerely,\n{{companyName}}',
        variables: ['customerName', 'productName', 'contactPerson', 'companyName'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'follow-up-neutral',
        name: 'Follow Up - Neutral Review',
        category: 'follow_up',
        sentiment: 'neutral',
        content:
          'Dear {{customerName}},\n\nThank you for sharing your feedback on {{productName}}. We appreciate your honest assessment. We would love to learn more about your experience and how we can improve. Could you please contact us at {{contactEmail}} so we can discuss further?\n\nBest,\n{{companyName}}',
        variables: ['customerName', 'productName', 'contactEmail', 'companyName'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'correction-review',
        name: 'Correction Notice',
        category: 'correction',
        sentiment: 'neutral',
        content:
          'Dear {{customerName}},\n\nThank you for your review. We wanted to clarify regarding your comment about {{topic}}: {{correction}}. If you have any questions, please do not hesitate to reach out.\n\nBest regards,\n{{companyName}}',
        variables: ['customerName', 'topic', 'correction', 'companyName'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}

// ============================================================================
// Review Manager
// ============================================================================

export class ReviewsManager {
  private reviews: Map<string, Review> = new Map();
  private sentimentAnalyzer: SentimentAnalyzer;
  private moderationEngine: ModerationEngine;
  private templateManager: ResponseTemplateManager;
  private userReviewCounts: Map<string, { hourly: Map<number, number>; daily: Map<string, number> }> = new Map();

  constructor(config?: {
    sentimentAnalyzer?: SentimentAnalyzer;
    moderationEngine?: ModerationEngine;
    templateManager?: ResponseTemplateManager;
  }) {
    this.sentimentAnalyzer = config?.sentimentAnalyzer || new SentimentAnalyzer();
    this.moderationEngine = config?.moderationEngine || new ModerationEngine();
    this.templateManager = config?.templateManager || new ResponseTemplateManager();
  }

  // --- Submission ---

  async submitReview(
    reviewData: {
      authorId: string;
      targetId: string;
      targetType: 'product' | 'service' | 'user';
      rating: number;
      title: string;
      content: string;
    },
    options?: { skipModeration?: boolean }
  ): Promise<SubmissionResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate input
    if (!reviewData.authorId) errors.push('Author ID is required');
    if (!reviewData.targetId) errors.push('Target ID is required');
    if (!['product', 'service', 'user'].includes(reviewData.targetType)) {
      errors.push('Invalid target type');
    }
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }
    if (!reviewData.title.trim()) errors.push('Title is required');
    if (!reviewData.content.trim()) errors.push('Content is required');
    if (reviewData.content.length < 10) {
      errors.push('Content must be at least 10 characters');
    }
    if (reviewData.content.length > 5000) {
      errors.push('Content must not exceed 5000 characters');
    }

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    // Check rate limits
    const rateLimitCheck = this.checkRateLimits(reviewData.authorId);
    if (!rateLimitCheck.allowed) {
      errors.push(rateLimitCheck.message);
      return { success: false, errors, warnings };
    }
    if (rateLimitCheck.warnings.length > 0) {
      warnings.push(...rateLimitCheck.warnings);
    }

    // Analyze sentiment
    const sentimentResult = this.sentimentAnalyzer.analyze(
      `${reviewData.title} ${reviewData.content}`
    );

    // Moderate
    let moderationResult: ModerationResult;
    if (options?.skipModeration) {
      moderationResult = { action: 'allow', reason: 'Moderation skipped', matchedRules: [] };
    } else {
      moderationResult = this.moderationEngine.moderate(
        { content: reviewData.content, title: reviewData.title, rating: reviewData.rating },
        sentimentResult.score
      );
    }

    // Determine status based on moderation
    let status: ReviewStatus;
    switch (moderationResult.action) {
      case 'block':
        errors.push(`Review blocked: ${moderationResult.reason}`);
        return { success: false, errors, warnings };
      case 'review':
        status = 'flagged';
        warnings.push(`Review flagged for manual review: ${moderationResult.reason}`);
        break;
      default:
        status = 'pending'; // All reviews start as pending
    }

    // Create review
    const review: Review = {
      id: this.generateId(),
      authorId: reviewData.authorId,
      targetId: reviewData.targetId,
      targetType: reviewData.targetType,
      rating: reviewData.rating,
      title: reviewData.title.trim(),
      content: reviewData.content.trim(),
      status,
      sentiment: sentimentResult.label,
      sentimentScore: sentimentResult.score,
      verified: false,
      helpful: 0,
      notHelpful: 0,
      responses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.reviews.set(review.id, review);
    this.incrementRateLimit(reviewData.authorId);

    return { success: true, review, errors, warnings };
  }

  // --- Retrieval ---

  getReview(reviewId: string): Review | null {
    return this.reviews.get(reviewId) || null;
  }

  getReviews(filters: ReviewFilters = {}): PaginatedResult<Review> {
    let results = Array.from(this.reviews.values());

    // Apply filters
    if (filters.targetId) {
      results = results.filter(r => r.targetId === filters.targetId);
    }
    if (filters.targetType) {
      results = results.filter(r => r.targetType === filters.targetType);
    }
    if (filters.status) {
      results = results.filter(r => r.status === filters.status);
    }
    if (filters.sentiment) {
      results = results.filter(r => r.sentiment === filters.sentiment);
    }
    if (filters.ratingMin !== undefined) {
      results = results.filter(r => r.rating >= filters.ratingMin!);
    }
    if (filters.ratingMax !== undefined) {
      results = results.filter(r => r.rating <= filters.ratingMax!);
    }
    if (filters.authorId) {
      results = results.filter(r => r.authorId === filters.authorId);
    }
    if (filters.verified !== undefined) {
      results = results.filter(r => r.verified === filters.verified);
    }

    // Sort
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    results.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'helpful':
          comparison = a.helpful - b.helpful;
          break;
        case 'sentimentScore':
          comparison = (a.sentimentScore || 0) - (b.sentimentScore || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Paginate
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = results.slice(start, start + limit);

    return { items, total, page, limit, totalPages };
  }

  getReviewsForTarget(targetId: string, status: ReviewStatus = 'approved'): Review[] {
    const result = this.getReviews({ targetId, status, limit: 1000 });
    return result.items;
  }

  // --- Moderation ---

  moderateReview(
    reviewId: string,
    action: 'approve' | 'reject',
    moderatorId: string,
    notes?: string
  ): Review | null {
    const review = this.reviews.get(reviewId);
    if (!review) return null;

    review.status = action === 'approve' ? 'approved' : 'rejected';
    review.moderatedAt = new Date();
    review.moderatedBy = moderatorId;
    review.moderationNotes = notes;
    review.updatedAt = new Date();

    return review;
  }

  getPendingReviews(): Review[] {
    return Array.from(this.reviews.values())
      .filter(r => r.status === 'pending' || r.status === 'flagged')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  getFlaggedReviews(): Review[] {
    return Array.from(this.reviews.values())
      .filter(r => r.status === 'flagged')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // --- Response Management ---

  addResponse(
    reviewId: string,
    responseData: { authorId: string; content: string }
  ): ReviewResponse | null {
    const review = this.reviews.get(reviewId);
    if (!review) return null;

    const response: ReviewResponse = {
      id: this.generateId(),
      reviewId,
      authorId: responseData.authorId,
      content: responseData.content.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    review.responses.push(response);
    review.updatedAt = new Date();

    return response;
  }

  generateSuggestedResponse(reviewId: string, variables: Record<string, string>): string | null {
    const review = this.reviews.get(reviewId);
    if (!review) return null;

    const template = this.templateManager.suggestTemplate(
      review.sentiment || 'neutral',
      review.rating
    );

    if (!template) return null;

    return this.templateManager.generateResponse(template.id, variables);
  }

  // --- Voting ---

  voteHelpful(reviewId: string, helpful: boolean): Review | null {
    const review = this.reviews.get(reviewId);
    if (!review) return null;

    if (helpful) {
      review.helpful++;
    } else {
      review.notHelpful++;
    }
    review.updatedAt = new Date();

    return review;
  }

  // --- Verification ---

  verifyReview(reviewId: string, verified: boolean = true): Review | null {
    const review = this.reviews.get(reviewId);
    if (!review) return null;

    review.verified = verified;
    review.updatedAt = new Date();

    return review;
  }

  // --- Statistics ---

  getStatistics(targetId?: string): {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    flagged: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    sentimentDistribution: Record<SentimentLabel, number>;
  } {
    let reviews = Array.from(this.reviews.values());
    if (targetId) {
      reviews = reviews.filter(r => r.targetId === targetId);
    }

    const approved = reviews.filter(r => r.status === 'approved');
    const ratingSum = approved.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = approved.length > 0 ? ratingSum / approved.length : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approved.forEach(r => {
      ratingDistribution[r.rating]++;
    });

    const sentimentDistribution: Record<SentimentLabel, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };
    approved.forEach(r => {
      if (r.sentiment) {
        sentimentDistribution[r.sentiment]++;
      }
    });

    return {
      total: reviews.length,
      approved: approved.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      rejected: reviews.filter(r => r.status === 'rejected').length,
      flagged: reviews.filter(r => r.status === 'flagged').length,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      sentimentDistribution,
    };
  }

  // --- Configuration ---

  getSentimentAnalyzer(): SentimentAnalyzer {
    return this.sentimentAnalyzer;
  }

  getModerationEngine(): ModerationEngine {
    return this.moderationEngine;
  }

  getTemplateManager(): ResponseTemplateManager {
    return this.templateManager;
  }

  // --- Private Helpers ---

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkRateLimits(
    authorId: string
  ): { allowed: boolean; message?: string; warnings: string[] } {
    const warnings: string[] = [];
    const userData = this.userReviewCounts.get(authorId) || {
      hourly: new Map(),
      daily: new Map(),
    };

    const now = Date.now();
    const hourKey = Math.floor(now / (1000 * 60 * 60));
    const dayKey = new Date().toISOString().split('T')[0];

    const hourlyCount = userData.hourly.get(hourKey) || 0;
    const dailyCount = userData.daily.get(dayKey) || 0;

    // Max 5 reviews per hour, 20 per day
    if (hourlyCount >= 5) {
      return {
        allowed: false,
        message: 'You have reached the maximum number of reviews per hour. Please try again later.',
        warnings: [],
      };
    }
    if (dailyCount >= 20) {
      return {
        allowed: false,
        message: 'You have reached the maximum number of reviews per day. Please try again tomorrow.',
        warnings: [],
      };
    }

    if (hourlyCount >= 3) {
      warnings.push('You are approaching your hourly review limit');
    }
    if (dailyCount >= 15) {
      warnings.push('You are approaching your daily review limit');
    }

    return { allowed: true, warnings };
  }

  private incrementRateLimit(authorId: string): void {
    const userData = this.userReviewCounts.get(authorId) || {
      hourly: new Map(),
      daily: new Map(),
    };

    const now = Date.now();
    const hourKey = Math.floor(now / (1000 * 60 * 60));
    const dayKey = new Date().toISOString().split('T')[0];

    userData.hourly.set(hourKey, (userData.hourly.get(hourKey) || 0) + 1);
    userData.daily.set(dayKey, (userData.daily.get(dayKey) || 0) + 1);

    // Clean up old entries
    const oneHourAgo = hourKey - 1;
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    for (const key of userData.hourly.keys()) {
      if (key < oneHourAgo) userData.hourly.delete(key);
    }
    for (const key of userData.daily.keys()) {
      if (key < twoDaysAgo) userData.daily.delete(key);
    }

    this.userReviewCounts.set(authorId, userData);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createReviewsManager(config?: {
  sentimentConfig?: {
    positive?: string[];
    negative?: string[];
  };
  moderationRules?: ModerationRule[];
  templates?: ResponseTemplate[];
}): ReviewsManager {
  const sentimentAnalyzer = new SentimentAnalyzer(config?.sentimentConfig);
  const moderationEngine = new ModerationEngine(config?.moderationRules);
  const templateManager = new ResponseTemplateManager(config?.templates);

  return new ReviewsManager({
    sentimentAnalyzer,
    moderationEngine,
    templateManager,
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default ReviewsManager;


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-reviews',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
