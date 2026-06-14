import { Stock, IStock } from '../models/Stock';
import { SKU } from '../models/SKU';
import { Batch, IBatch } from '../models/Batch';
import mongoose, { Types, ClientSession } from 'mongoose';

export interface StockOperationResult {
  success: boolean;
  stock?: IStock;
  previousQuantity: number;
  newQuantity: number;
  message: string;
}

export interface TransferStockInput {
  fromStoreId: string;
  toStoreId: string;
  skuId: string;
  quantity: number;
  reason?: string;
}

class StockService {
  /**
   * Add stock to a SKU
   */
  async addStock(
    skuId: string,
    storeId: string,
    quantity: number,
    batchInfo?: {
      batchNumber: string;
      manufacturingDate: Date;
      expiryDate: Date;
      costPrice: number;
      supplierId?: string;
    },
    session?: ClientSession
  ): Promise<StockOperationResult> {
    if (quantity <= 0) {
      return {
        success: false,
        previousQuantity: 0,
        newQuantity: 0,
        message: 'Quantity must be greater than 0',
      };
    }

    let stock = await Stock.findOne({ skuId, storeId });
    const previousQuantity = stock?.quantity || 0;

    if (!stock) {
      stock = new Stock({
        skuId: new Types.ObjectId(skuId),
        storeId,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
      });
    }

    stock.quantity += quantity;
    stock.lastRestocked = new Date();
    stock.availableQuantity = stock.quantity - stock.reservedQuantity;

    // Check low stock threshold
    const sku = await SKU.findById(skuId);
    if (sku && stock.quantity <= sku.minStock) {
      stock.lowStockAlert = true;
    }

    await stock.save({ session });

    // Create batch record if batch info provided
    if (batchInfo) {
      await Batch.create(
        [
          {
            skuId: new Types.ObjectId(skuId),
            batchNumber: batchInfo.batchNumber,
            quantity,
            manufacturingDate: batchInfo.manufacturingDate,
            expiryDate: batchInfo.expiryDate,
            costPrice: batchInfo.costPrice,
            supplierId: batchInfo.supplierId,
          },
        ],
        { session }
      );
    }

    return {
      success: true,
      stock,
      previousQuantity,
      newQuantity: stock.quantity,
      message: `Added ${quantity} units to stock. New quantity: ${stock.quantity}`,
    };
  }

