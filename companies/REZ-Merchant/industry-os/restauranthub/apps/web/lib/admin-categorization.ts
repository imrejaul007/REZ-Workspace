/**
 * Admin categorization system for automatic trending, new, and bestseller detection
 * Provides both automatic data-driven categorization and manual admin overrides
 */

export interface PromotionCriteria {
  trending: {
    minViews: number;
    minSales: number;
    viewsGrowthRate: number; // % growth in last 7 days
    salesGrowthRate: number; // % growth in last 7 days
  };
  new: {
    maxDaysOld: number; // Days since creation/joining
  };
  bestSeller: {
    minSales: number;
    minRevenue: number;
    minRating: number;
    minOrders: number;
  };
}

export interface AutoCategorizationSettings {
  products: PromotionCriteria;
  vendors: PromotionCriteria;
  refreshInterval: number; // minutes
  enableAutoPromotion: boolean;
  notificationThresholds: {
    trendingGrowth: number; // % to trigger trending notification
    salesSpike: number; // % to trigger sales spike notification
  };
}

// Default settings for auto-categorization
export const defaultCategorizationSettings: AutoCategorizationSettings = {
  products: {
    trending: {
      minViews: 1000,
      minSales: 100,
      viewsGrowthRate: 50, // 50% growth in views
      salesGrowthRate: 30  // 30% growth in sales
    },
    new: {
      maxDaysOld: 30 // 30 days
    },
    bestSeller: {
      minSales: 500,
      minRevenue: 10000,
      minRating: 4.0,
      minOrders: 50
    }
  },
  vendors: {
    trending: {
      minViews: 2000,
      minSales: 1000,
      viewsGrowthRate: 40,
      salesGrowthRate: 25
    },
    new: {
      maxDaysOld: 90 // 90 days for vendors
    },
    bestSeller: {
      minSales: 2000,
      minRevenue: 100000,
      minRating: 4.5,
      minOrders: 500
    }
  },
  refreshInterval: 60, // 1 hour
  enableAutoPromotion: true,
  notificationThresholds: {
    trendingGrowth: 100, // 100% growth triggers notification
    salesSpike: 200      // 200% growth triggers notification
  }
};

export interface ItemAnalytics {
  id: string;
  type: 'product' | 'vendor';
  currentMetrics: {
    views: number;
    sales: number;
    orders: number;
    revenue: number;
    rating: number;
    createdAt: string;
  };
  historicalMetrics?: {
    views7DaysAgo: number;
    sales7DaysAgo: number;
    orders7DaysAgo: number;
    revenue7DaysAgo: number;
  };
  manualOverrides: {
    trending?: boolean;
    new?: boolean;
    bestSeller?: boolean;
    overriddenAt?: string;
    overriddenBy?: string;
  };
}

export interface CategorizationResult {
  id: string;
  type: 'product' | 'vendor';
  autoFlags: {
    trending: boolean;
    new: boolean;
    bestSeller: boolean;
    confidence: number; // 0-1 confidence score
  };
  finalFlags: {
    trending: boolean;
    new: boolean;
    bestSeller: boolean;
    source: 'auto' | 'manual' | 'hybrid';
  };
  recommendations: string[];
  alerts: string[];
}

/**
 * Automatically categorize items based on data and criteria
 */
export class AutoCategorization {
  private settings: AutoCategorizationSettings;

  constructor(settings: AutoCategorizationSettings = defaultCategorizationSettings) {
    this.settings = settings;
  }

  /**
   * Analyze a single item and determine its categorization
   */
  analyzeItem(item: ItemAnalytics): CategorizationResult {
    const isProduct = item.type === 'product';
    const criteria = isProduct ? this.settings.products : this.settings.vendors;
    
    // Calculate auto flags
    const autoFlags = this.calculateAutoFlags(item, criteria);
    
    // Apply manual overrides
    const finalFlags = this.applyManualOverrides(autoFlags, item.manualOverrides);
    
    // Generate recommendations and alerts
    const recommendations = this.generateRecommendations(item, autoFlags);
    const alerts = this.generateAlerts(item, autoFlags);

    return {
      id: item.id,
      type: item.type,
      autoFlags,
      finalFlags,
      recommendations,
      alerts
    };
  }

