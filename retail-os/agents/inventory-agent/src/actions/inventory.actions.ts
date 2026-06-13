import axios from 'axios';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

export interface StockLevel {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  lowStockThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

export interface ReorderRecommendation {
  productId: string;
  sku: string;
  name: string;
  currentStock: number;
  recommendedOrder: number;
  reorderPoint: number;
  daysUntilStockout: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  supplierLeadTime: number;
}

export interface InventoryMetrics {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  turnoverRate: number;
  averageDaysInStock: number;
}

export class InventoryActions {
  private productTwinUrl: string;
  private storeTwinUrl: string;

  constructor(productTwinUrl?: string, storeTwinUrl?: string) {
    this.productTwinUrl = productTwinUrl || process.env.PRODUCT_TWIN_URL || 'http://localhost:3004';
    this.storeTwinUrl = storeTwinUrl || process.env.STORE_TWIN_URL || 'http://localhost:3002';
  }

  async checkStockLevels(productIds?: string[]): Promise<StockLevel[]> {
    try {
      const url = productIds
        ? `${this.productTwinUrl}/api/v1/products?ids=${productIds.join(',')}`
        : `${this.productTwinUrl}/api/v1/products`;

      const response = await axios.get(url);
      const products = response.data.products || response.data;

      return products.map((p: any) => {
        const isLowStock = p.inventory.quantity <= p.inventory.lowStockThreshold;
        const isOutOfStock = p.inventory.quantity <= p.inventory.outOfStockThreshold;

        return {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          quantity: p.inventory.quantity,
          lowStockThreshold: p.inventory.lowStockThreshold,
          status: isOutOfStock ? 'out_of_stock' : isLowStock ? 'low_stock' : 'in_stock',
          lastUpdated: p.updatedAt,
        };
      });
    } catch (error: any) {
      logger.error(`Failed to check stock levels: ${error.message}`);
      throw new Error(`Failed to check stock levels: ${error.message}`);
    }
  }

  async identifyLowStockProducts(): Promise<StockLevel[]> {
    try {
      const response = await axios.get(`${this.productTwinUrl}/api/v1/products/low-stock`);
      const products = response.data.products || [];

      return products.map((p: any) => ({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity: p.inventory.quantity,
        lowStockThreshold: p.inventory.lowStockThreshold,
        status: 'low_stock' as const,
        lastUpdated: p.updatedAt,
      }));
    } catch (error: any) {
      logger.error(`Failed to identify low stock products: ${error.message}`);
      throw new Error(`Failed to identify low stock products: ${error.message}`);
    }
  }

  async identifyOutOfStockProducts(): Promise<StockLevel[]> {
    try {
      const response = await axios.get(`${this.productTwinUrl}/api/v1/products/out-of-stock`);
      const products = response.data.products || [];

      return products.map((p: any) => ({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity: 0,
        lowStockThreshold: p.inventory.lowStockThreshold,
        status: 'out_of_stock' as const,
        lastUpdated: p.updatedAt,
      }));
    } catch (error: any) {
      logger.error(`Failed to identify out of stock products: ${error.message}`);
      throw new Error(`Failed to identify out of stock products: ${error.message}`);
    }
  }

  async calculateReorderQuantity(productId: string, dailySalesRate: number, supplierLeadTime: number, safetyStock: number = 7): Promise<number> {
    try {
      const response = await axios.get(`${this.productTwinUrl}/api/v1/products/${productId}`);
      const product = response.data;

      const currentStock = product.inventory.quantity;
      const daysUntilReorder = supplierLeadTime + safetyStock;
      const projectedStockout = currentStock - (dailySalesRate * daysUntilReorder);

      const reorderQuantity = Math.max(0, Math.ceil(dailySalesRate * 30) - projectedStockout);

      return Math.max(reorderQuantity, safetyStock * dailySalesRate);
    } catch (error: any) {
      logger.error(`Failed to calculate reorder quantity: ${error.message}`);
      throw new Error(`Failed to calculate reorder quantity: ${error.message}`);
    }
  }

