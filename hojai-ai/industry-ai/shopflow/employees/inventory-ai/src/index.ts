/**
 * Inventory AI Agent for Retail
 * Part of SHOPFLOW - Retail AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  leadTime: number;
  supplier?: string;
}

export interface ReorderRecommendation {
  product: Product;
  currentStock: number;
  recommendedOrder: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export class InventoryAI {
  private products: Map<string, Product> = new Map();

  /**
   * Get reorder recommendations
   */
  async getReorderRecommendations(): Promise<ReorderRecommendation[]> {
    const recommendations: ReorderRecommendation[] = [];

    for (const product of this.products.values()) {
      const urgency = this.calculateUrgency(product);
      if (urgency !== 'low') {
        recommendations.push({
          product,
          currentStock: product.stock,
          recommendedOrder: this.calculateOrderQuantity(product),
          urgency,
          reason: this.generateReason(product, urgency)
        });
      }
    }

    return recommendations.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.urgency] - order[b.urgency];
    });
  }

  /**
   * Predict stockout date
   */
  async predictStockout(productId: string, avgDailySales: number): Promise<{
    stockoutDate: string | null;
    daysRemaining: number;
    urgency: string;
  }> {
    const product = this.products.get(productId);
    if (!product) {
      return { stockoutDate: null, daysRemaining: -1, urgency: 'unknown' };
    }

    const daysRemaining = Math.floor(product.stock / avgDailySales);

    if (daysRemaining <= 0) {
      return { stockoutDate: 'IMMEDIATE', daysRemaining: 0, urgency: 'critical' };
    }

    const stockoutDate = new Date();
    stockoutDate.setDate(stockoutDate.getDate() + daysRemaining);

    let urgency = 'low';
    if (daysRemaining <= product.leadTime) urgency = 'critical';
    else if (daysRemaining <= product.leadTime * 2) urgency = 'high';
    else if (daysRemaining <= product.reorderPoint) urgency = 'medium';

    return {
      stockoutDate: stockoutDate.toISOString().split('T')[0],
      daysRemaining,
      urgency
    };
  }

  /**
   * Get ABC analysis
   */
  async getABCAnalysis(): Promise<{
    categoryA: Product[];
    categoryB: Product[];
    categoryC: Product[];
  }> {
    const products = Array.from(this.products.values());

    // Calculate revenue contribution
    const withRevenue = products.map(p => ({
      ...p,
      revenue: p.price * p.stock
    }));

    const totalRevenue = withRevenue.reduce((sum, p) => sum + p.revenue, 0);

    // Sort by revenue
    const sorted = withRevenue.sort((a, b) => b.revenue - a.revenue);

    let cumulative = 0;
    const categoryA: Product[] = [];
    const categoryB: Product[] = [];
    const categoryC: Product[] = [];

    for (const product of sorted) {
      cumulative += product.revenue / totalRevenue * 100;

      if (cumulative <= 80) categoryA.push(product);
      else if (cumulative <= 95) categoryB.push(product);
      else categoryC.push(product);
    }

    return { categoryA, categoryB, categoryC };
  }

  private calculateUrgency(product: Product): 'low' | 'medium' | 'high' | 'critical' {
    const daysOfStock = product.stock / Math.max(1, product.reorderPoint / 7);

    if (product.stock === 0) return 'critical';
    if (daysOfStock <= product.leadTime) return 'critical';
    if (daysOfStock <= product.leadTime * 2) return 'high';
    if (product.stock <= product.reorderPoint) return 'medium';
    return 'low';
  }

  private calculateOrderQuantity(product: Product): number {
    return Math.max(0, product.maxStock - product.stock);
  }

  private generateReason(product: Product, urgency: string): string {
    switch (urgency) {
      case 'critical':
        return `Stock critically low (${product.stock}/${product.reorderPoint}). Order immediately.`;
      case 'high':
        return `Stock below reorder point. Lead time: ${product.leadTime} days.`;
      case 'medium':
        return `Approaching reorder point. Consider ordering.`;
      default:
        return 'Normal stock levels.';
    }
  }
}

export default InventoryAI;