  /**
   * Batch analyze multiple items
   */
  batchAnalyze(items: ItemAnalytics[]): CategorizationResult[] {
    return items.map(item => this.analyzeItem(item));
  }

  /**
   * Calculate automatic flags based on criteria
   */
  private calculateAutoFlags(item: ItemAnalytics, criteria: PromotionCriteria) {
    const { currentMetrics, historicalMetrics } = item;
    const createdDate = new Date(currentMetrics.createdAt);
    const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    // New flag
    const isNew = daysSinceCreated <= criteria.new.maxDaysOld;

    // Best seller flag
    const isBestSeller = 
      currentMetrics.sales >= criteria.bestSeller.minSales &&
      currentMetrics.revenue >= criteria.bestSeller.minRevenue &&
      currentMetrics.rating >= criteria.bestSeller.minRating &&
      currentMetrics.orders >= criteria.bestSeller.minOrders;

    // Trending flag (requires historical data)
    let isTrending = false;
    let trendingConfidence = 0;

    if (historicalMetrics) {
      const viewsGrowth = this.calculateGrowthRate(
        historicalMetrics.views7DaysAgo,
        currentMetrics.views
      );
      const salesGrowth = this.calculateGrowthRate(
        historicalMetrics.sales7DaysAgo,
        currentMetrics.sales
      );

      const meetsViewsCriteria = 
        currentMetrics.views >= criteria.trending.minViews &&
        viewsGrowth >= criteria.trending.viewsGrowthRate;
        
      const meetsSalesCriteria = 
        currentMetrics.sales >= criteria.trending.minSales &&
        salesGrowth >= criteria.trending.salesGrowthRate;

      isTrending = meetsViewsCriteria || meetsSalesCriteria;
      
      // Calculate confidence based on how much criteria is exceeded
      if (isTrending) {
        const viewsExcess = Math.max(0, (viewsGrowth - criteria.trending.viewsGrowthRate) / 100);
        const salesExcess = Math.max(0, (salesGrowth - criteria.trending.salesGrowthRate) / 100);
        trendingConfidence = Math.min(1, (viewsExcess + salesExcess) / 2 + 0.5);
      }
    } else {
      // Fallback for trending without historical data
      isTrending = 
        currentMetrics.views >= criteria.trending.minViews &&
        currentMetrics.sales >= criteria.trending.minSales;
      trendingConfidence = isTrending ? 0.6 : 0; // Lower confidence without historical data
    }

    // Overall confidence (average of individual confidences)
    const overallConfidence = [
      isNew ? 0.9 : 0,
      isBestSeller ? 0.8 : 0,
      trendingConfidence
    ].reduce((sum, conf) => sum + conf, 0) / 3;

    return {
      trending: isTrending,
      new: isNew,
      bestSeller: isBestSeller,
      confidence: overallConfidence
    };
  }

  /**
   * Apply manual overrides to auto flags
   */
  private applyManualOverrides(
    autoFlags: { trending: boolean; new: boolean; bestSeller: boolean },
    manualOverrides: ItemAnalytics['manualOverrides']
  ) {
    const finalFlags = { ...autoFlags };
    let source: 'auto' | 'manual' | 'hybrid' = 'auto';

    // Apply manual overrides
    if (manualOverrides.trending !== undefined) {
      finalFlags.trending = manualOverrides.trending;
      source = source === 'auto' ? 'manual' : 'hybrid';
    }
    if (manualOverrides.new !== undefined) {
      finalFlags.new = manualOverrides.new;
      source = source === 'auto' ? 'manual' : 'hybrid';
    }
    if (manualOverrides.bestSeller !== undefined) {
      finalFlags.bestSeller = manualOverrides.bestSeller;
      source = source === 'auto' ? 'manual' : 'hybrid';
    }

    return {
      ...finalFlags,
      source
    };
  }

