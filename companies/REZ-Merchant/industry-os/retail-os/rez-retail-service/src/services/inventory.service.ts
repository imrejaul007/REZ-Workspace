import { Inventory, IInventory, IInventoryDocument } from '../models/Inventory';
import { Product } from '../models/Product';
import { StockAdjustment, InventoryFilter, InventoryMovement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import { EventEmitter } from 'events';

export class InventoryEvents extends EventEmitter {
  static LOW_STOCK = 'inventory:low_stock';
  static OUT_OF_STOCK = 'inventory:out_of_stock';
  static RESTOCKED = 'inventory:restocked';
  static MOVEMENT = 'inventory:movement';
}

export class InventoryService {
  private readonly CACHE_TTL = 1800; // 30 minutes
  private eventEmitter = new InventoryEvents();

  /**
   * Get inventory by product ID
   */
  async getInventoryByProductId(productId: string, warehouseId?: string): Promise<IInventory | null> {
    const cacheKey = `inventory:${productId}:${warehouseId || 'default'}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const inventory = await Inventory.findOne({
        productId,
        ...(warehouseId && { warehouseId }),
      });

      if (!inventory) return null;

      const result = inventory.toJSON();
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Error fetching inventory:', error);
      return await Inventory.findOne({ productId }).then(i => i?.toJSON() || null);
    }
  }

  /**
   * Get inventory by SKU
   */
  async getInventoryBySku(sku: string, warehouseId?: string): Promise<IInventory | null> {
    return await Inventory.findOne({
      sku,
      ...(warehouseId && { warehouseId }),
    }).then(i => i?.toJSON() || null);
  }

  /**
   * List inventory with filters
   */
  async listInventory(
    filter: InventoryFilter = {},
    page = 1,
    limit = 20
  ): Promise<{ inventory: IInventory[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, unknown> = {};

    if (filter.productId) {
      query.productId = filter.productId;
    }
    if (filter.sku) {
      query.sku = { $regex: filter.sku, $options: 'i' };
    }
    if (filter.warehouseId) {
      query.warehouseId = filter.warehouseId;
    }
    if (filter.lowStock) {
      query.$expr = { $lte: ['$availableQuantity', '$lowStockThreshold'] };
    }
    if (filter.outOfStock) {
      query.availableQuantity = { $lte: 0 };
    }

    const skip = (page - 1) * limit;

    const [inventory, total] = await Promise.all([
      Inventory.find(query)
        .sort({ availableQuantity: 1 })
        .skip(skip)
        .limit(limit),
      Inventory.countDocuments(query),
    ]);

    return {
      inventory: inventory.map(i => i.toJSON()),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Adjust stock for a product
   */
  async adjustStock(adjustment: StockAdjustment): Promise<IInventory> {
    const { productId, quantity, type, reason, reference, createdBy } = adjustment;

    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) {
        throw new Error(`Inventory not found for product ${productId}`);
      }

      const movement: InventoryMovement = {
        id: uuidv4(),
        type,
        quantity,
        reason,
        reference,
        createdBy,
        createdAt: new Date(),
      };

      switch (type) {
        case 'in':
          inventory.quantity += quantity;
          inventory.lastRestocked = new Date();
          this.eventEmitter.emit(InventoryEvents.RESTOCKED, { productId, quantity });
          break;

        case 'out':
          if (inventory.quantity < quantity) {
            throw new Error(`Insufficient stock. Available: ${inventory.quantity}, Requested: ${quantity}`);
          }
          inventory.quantity -= quantity;
          break;

        case 'return':
          inventory.quantity += quantity;
          inventory.lastRestocked = new Date();
          this.eventEmitter.emit(InventoryEvents.RESTOCKED, { productId, quantity });
          break;

        case 'adjustment':
          inventory.quantity = quantity;
          break;

        case 'transfer':
          // Transfer handled separately
          break;
      }

      inventory.movements.push(movement);
      await inventory.save();

      // Update product inventory
      await Product.updateOne({ id: productId }, { inventory: inventory.quantity });

      // Check stock levels and emit events
      this.checkStockLevels(inventory);

      // Invalidate cache
      await this.invalidateCache(productId);

      this.eventEmitter.emit(InventoryEvents.MOVEMENT, { productId, movement });

      logger.info(`Stock adjusted for ${productId}: ${type} ${quantity}`);
      return inventory.toJSON();
    } catch (error) {
      logger.error('Error adjusting stock:', error);
      throw error;
    }
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(productId: string, quantity: number): Promise<IInventory | null> {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) return null;

      if (inventory.availableQuantity < quantity) {
        throw new Error(`Insufficient available stock. Available: ${inventory.availableQuantity}, Requested: ${quantity}`);
      }

      inventory.reservedQuantity += quantity;
      await inventory.save();

      await this.invalidateCache(productId);
      return inventory.toJSON();
    } catch (error) {
      logger.error('Error reserving stock:', error);
      throw error;
    }
  }

  /**
   * Release reserved stock
   */
  async releaseStock(productId: string, quantity: number): Promise<IInventory | null> {
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) return null;

      inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - quantity);
      await inventory.save();

      await this.invalidateCache(productId);
      return inventory.toJSON();
    } catch (error) {
      logger.error('Error releasing stock:', error);
      throw error;
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(threshold?: number): Promise<IInventory[]> {
    const cacheKey = `inventory:lowstock:${threshold || 'default'}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const query = threshold
        ? { $expr: { $lte: ['$availableQuantity', threshold] } }
        : { $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] } };

      const items = await Inventory.find(query).sort({ availableQuantity: 1 });
      const result = items.map(i => i.toJSON());

      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      return result;
    } catch (error) {
      logger.error('Error fetching low stock items:', error);
      const query = threshold
        ? { availableQuantity: { $lte: threshold } }
        : { $where: function () { return this.availableQuantity <= this.lowStockThreshold; } };
      return await Inventory.find(query).sort({ availableQuantity: 1 }).then(i => i.map(item => item.toJSON()));
    }
  }

  /**
   * Get out of stock items
   */
  async getOutOfStockItems(): Promise<IInventory[]> {
    const cacheKey = 'inventory:outofstock';

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const items = await Inventory.find({ availableQuantity: { $lte: 0 } });
      const result = items.map(i => i.toJSON());

      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      return result;
    } catch (error) {
      logger.error('Error fetching out of stock items:', error);
      return await Inventory.find({ quantity: 0 }).then(i => i.map(item => item.toJSON()));
    }
  }

  /**
   * Get inventory movements for a product
   */
  async getMovements(productId: string, limit = 50): Promise<InventoryMovement[]> {
    const inventory = await Inventory.findOne({ productId });
    if (!inventory) return [];

    return inventory.movements
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get stock value report
   */
  async getStockValueReport(): Promise<{
    totalProducts: number;
    totalQuantity: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const [products, lowStockItems, outOfStockItems] = await Promise.all([
      Product.find({ isActive: true }),
      this.getLowStockItems(),
      this.getOutOfStockItems(),
    ]);

    const inventoryItems = await Inventory.find({});

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.price * (inventoryItems.find(i => i.productId === product.id)?.quantity || 0));
    }, 0);

    return {
      totalProducts: products.length,
      totalQuantity,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
    };
  }

  /**
   * Check and emit stock level events
   */
  private checkStockLevels(inventory: IInventoryDocument): void {
    if (inventory.availableQuantity <= 0) {
      this.eventEmitter.emit(InventoryEvents.OUT_OF_STOCK, {
        productId: inventory.productId,
        sku: inventory.sku,
        quantity: 0,
      });
    } else if (inventory.availableQuantity <= inventory.lowStockThreshold) {
      this.eventEmitter.emit(InventoryEvents.LOW_STOCK, {
        productId: inventory.productId,
        sku: inventory.sku,
        quantity: inventory.availableQuantity,
        threshold: inventory.lowStockThreshold,
      });
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache(productId: string, warehouseId?: string): Promise<void> {
    try {
      await redisClient.del(`inventory:${productId}:${warehouseId || 'default'}`);
      // Also invalidate summary caches
      await redisClient.del('inventory:lowstock:*');
      await redisClient.del('inventory:outofstock');
    } catch (error) {
      logger.warn('Cache invalidation failed:', error);
    }
  }

  /**
   * Subscribe to inventory events
   */
  on(event: string, listener: (...args: unknown[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Unsubscribe from inventory events
   */
  off(event: string, listener: (...args: unknown[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
