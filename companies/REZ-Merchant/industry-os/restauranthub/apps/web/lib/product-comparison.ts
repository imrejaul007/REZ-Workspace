/**
 * Product comparison system with localStorage persistence
 * Allows users to compare multiple products side-by-side
 */

export interface ComparisonProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  image?: string;
  vendorId: string;
  vendorName: string;
  category: string;
  unit: string;
  minOrderQuantity: number;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
  description?: string;
  specifications: {
    [key: string]: string | number | boolean;
  };
  features: string[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    fiber?: number;
    sodium?: number;
  };
  addedAt: string;
}

export interface ComparisonState {
  products: ComparisonProduct[];
  lastUpdated: string;
}

const COMPARISON_STORAGE_KEY = 'restopapa_product_comparison';
const MAX_COMPARISON_ITEMS = 4; // Maximum products to compare at once

export class ProductComparisonManager {
  private comparisonState: ComparisonState;
  private listeners: ((state: ComparisonState) => void)[] = [];

  constructor() {
    this.comparisonState = this.loadFromStorage();
  }

  /**
   * Load comparison data from localStorage
   */
  private loadFromStorage(): ComparisonState {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return {
        products: [],
        lastUpdated: new Date().toISOString()
      };
    }

    try {
      const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.products && Array.isArray(parsed.products)) {
          return {
            products: parsed.products,
            lastUpdated: parsed.lastUpdated || new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.error('Error loading product comparison from storage:', error);
    }

    return {
      products: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save comparison data to localStorage
   */
  private saveToStorage() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      this.notifyListeners();
      return;
    }

    try {
      this.comparisonState.lastUpdated = new Date().toISOString();
      localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(this.comparisonState));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving product comparison to storage:', error);
    }
  }

  /**
   * Subscribe to comparison changes
   */
  subscribe(listener: (state: ComparisonState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.comparisonState));
  }

  /**
   * Add product to comparison
   */
  addProduct(product: Omit<ComparisonProduct, 'addedAt'>): boolean {
    try {
      // Check if product already exists
      if (this.isInComparison(product.id)) {
        return false;
      }

      // Check if we've reached the maximum
      if (this.comparisonState.products.length >= MAX_COMPARISON_ITEMS) {
        return false;
      }

      const newProduct: ComparisonProduct = {
        ...product,
        addedAt: new Date().toISOString()
      };

      this.comparisonState.products.push(newProduct);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error adding product to comparison:', error);
      return false;
    }
  }

  /**
   * Remove product from comparison
   */
  removeProduct(productId: string): boolean {
    try {
      const initialLength = this.comparisonState.products.length;
      this.comparisonState.products = this.comparisonState.products.filter(
        product => product.id !== productId
      );
      
      if (this.comparisonState.products.length < initialLength) {
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing product from comparison:', error);
      return false;
    }
  }

  /**
   * Check if product is in comparison
   */
  isInComparison(productId: string): boolean {
    return this.comparisonState.products.some(product => product.id === productId);
  }

  /**
   * Get all comparison products
   */
  getProducts(): ComparisonProduct[] {
    return [...this.comparisonState.products];
  }

  /**
   * Get comparison count
   */
  getCount(): number {
    return this.comparisonState.products.length;
  }

  /**
   * Check if comparison is full
   */
  isFull(): boolean {
    return this.comparisonState.products.length >= MAX_COMPARISON_ITEMS;
  }

  /**
   * Clear all products from comparison
   */
  clearAll(): boolean {
    try {
      this.comparisonState.products = [];
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error clearing product comparison:', error);
      return false;
    }
  }

  /**
   * Get unique specification keys across all products
   */
  getAllSpecificationKeys(): string[] {
    const allKeys = new Set<string>();
    
    this.comparisonState.products.forEach(product => {
      Object.keys(product.specifications).forEach(key => allKeys.add(key));
    });
    
    return Array.from(allKeys).sort();
  }

  /**
   * Get comparison analysis
   */
  getComparisonAnalysis() {
    const products = this.comparisonState.products;
    
    if (products.length === 0) {
      return null;
    }

    // Price analysis
    const prices = products.map(p => p.price);
    const cheapest = Math.min(...prices);
    const mostExpensive = Math.max(...prices);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Rating analysis
    const ratingsData = products.filter(p => p.rating).map(p => ({ id: p.id, rating: p.rating! }));
    const bestRated = ratingsData.length > 0 
      ? ratingsData.reduce((best, current) => current.rating > best.rating ? current : best)
      : null;

    // Category analysis
    const categories = [...new Set(products.map(p => p.category))];
    const vendors = [...new Set(products.map(p => p.vendorName))];

    // Feature analysis
    const allFeatures = new Set<string>();
    products.forEach(p => p.features.forEach(f => allFeatures.add(f)));
    const commonFeatures = Array.from(allFeatures).filter(feature =>
      products.every(p => p.features.includes(feature))
    );

    return {
      totalProducts: products.length,
      priceRange: {
        min: cheapest,
        max: mostExpensive,
        average: averagePrice,
        cheapestProductId: products.find(p => p.price === cheapest)?.id,
        mostExpensiveProductId: products.find(p => p.price === mostExpensive)?.id
      },
      ratings: {
        bestRated: bestRated ? {
          productId: bestRated.id,
          rating: bestRated.rating
        } : null,
        averageRating: ratingsData.length > 0 
          ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
          : null
      },
      diversity: {
        categories: categories.length,
        vendors: vendors.length,
        uniqueCategories: categories,
        uniqueVendors: vendors
      },
      features: {
        totalUniqueFeatures: allFeatures.size,
        commonFeatures: commonFeatures,
        commonFeaturesCount: commonFeatures.length
      },
      lastUpdated: this.comparisonState.lastUpdated
    };
  }

  /**
   * Get product comparison matrix
   */
  getComparisonMatrix() {
    const products = this.comparisonState.products;
    const allSpecs = this.getAllSpecificationKeys();
    
    const matrix = {
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        vendor: p.vendorName,
        category: p.category
      })),
      basicInfo: {
        price: products.map(p => p.price),
        originalPrice: products.map(p => p.originalPrice || null),
        discount: products.map(p => p.discountPercentage || null),
        rating: products.map(p => p.rating || null),
        reviews: products.map(p => p.reviewCount || null),
        inStock: products.map(p => p.inStock),
        minOrder: products.map(p => p.minOrderQuantity),
        unit: products.map(p => p.unit)
      },
      specifications: allSpecs.reduce((specs, key) => {
        specs[key] = products.map(p => p.specifications[key] || null);
        return specs;
      }, {} as Record<string, (string | number | boolean | null)[]>),
      features: products.map(p => p.features),
      nutrition: products.some(p => p.nutritionInfo) ? {
        calories: products.map(p => p.nutritionInfo?.calories || null),
        protein: products.map(p => p.nutritionInfo?.protein || null),
        fat: products.map(p => p.nutritionInfo?.fat || null),
        carbs: products.map(p => p.nutritionInfo?.carbs || null),
        fiber: products.map(p => p.nutritionInfo?.fiber || null),
        sodium: products.map(p => p.nutritionInfo?.sodium || null)
      } : null
    };

    return matrix;
  }

  /**
   * Export comparison data
   */
  exportData(): string {
    const analysis = this.getComparisonAnalysis();
    const matrix = this.getComparisonMatrix();
    
    return JSON.stringify({
      comparisonState: this.comparisonState,
      analysis,
      matrix,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Get recommendations based on comparison
   */
  getRecommendations() {
    const analysis = this.getComparisonAnalysis();
    const products = this.comparisonState.products;
    
    if (!analysis || products.length === 0) {
      return [];
    }

    const recommendations: Array<{
      type: 'best_value' | 'highest_rated' | 'cheapest' | 'premium' | 'most_features';
      productId: string;
      reason: string;
      score?: number;
    }> = [];

    // Best value (good rating + reasonable price)
    const ratingsData = products.filter(p => p.rating);
    if (ratingsData.length > 0) {
      const valueScores = ratingsData.map(p => ({
        id: p.id,
        score: (p.rating! / 5) * (1 - (p.price / analysis.priceRange.max))
      }));
      
      const bestValue = valueScores.reduce((best, current) => 
        current.score > best.score ? current : best
      );
      
      recommendations.push({
        type: 'best_value',
        productId: bestValue.id,
        reason: 'Great balance of quality and price',
        score: bestValue.score
      });
    }

    // Cheapest option
    if (analysis.priceRange.cheapestProductId) {
      recommendations.push({
        type: 'cheapest',
        productId: analysis.priceRange.cheapestProductId,
        reason: `Most affordable at ${analysis.priceRange.min}`
      });
    }

    // Highest rated
    if (analysis.ratings.bestRated) {
      recommendations.push({
        type: 'highest_rated',
        productId: analysis.ratings.bestRated.productId,
        reason: `Highest rated with ${analysis.ratings.bestRated.rating}/5 stars`
      });
    }

    // Most features
    const featureCounts = products.map(p => ({
      id: p.id,
      count: p.features.length
    }));
    
    const mostFeatures = featureCounts.reduce((best, current) =>
      current.count > best.count ? current : best
    );
    
    if (mostFeatures.count > 0) {
      recommendations.push({
        type: 'most_features',
        productId: mostFeatures.id,
        reason: `Has the most features (${mostFeatures.count} features)`
      });
    }

    return recommendations;
  }
}

// Singleton instance
export const productComparisonManager = new ProductComparisonManager();

// React hook for using product comparison in components
export function useProductComparison() {
  const [comparisonState, setComparisonState] = React.useState<ComparisonState>(() => ({
    products: productComparisonManager.getProducts(),
    lastUpdated: new Date().toISOString()
  }));

  React.useEffect(() => {
    const unsubscribe = productComparisonManager.subscribe(setComparisonState);
    return unsubscribe;
  }, []);

  const addToComparison = React.useCallback((product: Omit<ComparisonProduct, 'addedAt'>) => {
    return productComparisonManager.addProduct(product);
  }, []);

  const removeFromComparison = React.useCallback((productId: string) => {
    return productComparisonManager.removeProduct(productId);
  }, []);

  const isInComparison = React.useCallback((productId: string) => {
    return productComparisonManager.isInComparison(productId);
  }, []);

  return {
    comparison: comparisonState,
    products: comparisonState.products,
    count: productComparisonManager.getCount(),
    isFull: productComparisonManager.isFull(),
    maxItems: MAX_COMPARISON_ITEMS,
    addToComparison,
    removeFromComparison,
    isInComparison,
    clearAll: () => productComparisonManager.clearAll(),
    getAnalysis: () => productComparisonManager.getComparisonAnalysis(),
    getMatrix: () => productComparisonManager.getComparisonMatrix(),
    getRecommendations: () => productComparisonManager.getRecommendations(),
    exportData: () => productComparisonManager.exportData()
  };
}

// Helper function to convert marketplace products to comparison format
export function convertToComparisonProduct(
  product: unknown
): Omit<ComparisonProduct, 'addedAt'> {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.originalPrice,
    discountPercentage: product.discountPercentage,
    image: product.images?.[0],
    vendorId: product.vendor?.id || product.vendorId,
    vendorName: product.vendor?.name,
    category: product.category,
    unit: product.unit,
    minOrderQuantity: product.minOrderQuantity || 1,
    inStock: product.inStock ?? true,
    rating: product.ratings?.average || product.rating,
    reviewCount: product.reviewCount || product.ratings?.count,
    description: product.description,
    specifications: product.specifications || {
      brand: product.brand || 'Unknown',
      origin: product.origin || 'Not specified',
      shelfLife: product.shelfLife || 'Not specified',
      storage: product.storage || 'Room temperature',
      certifications: product.certifications?.join(', ') || 'None'
    },
    features: product.features || [
      product.organic ? 'Organic' : null,
      product.glutenFree ? 'Gluten Free' : null,
      product.vegan ? 'Vegan' : null,
      product.kosher ? 'Kosher' : null,
      product.halal ? 'Halal' : null
    ].filter(Boolean),
    nutritionInfo: product.nutritionInfo || (product.nutrition ? {
      calories: product.nutrition.calories,
      protein: product.nutrition.protein,
      fat: product.nutrition.fat,
      carbs: product.nutrition.carbs,
      fiber: product.nutrition.fiber,
      sodium: product.nutrition.sodium
    } : undefined)
  };
}

// Additional React import for the hook
import React from 'react';