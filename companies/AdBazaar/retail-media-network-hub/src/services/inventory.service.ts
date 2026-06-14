import { InventoryItem } from '../types/index.js';
import { cacheGet, cacheSet } from '../config/redis.js';

export class InventoryService {
  private cacheTTL = 3600; // 1 hour for inventory

  async getAvailableInventory(
    options: {
      category?: string;
      minImpressions?: number;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    items: InventoryItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { category, minImpressions = 0, page = 1, limit = 50 } = options;

    const cacheKey = `inventory:${category || 'all'}:${minImpressions}:${page}:${limit}`;
    const cached = await cacheGet<{
      items: InventoryItem[];
      total: number;
      page: number;
      limit: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    // Generate mock inventory data based on available ad placements
    // In production, this would query from actual ad inventory system
    const mockInventory = this.generateMockInventory(category, minImpressions);

    const startIndex = (page - 1) * limit;
    const paginatedItems = mockInventory.slice(startIndex, startIndex + limit);

    const result = {
      items: paginatedItems,
      total: mockInventory.length,
      page,
      limit,
    };

    await cacheSet(cacheKey, result, this.cacheTTL);

    return result;
  }

  async getInventoryByProductId(productId: string): Promise<InventoryItem | null> {
    const cacheKey = `inventory:product:${productId}`;
    const cached = await cacheGet<InventoryItem>(cacheKey);

    if (cached) {
      return cached;
    }

    // Generate mock data for product
    const inventory = this.generateMockInventory().find(
      (item) => item.productId === productId
    );

    if (inventory) {
      await cacheSet(cacheKey, inventory, this.cacheTTL);
    }

    return inventory || null;
  }

  async getCategoryPerformance(): Promise<{
    category: string;
    totalImpressions: number;
    avgConversionRate: number;
    estimatedCPM: number;
  }[]> {
    const cacheKey = 'inventory:category-performance';
    const cached = await cacheGet<{
      category: string;
      totalImpressions: number;
      avgConversionRate: number;
      estimatedCPM: number;
    }[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // Mock category performance data
    const categories = [
      { category: 'Electronics', totalImpressions: 1500000, avgConversionRate: 0.035, estimatedCPM: 45 },
      { category: 'Fashion', totalImpressions: 2000000, avgConversionRate: 0.028, estimatedCPM: 35 },
      { category: 'Food& Grocery', totalImpressions: 3000000, avgConversionRate: 0.042, estimatedCPM: 25 },
      { category: 'Home & Living', totalImpressions: 1200000, avgConversionRate: 0.031, estimatedCPM: 40 },
      { category: 'Beauty', totalImpressions: 1800000, avgConversionRate: 0.038, estimatedCPM: 38 },
      { category: 'Sports', totalImpressions: 900000, avgConversionRate: 0.029, estimatedCPM: 42 },
      { category: 'Books', totalImpressions: 500000, avgConversionRate: 0.022, estimatedCPM: 20 },
      { category: 'Toys', totalImpressions: 700000, avgConversionRate: 0.033, estimatedCPM: 30 },
    ];

    await cacheSet(cacheKey, categories, this.cacheTTL);

    return categories;
  }

  async getRecommendedPlacements(
    productId: string,
    budget: number
  ): Promise<{
    placement: string;
    estimatedImpressions: number;
    estimatedClicks: number;
    estimatedOrders: number;
    estimatedCost: number;
  }[]> {
    // Generate recommended ad placements based on budget
    const placements = [
      {
        placement: 'Homepage Banner',
        estimatedImpressions: Math.floor(budget * 100),
        estimatedClicks: Math.floor(budget * 5),
        estimatedOrders: Math.floor(budget * 0.15),
        estimatedCost: budget,
      },
      {
        placement: 'Search Results Top',
        estimatedImpressions: Math.floor(budget * 200),
        estimatedClicks: Math.floor(budget * 10),
        estimatedOrders: Math.floor(budget * 0.25),
        estimatedCost: budget,
      },
      {
        placement: 'Category Page Sidebar',
        estimatedImpressions: Math.floor(budget * 150),
        estimatedClicks: Math.floor(budget * 6),
        estimatedOrders: Math.floor(budget * 0.18),
        estimatedCost: budget,
      },
      {
        placement: 'Product Detail Page',
        estimatedImpressions: Math.floor(budget * 80),
        estimatedClicks: Math.floor(budget * 12),
        estimatedOrders: Math.floor(budget * 0.35),
        estimatedCost: budget,
      },
      {
        placement: 'Cart Page Overlay',
        estimatedImpressions: Math.floor(budget * 50),
        estimatedClicks: Math.floor(budget * 15),
        estimatedOrders: Math.floor(budget * 0.45),
        estimatedCost: budget,
      },
    ];

    return placements;
  }

  private generateMockInventory(
    category?: string,
    minImpressions?: number
  ): InventoryItem[] {
    const categories = [
      'Electronics',
      'Fashion',
      'Food & Grocery',
      'Home & Living',
      'Beauty',
      'Sports',
      'Books',
      'Toys',
    ];

    const products = [
      { name: 'Wireless Earbuds Pro', category: 'Electronics', basePrice: 2999 },
      { name: 'Smart Watch Series X', category: 'Electronics', basePrice: 8999 },
      { name: 'Designer T-Shirt', category: 'Fashion', basePrice: 799 },
      { name: 'Running Shoes Elite', category: 'Fashion', basePrice: 2499 },
      { name: 'Organic Honey Pack', category: 'Food & Grocery', basePrice: 450 },
      { name: 'Premium Coffee Beans', category: 'Food & Grocery', basePrice: 650 },
      { name: 'Smart LED Bulb Set', category: 'Home & Living', basePrice: 899 },
      { name: 'Air Purifier Mini', category: 'Home & Living', basePrice: 3999 },
      { name: 'Vitamin C Serum', category: 'Beauty', basePrice: 599 },
      { name: 'Hair Styling Kit', category: 'Beauty', basePrice: 1299 },
      { name: 'Yoga Mat Premium', category: 'Sports', basePrice: 1499 },
      { name: 'Resistance Bands Set', category: 'Sports', basePrice: 699 },
      { name: 'Bestseller Novel Collection', category: 'Books', basePrice: 899 },
      { name: 'Educational Puzzle Set', category: 'Toys', basePrice: 599 },
    ];

    let filteredProducts = products;

    if (category) {
      filteredProducts = products.filter((p) => p.category === category);
    }

    return filteredProducts.map((product, index) => ({
      productId: `PROD-${String(index + 1).padStart(4, '0')}`,
      productName: product.name,
      category: product.category,
      availableImpressions: Math.floor(Math.random() * 500000) + 100000,
      estimatedCPM: Math.floor(Math.random() * 30) + 20,
      averageConversionRate: Math.random() * 0.05 + 0.01,
    }));
  }
}

export const inventoryService = new InventoryService();