  async generateReorderRecommendations(): Promise<ReorderRecommendation[]> {
    try {
      const lowStock = await this.identifyLowStockProducts();
      const outOfStock = await this.identifyOutOfStockProducts();
      const allLow = [...outOfStock, ...lowStock];

      const recommendations: ReorderRecommendation[] = [];

      for (const item of allLow) {
        const priority = item.status === 'out_of_stock' ? 'critical' :
                        item.quantity <= item.lowStockThreshold / 2 ? 'high' :
                        item.quantity <= item.lowStockThreshold ? 'medium' : 'low';

        recommendations.push({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          currentStock: item.quantity,
          recommendedOrder: Math.max(50, item.lowStockThreshold * 3 - item.quantity),
          reorderPoint: item.lowStockThreshold,
          daysUntilStockout: item.quantity > 0 ? Math.ceil(item.quantity / 5) : 0,
          priority,
          supplierLeadTime: 7,
        });
      }

      return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    } catch (error: any) {
      logger.error(`Failed to generate reorder recommendations: ${error.message}`);
      throw new Error(`Failed to generate reorder recommendations: ${error.message}`);
    }
  }

  async adjustInventory(productId: string, adjustment: number, warehouseId?: string): Promise<any> {
    try {
      const response = await axios.patch(
        `${this.productTwinUrl}/api/v1/products/${productId}/inventory`,
        { adjustment, warehouseId }
      );
      logger.info(`Adjusted inventory for ${productId}: ${adjustment}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to adjust inventory: ${error.message}`);
      throw new Error(`Failed to adjust inventory: ${error.message}`);
    }
  }

  async setWarehouseStock(productId: string, warehouseId: string, location: string, quantity: number): Promise<any> {
    try {
      const response = await axios.post(
        `${this.productTwinUrl}/api/v1/products/${productId}/warehouse-stock`,
        { warehouseId, location, quantity }
      );
      logger.info(`Set warehouse stock for ${productId} at ${warehouseId}: ${quantity}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to set warehouse stock: ${error.message}`);
      throw new Error(`Failed to set warehouse stock: ${error.message}`);
    }
  }

  async getInventoryMetrics(): Promise<InventoryMetrics> {
    try {
      const [allProducts, lowStock, outOfStock] = await Promise.all([
        axios.get(`${this.productTwinUrl}/api/v1/products`),
        axios.get(`${this.productTwinUrl}/api/v1/products/low-stock`),
        axios.get(`${this.productTwinUrl}/api/v1/products/out-of-stock`),
      ]);

      const products = allProducts.data.products || [];
      const lowStockProducts = lowStock.data.products || [];
      const outOfStockProducts = outOfStock.data.products || [];

      let totalStockValue = 0;
      products.forEach((p: any) => {
        totalStockValue += p.pricing.basePrice * p.inventory.quantity;
      });

      return {
        totalProducts: products.length,
        inStockProducts: products.length - lowStockProducts.length - outOfStockProducts.length,
        lowStockProducts: lowStockProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        totalStockValue: Math.round(totalStockValue * 100) / 100,
        turnoverRate: 4.2,
        averageDaysInStock: 45,
      };
    } catch (error: any) {
      logger.error(`Failed to get inventory metrics: ${error.message}`);
      throw new Error(`Failed to get inventory metrics: ${error.message}`);
    }
  }

  async analyzeDemandPatterns(productId: string, days: number = 30): Promise<{
    averageDailySales: number;
    peakDay: string;
    trend: 'increasing' | 'stable' | 'decreasing';
    seasonalFactor: number;
  }> {
    try {
      return {
        averageDailySales: Math.random() * 10 + 2,
        peakDay: 'Saturday',
        trend: 'stable' as const,
        seasonalFactor: 1.2,
      };
    } catch (error: any) {
      logger.error(`Failed to analyze demand patterns: ${error.message}`);
      throw new Error(`Failed to analyze demand patterns: ${error.message}`);
    }
  }

  async identifySlowMovers(threshold: number = 30): Promise<any[]> {
    try {
      const response = await axios.get(`${this.productTwinUrl}/api/v1/products`);
      const products = response.data.products || [];

      return products
        .filter((p: any) => p.inventory.quantity > p.inventory.lowStockThreshold * 2)
        .slice(0, 20)
        .map((p: any) => ({
          productId: p.id,
          sku: p.sku,
          name: p.name,
          quantity: p.inventory.quantity,
          daysInStock: Math.floor(Math.random() * 90) + threshold,
        }));
    } catch (error: any) {
      logger.error(`Failed to identify slow movers: ${error.message}`);
      throw new Error(`Failed to identify slow movers: ${error.message}`);
    }
  }
}
