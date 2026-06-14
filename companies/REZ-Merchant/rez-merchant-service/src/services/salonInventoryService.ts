/**
 * Salon Inventory Service
 *
 * Provides inventory management for salon products:
 * - Add and manage product inventory
 * - Track stock levels and low-stock alerts
 * - Expiry date monitoring
 * - Usage recording for staff accountability
 * - Integrated with SmartInventory for base restaurant features
 * - Salon-specific: treatment rooms, salon products, professional tools
 */

import { Types } from 'mongoose';
import { SalonProduct, ISalonProduct, ProductCategory } from '../models/SalonProduct';
import { logger } from '../config/logger';
import {
  SmartInventoryService,
  createSmartInventoryService,
  WasteReason,
  type WasteAnalytics,
  type InventoryForecast,
} from './smartInventory';

export interface ProductInput {
  storeId: string;
  name: string;
  brand: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  reorderPoint: number;
  cost: number;
  price: number;
  supplier: string;
  expiryDate?: Date;
}

export interface UsageRecord {
  productId: string;
  staffId: string;
  quantity: number;
  date: Date;
}

/**
 * Salon-specific inventory types
 */
export interface TreatmentRoom {
  roomId: string;
  name: string;
  equipment: string[];
  capacity: number;
  servicesOffered: string[];
}

export interface SalonSupplyCategory {
  categoryId: string;
  name: string;
  type: 'product' | 'equipment' | 'consumable';
  reorderPoint: number;
}

export interface SalonServiceSupply {
  serviceId: string;
  serviceName: string;
  supplies: Array<{
    productId: string;
    quantityPerService: number;
  }>;
}

// Salon-specific product categories
export enum SalonProductType {
  HAIR_CARE = 'hair_care',
  SKIN_CARE = 'skin_care',
  NAIL_CARE = 'nail_care',
  MAKEUP = 'makeup',
  EQUIPMENT = 'equipment',
  TOOLS = 'tools',
  SANITARY = 'sanitary',
  PROFESSIONAL = 'professional',
}

/**
 * Salon Inventory Service
 */
export class SalonInventoryService {
  private smartInventory: SmartInventoryService;
  private merchantId: Types.ObjectId;

  constructor(merchantId?: string) {
    // Initialize with base SmartInventory for shared restaurant features
    this.smartInventory = createSmartInventoryService(merchantId || 'default');
    this.merchantId = merchantId ? new Types.ObjectId(merchantId) : new Types.ObjectId();
  }

  /**
   * Update merchant context for SmartInventory integration
   */
  setMerchantId(merchantId: string): void {
    this.merchantId = new Types.ObjectId(merchantId);
    this.smartInventory = createSmartInventoryService(merchantId);
  }

  /**
   * Add a new product to salon inventory
   */
  async addProduct(data: ProductInput): Promise<ISalonProduct> {
    const product = new SalonProduct({
      storeId: new Types.ObjectId(data.storeId),
      name: data.name,
      brand: data.brand,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      reorderPoint: data.reorderPoint,
      cost: data.cost,
      price: data.price,
      supplier: data.supplier,
      expiryDate: data.expiryDate,
    });

    await product.save();
    logger.info(`Salon product added: ${product.name} (${product._id})`);

    return product;
  }

