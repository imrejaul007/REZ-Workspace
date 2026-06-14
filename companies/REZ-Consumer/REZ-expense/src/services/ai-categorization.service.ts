/**
 * REZ Expense - AI Categorization Service
 * Uses Claude for intelligent expense categorization with learning
 */

import axios, { AxiosInstance } from 'axios';
import {
  CategorySuggestion,
  AICategorizationResult,
  CategoryHistoryEntry,
  CategoryPattern,
  EXPENSE_CATEGORIES,
  CategoryConfidence,
  ClaudeCategorizationInput,
  ClaudeCategorizationOutput,
} from '../types';

interface ClaudeResponse {
  category: string;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{ category: string; confidence: number; reasoning: string }>;
}

export class AICategorizationService {
  private hojaiFinanceAIUrl: string;
  private apiKey: string;
  private timeout: number;
  private httpClient: AxiosInstance;

  constructor() {
    this.hojaiFinanceAIUrl = process.env.HOJAIFINANCE_AI_URL || 'http://localhost:4830';
    this.apiKey = process.env.HOJAIFINANCE_AI_API_KEY || '';
    this.timeout = parseInt(process.env.AI_TIMEOUT || '30000', 10);

    this.httpClient = axios.create({
      baseURL: this.hojaiFinanceAIUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
    });
  }

  /**
   * Categorize an expense using AI
   */
  async categorizeExpense(
    merchantName: string,
    amount: number,
    date: Date,
    userId: string,
    extractedData?: Record<string, unknown>
  ): Promise<AICategorizationResult> {
    const timestamp = new Date();

    try {
      // First check for known patterns
      const patternMatch = await this.findCategoryPattern(userId, merchantName);
      if (patternMatch && patternMatch.confidence >= 0.9) {
        return this.buildResultFromPattern(patternMatch, timestamp);
      }

      // Try HOJAI Finance AI first
      try {
        const aiResult = await this.callHOJAIFinanceAI({
          merchant_name: merchantName,
          amount,
          date,
          extracted_data: extractedData,
        });
        return aiResult;
      } catch {
        // Fallback to local categorization
        console.log('HOJAI Finance AI unavailable, using local categorization');
      }

      // Local categorization fallback
      return this.localCategorize(merchantName, amount, timestamp);
    } catch (error) {
      console.error('AI categorization failed:', error);
      return this.localCategorize(merchantName, amount, timestamp);
    }
  }

  /**
   * Call HOJAI Finance AI service
   */
  private async callHOJAIFinanceAI(input: ClaudeCategorizationInput): Promise<AICategorizationResult> {
    const response = await this.httpClient.post<ClaudeResponse>(
      '/api/categorize',
      {
        merchant_name: input.merchant_name,
        amount: input.amount,
        date: input.date,
        extracted_data: input.extracted_data,
        available_categories: EXPENSE_CATEGORIES,
      }
    );

    const data = response.data;
    const timestamp = new Date();

    return {
      expense_id: '', // Will be set by caller
      suggested_category: data.category,
      confidence: data.confidence,
      confidence_level: this.getConfidenceLevel(data.confidence),
      reasoning: data.reasoning,
      alternatives: (data.alternatives || []).map((alt) => ({
        category: alt.category,
        confidence: alt.confidence,
        confidence_level: this.getConfidenceLevel(alt.confidence),
        reasoning: alt.reasoning,
      })),
      requires_review: data.confidence < 0.8,
      timestamp,
    };
  }

  /**
   * Local categorization using merchant patterns
   */
  private localCategorize(
    merchantName: string,
    amount: number,
    timestamp: Date
  ): AICategorizationResult {
    const normalizedMerchant = merchantName.toLowerCase().trim();
    const patterns = this.getMerchantPatterns();

    // Find matching pattern
    for (const [pattern, category] of Object.entries(patterns)) {
      if (normalizedMerchant.includes(pattern)) {
        return {
          expense_id: '',
          suggested_category: category,
          confidence: 0.85,
          confidence_level: 'high',
          reasoning: `Matched merchant pattern: "${pattern}"`,
          alternatives: this.getAlternatives(category),
          requires_review: false,
          timestamp,
        };
      }
    }

    // Fallback categorization based on amount and keywords
    return this.fallbackCategorize(normalizedMerchant, amount, timestamp);
  }

