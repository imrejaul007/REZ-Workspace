/**
 * HOJAI AI Support Agent - FAQ Engine Service
 * Version: 1.0.0 | Date: May 30, 2026
 * Purpose: Intelligent FAQ management with search, relevance scoring, and user feedback
 */
import type { FAQItem, FAQCategory, FAQSearchResult, CreateFAQInput, FAQSearchInputType } from '../types.js';
/**
 * Create a new FAQ
 */
export declare function createFAQ(input: CreateFAQInput): Promise<FAQItem>;
/**
 * Get FAQ by ID
 */
export declare function getFAQById(faqId: string): Promise<FAQItem | null>;
/**
 * Search FAQs
 */
export declare function searchFAQs(input: FAQSearchInputType): Promise<FAQSearchResult[]>;
/**
 * Get FAQs by category
 */
export declare function getFAQsByCategory(category: FAQCategory): Promise<FAQItem[]>;
/**
 * Record FAQ feedback
 */
export declare function recordFAQFeedback(faqId: string, helpful: boolean): Promise<FAQItem | null>;
/**
 * Record FAQ view
 */
export declare function recordFAQView(faqId: string): Promise<FAQItem | null>;
/**
 * Update FAQ
 */
export declare function updateFAQ(faqId: string, updates: Partial<Pick<FAQItem, 'question' | 'answer' | 'category' | 'tags'>>): Promise<FAQItem | null>;
/**
 * Delete FAQ
 */
export declare function deleteFAQ(faqId: string): Promise<boolean>;
/**
 * Get all FAQ categories with counts
 */
export declare function getFAQCategories(): Promise<{
    category: FAQCategory;
    count: number;
}[]>;
/**
 * Get popular FAQs
 */
export declare function getPopularFAQs(limit?: number): Promise<FAQItem[]>;
/**
 * Get suggested FAQs based on text
 */
export declare function getSuggestedFAQs(text: string, limit?: number): Promise<FAQSearchResult[]>;
//# sourceMappingURL=faqService.d.ts.map