import { ProductPerformance, Merchant } from '../models/index.js';
import type { ProductAnalysis, ProductPerformance as ProductPerformanceType } from '../types/index.js';
import logger from '../config/logger.js';
import { subDays, format } from 'date-fns';

export class ProductAnalysisService {
  /**
   * Get comprehensive product performance analysis
   */
  async getProductAnalysis(
    merchantId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
    sortBy: 'revenue' | 'units' | 'margin' | 'growth' = 'revenue',
    limit: number = 20
  ): Promise<ProductAnalysis> {
    const days = this.getDaysForPeriod(period);
    const startDate = subDays(new Date(), days);

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }

    // Get product performance data
    const products = await ProductPerformance.find({
      merchantId,
      lastUpdated: { $gte: startDate },
    }).sort({ [sortBy]: -1 });

    const totalProducts = products.length;

    // Categorize products
    const topProducts = this.getTopProducts(products, limit);
    const underperformers = this.getUnderperformers(products, limit);

    // Category breakdown
    const categoryBreakdown = this.getCategoryBreakdown(products);

    // Generate recommendations
    const recommendations = this.generateRecommendations(products);

    return {
      merchantId,
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
      },
      totalProducts,
      topProducts,
      underperformers,
      categoryBreakdown,
      recommendations,
    };
  }

  /**
   * Get performance for a specific product
   */
  async getProductPerformance(
    merchantId: string,
    productId: string
  ): Promise<ProductPerformanceType | null> {
    const product = await ProductPerformance.findOne({ merchantId, productId });

    if (!product) {
      return null;
    }

    return {
      productId: product.productId,
      name: product.name,
      sku: product.sku,
      category: product.category,
      revenue: product.revenue,
      unitsSold: product.unitsSold,
      margin: product.margin,
      returnRate: product.returnRate,
      trend: product.trend,
      rank: 0, // Will be calculated by caller
      performance: this.determinePerformance(product),
    };
  }

  private getDaysForPeriod(period: string): number {
    switch (period) {
      case 'week': return 7;
      case 'month': return 30;
      case 'quarter': return 90;
      case 'year': return 365;
      default: return 30;
    }
  }

  private getTopProducts(
    products: InstanceType<typeof ProductPerformance>[],
    limit: number
  ): ProductPerformanceType[] {
    return products
      .slice(0, limit)
      .map((p, index) => ({
        productId: p.productId,
        name: p.name,
        sku: p.sku,
        category: p.category,
        revenue: p.revenue,
        unitsSold: p.unitsSold,
        margin: p.margin,
        returnRate: p.returnRate,
        trend: p.trend,
        rank: index + 1,
        performance: 'top' as const,
      }));
  }

  private getUnderperformers(
    products: InstanceType<typeof ProductPerformance>[],
    limit: number
  ): ProductPerformanceType[] {
    return products
      .filter(p => p.trend === 'falling' || p.returnRate > 10)
      .slice(0, limit)
      .map((p, index) => ({
        productId: p.productId,
        name: p.name,
        sku: p.sku,
        category: p.category,
        revenue: p.revenue,
        unitsSold: p.unitsSold,
        margin: p.margin,
        returnRate: p.returnRate,
        trend: p.trend,
        rank: products.length - index,
        performance: 'low' as const,
      }));
  }

  private getCategoryBreakdown(
    products: InstanceType<typeof ProductPerformance>[]
  ): { category: string; revenue: number; percentage: number }[] {
    const categoryTotals = new Map<string, number>();
    let totalRevenue = 0;

    for (const product of products) {
      totalRevenue += product.revenue;
      const current = categoryTotals.get(product.category) || 0;
      categoryTotals.set(product.category, current + product.revenue);
    }

    return Array.from(categoryTotals.entries())
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private determinePerformance(
    product: InstanceType<typeof ProductPerformance>
  ): 'top' | 'mid' | 'low' {
    if (product.trend === 'rising' && product.margin > 30) {
      return 'top';
    }
    if (product.trend === 'falling' || product.returnRate > 10) {
      return 'low';
    }
    return 'mid';
  }

  private generateRecommendations(
    products: InstanceType<typeof ProductPerformance>[]
  ): string[] {
    const recommendations: string[] = [];

    // Top performers recommendations
    const topProducts = products.filter(p => p.trend === 'rising').slice(0, 3);
    if (topProducts.length > 0) {
      recommendations.push(
        `Your top performers are ${topProducts.map(p => p.name).join(', ')}. ` +
        `Consider increasing inventory and marketing spend for these products.`
      );
    }

    // Underperformers recommendations
    const underperformers = products.filter(p => p.trend === 'falling').slice(0, 3);
    if (underperformers.length > 0) {
      recommendations.push(
        `Products ${underperformers.map(p => p.name).join(', ')} are showing declining trends. ` +
        `Review pricing, marketing, or consider phasing them out.`
      );
    }

    // High return rate warning
    const highReturns = products.filter(p => p.returnRate > 5);
    if (highReturns.length > 0) {
      recommendations.push(
        `Products ${highReturns.map(p => p.name).join(', ')} have high return rates (>5%). ` +
        `Review product quality and descriptions.`
      );
    }

    // Category optimization
    const categoryRevenue = new Map<string, number>();
    for (const product of products) {
      const current = categoryRevenue.get(product.category) || 0;
      categoryRevenue.set(product.category, current + product.revenue);
    }

    const sortedCategories = Array.from(categoryRevenue.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length > 1) {
      const topCategory = sortedCategories[0];
      const bottomCategory = sortedCategories[sortedCategories.length - 1];
      recommendations.push(
        `${topCategory[0]} is your highest revenue category. ` +
        `Consider cross-selling from ${bottomCategory[0]} to boost overall sales.`
      );
    }

    return recommendations;
  }
}

export default new ProductAnalysisService();