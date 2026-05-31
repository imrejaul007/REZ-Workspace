/**
 * HOJAI AI Recommendation Engine - In-Memory Data Store
 *
 * Mock data store for development.
 * In production, this would connect to a real database.
 */
import type { Product, UserPurchase, TrendingItem } from '../types/index.js';
/**
 * Initialize mock product data
 */
export declare function initializeMockData(): void;
/**
 * Get all products
 */
export declare function getAllProducts(): Product[];
/**
 * Get product by ID
 */
export declare function getProductById(id: string): Product | undefined;
/**
 * Get multiple products by IDs
 */
export declare function getProductsByIds(ids: string[]): Product[];
/**
 * Add a purchase record
 */
export declare function addPurchase(purchase: UserPurchase): void;
/**
 * Get trending items for the last N days
 */
export declare function getTrendingItems(days?: number, limit?: number): TrendingItem[];
/**
 * Get purchase patterns for a product (frequently bought together)
 */
export declare function getFrequentlyBoughtTogether(productId: string, limit?: number): Array<{
    productId: string;
    frequency: number;
}>;
/**
 * Get user's purchase history
 */
export declare function getUserPurchaseHistory(userId: string): UserPurchase[];
/**
 * Get user's purchased product IDs
 */
export declare function getUserPurchasedProductIds(userId: string): Set<string>;
/**
 * Get products by category
 */
export declare function getProductsByCategory(category: string): Product[];
/**
 * Get all unique categories
 */
export declare function getAllCategories(): string[];
/**
 * Record a purchase (for API usage)
 */
export declare function recordPurchase(userId: string, productId: string, quantity?: number): void;
/**
 * Get data store stats
 */
export declare function getDataStats(): {
    productCount: number;
    purchaseCount: number;
    patternCount: number;
    categories: string[];
};
//# sourceMappingURL=dataStore.d.ts.map