  /**
   * Generate recommendations for improving categorization
   */
  private generateRecommendations(
    item: ItemAnalytics,
    autoFlags: { trending: boolean; new: boolean; bestSeller: boolean; confidence: number }
  ): string[] {
    const recommendations: string[] = [];
    const { currentMetrics } = item;
    const isProduct = item.type === 'product';
    const criteria = isProduct ? this.settings.products : this.settings.vendors;

    // Trending recommendations
    if (!autoFlags.trending) {
      if (currentMetrics.views < criteria.trending.minViews) {
        recommendations.push(`Increase visibility: Need ${criteria.trending.minViews - currentMetrics.views} more views to qualify for trending`);
      }
      if (currentMetrics.sales < criteria.trending.minSales) {
        recommendations.push(`Boost sales: Need ${criteria.trending.minSales - currentMetrics.sales} more sales to qualify for trending`);
      }
    }

    // Best seller recommendations
    if (!autoFlags.bestSeller) {
      if (currentMetrics.sales < criteria.bestSeller.minSales) {
        recommendations.push(`Increase sales volume: Need ${criteria.bestSeller.minSales - currentMetrics.sales} more sales for best seller status`);
      }
      if (currentMetrics.rating < criteria.bestSeller.minRating) {
        recommendations.push(`Improve rating: Need ${(criteria.bestSeller.minRating - currentMetrics.rating).toFixed(1)} more rating points for best seller status`);
      }
      if (currentMetrics.revenue < criteria.bestSeller.minRevenue) {
        recommendations.push(`Increase revenue: Need $${(criteria.bestSeller.minRevenue - currentMetrics.revenue).toLocaleString()} more revenue for best seller status`);
      }
    }

    // Low confidence warning
    if (autoFlags.confidence < 0.5) {
      recommendations.push('Consider manual promotion: Auto-categorization confidence is low due to limited data');
    }

    return recommendations;
  }

  /**
   * Generate alerts for significant changes or issues
   */
  private generateAlerts(
    item: ItemAnalytics,
    autoFlags: { trending: boolean; new: boolean; bestSeller: boolean }
  ): string[] {
    const alerts: string[] = [];
    const { currentMetrics, historicalMetrics } = item;

    if (historicalMetrics) {
      // Check for significant growth
      const viewsGrowth = this.calculateGrowthRate(
        historicalMetrics.views7DaysAgo,
        currentMetrics.views
      );
      const salesGrowth = this.calculateGrowthRate(
        historicalMetrics.sales7DaysAgo,
        currentMetrics.sales
      );

      if (viewsGrowth >= this.settings.notificationThresholds.trendingGrowth) {
        alerts.push(`🔥 Viral alert: ${viewsGrowth.toFixed(0)}% increase in views over 7 days`);
      }
      if (salesGrowth >= this.settings.notificationThresholds.salesSpike) {
        alerts.push(`💰 Sales spike: ${salesGrowth.toFixed(0)}% increase in sales over 7 days`);
      }

      // Check for concerning drops
      if (viewsGrowth < -30) {
        alerts.push(`⚠️ Views declining: ${Math.abs(viewsGrowth).toFixed(0)}% decrease in views`);
      }
      if (salesGrowth < -30) {
        alerts.push(`📉 Sales declining: ${Math.abs(salesGrowth).toFixed(0)}% decrease in sales`);
      }
    }

    // Quality alerts
    if (currentMetrics.rating < 3.0) {
      alerts.push('⭐ Low rating: Consider reviewing for quality issues');
    }

    return alerts;
  }