  /**
   * Deduct stock from a SKU
   */
  async deductStock(
    skuId: string,
    storeId: string,
    quantity: number,
    reason: string = 'sale',
    session?: ClientSession
  ): Promise<StockOperationResult> {
    if (quantity <= 0) {
      return {
        success: false,
        previousQuantity: 0,
        newQuantity: 0,
        message: 'Quantity must be greater than 0',
      };
    }

    const stock = await Stock.findOne({ skuId, storeId });
    if (!stock) {
      return {
        success: false,
        previousQuantity: 0,
        newQuantity: 0,
        message: 'Stock record not found',
      };
    }

    const availableToDeduct = stock.quantity - stock.reservedQuantity;
    if (availableToDeduct < quantity) {
      return {
        success: false,
        previousQuantity: stock.quantity,
        newQuantity: stock.quantity,
        message: `Insufficient stock. Available: ${availableToDeduct}, Requested: ${quantity}`,
      };
    }

    const previousQuantity = stock.quantity;
    stock.quantity -= quantity;
    stock.lastSold = new Date();
    stock.availableQuantity = stock.quantity - stock.reservedQuantity;

    // Update low stock alert
    const sku = await SKU.findById(skuId);
    if (sku) {
      stock.lowStockAlert = stock.quantity <= sku.minStock;
    }

    await stock.save({ session });

    // Deduct from oldest batch (FIFO)
    await this.deductFromBatch(skuId, quantity, session);

    return {
      success: true,
      stock,
      previousQuantity,
      newQuantity: stock.quantity,
      message: `Deducted ${quantity} units from stock. New quantity: ${stock.quantity}`,
    };
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(
    skuId: string,
    storeId: string,
    quantity: number
  ): Promise<StockOperationResult> {
    if (quantity <= 0) {
      return {
        success: false,
        previousQuantity: 0,
        newQuantity: 0,
        message: 'Quantity must be greater than 0',
      };
    }

    const stock = await Stock.findOne({ skuId, storeId });
    if (!stock) {
      return {
        success: false,
        previousQuantity: 0,
        newQuantity: 0,
        message: 'Stock record not found',
      };
    }

    const availableQuantity = stock.quantity - stock.reservedQuantity;
    if (availableQuantity < quantity) {
      return {
        success: false,
        previousQuantity: stock.quantity,
        newQuantity: stock.quantity,
        message: `Insufficient available stock. Available: ${availableQuantity}, Requested: ${quantity}`,
      };
    }

    const previousReserved = stock.reservedQuantity;
    stock.reservedQuantity += quantity;
    stock.availableQuantity = stock.quantity - stock.reservedQuantity;

    await stock.save();

    return {
      success: true,
      stock,
      previousQuantity: previousReserved,
      newQuantity: stock.reservedQuantity,
      message: `Reserved ${quantity} units. Total reserved: ${stock.reservedQuantity}`,
    };
  }

  /**
   * Release reserved stock
   */
  async releaseStock(
    skuId: string,
    storeId: string,
    quantity: number
  ): Promise<StockOperationResult> {
    if (quantity <= 0) {
      return {
        success: false,
        previousQuantity: 0,
        newQuantity: 0,
        message: 'Quantity must be greater than 0',
      };
    }

    const stock = await Stock.findOne({ skuId, storeId });
    if (!stock) {
      return {
        success: false,
        previousQuantity: 0,
        newQuantity: 0,
        message: 'Stock record not found',
      };
    }

    if (stock.reservedQuantity < quantity) {
      return {
        success: false,
        previousQuantity: stock.reservedQuantity,
        newQuantity: stock.reservedQuantity,
        message: `Cannot release more than reserved. Reserved: ${stock.reservedQuantity}, Requested: ${quantity}`,
      };
    }

    const previousReserved = stock.reservedQuantity;
    stock.reservedQuantity -= quantity;
    stock.availableQuantity = stock.quantity - stock.reservedQuantity;

    // Check if low stock alert should be cleared
    const sku = await SKU.findById(skuId);
    if (sku) {
      stock.lowStockAlert = stock.quantity <= sku.minStock;
    }

    await stock.save();

    return {
      success: true,
      stock,
      previousQuantity: previousReserved,
      newQuantity: stock.reservedQuantity,
      message: `Released ${quantity} units. Total reserved: ${stock.reservedQuantity}`,
    };
  }

  /**
   * Get stock level for a SKU
   */
  async getStockLevel(skuId: string, storeId?: string): Promise<IStock | IStock[] | null> {
    if (storeId) {
      return Stock.findOne({ skuId, storeId });
    }
    return Stock.findOne({ skuId });
  }

  /**
   * Get stock levels for all SKUs in a store
   */
  async getStoreStockLevels(storeId: string): Promise<any[]> {
    return Stock.aggregate([
      { $match: { storeId } },
      {
        $lookup: {
          from: 'skus',
          localField: 'skuId',
          foreignField: '_id',
          as: 'sku',
        },
      },
      { $unwind: '$sku' },
      {
        $project: {
          skuId: 1,
          storeId: 1,
          quantity: 1,
          reservedQuantity: 1,
          availableQuantity: 1,
          lowStockAlert: 1,
          warehouseStock: 1,
          lastRestocked: 1,
          lastSold: 1,
          skuName: '$sku.name',
          skuCode: '$sku.sku',
          minStock: '$sku.minStock',
          maxStock: '$sku.maxStock',
          reorderPoint: '$sku.reorderPoint',
        },
      },
      { $sort: { skuName: 1 } },
    ]);
  }

  /**
   * Transfer stock between stores
   */
  async transferStock(input: TransferStockInput): Promise<{
    success: boolean;
    fromStock?: IStock;
    toStock?: IStock;
    message: string;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { fromStoreId, toStoreId, skuId, quantity, reason } = input;

      // Deduct from source store
      const deductResult = await this.deductStock(skuId, fromStoreId, quantity, reason || 'transfer', session);
      if (!deductResult.success) {
        await session.abortTransaction();
        return {
          success: false,
          message: `Failed to deduct from source: ${deductResult.message}`,
        };
      }

      // Add to destination store
      const addResult = await this.addStock(skuId, toStoreId, quantity, undefined, session);
      if (!addResult.success) {
        await session.abortTransaction();
        return {
          success: false,
          message: `Failed to add to destination: ${addResult.message}`,
        };
      }

      await session.commitTransaction();
      return {
        success: true,
        fromStock: deductResult.stock,
        toStock: addResult.stock,
        message: `Transferred ${quantity} units from ${fromStoreId} to ${toStoreId}`,
      };
    } catch (error: any) {
      await session.abortTransaction();
      return {
        success: false,
        message: `Transfer failed: ${error.message}`,
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Deduct from oldest batch (FIFO)
   */
  private async deductFromBatch(
    skuId: string,
    quantity: number,
    session?: ClientSession
  ): Promise<void> {
    let remaining = quantity;
    const batches = await Batch.find({
      skuId: new Types.ObjectId(skuId),
      quantity: { $gt: 0 },
      expiryDate: { $gt: new Date() },
    })
      .sort({ expiryDate: 1 })
      .session(session || null);

    for (const batch of batches) {
      if (remaining <= 0) break;

      const deductAmount = Math.min(batch.quantity, remaining);
      batch.quantity -= deductAmount;
      remaining -= deductAmount;
      await batch.save({ session });
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(storeId?: string): Promise<any[]> {
    const matchStage: any = { lowStockAlert: true };
    if (storeId) {
      matchStage.storeId = storeId;
    }

    return Stock.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'skus',
          localField: 'skuId',
          foreignField: '_id',
          as: 'sku',
        },
      },
      { $unwind: '$sku' },
      {
        $project: {
          skuId: 1,
          storeId: 1,
          quantity: 1,
          minStock: '$sku.minStock',
          reorderPoint: '$sku.reorderPoint',
          skuName: '$sku.name',
          skuCode: '$sku.sku',
          stockDeficit: { $subtract: ['$sku.minStock', '$quantity'] },
        },
      },
      { $sort: { stockDeficit: -1 } },
    ]);
  }

  /**
   * Adjust stock (for inventory count corrections)
   */
  async adjustStock(
    skuId: string,
    storeId: string,
    newQuantity: number,
    reason: string
  ): Promise<StockOperationResult> {
    if (newQuantity < 0) {
      return {
        success: false,
        previousQuantity: 0,
        newQuantity: 0,
        message: 'Quantity cannot be negative',
      };
    }

    const stock = await Stock.findOne({ skuId, storeId });
    if (!stock) {
      return {
        success: false,
        previousQuantity: 0,
        newQuantity: 0,
        message: 'Stock record not found',
      };
    }

    const previousQuantity = stock.quantity;
    stock.quantity = newQuantity;
    stock.availableQuantity = stock.quantity - stock.reservedQuantity;

    // Update low stock alert
    const sku = await SKU.findById(skuId);
    if (sku) {
      stock.lowStockAlert = stock.quantity <= sku.minStock;
    }

    await stock.save();

    return {
      success: true,
      stock,
      previousQuantity,
      newQuantity: stock.quantity,
      message: `Stock adjusted from ${previousQuantity} to ${newQuantity}. Reason: ${reason}`,
    };
  }

  /**
   * Get stock with batches
   */
  async getStockWithBatches(skuId: string, storeId: string): Promise<any | null> {
    const stock = await Stock.findOne({ skuId, storeId });
    if (!stock) {
      return null;
    }

    const batches = await Batch.find({
      skuId: new Types.ObjectId(skuId),
      quantity: { $gt: 0 },
    }).sort({ expiryDate: 1 });

    return {
      ...stock.toObject(),
      batches,
    };
  }
}

export const stockService = new StockService();
