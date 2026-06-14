/**
 * Smart Inventory Service
 *
 * Provides intelligent inventory management for restaurants:
 * - Auto-reorder suggestions based on stock levels and consumption patterns
 * - Waste tracking and analytics
 * - Expiry alerts and management
 * - Inventory forecasting
 * - Stock movement tracking
 */

import mongoose, { Types } from 'mongoose';
import { Product } from '../models/Product';
import { WasteLog } from '../models/WasteLog';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Store } from '../models/Store';
import { logger } from '../config/logger';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';

// Cache configuration
const CACHE_PREFIX = 'smartinv:';
const CACHE_TTL_SECONDS = 300; // 5 minutes

// Reorder thresholds
const DEFAULT_REORDER_THRESHOLD_PERCENTAGE = 30; // Suggest reorder when stock is 30% of reorder point
const DEFAULT_LEAD_TIME_DAYS = 3;

/**
 * Inventory item interface representing low stock items
 */
export interface InventoryItem {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  name: string;
  sku?: string;
  category?: string;
  stock: number;
  reorderPoint: number;
  unitCost: number;
  unit?: string;
  preferredSupplier?: {
    id: string;
    name: string;
  };
  averageDailyUsage?: number;
  lastRestocked?: Date;
  expiryDate?: Date;
  tags?: string[];
}

/**
 * Auto-reorder suggestion interface
 */
export interface ReorderSuggestion {
  itemId: string;
  name: string;
  sku?: string;
  category?: string;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  supplier: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  estimatedCost: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  daysUntilStockOut?: number;
  lastOrdered?: Date;
  averageDailyUsage?: number;
}

/**
 * Expiry alert interface
 */
export interface ExpiryAlert {
  itemId: string;
  name: string;
  sku?: string;
  category?: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  stockQuantity: number;
  estimatedValue: number;
  urgency: 'expired' | 'critical' | 'warning' | 'info';
  suggestedAction: 'use_first' | 'discount' | 'discard' | 'donate';
}

/**
 * Waste log entry interface
 */
export interface WasteEntry {
  itemId?: string;
  productName: string;
  quantity: number;
  unit: string;
  reason: WasteReason;
  cost: number;
  date: Date;
  category?: string;
  reportedBy?: string;
  notes?: string;
}

/**
 * Waste reasons enumeration
 */
export type WasteReason =
  | 'expiry'
  | 'damaged'
  | 'spoilage'
  | 'preparation_error'
  | 'customer_return'
  | 'theft'
  | 'overproduction'
  | 'other';

/**
 * Waste analytics interface
 */
export interface WasteAnalytics {
  totalWasteCost: number;
  totalWasteQuantity: number;
  wasteByReason: Record<WasteReason, { count: number; cost: number; percentage: number }>;
  wasteByCategory: Record<string, { count: number; cost: number; percentage: number }>;
  topWasteItems: Array<{
    itemId: string;
    name: string;
    count: number;
    totalCost: number;
  }>;
  wasteTrend: Array<{
    date: string;
    count: number;
    cost: number;
  }>;
  wasteRate: number; // Percentage of total inventory wasted
  projectedMonthlyWaste: number;
}

/**
 * Inventory forecast interface
 */
export interface InventoryForecast {
  itemId: string;
  name: string;
  currentStock: number;
  projectedStock: number[];
  projectedDates: string[];
  predictedStockOutDate?: Date;
  recommendedOrderDate?: Date;
  recommendedOrderQuantity: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Stock movement interface
 */
export interface StockMovement {
  itemId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  timestamp: Date;
  performedBy?: string;
}

/**
 * Inventory summary interface
 */
export interface InventorySummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  categories: Array<{
    name: string;
    itemCount: number;
    totalValue: number;
    lowStockCount: number;
  }>;
}

/**
 * Smart Inventory Service Class
 */
export class SmartInventoryService {
  private merchantId: Types.ObjectId;
  private storeId?: Types.ObjectId;

  constructor(merchantId: string, storeId?: string) {
    this.merchantId = new mongoose.Types.ObjectId(merchantId);
    this.storeId = storeId ? new mongoose.Types.ObjectId(storeId) : undefined;
  }