  /**
   * Calculate growth rate percentage
   */
  private calculateGrowthRate(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Update categorization settings
   */
  updateSettings(newSettings: Partial<AutoCategorizationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): AutoCategorizationSettings {
    return { ...this.settings };
  }
}

/**
 * Export singleton instance for global use
 */
export const autoCategorization = new AutoCategorization();

/**
 * Helper function to convert marketplace data to ItemAnalytics format
 */
export function convertToAnalytics(
  marketplaceItem,
  type: 'product' | 'vendor',
  mockHistoricalData: boolean = true
): ItemAnalytics {
  const createdAt = type === 'product' 
    ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000).toISOString();

  const currentMetrics = {
    views: Math.floor(Math.random() * 5000) + 100,
    sales: Math.floor(Math.random() * 1000) + 50,
    orders: Math.floor(Math.random() * 200) + 10,
    revenue: (Math.floor(Math.random() * 1000) + 50) * (marketplaceItem.price || 100),
    rating: marketplaceItem.rating || Math.random() * 2 + 3,
    createdAt
  };

  const historicalMetrics = mockHistoricalData ? {
    views7DaysAgo: Math.max(0, currentMetrics.views - Math.floor(Math.random() * 500)),
    sales7DaysAgo: Math.max(0, currentMetrics.sales - Math.floor(Math.random() * 200)),
    orders7DaysAgo: Math.max(0, currentMetrics.orders - Math.floor(Math.random() * 50)),
    revenue7DaysAgo: Math.max(0, currentMetrics.revenue - Math.floor(Math.random() * 10000))
  } : undefined;

  return {
    id: marketplaceItem.id,
    type,
    currentMetrics,
    historicalMetrics,
    manualOverrides: {}
  };
}

/**
 * Utility functions for admin interface
 */
export const AdminCategorizationUtils = {
  /**
   * Get summary statistics for categorization results
   */
  getSummaryStats(results: CategorizationResult[]) {
    const total = results.length;
    const autoTrending = results.filter(r => r.autoFlags.trending).length;
    const manualTrending = results.filter(r => r.finalFlags.trending && r.finalFlags.source !== 'auto').length;
    const totalTrending = results.filter(r => r.finalFlags.trending).length;
    
    const autoNew = results.filter(r => r.autoFlags.new).length;
    const totalNew = results.filter(r => r.finalFlags.new).length;
    
    const autoBestSellers = results.filter(r => r.autoFlags.bestSeller).length;
    const totalBestSellers = results.filter(r => r.finalFlags.bestSeller).length;
    
    const avgConfidence = results.reduce((sum, r) => sum + r.autoFlags.confidence, 0) / total;
    
    const totalAlerts = results.reduce((sum, r) => sum + r.alerts.length, 0);
    const totalRecommendations = results.reduce((sum, r) => sum + r.recommendations.length, 0);

    return {
      total,
      trending: { auto: autoTrending, manual: manualTrending, total: totalTrending },
      new: { auto: autoNew, total: totalNew },
      bestSellers: { auto: autoBestSellers, total: totalBestSellers },
      avgConfidence: Math.round(avgConfidence * 100),
      alerts: totalAlerts,
      recommendations: totalRecommendations
    };
  },

  /**
   * Export categorization data as CSV
   */
  exportToCSV(results: CategorizationResult[]): string {
    const headers = [
      'ID', 'Type', 'Auto Trending', 'Final Trending', 'Auto New', 'Final New',
      'Auto Best Seller', 'Final Best Seller', 'Confidence', 'Source',
      'Recommendations', 'Alerts'
    ];
    
    const rows = results.map(r => [
      r.id,
      r.type,
      r.autoFlags.trending ? 'Yes' : 'No',
      r.finalFlags.trending ? 'Yes' : 'No',
      r.autoFlags.new ? 'Yes' : 'No',
      r.finalFlags.new ? 'Yes' : 'No',
      r.autoFlags.bestSeller ? 'Yes' : 'No',
      r.finalFlags.bestSeller ? 'Yes' : 'No',
      Math.round(r.autoFlags.confidence * 100) + '%',
      r.finalFlags.source,
      r.recommendations.join('; '),
      r.alerts.join('; ')
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }
};