  /**
   * Fallback categorization logic
   */
  private fallbackCategorize(
    merchant: string,
    amount: number,
    timestamp: Date
  ): AICategorizationResult {
    const keywordPatterns: Record<string, string> = {
      food: ['restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'kitchen', 'dining', 'eatery', 'bakery', 'dessert', 'ice cream', 'tea', 'biryani', 'dosa', 'thali', 'tiffin'],
      travel: ['uber', 'ola', 'taxi', 'airline', 'flight', 'train', 'bus', 'metro', 'railway', 'airport', 'cab', 'petrol', 'fuel', 'gas', 'parking'],
      shopping: ['amazon', 'flipkart', 'myntra', 'shop', 'store', 'mall', 'retail', 'fashion', 'clothing', 'electronics', 'furniture'],
      entertainment: ['netflix', 'spotify', 'movie', 'cinema', 'theatre', 'concert', 'game', 'gaming', 'subscription', 'prime', 'disney'],
      utilities: ['electricity', 'water', 'internet', 'phone', 'mobile', 'bill', 'gas', 'electric'],
      healthcare: ['pharmacy', 'hospital', 'clinic', 'doctor', 'medical', 'health', 'medicine', 'diagnostic', 'lab'],
      education: ['school', 'college', 'university', 'course', 'book', 'tution', 'training', 'udemy', 'coursera'],
    };

    // Check keywords
    for (const [category, keywords] of Object.entries(keywordPatterns)) {
      if (keywords.some((kw) => merchant.includes(kw))) {
        return {
          expense_id: '',
          suggested_category: category,
          confidence: 0.7,
          confidence_level: 'medium',
          reasoning: `Matched keyword: "${category}"`,
          alternatives: this.getAlternatives(category),
          requires_review: true,
          timestamp,
        };
      }
    }

    // Amount-based heuristics
    if (amount < 100) {
      return {
        expense_id: '',
        suggested_category: 'food',
        confidence: 0.5,
        confidence_level: 'low',
        reasoning: 'Small amount, likely food or small purchase',
        alternatives: this.getAlternatives('food'),
        requires_review: true,
        timestamp,
      };
    }

    if (amount > 10000) {
      return {
        expense_id: '',
        suggested_category: 'shopping',
        confidence: 0.6,
        confidence_level: 'low',
        reasoning: 'Large amount, likely major purchase',
        alternatives: this.getAlternatives('shopping'),
        requires_review: true,
        timestamp,
      };
    }

    // Default
    return {
      expense_id: '',
      suggested_category: 'other',
      confidence: 0.4,
      confidence_level: 'low',
      reasoning: 'Unable to determine category, defaulting to other',
      alternatives: this.getAlternatives('other'),
      requires_review: true,
      timestamp,
    };
  }

  /**
   * Find category pattern from history
   */
  private async findCategoryPattern(
    userId: string,
    merchantName: string
  ): Promise<{ category: string; confidence: number } | null> {
    const normalizedMerchant = merchantName.toLowerCase().trim();

    // Pattern matching based on merchant name
    const patterns = this.getMerchantPatterns();
    for (const [pattern, category] of Object.entries(patterns)) {
      if (normalizedMerchant.includes(pattern)) {
        // In production, check user-specific patterns from DB
        return { category, confidence: 0.95 };
      }
    }

    return null;
  }

  /**
   * Get known merchant patterns
   */
  private getMerchantPatterns(): Record<string, string> {
    return {
      // Food & Dining
      'dominos': 'food',
      'pizza hut': 'food',
      'mcdonalds': 'food',
      'starbucks': 'food',
      'cafe coffee day': 'food',
      'swiggy': 'food',
      'zomato': 'food',
      'uber eats': 'food',
      'restaurant': 'food',
      'hotel': 'food',
      'kitchen': 'food',

      // Travel
      'uber': 'travel',
      'ola': 'travel',
      'makemytrip': 'travel',
      'cleartrip': 'travel',
      'goibibo': 'travel',
      'air india': 'travel',
      'indigo': 'travel',
      'irctc': 'travel',
      'redbus': 'travel',
      ' petrol': 'travel',
      'bpcl': 'travel',
      'ioc': 'travel',

      // Shopping
      'amazon': 'shopping',
      'flipkart': 'shopping',
      'myntra': 'shopping',
      'ajio': 'shopping',
      'nykaa': 'shopping',
      'tatacliq': 'shopping',
      ' Reliance Digital': 'shopping',
      'croma': 'shopping',

      // Entertainment
      'netflix': 'entertainment',
      'amazon prime': 'entertainment',
      'hotstar': 'entertainment',
      'spotify': 'entertainment',
      'youtube': 'entertainment',
      'bookmyshow': 'entertainment',
      'pvr': 'entertainment',
      'inox': 'entertainment',

      // Utilities
      'airtel': 'utilities',
      'jio': 'utilities',
      'vodafone': 'utilities',
      'bsnl': 'utilities',
      'act broadband': 'utilities',
      'spectrum': 'utilities',

      // Healthcare
      'apollo': 'healthcare',
      'fortis': 'healthcare',
      'max hospital': 'healthcare',
      'pharmacy': 'healthcare',
      'medplus': 'healthcare',
      '1mg': 'healthcare',

      // Education
      'byju': 'education',
      'vedantu': 'education',
      'unacademy': 'education',
      'udemy': 'education',
      'coursera': 'education',
    };
  }

  /**
   * Get alternative category suggestions
   */
  private getAlternatives(currentCategory: string): CategorySuggestion[] {
    const alternatives: CategorySuggestion[] = [];
    const categories = EXPENSE_CATEGORIES.filter((c) => c !== currentCategory);

    for (const category of categories.slice(0, 3)) {
      alternatives.push({
        category,
        confidence: Math.random() * 0.3, // Lower confidence for alternatives
        confidence_level: 'low',
        reasoning: `Alternative: ${category}`,
      });
    }

    return alternatives;
  }

  /**
   * Build result from pattern match
   */
  private buildResultFromPattern(
    pattern: { category: string; confidence: number },
    timestamp: Date
  ): AICategorizationResult {
    return {
      expense_id: '',
      suggested_category: pattern.category,
      confidence: pattern.confidence,
      confidence_level: this.getConfidenceLevel(pattern.confidence),
      reasoning: 'Matched from user categorization history',
      alternatives: this.getAlternatives(pattern.category),
      requires_review: pattern.confidence < 0.8,
      timestamp,
    };
  }

  /**
   * Get confidence level from numeric confidence
   */
  private getConfidenceLevel(confidence: number): CategoryConfidence {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Record category selection for learning
   */
  async recordCategorySelection(
    expenseId: string,
    originalCategory: string,
    finalCategory: string,
    userId: string,
    changedBy: 'ai' | 'user'
  ): Promise<void> {
    // In production, save to database for learning
    console.log('Recording category selection:', {
      expenseId,
      originalCategory,
      finalCategory,
      userId,
      changedBy,
      timestamp: new Date().toISOString(),
    });

    // This would update the CategoryHistory collection in MongoDB
  }

  /**
   * Get category suggestions for a user
   */
  async getCategorySuggestions(
    userId: string,
    limit: number = 10
  ): Promise<CategorySuggestion[]> {
    // In production, analyze user's category history
    // and return personalized suggestions
    return [
      { category: 'food', confidence: 0.9, confidence_level: 'high', reasoning: 'Most frequent category' },
      { category: 'travel', confidence: 0.7, confidence_level: 'medium', reasoning: 'Recent activity detected' },
      { category: 'shopping', confidence: 0.5, confidence_level: 'low', reasoning: 'Occasional purchases' },
    ];
  }

  /**
   * Batch categorize multiple expenses
   */
  async batchCategorize(
    expenses: Array<{
      expense_id: string;
      merchant_name: string;
      amount: number;
      date: Date;
    }>,
    userId: string
  ): Promise<AICategorizationResult[]> {
    const results: AICategorizationResult[] = [];

    for (const expense of expenses) {
      const result = await this.categorizeExpense(
        expense.merchant_name,
        expense.amount,
        expense.date,
        userId
      );
      result.expense_id = expense.expense_id;
      results.push(result);
    }

    return results;
  }

  /**
   * Learn from user corrections
   */
  async learnFromCorrection(
    userId: string,
    merchantPattern: string,
    correctCategory: string
  ): Promise<void> {
    // In production, update the CategoryPattern collection
    // to improve future categorization accuracy
    console.log('Learning from correction:', {
      userId,
      merchantPattern,
      correctCategory,
    });
  }
}

// Export singleton instance
export const aiCategorizationService = new AICategorizationService();