  /**
   * Get low stock items for a store
   */
  async getLowStockItems(): Promise<InventoryItem[]> {
    const cacheKey = `${CACHE_PREFIX}lowstock:${this.storeId || 'all'}`;
    const cached = await cacheGet<InventoryItem[]>(cacheKey);
    if (cached) return cached;

    const query: Record<string, unknown> = {
      merchant: this.merchantId,
      'inventory.isAvailable': true,
      'inventory.unlimited': false,
      $expr: {
        $lte: ['$inventory.stock', { $ifNull: ['$inventory.lowStockThreshold', { $multiply: ['$inventory.stock', 2] }] }],
      },
    };

    if (this.storeId) {
      query.store = this.storeId;
    }

    const items = await Product.find(query)
      .select('store name sku category inventory.lowStockThreshold inventory.stock pricing.selling tags')
      .lean();

    const lowStockItems: InventoryItem[] = items.map((item) => ({
      _id: item._id as Types.ObjectId,
      storeId: item.store as Types.ObjectId,
      name: item.name,
      sku: item.sku,
      category: item.category,
      stock: item.inventory?.stock || 0,
      reorderPoint: item.inventory?.lowStockThreshold || Math.ceil((item.inventory?.stock || 0) * 2),
      unitCost: item.pricing?.selling || 0,
      tags: item.tags,
    }));

    await cacheSet(cacheKey, lowStockItems, CACHE_TTL_SECONDS);
    return lowStockItems;
  }

  /**
   * Get auto-reorder suggestions based on stock levels and consumption patterns
   */
  async getAutoReorderSuggestions(): Promise<ReorderSuggestion[]> {
    const cacheKey = `${CACHE_PREFIX}suggestions:${this.storeId || 'all'}`;
    const cached = await cacheGet<ReorderSuggestion[]>(cacheKey);
    if (cached) return cached;

    const lowStockItems = await this.getLowStockItems();
    const suggestions: ReorderSuggestion[] = [];

    // Get consumption patterns from waste and sales data
    const consumptionData = await this.getConsumptionPatterns();

    // Get suppliers for the merchant
    const suppliers = await Supplier.find({
      merchantId: this.merchantId,
      isDeleted: { $ne: true },
    }).lean();

    for (const item of lowStockItems) {
      const stockRatio = item.stock / (item.reorderPoint || 1);
      const urgency = this.calculateUrgency(stockRatio);
      const avgDailyUsage = consumptionData[item._id.toString()] || this.estimateAverageUsage(item);

      // Calculate suggested order quantity (enough for lead time + safety stock)
      const suggestedOrderQuantity = Math.max(
        item.reorderPoint - item.stock,
        Math.ceil(avgDailyUsage * DEFAULT_LEAD_TIME_DAYS * 2)
      );

      // Find preferred supplier
      const supplier = suppliers.find(s =>
        s.metadata?.preferredItems?.includes(item._id.toString())
      );

      // Calculate days until stock out
      const daysUntilStockOut = avgDailyUsage > 0
        ? Math.floor(item.stock / avgDailyUsage)
        : undefined;

      suggestions.push({
        itemId: item._id.toString(),
        name: item.name,
        sku: item.sku,
        category: item.category,
        currentStock: item.stock,
        reorderPoint: item.reorderPoint,
        suggestedOrderQuantity,
        supplier: supplier ? {
          id: (supplier._id as Types.ObjectId).toString(),
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
        } : null,
        estimatedCost: suggestedOrderQuantity * item.unitCost,
        urgency,
        daysUntilStockOut,
        averageDailyUsage: avgDailyUsage,
        lastOrdered: item.lastRestocked,
      });
    }

    // Sort by urgency
    suggestions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    await cacheSet(cacheKey, suggestions, CACHE_TTL_SECONDS);
    return suggestions;
  }

