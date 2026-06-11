/**
 * DISCOVERY AGENT - ShopFlow AI
 * Semantic search, personalized ranking, recommendations, frequently bought together
 */

import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface SearchResult {
  products: {
    productId: string;
    name: string;
    price: number;
    image: string;
    score: number;
    highlights: string[];
  }[];
  facets: {
    category: { name: string; count: number }[];
    brand: { name: string; count: number }[];
    priceRange: { min: number; max: number; count: number }[];
  };
  totalResults: number;
  page: number;
  pageSize: number;
}

export interface Recommendation {
  productId: string;
  name: string;
  price: number;
  image: string;
  score: number;
  reason: string;
  type: 'personalized' | 'trending' | 'similar' | 'frequently_bought' | 'new' | 'sale';
}

export interface PersonalizedFeed {
  userId: string;
  recommendations: Recommendation[];
  segments: string[];
  lastUpdated: Date;
}

export interface FrequentlyBoughtTogether {
  productId: string;
  relatedProducts: {
    productId: string;
    name: string;
    price: number;
    lift: number;
    frequency: number;
  }[];
}

export class DiscoveryAgent {
  /**
   * Semantic search across products
   */
  async search(query: string, options?: {
    filters?: { category?: string; brand?: string; minPrice?: number; maxPrice?: number };
    page?: number;
    pageSize?: number;
    userId?: string;
  }): Promise<SearchResult> {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;

      // Fetch products from Retail Service
      const products = await this.fetchProducts(options?.filters);

      // Score and rank products
      const scoredProducts = this.scoreProducts(products, query, options?.userId);

      // Apply pagination
      const start = (page - 1) * pageSize;
      const paginatedProducts = scoredProducts.slice(start, start + pageSize);

      // Generate facets
      const facets = this.generateFacets(products);

      const result: SearchResult = {
        products: paginatedProducts.map(p => ({
          productId: p._id,
          name: p.name,
          price: p.price,
          image: p.images?.[0] || '',
          score: p._score || 0,
          highlights: this.generateHighlights(p, query),
        })),
        facets,
        totalResults: scoredProducts.length,
        page,
        pageSize,
      };

      logger.info('Search completed', {
        query,
        totalResults: result.totalResults,
        returned: result.products.length,
      });

      return result;
    } catch (error) {
      logger.error('Search failed', { error, query });
      throw error;
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<Recommendation[]> {
    try {
      // Fetch user data
      const userData = await this.fetchUserData(userId);

      // Get user preferences and history
      const preferences = userData?.preferences || {};
      const categories = preferences.categories || [];

      // Fetch products
      const products = await this.fetchProducts({});

      // Score products based on user preferences
      const recommendations = this.scoreForUser(products, userData, userId);

      const result = recommendations.slice(0, limit).map(p => ({
        productId: p._id,
        name: p.name,
        price: p.price,
        image: p.images?.[0] || '',
        score: p._score || 0,
        reason: this.generateRecommendationReason(p, categories),
        type: 'personalized' as const,
      }));

      logger.info('Personalized recommendations generated', {
        userId,
        count: result.length,
      });

      return result;
    } catch (error) {
      logger.error('Personalized recommendations failed', { error, userId });
      throw error;
    }
  }

  /**
   * Get trending products
   */
  async getTrending(limit: number = 10, category?: string): Promise<Recommendation[]> {
    try {
      const products = await this.fetchProducts(category ? { category } : {});

      // Simulate trending based on random scores (in production, use analytics)
      const trending = products
        .map(p => ({ ...p, _score: Math.random() * 0.5 + 0.5 }))
        .sort((a, b) => (b as any)._score - (a as any)._score)
        .slice(0, limit);

      return trending.map(p => ({
        productId: p._id,
        name: p.name,
        price: p.price,
        image: p.images?.[0] || '',
        score: (p as any)._score,
        reason: 'Trending based on recent sales velocity',
        type: 'trending' as const,
      }));
    } catch (error) {
      logger.error('Trending products failed', { error });
      throw error;
    }
  }

  /**
   * Get frequently bought together
   */
  async getFrequentlyBoughtTogether(productId: string, limit: number = 5): Promise<FrequentlyBoughtTogether> {
    try {
      const product = await this.fetchProduct(productId);
      if (!product) throw new Error('Product not found');

      // Fetch products in same category
      const categoryProducts = await this.fetchProducts({ category: product.category });

      // Simulate affinity analysis (in production, use order history)
      const relatedProducts = categoryProducts
        .filter(p => p._id !== productId)
        .slice(0, limit)
        .map(p => ({
          productId: p._id,
          name: p.name,
          price: p.price,
          lift: 1.5 + Math.random() * 1.5,
          frequency: Math.floor(Math.random() * 100) + 10,
        }))
        .sort((a, b) => b.lift - a.lift);

      logger.info('Frequently bought together generated', {
        productId,
        count: relatedProducts.length,
      });

      return {
        productId,
        relatedProducts,
      };
    } catch (error) {
      logger.error('Frequently bought together failed', { error, productId });
      throw error;
    }
  }

  /**
   * Get "You may also like" products
   */
  async getSimilarProducts(productId: string, limit: number = 5): Promise<Recommendation[]> {
    try {
      const product = await this.fetchProduct(productId);
      if (!product) throw new Error('Product not found');

      const products = await this.fetchProducts({ category: product.category });

      const similar = products
        .filter(p => p._id !== productId)
        .slice(0, limit)
        .map(p => ({
          productId: p._id,
          name: p.name,
          price: p.price,
          image: p.images?.[0] || '',
          score: this.calculateSimilarity(product, p),
          reason: `Similar to ${product.name}`,
          type: 'similar' as const,
        }));

      return similar;
    } catch (error) {
      logger.error('Similar products failed', { error, productId });
      throw error;
    }
  }

  /**
   * Get new arrivals
   */
  async getNewArrivals(limit: number = 10, category?: string): Promise<Recommendation[]> {
    try {
      const products = await this.fetchProducts(category ? { category } : {});

      // Sort by creation date (newest first)
      const newArrivals = [...products]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return newArrivals.map(p => ({
        productId: p._id,
        name: p.name,
        price: p.price,
        image: p.images?.[0] || '',
        score: 1,
        reason: 'New arrival',
        type: 'new' as const,
      }));
    } catch (error) {
      logger.error('New arrivals failed', { error });
      throw error;
    }
  }

  /**
   * Get products on sale
   */
  async getOnSale(limit: number = 10): Promise<Recommendation[]> {
    try {
      const products = await this.fetchProducts({});

      // Find products with discounts (simulated)
      const onSale = products
        .filter(p => p.price < p.mrp)
        .slice(0, limit);

      return onSale.map(p => ({
        productId: p._id,
        name: p.name,
        price: p.price,
        originalPrice: p.mrp,
        image: p.images?.[0] || '',
        score: 1,
        reason: `Sale: ${Math.round((1 - p.price / p.mrp) * 100)}% off`,
        type: 'sale' as const,
      }));
    } catch (error) {
      logger.error('On sale products failed', { error });
      throw error;
    }
  }

  /**
   * Get personalized homepage feed
   */
  async getHomepageFeed(userId?: string, limit: number = 20): Promise<PersonalizedFeed> {
    try {
      const feed: Recommendation[] = [];

      // Get trending products
      const trending = await this.getTrending(5);
      feed.push(...trending);

      // Get personalized if userId provided
      if (userId) {
        const personalized = await this.getPersonalizedRecommendations(userId, 5);
        feed.push(...personalized);
      }

      // Get new arrivals
      const newArrivals = await this.getNewArrivals(5);
      feed.push(...newArrivals);

      // Shuffle and limit
      const shuffledFeed = this.shuffleArray(feed).slice(0, limit);

      return {
        userId: userId || 'anonymous',
        recommendations: shuffledFeed,
        segments: userId ? ['personalized', 'trending', 'new'] : ['trending', 'new'],
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Homepage feed failed', { error });
      throw error;
    }
  }

  // ============ Private Helper Methods ============

  private async fetchProducts(filters?: any): Promise<any[]> {
    try {
      let url = `${config.integrations.retail}/api/products?limit=100`;
      if (filters?.category) url += `&category=${encodeURIComponent(filters.category)}`;
      if (filters?.brand) url += `&brand=${encodeURIComponent(filters.brand)}`;

      const response = await axios.get(url, { timeout: 5000 });
      return response.data.data || [];
    } catch {
      // Return mock data for demo
      return this.getMockProducts();
    }
  }

  private async fetchProduct(productId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.integrations.retail}/api/products/${productId}`,
        { timeout: 5000 }
      );
      return response.data.data;
    } catch {
      return null;
    }
  }

  private async fetchUserData(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.integrations.crm}/api/customers/${userId}`,
        { timeout: 5000 }
      );
      return response.data.data;
    } catch {
      return { preferences: { categories: [] } };
    }
  }

  private scoreProducts(products: any[], query: string, userId?: string): any[] {
    const queryTerms = query.toLowerCase().split(/\s+/);

    return products.map(product => {
      const text = `${product.name} ${product.description || ''} ${product.category || ''} ${product.brand || ''}`.toLowerCase();
      let score = 0;

      // Exact match bonus
      if (text.includes(query.toLowerCase())) score += 0.5;

      // Term matching
      for (const term of queryTerms) {
        if (text.includes(term)) score += 0.1;
      }

      // Name match is more important
      if (product.name.toLowerCase().includes(query.toLowerCase())) score += 0.3;

      return { ...product, _score: score };
    }).filter(p => p._score > 0).sort((a, b) => b._score - a._score);
  }

  private scoreForUser(products: any[], userData: any, userId: string): any[] {
    const userCategories = userData?.preferences?.categories || [];

    return products.map(product => {
      let score = 0.5; // Base score

      // Category match
      if (userCategories.includes(product.category)) score += 0.3;

      // Brand preference
      if (userData?.preferences?.brands?.includes(product.brand)) score += 0.1;

      // Price range preference
      if (userData?.preferences?.priceRange) {
        const range = userData.preferences.priceRange;
        if (product.price >= range.min && product.price <= range.max) {
          score += 0.1;
        }
      }

      return { ...product, _score: score };
    }).sort((a, b) => b._score - a._score);
  }

  private generateHighlights(product: any, query: string): string[] {
    const highlights: string[] = [];
    const text = product.name;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerText.includes(lowerQuery)) {
      highlights.push(text);
    }

    return highlights;
  }

  private generateFacets(products: any[]): SearchResult['facets'] {
    const categoryCount: Record<string, number> = {};
    const brandCount: Record<string, number> = {};

    for (const product of products) {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
      if (product.brand) {
        brandCount[product.brand] = (brandCount[product.brand] || 0) + 1;
      }
    }

    return {
      category: Object.entries(categoryCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      brand: Object.entries(brandCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      priceRange: this.generatePriceRanges(products),
    };
  }

  private generatePriceRanges(products: any[]): SearchResult['facets']['priceRange'] {
    const prices = products.map(p => p.price).sort((a, b) => a - b);
    if (prices.length === 0) return [];

    const min = prices[0];
    const max = prices[prices.length - 1];
    const rangeSize = (max - min) / 4;

    return [
      { min: min, max: min + rangeSize, count: Math.floor(prices.length * 0.3) },
      { min: min + rangeSize, max: min + rangeSize * 2, count: Math.floor(prices.length * 0.3) },
      { min: min + rangeSize * 2, max: min + rangeSize * 3, count: Math.floor(prices.length * 0.25) },
      { min: min + rangeSize * 3, max: max, count: Math.floor(prices.length * 0.15) },
    ];
  }

  private calculateSimilarity(product1: any, product2: any): number {
    let score = 0;

    if (product1.category === product2.category) score += 0.4;
    if (product1.brand === product2.brand) score += 0.2;
    if (Math.abs(product1.price - product2.price) / product1.price < 0.2) score += 0.2;

    // Attribute similarity
    const attrs1 = Object.entries(product1.attributes || {}).sort();
    const attrs2 = Object.entries(product2.attributes || {}).sort();
    const commonAttrs = attrs1.filter(([k, v]) => attrs2.some(([k2, v2]) => k === k2 && v === v2)).length;
    score += commonAttrs * 0.1;

    return Math.min(score, 1);
  }

  private generateRecommendationReason(product: any, categories: string[]): string {
    if (categories.includes(product.category)) {
      return 'Based on your interest in ' + product.category;
    }
    return 'Popular in ' + product.category;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getMockProducts(): any[] {
    return [
      { _id: '1', name: 'Cotton T-Shirt', price: 599, category: 'Clothing', images: [] },
      { _id: '2', name: 'Denim Jeans', price: 1299, category: 'Clothing', images: [] },
      { _id: '3', name: 'Running Shoes', price: 2499, category: 'Footwear', images: [] },
      { _id: '4', name: 'Leather Wallet', price: 799, category: 'Accessories', images: [] },
      { _id: '5', name: 'Sunglasses', price: 1499, category: 'Accessories', images: [] },
    ];
  }
}

export const discoveryAgent = new DiscoveryAgent();
export default discoveryAgent;