  /**
   * Get all products for a store
   */
  async getProducts(storeId: string): Promise<ISalonProduct[]> {
    const products = await SalonProduct.find({
      storeId: new Types.ObjectId(storeId),
    }).sort({ name: 1 });

    return products;
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(storeId: string, category: ProductCategory): Promise<ISalonProduct[]> {
    const products = await SalonProduct.find({
      storeId: new Types.ObjectId(storeId),
      category,
    }).sort({ name: 1 });

    return products;
  }

  /**
   * Update stock quantity for a product
   */
  async updateStock(productId: string, quantity: number): Promise<void> {
    const product = await SalonProduct.findById(productId);

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    product.quantity = quantity;
    await product.save();

    logger.info(`Stock updated for product ${productId}: ${quantity} ${product.unit}`);
  }

  /**
   * Add stock to existing quantity (for restocking)
   */
  async addStock(productId: string, quantityToAdd: number): Promise<void> {
    const product = await SalonProduct.findById(productId);

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    product.quantity += quantityToAdd;
    await product.save();

    logger.info(`Added ${quantityToAdd} ${product.unit} to product ${productId}`);
  }

  /**
   * Get all low-stock products for a store
   */
  async getLowStock(storeId: string): Promise<ISalonProduct[]> {
    const products = await SalonProduct.find({
      storeId: new Types.ObjectId(storeId),
      status: { $in: ['low_stock', 'out_of_stock'] },
    }).sort({ quantity: 1 });

    return products;
  }

  /**
   * Get products expiring within specified days
   */
  async getExpiryAlerts(storeId: string, daysAhead: number = 30): Promise<ISalonProduct[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const products = await SalonProduct.find({
      storeId: new Types.ObjectId(storeId),
      expiryDate: {
        $gte: now,
        $lte: futureDate,
      },
    }).sort({ expiryDate: 1 });

    return products;
  }

  /**
   * Get all expired products
   */
  async getExpiredProducts(storeId: string): Promise<ISalonProduct[]> {
    const now = new Date();

    const products = await SalonProduct.find({
      storeId: new Types.ObjectId(storeId),
      expiryDate: {
        $lt: now,
      },
    }).sort({ expiryDate: 1 });

    return products;
  }

  /**
   * Record product usage by staff
   */
  async recordUsage(productId: string, quantity: number, staffId: string): Promise<void> {
    const product = await SalonProduct.findById(productId);

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    if (product.quantity < quantity) {
      throw new Error(
        `Insufficient stock: available ${product.quantity} ${product.unit}, requested ${quantity}`
      );
    }

    product.quantity -= quantity;
    await product.save();

    logger.info(
      `Usage recorded: ${quantity} ${product.unit} of ${product.name} by staff ${staffId}`
    );
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<ISalonProduct | null> {
    const product = await SalonProduct.findById(productId);
    return product;
  }

  /**
   * Update product details
   */
  async updateProduct(
    productId: string,
    updates: Partial<Omit<ProductInput, 'storeId'>>
  ): Promise<ISalonProduct | null> {
    const product = await SalonProduct.findByIdAndUpdate(
      productId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (product) {
      logger.info(`Product updated: ${product.name} (${productId})`);
    }

    return product;
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<boolean> {
    const result = await SalonProduct.findByIdAndDelete(productId);

    if (result) {
      logger.info(`Product deleted: ${result.name} (${productId})`);
      return true;
    }

    return false;
  }

  /**
   * Get inventory summary for a store
   */
  async getInventorySummary(storeId: string): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringCount: number;
  }> {
    const storeObjectId = new Types.ObjectId(storeId);
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const [products, lowStockCount, outOfStockCount, expiringCount] = await Promise.all([
      SalonProduct.find({ storeId: storeObjectId }),
      SalonProduct.countDocuments({
        storeId: storeObjectId,
        status: 'low_stock',
      }),
      SalonProduct.countDocuments({
        storeId: storeObjectId,
        status: 'out_of_stock',
      }),
      SalonProduct.countDocuments({
        storeId: storeObjectId,
        expiryDate: { $gte: now, $lte: futureDate },
      }),
    ]);

    const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    return {
      totalProducts: products.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
      expiringCount,
    };
  }

  // ── Salon-Specific Features (Shared Base + Salon Extensions) ──────────────────────

  /**
   * Get salon-specific waste analytics from SmartInventory
   */
  async getWasteAnalytics(daysBack: number = 30): Promise<WasteAnalytics> {
    return this.smartInventory.getWasteAnalytics(daysBack);
  }

  /**
   * Get inventory forecast from SmartInventory
   */
  async getInventoryForecast(itemIds?: string[]): Promise<InventoryForecast[]> {
    return this.smartInventory.getInventoryForecast(itemIds);
  }

  /**
   * Track product waste (delegates to SmartInventory)
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
  ): Promise<void> {
    await this.smartInventory.trackWaste(itemId, quantity, reason, options);
    logger.info(`[SalonInventory] Waste tracked for product ${itemId}`);
  }

  /**
   * Get low-stock alerts with SmartInventory suggestions
   */
  async getLowStockWithSuggestions(storeId: string): Promise<{
    products: ISalonProduct[];
    suggestions: Array<{
      productId: string;
      name: string;
      suggestedOrderQuantity: number;
      urgency: string;
    }>;
  }> {
    const products = await this.getLowStock(storeId);
    const suggestions = await this.smartInventory.getAutoReorderSuggestions();

    const suggestionMap = new Map(
      suggestions.map(s => [s.itemId, { suggestedOrderQuantity: s.suggestedOrderQuantity, urgency: s.urgency }])
    );

    return {
      products,
      suggestions: products.map(p => ({
        productId: p._id.toString(),
        name: p.name,
        ...(suggestionMap.get(p._id.toString()) || { suggestedOrderQuantity: 0, urgency: 'low' }),
      })),
    };
  }

  /**
   * Record supply usage for a salon service
   */
  async recordServiceUsage(
    productId: string,
    serviceId: string,
    staffId: string,
    clientCount: number = 1
  ): Promise<void> {
    const product = await SalonProduct.findById(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Calculate quantity used based on typical usage per service
    const quantityPerClient = 1; // Default: 1 unit per client
    const totalQuantity = quantityPerClient * clientCount;

    if (product.quantity < totalQuantity) {
      throw new Error(
        `Insufficient stock for service: available ${product.quantity} ${product.unit}, needed ${totalQuantity}`
      );
    }

    product.quantity -= totalQuantity;
    await product.save();

    logger.info(
      `[SalonInventory] Service usage recorded: ${totalQuantity} ${product.unit} of ${product.name} ` +
      `for service ${serviceId} by staff ${staffId}`
    );
  }

  /**
   * Get equipment maintenance schedule
   */
  async getEquipmentMaintenance(): Promise<Array<{
    productId: string;
    name: string;
    lastMaintenance: Date | null;
    nextMaintenanceDue: Date | null;
    status: 'ok' | 'due_soon' | 'overdue';
  }>> {
    const equipment = await SalonProduct.find({
      category: 'EQUIPMENT' as ProductCategory,
    }).lean();

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return equipment.map((item) => {
      const lastMaintenance = item.lastMaintenanceDate || null;
      const nextMaintenance = lastMaintenance
        ? new Date(new Date(lastMaintenance).getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days interval
        : new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      let status: 'ok' | 'due_soon' | 'overdue' = 'ok';
      if (nextMaintenance < now) {
        status = 'overdue';
      } else if (nextMaintenance < thirtyDaysFromNow) {
        status = 'due_soon';
      }

      return {
        productId: item._id.toString(),
        name: item.name,
        lastMaintenance,
        nextMaintenanceDue: nextMaintenance,
        status,
      };
    });
  }

  /**
   * Get products by salon-specific type
   */
  async getProductsByType(storeId: string, type: SalonProductType): Promise<ISalonProduct[]> {
    return SalonProduct.find({
      storeId: new Types.ObjectId(storeId),
      salonProductType: type,
    }).sort({ name: 1 });
  }
}

// Singleton instance
let serviceInstance: SalonInventoryService | null = null;

export function getSalonInventoryService(): SalonInventoryService {
  if (!serviceInstance) {
    serviceInstance = new SalonInventoryService();
  }
  return serviceInstance;
}

export function createSalonInventoryService(): SalonInventoryService {
  return new SalonInventoryService();
}
