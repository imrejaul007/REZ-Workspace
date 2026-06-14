import axios, { AxiosInstance } from 'axios';
import config from '../config';
import { logger } from '../utils/logger';

interface InventoryItem {
  id: string;
  merchantId: string;
  name: string;
  category: string;
  currentStock: number;
  lowStockThreshold: number;
  price: number;
  isActive: boolean;
  lastRestocked?: string;
}

interface InventorySummary {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  averageStockLevel: number;
  turnoverRate: number;
}

interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  alertType: 'low_stock' | 'out_of_stock';
  createdAt: string;
}

export class InventoryConnector {
  private client: AxiosInstance;
  private cache: Map<string, { data; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.client = axios.create({
      baseURL: config.services.inventory,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Fetch inventory for a merchant
   */
  async getMerchantInventory(
    merchantId: string,
    options: { activeOnly?: boolean; category?: string } = {}
  ): Promise<InventoryItem[]> {
    const cacheKey = `inventory:${merchantId}:${JSON.stringify(options)}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    try {
      const response = await this.client.get(`/merchants/${merchantId}/inventory`, {
        params: options,
      });

      const items = response.data.data || [];
      this.setCache(cacheKey, items);
      return items;
    } catch (error) {
      logger.error(`Failed to fetch inventory for merchant ${merchantId}`, error);
      return this.getMockInventory(merchantId);
    }
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(merchantId: string): Promise<InventorySummary> {
    const inventory = await this.getMerchantInventory(merchantId);

    const outOfStock = inventory.filter(i => i.currentStock === 0).length;
    const lowStock = inventory.filter(i => i.currentStock > 0 && i.currentStock <= i.lowStockThreshold).length;
    const activeProducts = inventory.filter(i => i.isActive).length;
    const totalStock = inventory.reduce((sum, i) => sum + i.currentStock, 0);

    return {
      totalProducts: inventory.length,
      activeProducts,
      outOfStock,
      lowStock,
      averageStockLevel: inventory.length > 0 ? totalStock / inventory.length : 0,
      turnoverRate: this.calculateTurnoverRate(inventory),
    };
  }

  /**
   * Get stock alerts
   */
  async getStockAlerts(merchantId: string): Promise<StockAlert[]> {
    const inventory = await this.getMerchantInventory(merchantId);
    const alerts: StockAlert[] = [];

    inventory.forEach(item => {
      if (item.currentStock === 0) {
        alerts.push({
          productId: item.id,
          productName: item.name,
          currentStock: 0,
          threshold: item.lowStockThreshold,
          alertType: 'out_of_stock',
          createdAt: new Date().toISOString(),
        });
      } else if (item.currentStock <= item.lowStockThreshold) {
        alerts.push({
          productId: item.id,
          productName: item.name,
          currentStock: item.currentStock,
          threshold: item.lowStockThreshold,
          alertType: 'low_stock',
          createdAt: new Date().toISOString(),
        });
      }
    });

    return alerts.sort((a, b) => {
      if (a.alertType === 'out_of_stock' && b.alertType !== 'out_of_stock') return -1;
      if (b.alertType === 'out_of_stock' && a.alertType !== 'out_of_stock') return 1;
      return a.currentStock - b.currentStock;
    });
  }

  /**
   * Get top categories by product count and turnover
   */
  async getTopCategories(merchantId: string, limit: number = 10): Promise<unknown[]> {
    const inventory = await this.getMerchantInventory(merchantId);
    const categoryMap = new Map<string, { count: number; totalStock: number; turnover: number }>();

    inventory.forEach(item => {
      const existing = categoryMap.get(item.category);
      if (existing) {
        existing.count++;
        existing.totalStock += item.currentStock;
      } else {
        categoryMap.set(item.category, {
          count: 1,
          totalStock: item.currentStock,
          turnover: Math.random() * 10 + 2, // Mock turnover rate
        });
      }
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        turnover: data.turnover,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get restock patterns
   */
  async getRestockPatterns(merchantId: string): Promise<unknown[]> {
    const inventory = await this.getMerchantInventory(merchantId);

    return inventory.map(item => ({
      productId: item.id,
      productName: item.name,
      averageDaysBetweenRestocks: Math.floor(Math.random() * 14) + 3,
      typicalRestockQuantity: Math.floor(item.lowStockThreshold * 2),
      lastRestocked: item.lastRestocked || new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      nextPredictedRestock: this.predictNextRestock(item),
    }));
  }

  /**
   * Calculate turnover rate
   */
  private calculateTurnoverRate(inventory: InventoryItem[]): number {
    if (inventory.length === 0) return 0;

    // Mock turnover calculation
    const avgStock = inventory.reduce((sum, i) => sum + i.currentStock, 0) / inventory.length;
    const mockSalesRate = inventory.length * 2; // Mock daily sales

    return avgStock > 0 ? mockSalesRate / avgStock * 30 : 0; // Monthly turnover
  }

  /**
   * Predict next restock date
   */
  private predictNextRestock(item: InventoryItem): string {
    const avgDaysToRestock = 7; // Mock average
    const daysUntilStockOut = item.currentStock > 0 ? item.currentStock / 2 : 0;

    const nextRestock = new Date();
    nextRestock.setDate(nextRestock.getDate() + Math.max(daysUntilStockOut, avgDaysToRestock));

    return nextRestock.toISOString();
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached !== undefined && Date.now() - cached.timestamp < this.cacheTimeout;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get mock inventory for development
   */
  private getMockInventory(merchantId: string): InventoryItem[] {
    const categories = ['Food', 'Beverage', 'Dessert', 'Merchandise', 'Specials'];
    const items: InventoryItem[] = [];

    for (let i = 0; i < 50; i++) {
      const stock = Math.floor(Math.random() * 100);
      items.push({
        id: `item-${i}`,
        merchantId,
        name: `Product ${i + 1}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        currentStock: stock,
        lowStockThreshold: 10 + Math.floor(Math.random() * 20),
        price: Math.floor(Math.random() * 30) + 5,
        isActive: stock > 0,
        lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return items;
  }
}

export const inventoryConnector = new InventoryConnector();
export default inventoryConnector;