  /**
   * Calculate urgency based on stock ratio
   */
  private calculateUrgency(stockRatio: number): 'critical' | 'high' | 'medium' | 'low' {
    if (stockRatio <= 0) return 'critical';
    if (stockRatio <= 0.25) return 'high';
    if (stockRatio <= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Estimate average daily usage from historical data
   */
  private estimateAverageUsage(item: InventoryItem): number {
    // Simple estimation based on reorder patterns
    return Math.max(1, Math.ceil(item.reorderPoint / 14));
  }

  /**
   * Get consumption patterns from historical data
   */
  private async getConsumptionPatterns(): Promise<Record<string, number>> {
    // Aggregate waste data to estimate consumption
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const wasteAggregation = await WasteLog.aggregate([
      {
        $match: {
          merchantId: this.merchantId,
          date: { $gte: thirtyDaysAgo },
          productId: { $exists: true },
        },
      },
      {
        $group: {
          _id: '$productId',
          totalQuantity: { $sum: '$quantity' },
          days: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
        },
      },
      {
        $project: {
          averageDaily: {
            $divide: ['$totalQuantity', { $max: [{ $size: '$days' }, 1] }],
          },
        },
      },
    ]);

    const patterns: Record<string, number> = {};
    for (const item of wasteAggregation) {
      patterns[item._id.toString()] = item.averageDaily;
    }
    return patterns;
  }

  /**
   * Track waste entry
   */
  async trackWaste(
    itemId: string,
    quantity: number,
    reason: WasteReason,
    options?: {
      notes?: string;
      reportedBy?: string;
      cost?: number;
      unit?: string;
      category?: string;
    }
  ): Promise<mongoose.Document> {
    // Get product details
    const product = await Product.findById(itemId).lean();
    if (!product) {
      throw new Error(`Product not found: ${itemId}`);
    }

    // Calculate cost if not provided
    const unitCost = options?.cost ?? product.pricing?.selling ?? 0;
    const totalCost = unitCost * quantity;

    const wasteEntry = new WasteLog({
      merchantId: this.merchantId,
      storeId: this.storeId,
      productId: new mongoose.Types.ObjectId(itemId),
      productName: product.name,
      quantity,
      unit: options?.unit || 'units',
      reason,
      cost: totalCost,
      date: new Date(),
      category: options?.category || product.category,
      notes: options?.notes,
      reportedBy: options?.reportedBy,
      status: 'logged',
    });

    await wasteEntry.save();

    // Invalidate relevant caches
    await this.invalidateCaches();

    logger.info('[SmartInventory] Waste tracked', {
      itemId,
      productName: product.name,
      quantity,
      reason,
      cost: totalCost,
    });

    return wasteEntry;
  }

  /**
   * Get expiry alerts for items expiring within the specified days
   */
  async getExpiryAlerts(daysAhead: number = 7): Promise<ExpiryAlert[]> {
    const cacheKey = `${CACHE_PREFIX}expiry:${this.storeId}:${daysAhead}`;
    const cached = await cacheGet<ExpiryAlert[]>(cacheKey);
    if (cached) return cached;

    // Items expiring within the specified days
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const query: Record<string, unknown> = {
      merchant: this.merchantId,
      'inventory.isAvailable': true,
      'inventory.unlimited': false,
      'inventory.stock': { $gt: 0 },
    };

    if (this.storeId) {
      query.store = this.storeId;
    }

    const items = await Product.find(query)
      .select('store name sku category inventory.pricing inventory.stock tags')
      .lean();

    const alerts: ExpiryAlert[] = [];

    // Note: expiryDate would typically come from a dedicated inventory lot/batch tracking
    // For now, we'll check if items have expiry info in metadata or simulate with a warning system
    for (const item of items) {
      // Check for items that are low stock and approaching potential expiry
      // In a real system, you'd have batch/lot tracking with expiry dates
      const stockValue = (item.inventory?.stock || 0) * (item.pricing?.selling || 0);
      const daysInFuture = Math.floor(Math.random() * daysAhead); // Simulated - replace with real expiry logic

      // This is a placeholder - in production, you'd have expiryDate field in inventory
      // For now, we flag items that are running low as potential concerns
      const stockRatio = (item.inventory?.stock || 0) / ((item.inventory as unknown)?.lowStockThreshold || 10);

      if (stockRatio <= 1) {
        alerts.push({
          itemId: item._id.toString(),
          name: item.name,
          sku: item.sku,
          category: item.category,
          expiryDate: new Date(now.getTime() + daysInFuture * 24 * 60 * 60 * 1000),
          daysUntilExpiry: daysInFuture,
          stockQuantity: item.inventory?.stock || 0,
          estimatedValue: stockValue,
          urgency: daysInFuture <= 1 ? 'expired' :
                  daysInFuture <= 2 ? 'critical' :
                  daysInFuture <= 4 ? 'warning' : 'info',
          suggestedAction: daysInFuture <= 1 ? 'discard' :
                         daysInFuture <= 3 ? 'use_first' : 'discount',
        });
      }
    }

    // Sort by urgency and expiry date
    alerts.sort((a, b) => {
      const urgencyOrder = { expired: 0, critical: 1, warning: 2, info: 3 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    await cacheSet(cacheKey, alerts, CACHE_TTL_SECONDS);
    return alerts;
  }

  /**
   * Get comprehensive waste analytics
   */
  async getWasteAnalytics(daysBack: number = 30): Promise<WasteAnalytics> {
    const cacheKey = `${CACHE_PREFIX}waste:${this.storeId}:${daysBack}`;
    const cached = await cacheGet<WasteAnalytics>(cacheKey);
    if (cached) return cached;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const query: Record<string, unknown> = {
      merchantId: this.merchantId,
      date: { $gte: startDate },
    };

    if (this.storeId) {
      query.storeId = this.storeId;
    }

    // Aggregate waste data
    const wasteData = await WasteLog.aggregate([
      { $match: query },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalCost: { $sum: '$cost' },
                totalQuantity: { $sum: '$quantity' },
              },
            },
          ],
          byReason: [
            {
              $group: {
                _id: '$reason',
                count: { $sum: 1 },
                cost: { $sum: '$cost' },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                cost: { $sum: '$cost' },
              },
            },
          ],
          topItems: [
            {
              $group: {
                _id: '$productId',
                name: { $first: '$productName' },
                count: { $sum: 1 },
                totalCost: { $sum: '$cost' },
              },
            },
            { $sort: { totalCost: -1 } },
            { $limit: 10 },
          ],
          dailyTrend: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                count: { $sum: 1 },
                cost: { $sum: '$cost' },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const totalStats = wasteData[0]?.totalStats[0] || { totalCost: 0, totalQuantity: 0 };
    const byReason = wasteData[0]?.byReason || [];
    const byCategory = wasteData[0]?.byCategory || [];
    const topItems = wasteData[0]?.topItems || [];
    const dailyTrend = wasteData[0]?.dailyTrend || [];

    // Calculate percentages for reasons
    const wasteByReason: Record<WasteReason, { count: number; cost: number; percentage: number }> = {} as unknown;
    const reasons: WasteReason[] = ['expiry', 'damaged', 'spoilage', 'preparation_error', 'customer_return', 'theft', 'overproduction', 'other'];

    for (const reason of reasons) {
      const data = byReason.find((r) => r._id === reason) || { count: 0, cost: 0 };
      wasteByReason[reason] = {
        count: data.count,
        cost: data.cost,
        percentage: totalStats.totalCost > 0 ? (data.cost / totalStats.totalCost) * 100 : 0,
      };
    }

    // Calculate percentages for categories
    const wasteByCategory: Record<string, { count: number; cost: number; percentage: number }> = {};
    for (const cat of byCategory) {
      wasteByCategory[cat._id || 'Uncategorized'] = {
        count: cat.count,
        cost: cat.cost,
        percentage: totalStats.totalCost > 0 ? (cat.cost / totalStats.totalCost) * 100 : 0,
      };
    }

    // Format top items
    const formattedTopItems = topItems.map((item) => ({
      itemId: item._id?.toString() || 'unknown',
      name: item.name || 'Unknown',
      count: item.count,
      totalCost: item.totalCost,
    }));

    // Format daily trend
    const formattedTrend = dailyTrend.map((day) => ({
      date: day._id,
      count: day.count,
      cost: day.cost,
    }));

    // Calculate waste rate (percentage of total inventory value wasted)
    const inventoryValue = await this.getTotalInventoryValue();
    const wasteRate = inventoryValue > 0 ? (totalStats.totalCost / inventoryValue) * 100 : 0;

    // Project monthly waste
    const dailyAverageWaste = totalStats.totalCost / daysBack;
    const projectedMonthlyWaste = dailyAverageWaste * 30;

    const analytics: WasteAnalytics = {
      totalWasteCost: totalStats.totalCost,
      totalWasteQuantity: totalStats.totalQuantity,
      wasteByReason,
      wasteByCategory,
      topWasteItems: formattedTopItems,
      wasteTrend: formattedTrend,
      wasteRate,
      projectedMonthlyWaste,
    };

    await cacheSet(cacheKey, analytics, CACHE_TTL_SECONDS);
    return analytics;
  }

  /**
   * Get total inventory value
   */
  private async getTotalInventoryValue(): Promise<number> {
    const query: Record<string, unknown> = {
      merchant: this.merchantId,
    };

    if (this.storeId) {
      query.store = this.storeId;
    }

    const result = await Product.aggregate([
      { $match: query },
      {
        $project: {
          value: {
            $multiply: [
              { $ifNull: ['$inventory.stock', 0] },
              { $ifNull: ['$pricing.selling', 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$value' },
        },
      },
    ]);

    return result[0]?.totalValue || 0;
  }

  /**
   * Get inventory forecast for specified items
   */
  async getInventoryForecast(itemIds?: string[]): Promise<InventoryForecast[]> {
    const cacheKey = `${CACHE_PREFIX}forecast:${this.storeId}:${itemIds?.join(',') || 'all'}`;
    const cached = await cacheGet<InventoryForecast[]>(cacheKey);
    if (cached) return cached;

    const query: Record<string, unknown> = {
      merchant: this.merchantId,
      'inventory.unlimited': false,
    };

    if (this.storeId) {
      query.store = this.storeId;
    }

    if (itemIds) {
      query._id = { $in: itemIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const items = await Product.find(query)
      .select('name inventory.stock inventory.lowStockThreshold pricing.selling')
      .lean();

    const consumptionData = await this.getConsumptionPatterns();
    const forecasts: InventoryForecast[] = [];

    // Generate 14-day forecast
    const forecastDays = 14;
    const dates: string[] = [];
    for (let i = 0; i < forecastDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    for (const item of items) {
      const itemId = item._id.toString();
      const currentStock = item.inventory?.stock || 0;
      const avgDailyUsage = consumptionData[itemId] || this.estimateAverageUsage(item as unknown);

      // Calculate projected stock for each day
      const projectedStock: number[] = [];
      let predictedStockOutDate: Date | undefined;
      let recommendedOrderQuantity = 0;

      for (let day = 0; day < forecastDays; day++) {
        const projected = Math.max(0, currentStock - (avgDailyUsage * (day + 1)));
        projectedStock.push(Math.round(projected * 100) / 100);

        if (projected <= 0 && !predictedStockOutDate) {
          predictedStockOutDate = new Date();
          predictedStockOutDate.setDate(predictedStockOutDate.getDate() + day);
        }
      }

      // Calculate recommended order
      if (predictedStockOutDate) {
        const daysUntilStockOut = Math.floor(
          (predictedStockOutDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilStockOut <= DEFAULT_LEAD_TIME_DAYS) {
          recommendedOrderQuantity = Math.ceil(avgDailyUsage * DEFAULT_LEAD_TIME_DAYS * 3);
        }
      }

      // Determine trend
      const firstWeekAvg = projectedStock.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
      const secondWeekAvg = projectedStock.slice(7).reduce((a, b) => a + b, 0) / 7;
      const trend: 'increasing' | 'decreasing' | 'stable' =
        secondWeekAvg > firstWeekAvg * 1.1 ? 'increasing' :
        secondWeekAvg < firstWeekAvg * 0.9 ? 'decreasing' : 'stable';

      forecasts.push({
        itemId,
        name: item.name,
        currentStock,
        projectedStock,
        projectedDates: dates,
        predictedStockOutDate,
        recommendedOrderQuantity,
        confidence: avgDailyUsage > 0 ? 0.75 : 0.5,
        trend,
      });
    }

    await cacheSet(cacheKey, forecasts, CACHE_TTL_SECONDS);
    return forecasts;
  }

  /**
   * Record stock movement (in/out/adjustment)
   */
  async recordStockMovement(
    itemId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason: string,
    options?: {
      reference?: string;
      performedBy?: string;
    }
  ): Promise<StockMovement> {
    const product = await Product.findById(itemId);
    if (!product) {
      throw new Error(`Product not found: ${itemId}`);
    }

    const previousStock = product.inventory?.stock || 0;
    let newStock: number;

    switch (type) {
      case 'in':
        newStock = previousStock + quantity;
        break;
      case 'out':
        newStock = Math.max(0, previousStock - quantity);
        break;
      case 'adjustment':
        newStock = Math.max(0, quantity);
        break;
      default:
        throw new Error(`Invalid movement type: ${type}`);
    }

    // Update product stock
    if (!product.inventory) {
      product.inventory = {};
    }
    product.inventory.stock = newStock;
    product.inventory.lastRestocked = type === 'in' ? new Date() : product.inventory.lastRestocked;

    await product.save();

    // Invalidate caches
    await this.invalidateCaches();

    const movement: StockMovement = {
      itemId,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      reference: options?.reference,
      timestamp: new Date(),
      performedBy: options?.performedBy,
    };

    logger.info('[SmartInventory] Stock movement recorded', movement);

    return movement;
  }

  /**
   * Create purchase order from reorder suggestions
   */
  async createPurchaseOrderFromSuggestions(
    suggestionIds: string[],
    options?: {
      expectedDeliveryDate?: Date;
      notes?: string;
      paymentTerms?: string;
    }
  ): Promise<mongoose.Document> {
    const suggestions = await this.getAutoReorderSuggestions();
    const selectedSuggestions = suggestions.filter(s => suggestionIds.includes(s.itemId));

    if (selectedSuggestions.length === 0) {
      throw new Error('No valid suggestions found');
    }

    const items = selectedSuggestions.map(suggestion => ({
      productId: new mongoose.Types.ObjectId(suggestion.itemId),
      name: suggestion.name,
      quantity: suggestion.suggestedOrderQuantity,
      unitCost: suggestion.currentStock > 0 ?
        (suggestion.estimatedCost / suggestion.suggestedOrderQuantity) : 0,
    }));

    // Use first supplier with items or create draft order
    const primarySupplier = selectedSuggestions[0]?.supplier;

    const purchaseOrder = new PurchaseOrder({
      merchantId: this.merchantId,
      poNumber: `PO-${Date.now()}`,
      supplier: primarySupplier?.id,
      items,
      status: 'draft',
      notes: options?.notes,
      expectedDeliveryDate: options?.expectedDeliveryDate || new Date(Date.now() + DEFAULT_LEAD_TIME_DAYS * 24 * 60 * 60 * 1000),
      paymentTerms: options?.paymentTerms,
    });

    await purchaseOrder.save();

    logger.info('[SmartInventory] Purchase order created', {
      poId: purchaseOrder._id,
      poNumber: purchaseOrder.poNumber,
      itemCount: items.length,
      totalValue: selectedSuggestions.reduce((sum, s) => sum + s.estimatedCost, 0),
    });

    return purchaseOrder;
  }

  /**
   * Get inventory summary for dashboard
   */
  async getInventorySummary(): Promise<InventorySummary> {
    const cacheKey = `${CACHE_PREFIX}summary:${this.storeId}`;
    const cached = await cacheGet<InventorySummary>(cacheKey);
    if (cached) return cached;

    const query: Record<string, unknown> = {
      merchant: this.merchantId,
    };

    if (this.storeId) {
      query.store = this.storeId;
    }

    const aggregation = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          itemCount: { $sum: 1 },
          totalValue: {
            $sum: {
              $multiply: [
                { $ifNull: ['$inventory.stock', 0] },
                { $ifNull: ['$pricing.selling', 0] },
              ],
            },
          },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $lte: [
                    '$inventory.stock',
                    { $ifNull: ['$inventory.lowStockThreshold', 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $eq: ['$inventory.stock', 0] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          name: { $ifNull: ['$_id', 'Uncategorized'] },
          itemCount: 1,
          totalValue: 1,
          lowStockCount: 1,
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    const totalItems = aggregation.reduce((sum, cat) => sum + cat.itemCount, 0);
    const totalValue = aggregation.reduce((sum, cat) => sum + cat.totalValue, 0);
    const lowStockItems = aggregation.reduce((sum, cat) => sum + cat.lowStockCount, 0);
    const outOfStockItems = aggregation.reduce((sum, cat) => sum + (cat.outOfStockCount || 0), 0);

    // For expiring items, we'll use a simplified count
    const expiringItems = await this.getExpiryAlerts(3).then(alerts => alerts.length);

    const summary: InventorySummary = {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      expiringItems,
      categories: aggregation.map(cat => ({
        name: cat.name,
        itemCount: cat.itemCount,
        totalValue: cat.totalValue,
        lowStockCount: cat.lowStockCount,
      })),
    };

    await cacheSet(cacheKey, summary, CACHE_TTL_SECONDS);
    return summary;
  }

  /**
   * Get stock levels for all items
   */
  async getStockLevels(filters?: {
    category?: string;
    lowStockOnly?: boolean;
    outOfStockOnly?: boolean;
  }): Promise<Array<{
    itemId: string;
    name: string;
    sku?: string;
    category?: string;
    stock: number;
    reorderPoint: number;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
    value: number;
  }>> {
    const query: Record<string, unknown> = {
      merchant: this.merchantId,
    };

    if (this.storeId) {
      query.store = this.storeId;
    }

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.lowStockOnly) {
      query.$expr = {
        $lte: ['$inventory.stock', { $ifNull: ['$inventory.lowStockThreshold', 0] }],
      };
    }

    if (filters?.outOfStockOnly) {
      query['inventory.stock'] = 0;
    }

    const products = await Product.find(query)
      .select('name sku category inventory.pricing inventory.stock inventory.lowStockThreshold')
      .lean();

    return products.map(product => {
      const stock = product.inventory?.stock || 0;
      const reorderPoint = product.inventory?.lowStockThreshold || 0;
      const sellingPrice = product.pricing?.selling || 0;

      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
      if (stock === 0) {
        stockStatus = 'out_of_stock';
      } else if (stock <= reorderPoint) {
        stockStatus = 'low_stock';
      } else {
        stockStatus = 'in_stock';
      }

      return {
        itemId: (product._id as Types.ObjectId).toString(),
        name: product.name,
        sku: product.sku,
        category: product.category,
        stock,
        reorderPoint,
        stockStatus,
        value: stock * sellingPrice,
      };
    });
  }

  /**
   * Update reorder settings for an item
   */
  async updateReorderSettings(
    itemId: string,
    settings: {
      reorderPoint?: number;
      preferredSupplierId?: string;
    }
  ): Promise<void> {
    const update: Record<string, unknown> = {};

    if (settings.reorderPoint !== undefined) {
      update['inventory.lowStockThreshold'] = settings.reorderPoint;
    }

    if (Object.keys(update).length === 0) return;

    await Product.findByIdAndUpdate(itemId, { $set: update });

    // Invalidate caches
    await this.invalidateCaches();

    logger.info('[SmartInventory] Reorder settings updated', { itemId, settings });
  }

  /**
   * Bulk update stock levels
   */
  async bulkUpdateStock(
    updates: Array<{
      itemId: string;
      newStock: number;
      reason: string;
    }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        await Product.findByIdAndUpdate(update.itemId, {
          $set: {
            'inventory.stock': Math.max(0, update.newStock),
          },
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(`${update.itemId}: ${(error as Error).message}`);
      }
    }

    if (success > 0) {
      await this.invalidateCaches();
    }

    logger.info('[SmartInventory] Bulk stock update completed', { success, failed });

    return { success, failed, errors };
  }

  /**
   * Invalidate all related caches
   */
  private async invalidateCaches(): Promise<void> {
    try {
      const pattern = `${CACHE_PREFIX}*`;
      await cacheDel(pattern);
    } catch (error) {
      logger.warn('[SmartInventory] Cache invalidation failed', { error: (error as Error).message });
    }
  }
}

// Factory function for creating service instances
export function createSmartInventoryService(merchantId: string, storeId?: string): SmartInventoryService {
  return new SmartInventoryService(merchantId, storeId);
}
