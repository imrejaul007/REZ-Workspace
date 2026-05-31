/**
 * HOJAI AI Recommendation Engine - Recommendation Service
 *
 * Implements rule-based + embedding similarity recommendations
 */
import type { RecommendationItem, RecommendationType } from '../types/index.js';
/**
 * Get personalized recommendations for a user
 * Combines user history with trending items
 */
export declare function getPersonalizedRecommendations(userId: string, limit?: number): Promise<RecommendationItem[]>;
/**
 * Get trending item recommendations
 * Based on most purchased in last 7 days
 */
export declare function getTrendingRecommendations(limit?: number, category?: string): Promise<RecommendationItem[]>;
/**
 * Get similar items based on embedding similarity
 */
export declare function getSimilarItems(productId: string, limit?: number): Promise<RecommendationItem[]>;
/**
 * Get frequently bought together recommendations
 * Based on co-purchase patterns
 */
export declare function getFrequentlyBoughtRecommendations(productId: string, limit?: number): Promise<RecommendationItem[]>;
/**
 * Get recommendations by type
 */
export declare function getRecommendationsByType(type: RecommendationType, userId?: string, productId?: string, limit?: number): Promise<RecommendationItem[]>;
/**
 * Record a user interaction (purchase)
 */
export declare function recordUserPurchase(userId: string, productId: string, quantity?: number): void;
//# sourceMappingURL=recommendationService.d.ts.map